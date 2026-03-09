import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/queries/sessions';
import { getActivitiesBySession } from '@/lib/queries/activities';
import { getActiveLocations } from '@/lib/queries/admin';
import { ActivityLogger } from '@/components/driver/ActivityLogger';

export default async function SessionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const session = await getActiveSession(user.id);
  if (!session) redirect('/driver');

  const activities = await getActivitiesBySession(session.id);
  const locations = await getActiveLocations();

  return (
    <ActivityLogger
      session={session}
      activities={activities}
      locations={locations}
    />
  );
}
