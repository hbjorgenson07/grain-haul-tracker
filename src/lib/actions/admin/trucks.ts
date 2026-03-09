'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const truckSchema = z.object({
  name: z.string().min(1),
  licensePlate: z.string().optional(),
});

export async function createTruck(formData: FormData) {
  const supabase = await createClient();
  const parsed = truckSchema.safeParse({
    name: formData.get('name'),
    licensePlate: formData.get('licensePlate') || undefined,
  });

  if (!parsed.success) return { error: 'Name is required.' };

  const { error } = await supabase.from('trucks').insert({
    name: parsed.data.name,
    license_plate: parsed.data.licensePlate || null,
  });

  if (error) return { error: 'Failed to create truck.' };
  revalidatePath('/admin/trucks');
  return { success: true };
}

export async function updateTruck(id: string, formData: FormData) {
  const supabase = await createClient();
  const parsed = truckSchema.safeParse({
    name: formData.get('name'),
    licensePlate: formData.get('licensePlate') || undefined,
  });

  if (!parsed.success) return { error: 'Name is required.' };

  const { error } = await supabase.from('trucks').update({
    name: parsed.data.name,
    license_plate: parsed.data.licensePlate || null,
  }).eq('id', id);

  if (error) return { error: 'Failed to update truck.' };
  revalidatePath('/admin/trucks');
  return { success: true };
}

export async function toggleTruckActive(id: string) {
  const supabase = await createClient();
  const { data: truck } = await supabase.from('trucks').select('is_active').eq('id', id).single();
  if (!truck) return { error: 'Truck not found.' };

  await supabase.from('trucks').update({ is_active: !truck.is_active }).eq('id', id);
  revalidatePath('/admin/trucks');
  return { success: true };
}
