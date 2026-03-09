import { createClient } from '@/lib/supabase/server';

export async function getActivitiesBySession(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('activity_logs')
    .select('*, location:locations(*)')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  return data ?? [];
}

export async function getLatestActivity(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('activity_logs')
    .select('*, location:locations(*)')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getRecentActivities(limit = 50, filters?: {
  driverId?: string;
  truckId?: string;
  locationId?: string;
  activityType?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('activity_logs')
    .select('*, location:locations(*), driver:profiles(full_name), truck:trucks(name)')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (filters?.driverId) query = query.eq('driver_id', filters.driverId);
  if (filters?.truckId) query = query.eq('truck_id', filters.truckId);
  if (filters?.locationId) query = query.eq('location_id', filters.locationId);
  if (filters?.activityType) query = query.eq('activity_type', filters.activityType);
  if (filters?.dateFrom) query = query.gte('timestamp', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('timestamp', filters.dateTo);

  const { data } = await query;
  return data ?? [];
}
