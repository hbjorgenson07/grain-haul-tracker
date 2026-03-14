'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getEasternDayBounds } from '@/lib/queries/dashboard';
import { fromZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/utils';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' } as const;

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Not authorized' } as const;
  return { user } as const;
}

export async function deleteDataByDate(dateStr: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  // Parse the date string as a date in Eastern time
  const date = fromZonedTime(`${dateStr}T12:00:00`, TIMEZONE);
  const { dayStart, dayEnd } = getEasternDayBounds(date);

  const supabase = await createServiceClient();

  // Find sessions that started on this date
  const { data: sessions, error: fetchError } = await supabase
    .from('sessions')
    .select('id')
    .gte('started_at', dayStart)
    .lte('started_at', dayEnd);

  if (fetchError) return { error: fetchError.message };
  if (!sessions || sessions.length === 0) {
    return { error: 'No sessions found for this date.' };
  }

  const sessionIds = sessions.map(s => s.id);

  // Delete activity logs first (FK constraint)
  const { error: logsError } = await supabase
    .from('activity_logs')
    .delete()
    .in('session_id', sessionIds);

  if (logsError) return { error: `Failed to delete activity logs: ${logsError.message}` };

  // Delete sessions
  const { error: sessionsError } = await supabase
    .from('sessions')
    .delete()
    .in('id', sessionIds);

  if (sessionsError) return { error: `Failed to delete sessions: ${sessionsError.message}` };

  return { success: true, deletedCount: sessions.length };
}
