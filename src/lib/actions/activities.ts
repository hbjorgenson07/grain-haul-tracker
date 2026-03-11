'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';
import { ACTIVITY_TYPES } from '@/lib/constants';

const logActivitySchema = z.object({
  sessionId: z.uuid(),
  activityType: z.enum(ACTIVITY_TYPES),
  locationId: z.uuid().optional(),
  notes: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().min(0).optional(),
});

export async function logActivity(data: {
  sessionId: string;
  activityType: string;
  locationId?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = logActivitySchema.safeParse(data);
  if (!parsed.success) {
    return { error: 'Invalid activity data.' };
  }

  const serviceClient = await createServiceClient();

  // Get session to verify ownership and get truck_id
  const { data: session } = await serviceClient
    .from('sessions')
    .select('id, driver_id, truck_id')
    .eq('id', parsed.data.sessionId)
    .single();

  if (!session || session.driver_id !== user.id) {
    return { error: 'Session not found.' };
  }

  const { error } = await serviceClient.from('activity_logs').insert({
    session_id: parsed.data.sessionId,
    driver_id: user.id,
    truck_id: session.truck_id,
    activity_type: parsed.data.activityType,
    location_id: parsed.data.locationId || null,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    gps_accuracy: parsed.data.gpsAccuracy ?? null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: 'Failed to log activity.' };
  }

  revalidatePath('/driver');
  return { success: true };
}
