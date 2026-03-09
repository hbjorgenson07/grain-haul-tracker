'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const cropSchema = z.object({
  name: z.string().min(1),
});

export async function createCrop(formData: FormData) {
  const supabase = await createClient();
  const parsed = cropSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: 'Name is required.' };

  const { error } = await supabase.from('crop_types').insert({ name: parsed.data.name });
  if (error) return { error: 'Failed to create crop type.' };
  revalidatePath('/admin/crops');
  return { success: true };
}

export async function updateCrop(id: string, formData: FormData) {
  const supabase = await createClient();
  const parsed = cropSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: 'Name is required.' };

  const { error } = await supabase.from('crop_types').update({ name: parsed.data.name }).eq('id', id);
  if (error) return { error: 'Failed to update crop type.' };
  revalidatePath('/admin/crops');
  return { success: true };
}

export async function toggleCropActive(id: string) {
  const supabase = await createClient();
  const { data: crop } = await supabase.from('crop_types').select('is_active').eq('id', id).single();
  if (!crop) return { error: 'Crop type not found.' };

  await supabase.from('crop_types').update({ is_active: !crop.is_active }).eq('id', id);
  revalidatePath('/admin/crops');
  return { success: true };
}
