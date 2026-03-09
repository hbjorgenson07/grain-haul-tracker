import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DriverNav } from '@/components/layout/DriverNav';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-green-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Grain Haul Tracker</h1>
          <span className="text-sm text-green-100">{profile.full_name}</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      <DriverNav />
    </div>
  );
}
