'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod/v4';

const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'driver']),
  phone: z.string().optional(),
});

export async function createUser(formData: FormData) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Not authorized' };

  const parsed = createUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
    phone: formData.get('phone') || undefined,
  });

  if (!parsed.success) {
    return { error: 'Invalid input. Check all fields.' };
  }

  // Use service role client to create user
  const serviceClient = await createServiceClient();
  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: parsed.data.role,
    },
  });

  if (createError) {
    return { error: createError.message };
  }

  // Update profile with phone if provided
  if (parsed.data.phone && newUser.user) {
    await serviceClient
      .from('profiles')
      .update({ phone: parsed.data.phone })
      .eq('id', newUser.user.id);
  }

  revalidatePath('/admin/drivers');
  return { success: true };
}

export async function toggleUserActive(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Not authorized' };

  const { data: target } = await serviceClient
    .from('profiles')
    .select('is_active')
    .eq('id', userId)
    .single();

  if (!target) return { error: 'User not found' };

  await serviceClient
    .from('profiles')
    .update({ is_active: !target.is_active })
    .eq('id', userId);

  revalidatePath('/admin/drivers');
  return { success: true };
}
