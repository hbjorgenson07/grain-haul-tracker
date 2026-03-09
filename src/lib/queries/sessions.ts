import { createClient } from '@/lib/supabase/server';

export async function getActiveSession(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sessions')
    .select('*, truck:trucks(*), crop_type:crop_types(*)')
    .eq('driver_id', userId)
    .is('ended_at', null)
    .maybeSingle();

  return data;
}

export async function getSessionHistory(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sessions')
    .select('*, truck:trucks(*), crop_type:crop_types(*)')
    .eq('driver_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getSessionById(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sessions')
    .select('*, truck:trucks(*), crop_type:crop_types(*), driver:profiles(*)')
    .eq('id', sessionId)
    .single();

  return data;
}

export async function getAllSessions(filters?: {
  driverId?: string;
  truckId?: string;
  cropTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('sessions')
    .select('*, truck:trucks(*), crop_type:crop_types(*), driver:profiles(*)')
    .order('started_at', { ascending: false });

  if (filters?.driverId) query = query.eq('driver_id', filters.driverId);
  if (filters?.truckId) query = query.eq('truck_id', filters.truckId);
  if (filters?.cropTypeId) query = query.eq('crop_type_id', filters.cropTypeId);
  if (filters?.dateFrom) query = query.gte('started_at', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('started_at', filters.dateTo);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data } = await query;
  return data ?? [];
}
