import { createClient, getProfileByUserId } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminNavbar } from '@/components/layout/AdminNavbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getProfileByUserId(user.id);

  if (!profile || profile.role !== 'admin') redirect('/driver');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar userName={profile.full_name} />
      <main className="pt-14">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
