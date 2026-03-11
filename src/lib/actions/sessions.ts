'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const startSessionSchema = z.object({
  truckId: z.uuid(),
  cropTypeId: z.uuid(),
  sourceType: z.enum(['field', 'storage']),
  destinationType: z.enum(['bins', 'elevator', 'plant']),
});

export async function startSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const latStr = formData.get('latitude');
  const lngStr = formData.get('longitude');
  const accStr = formData.get('gpsAccuracy');

  const parsed = startSessionSchema.safeParse({
    truckId: formData.get('truckId'),
    cropTypeId: formData.get('cropTypeId') || undefined,
    sourceType: formData.get('sourceType') || undefined,
    destinationType: formData.get('destinationType') || undefined,
  });

  const latitude = latStr ? parseFloat(latStr as string) : null;
  const longitude = lngStr ? parseFloat(lngStr as string) : null;
  const gpsAccuracy = accStr ? parseFloat(accStr as string) : null;

  if (!parsed.success) {
    return { error: 'Please select a truck, crop type, source, and destination type.' };
  }

  const serviceClient = await createServiceClient();

  // Check for existing active session
  const { data: existing } = await serviceClient
    .from('sessions')
    .select('id')
    .eq('driver_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (existing) {
    return { error: 'You already have an active session. End it first.' };
  }

  const { data: session, error } = await serviceClient
    .from('sessions')
    .insert({
      driver_id: user.id,
      truck_id: parsed.data.truckId,
      crop_type_id: parsed.data.cropTypeId,
      source_type: parsed.data.sourceType,
      destination_type: parsed.data.destinationType,
    })
    .select()
    .single();

  if (error) {
    return { error: 'Failed to start session.' };
  }

  // Log shift_start activity
  await serviceClient.from('activity_logs').insert({
    session_id: session.id,
    driver_id: user.id,
    truck_id: parsed.data.truckId,
    activity_type: 'shift_start',
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    gps_accuracy: Number.isFinite(gpsAccuracy) ? gpsAccuracy : null,
  });

  revalidatePath('/driver');
  return { sessionId: session.id };
}

export async function endSession(sessionId: string, gps?: { latitude: number; longitude: number; accuracy: number } | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  // Get session to verify ownership and get truck_id
  const { data: session } = await serviceClient
    .from('sessions')
    .select('id, driver_id, truck_id')
    .eq('id', sessionId)
    .single();

  if (!session || session.driver_id !== user.id) {
    return { error: 'Session not found.' };
  }

  // Log shift_end activity
  await serviceClient.from('activity_logs').insert({
    session_id: sessionId,
    driver_id: user.id,
    truck_id: session.truck_id,
    activity_type: 'shift_end',
    latitude: gps?.latitude ?? null,
    longitude: gps?.longitude ?? null,
    gps_accuracy: gps?.accuracy ?? null,
  });

  // Close the session
  const { error } = await serviceClient
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    return { error: 'Failed to end session.' };
  }

  revalidatePath('/driver');
  return { success: true };
}

const updateDestinationSchema = z.object({
  sessionId: z.uuid(),
  destinationType: z.enum(['bins', 'elevator', 'plant']),
});

export async function updateSessionDestination(sessionId: string, destinationType: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = updateDestinationSchema.safeParse({ sessionId, destinationType });
  if (!parsed.success) {
    return { error: 'Invalid destination type.' };
  }

  const serviceClient = await createServiceClient();

  // Verify ownership and active session
  const { data: session } = await serviceClient
    .from('sessions')
    .select('id, driver_id')
    .eq('id', parsed.data.sessionId)
    .eq('driver_id', user.id)
    .is('ended_at', null)
    .maybeSingle();

  if (!session) {
    return { error: 'Active session not found.' };
  }

  const { error } = await serviceClient
    .from('sessions')
    .update({ destination_type: parsed.data.destinationType })
    .eq('id', parsed.data.sessionId);

  if (error) {
    return { error: 'Failed to update destination.' };
  }

  revalidatePath('/driver');
  return { success: true };
}
