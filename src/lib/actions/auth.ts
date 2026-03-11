'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod/v4';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Invalid email or password.' };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  // Ensure profile exists (may be missing if user was created before the DB trigger)
  if (authData.user) {
    const serviceClient = await createServiceClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile) {
      const { error: insertError } = await serviceClient.from('profiles').insert({
        id: authData.user.id,
        full_name: authData.user.user_metadata?.full_name ?? authData.user.email ?? 'Unknown',
        role: authData.user.user_metadata?.role ?? 'driver',
      });
      if (insertError) {
        console.error('[login] profile insert failed:', insertError.message);
        return { error: 'Account setup failed: ' + insertError.message };
      }
    }
  }

  redirect('/');
}

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accessCode: z.string().min(1, 'Access code is required'),
});

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    accessCode: formData.get('accessCode'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input.';
    return { error: firstError };
  }

  const { fullName, email, password, accessCode } = parsed.data;

  // Validate access code server-side
  if (accessCode !== process.env.DRIVER_ACCESS_CODE) {
    return { error: 'Invalid access code.' };
  }

  // Use service role client to create user (bypasses email confirmation)
  const serviceClient = await createServiceClient();

  const { data: authData, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'driver' },
  });

  if (createError) {
    if (createError.message?.includes('already been registered')) {
      return { error: 'An account with this email already exists.' };
    }
    return { error: 'Failed to create account. Please try again.' };
  }

  // Profile row is auto-created by the on_auth_user_created database trigger
  // using the full_name and role from user_metadata above.

  // Sign in the new user
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: 'Account created but sign-in failed. Please go to the login page.' };
  }

  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
