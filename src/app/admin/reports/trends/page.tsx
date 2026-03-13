import { createServiceClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/utils';
import { calculateDurations } from '@/lib/queries/dashboard';
import { TrendsCharts } from '@/components/admin/TrendsCharts';
import { TrendsFilters } from '@/components/admin/TrendsFilters';

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = [7, 14, 30].includes(Number(params.days)) ? Number(params.days) : 14;

  const supabase = await createServiceClient();

  // Build timezone-aware start date
  const startDateStr = formatInTimeZone(subDays(new Date(), days - 1), TIMEZONE, 'yyyy-MM-dd');
  const startDate = fromZonedTime(`${startDateStr}T00:00:00`, TIMEZONE);

  // Get all activity logs for the date range
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('activity_type, timestamp, driver_id, session_id')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });

  // Get driver names
  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'driver');

  const driverMap = new Map(drivers?.map(d => [d.id, d.full_name]) ?? []);

  // Initialize daily stats
  const dailyStats: Record<string, {
    date: string;
    trips: number;
    sessions: number;
  }> = {};

  const dailyEfficiency: Record<string, {
    date: string;
    loading: number;
    travel: number;
    unloading: number;
    idle: number;
  }> = {};

  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), days - 1 - i);
    const key = formatInTimeZone(d, TIMEZONE, 'yyyy-MM-dd');
    const label = formatInTimeZone(d, TIMEZONE, 'MMM d');
    dailyStats[key] = { date: label, trips: 0, sessions: 0 };
    dailyEfficiency[key] = { date: label, loading: 0, travel: 0, unloading: 0, idle: 0 };
  }

  // Count daily trips and sessions
  for (const a of activities ?? []) {
    const day = formatInTimeZone(new Date(a.timestamp), TIMEZONE, 'yyyy-MM-dd');
    if (!dailyStats[day]) continue;

    if (a.activity_type === 'loaded_leaving') dailyStats[day].trips++;
    if (a.activity_type === 'shift_start') dailyStats[day].sessions++;
  }

  // Group activities by session for duration calculation
  const sessionActivities = new Map<string, { activity_type: string; timestamp: string }[]>();
  for (const a of activities ?? []) {
    if (!a.session_id) continue;
    if (!sessionActivities.has(a.session_id)) {
      sessionActivities.set(a.session_id, []);
    }
    sessionActivities.get(a.session_id)!.push({
      activity_type: a.activity_type,
      timestamp: a.timestamp,
    });
  }

  // Calculate durations per session and aggregate by day
  for (const [, acts] of sessionActivities) {
    const shiftStart = acts.find(a => a.activity_type === 'shift_start');
    if (!shiftStart) continue;

    const day = formatInTimeZone(new Date(shiftStart.timestamp), TIMEZONE, 'yyyy-MM-dd');
    if (!dailyEfficiency[day]) continue;

    const durations = calculateDurations(acts);
    dailyEfficiency[day].loading += durations.totalLoadingMinutes;
    dailyEfficiency[day].travel += durations.totalTravelMinutes;
    dailyEfficiency[day].unloading += durations.totalUnloadingMinutes;
    dailyEfficiency[day].idle += durations.idleMinutes ?? 0;
  }

  // Driver trip counts, sorted descending
  const driverTrips: Record<string, number> = {};
  for (const a of activities ?? []) {
    if (a.activity_type === 'loaded_leaving') {
      const name = driverMap.get(a.driver_id) ?? 'Unknown';
      driverTrips[name] = (driverTrips[name] || 0) + 1;
    }
  }

  const chartData = Object.values(dailyStats);
  const efficiencyData = Object.values(dailyEfficiency);
  const driverChartData = Object.entries(driverTrips)
    .map(([name, trips]) => ({ name, trips }))
    .sort((a, b) => b.trips - a.trips);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Trends (Last {days} Days)</h1>
        <TrendsFilters currentDays={days} />
      </div>
      <TrendsCharts
        dailyData={chartData}
        efficiencyData={efficiencyData}
        driverData={driverChartData}
      />
    </div>
  );
}
