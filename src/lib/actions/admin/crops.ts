'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const cropSchema = z.object({
  name: z.string().min(1),
});

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

export async function createCrop(formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = cropSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: 'Name is required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('crop_types').insert({ name: parsed.data.name });
  if (error) return { error: error.message };
  revalidatePath('/admin/crops');
  return { success: true };
}

export async function updateCrop(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = cropSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: 'Name is required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('crop_types').update({ name: parsed.data.name }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/crops');
  return { success: true };
}

export async function deleteCrop(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const serviceClient = await createServiceClient();

  // Check if crop is referenced by any sessions
  const { data: referenced } = await serviceClient
    .from('sessions')
    .select('id')
    .eq('crop_type_id', id)
    .limit(1);

  if (referenced && referenced.length > 0) {
    return { error: 'This crop type is in use by one or more sessions and cannot be deleted.' };
  }

  const { error } = await serviceClient.from('crop_types').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/crops');
  return { success: true };
}

export async function toggleCropActive(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const serviceClient = await createServiceClient();
  const { data: crop } = await serviceClient.from('crop_types').select('is_active').eq('id', id).single();
  if (!crop) return { error: 'Crop type not found.' };

  await serviceClient.from('crop_types').update({ is_active: !crop.is_active }).eq('id', id);
  revalidatePath('/admin/crops');
  return { success: true };
}
