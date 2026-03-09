'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';
import { ACTIVITY_TYPES } from '@/lib/constants';

const logActivitySchema = z.object({
  sessionId: z.uuid(),
  activityType: z.enum(ACTIVITY_TYPES),
  locationId: z.uuid().optional(),
  notes: z.string().optional(),
});

export async function logActivity(data: {
  sessionId: string;
  activityType: string;
  locationId?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = logActivitySchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid activity data.' };
  }

  // Get session to verify ownership and get truck_id
  const { data: session } = await supabase
    .from('sessions')
    .select('id, driver_id, truck_id')
    .eq('id', parsed.data.sessionId)
    .single();

  if (!session || session.driver_id !== user.id) {
    return { error: 'Session not found.' };
  }

  const { error } = await supabase.from('activity_logs').insert({
    session_id: parsed.data.sessionId,
    driver_id: user.id,
    truck_id: session.truck_id,
    activity_type: parsed.data.activityType,
    location_id: parsed.data.locationId || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: 'Failed to log activity.' };
  }

  revalidatePath('/driver');
  return { success: true };
}
