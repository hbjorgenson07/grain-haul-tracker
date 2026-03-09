import { createClient } from '@/lib/supabase/server';
import { startOfDay, endOfDay } from 'date-fns';

export async function getTodayStats() {
  const supabase = await createClient();
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  // Active sessions (no ended_at)
  const { count: activeSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .is('ended_at', null);

  // Sessions started today
  const { count: todaySessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', dayStart)
    .lte('started_at', dayEnd);

  // Activity logs today
  const { data: todayActivities } = await supabase
    .from('activity_logs')
    .select('activity_type')
    .gte('timestamp', dayStart)
    .lte('timestamp', dayEnd);

  const totalTripsToday = todayActivities?.filter(
    a => a.activity_type === 'loaded_leaving'
  ).length ?? 0;

  return {
    activeSessions: activeSessions ?? 0,
    todaySessions: todaySessions ?? 0,
    totalTripsToday,
  };
}

export async function getActiveSessionsWithDrivers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sessions')
    .select('*, driver:profiles(full_name), truck:trucks(name)')
    .is('ended_at', null)
    .order('started_at', { ascending: false });

  if (!data) return [];

  // Get latest activity for each active session
  const sessionsWithStatus = await Promise.all(
    data.map(async (session) => {
      const { data: latestActivity } = await supabase
        .from('activity_logs')
        .select('activity_type, timestamp, location:locations(name)')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { ...session, latestActivity };
    })
  );

  return sessionsWithStatus;
}

export async function getDailySummary(date: Date, filters?: {
  driverId?: string;
  truckId?: string;
}) {
  const supabase = await createClient();
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  let sessionsQuery = supabase
    .from('sessions')
    .select('*, driver:profiles(full_name), truck:trucks(name), crop_type:crop_types(name)')
    .gte('started_at', dayStart)
    .lte('started_at', dayEnd)
    .order('started_at');

  if (filters?.driverId) sessionsQuery = sessionsQuery.eq('driver_id', filters.driverId);
  if (filters?.truckId) sessionsQuery = sessionsQuery.eq('truck_id', filters.truckId);

  const { data: sessions } = await sessionsQuery;
  if (!sessions) return [];

  // Get activities for each session
  const summaries = await Promise.all(
    sessions.map(async (session) => {
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('activity_type, timestamp, location:locations(name)')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: true });

      const trips = countTrips(activities ?? []);
      const durations = calculateDurations(activities ?? []);

      return {
        ...session,
        tripCount: trips,
        ...durations,
      };
    })
  );

  return summaries;
}

function countTrips(activities: { activity_type: string }[]): number {
  return activities.filter(a => a.activity_type === 'loaded_leaving').length;
}

function calculateDurations(activities: { activity_type: string; timestamp: string }[]) {
  let totalLoadingMs = 0;
  let totalUnloadingMs = 0;
  let totalTravelMs = 0;

  for (let i = 0; i < activities.length; i++) {
    const current = activities[i];
    const next = activities[i + 1];
    if (!next) break;

    const duration = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();

    switch (current.activity_type) {
      case 'loading':
        totalLoadingMs += duration;
        break;
      case 'unloading':
        totalUnloadingMs += duration;
        break;
      case 'loaded_leaving':
        totalTravelMs += duration;
        break;
      case 'return_trip':
        totalTravelMs += duration;
        break;
    }
  }

  const shiftStart = activities.find(a => a.activity_type === 'shift_start');
  const shiftEnd = activities.find(a => a.activity_type === 'shift_end');
  const totalShiftMs = shiftStart && shiftEnd
    ? new Date(shiftEnd.timestamp).getTime() - new Date(shiftStart.timestamp).getTime()
    : null;

  const productiveMs = totalLoadingMs + totalUnloadingMs + totalTravelMs;
  const idleMs = totalShiftMs ? totalShiftMs - productiveMs : null;

  return {
    totalLoadingMinutes: Math.round(totalLoadingMs / 60000),
    totalUnloadingMinutes: Math.round(totalUnloadingMs / 60000),
    totalTravelMinutes: Math.round(totalTravelMs / 60000),
    totalShiftMinutes: totalShiftMs ? Math.round(totalShiftMs / 60000) : null,
    idleMinutes: idleMs ? Math.round(idleMs / 60000) : null,
  };
}
