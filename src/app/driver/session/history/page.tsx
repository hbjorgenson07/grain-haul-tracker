import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSessionHistory } from '@/lib/queries/sessions';
import { formatDate, formatDurationMinutes } from '@/lib/utils';
import { differenceInMinutes } from 'date-fns';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  truck: { name: string } | null;
  crop_type: { name: string } | null;
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sessions = (await getSessionHistory(user.id)) as SessionRow[];

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Shift History</h2>

      {sessions.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No completed shifts yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const duration = session.ended_at
              ? differenceInMinutes(new Date(session.ended_at), new Date(session.started_at))
              : null;

            return (
              <Link
                key={session.id}
                href={`/driver/session/${session.id}`}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDate(session.started_at)}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {session.truck?.name} · {duration !== null ? formatDurationMinutes(duration) : 'In progress'}
                  </div>
                  {session.crop_type && (
                    <div className="mt-0.5 text-xs text-gray-400">
                      {session.crop_type.name}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
