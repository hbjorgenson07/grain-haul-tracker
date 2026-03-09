'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';
import { LOCATION_TYPES } from '@/lib/constants';

const locationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(LOCATION_TYPES),
});

export async function createLocation(formData: FormData) {
  const supabase = await createClient();
  const parsed = locationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  });

  if (!parsed.success) return { error: 'Name and type are required.' };

  const { error } = await supabase.from('locations').insert({
    name: parsed.data.name,
    type: parsed.data.type,
  });

  if (error) return { error: 'Failed to create location.' };
  revalidatePath('/admin/locations');
  return { success: true };
}

export async function updateLocation(id: string, formData: FormData) {
  const supabase = await createClient();
  const parsed = locationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  });

  if (!parsed.success) return { error: 'Name and type are required.' };

  const { error } = await supabase.from('locations').update({
    name: parsed.data.name,
    type: parsed.data.type,
  }).eq('id', id);

  if (error) return { error: 'Failed to update location.' };
  revalidatePath('/admin/locations');
  return { success: true };
}

export async function toggleLocationActive(id: string) {
  const supabase = await createClient();
  const { data: loc } = await supabase.from('locations').select('is_active').eq('id', id).single();
  if (!loc) return { error: 'Location not found.' };

  await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', id);
  revalidatePath('/admin/locations');
  return { success: true };
}
