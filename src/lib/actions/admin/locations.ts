'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';
import { LOCATION_TYPES } from '@/lib/constants';

const locationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(LOCATION_TYPES),
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

export async function createLocation(formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = locationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  });

  if (!parsed.success) return { error: 'Name and type are required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('locations').insert({
    name: parsed.data.name,
    type: parsed.data.type,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/locations');
  return { success: true };
}

export async function updateLocation(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const parsed = locationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  });

  if (!parsed.success) return { error: 'Name and type are required.' };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from('locations').update({
    name: parsed.data.name,
    type: parsed.data.type,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/admin/locations');
  return { success: true };
}

export async function toggleLocationActive(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const serviceClient = await createServiceClient();
  const { data: loc } = await serviceClient.from('locations').select('is_active').eq('id', id).single();
  if (!loc) return { error: 'Location not found.' };

  await serviceClient.from('locations').update({ is_active: !loc.is_active }).eq('id', id);
  revalidatePath('/admin/locations');
  return { success: true };
}

export async function deleteLocations(ids: string[]) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  if (ids.length === 0) return { error: 'No locations selected.' };

  const serviceClient = await createServiceClient();

  // Find which locations are referenced by activity_logs
  const { data: referenced } = await serviceClient
    .from('activity_logs')
    .select('location_id')
    .in('location_id', ids);

  const inUseIds = new Set((referenced ?? []).map(r => r.location_id));
  const deletableIds = ids.filter(id => !inUseIds.has(id));
  const skippedCount = ids.length - deletableIds.length;

  if (deletableIds.length > 0) {
    const { error } = await serviceClient
      .from('locations')
      .delete()
      .in('id', deletableIds);

    if (error) return { error: error.message };
  }

  revalidatePath('/admin/locations');
  return { success: true, deleted: deletableIds.length, skipped: skippedCount };
}

export async function importFieldsFromCsv(formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: auth.error };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided.' };

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return { error: 'File is empty.' };

  // Skip header row if it looks like one
  const firstLine = lines[0].toLowerCase();
  if (firstLine === 'name' || firstLine === 'field' || firstLine === 'field name' || firstLine === 'field_name') {
    lines.shift();
  }

  if (lines.length === 0) return { error: 'No field names found in file.' };

  const serviceClient = await createServiceClient();

  // Get existing location names to deduplicate
  const { data: existing } = await serviceClient
    .from('locations')
    .select('name');

  const existingNames = new Set(
    (existing ?? []).map(l => l.name.toLowerCase())
  );

  const newFields = lines.filter(name => !existingNames.has(name.toLowerCase()));
  const skipped = lines.length - newFields.length;

  if (newFields.length > 0) {
    const { error } = await serviceClient
      .from('locations')
      .insert(newFields.map(name => ({ name, type: 'field' })));

    if (error) return { error: error.message };
  }

  revalidatePath('/admin/locations');
  return { success: true, imported: newFields.length, skipped };
}
