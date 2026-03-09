import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/queries/sessions';
import { getActiveTrucks, getActiveCropTypes } from '@/lib/queries/admin';
import { StartShiftForm } from '@/components/driver/StartShiftForm';

export default async function DriverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeSession = await getActiveSession(user.id);

  // If there's an active session, go to the activity logger
  if (activeSession) {
    redirect('/driver/session');
  }

  const trucks = await getActiveTrucks();
  const cropTypes = await getActiveCropTypes();

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <StartShiftForm trucks={trucks} cropTypes={cropTypes} />
    </div>
  );
}
