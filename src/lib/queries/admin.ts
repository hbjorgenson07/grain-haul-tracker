import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function getAllDrivers() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'driver')
    .order('full_name');

  return data ?? [];
}

export async function getAllProfiles() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('full_name');

  return data ?? [];
}

export async function getAllTrucks() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('trucks')
    .select('*')
    .order('name');

  return data ?? [];
}

export async function getActiveTrucks() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('trucks')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}

export async function getAllLocations() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('locations')
    .select('*')
    .order('type')
    .order('name');

  return data ?? [];
}

export async function getActiveLocations() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('type')
    .order('name');

  return data ?? [];
}

export async function getAllCropTypes() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('crop_types')
    .select('*')
    .order('name');

  return data ?? [];
}

export async function getActiveCropTypes() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('crop_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}
