'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const truckSchema = z.object({
  name: z.string().min(1),
  licensePlate: z.string().optional(),
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

export async function createTruck(formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = truckSchema.safeParse({
    name: formData.get('name'),
    licensePlate: formData.get('licensePlate') || undefined,
  });

  if (!parsed.success) return { error: 'Name is required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('trucks').insert({
    name: parsed.data.name,
    license_plate: parsed.data.licensePlate || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/trucks');
  return { success: true };
}

export async function updateTruck(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = truckSchema.safeParse({
    name: formData.get('name'),
    licensePlate: formData.get('licensePlate') || undefined,
  });

  if (!parsed.success) return { error: 'Name is required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('trucks').update({
    name: parsed.data.name,
    license_plate: parsed.data.licensePlate || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin/trucks');
  return { success: true };
}

export async function deleteTruck(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('trucks').delete().eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin/trucks');
  return { success: true };
}

export async function toggleTruckActive(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const serviceClient = await createServiceClient();
  const { data: truck } = await serviceClient.from('trucks').select('is_active').eq('id', id).single();
  if (!truck) return { error: 'Truck not found.' };

  await serviceClient.from('trucks').update({ is_active: !truck.is_active }).eq('id', id);
  revalidatePath('/admin/trucks');
  return { success: true };
}
