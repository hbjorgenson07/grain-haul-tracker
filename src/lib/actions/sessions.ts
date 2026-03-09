'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const startSessionSchema = z.object({
  truckId: z.uuid(),
  cropTypeId: z.uuid().optional(),
});

export async function startSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = startSessionSchema.safeParse({
    truckId: formData.get('truckId'),
    cropTypeId: formData.get('cropTypeId') || undefined,
  });

  if (!parsed.success) {
    return { error: 'Please select a truck.' };
  }

  // Check for existing active session
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('driver_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (existing) {
    return { error: 'You already have an active session. End it first.' };
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      driver_id: user.id,
      truck_id: parsed.data.truckId,
      crop_type_id: parsed.data.cropTypeId || null,
    })
    .select()
    .single();

  if (error) {
    return { error: 'Failed to start session.' };
  }

  // Log shift_start activity
  await supabase.from('activity_logs').insert({
    session_id: session.id,
    driver_id: user.id,
    truck_id: parsed.data.truckId,
    activity_type: 'shift_start',
  });

  revalidatePath('/driver');
  return { sessionId: session.id };
}

export async function endSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Get session to verify ownership and get truck_id
  const { data: session } = await supabase
    .from('sessions')
    .select('id, driver_id, truck_id')
    .eq('id', sessionId)
    .single();

  if (!session || session.driver_id !== user.id) {
    return { error: 'Session not found.' };
  }

  // Log shift_end activity
  await supabase.from('activity_logs').insert({
    session_id: sessionId,
    driver_id: user.id,
    truck_id: session.truck_id,
    activity_type: 'shift_end',
  });

  // Close the session
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    return { error: 'Failed to end session.' };
  }

  revalidatePath('/driver');
  return { success: true };
}
