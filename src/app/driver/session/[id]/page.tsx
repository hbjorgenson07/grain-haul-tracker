import { redirect } from 'next/navigation';
import { getSessionById } from '@/lib/queries/sessions';
import { getActivitiesBySession } from '@/lib/queries/activities';
import { formatDate, formatTimestamp, formatDurationMinutes } from '@/lib/utils';
import { differenceInMinutes } from 'date-fns';
import {
  ACTIVITY_LABELS,
  SOURCE_TYPE_LABELS,
  DESTINATION_TYPE_LABELS,
  type ActivityType,
  type SourceType,
  type DestinationType,
} from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) redirect('/driver');

  const activities = await getActivitiesBySession(id);

  const duration = session.ended_at
    ? differenceInMinutes(new Date(session.ended_at), new Date(session.started_at))
    : null;

  const tripCount = activities.filter(a => a.activity_type === 'loaded_leaving').length;

  return (
    <div className="p-4">
      <Link
        href="/driver/session/history"
        className="mb-4 flex items-center gap-1 text-sm text-green-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">{formatDate(session.started_at)}</h2>
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <p>Truck: {(session.truck as { name: string })?.name}</p>
          {session.crop_type && <p>Crop: {(session.crop_type as { name: string })?.name}</p>}
          {session.source_type && <p>Source: {SOURCE_TYPE_LABELS[session.source_type as SourceType]}</p>}
          {session.destination_type && <p>Destination: {DESTINATION_TYPE_LABELS[session.destination_type as DestinationType]}</p>}
          <p>Duration: {duration !== null ? formatDurationMinutes(duration) : 'In progress'}</p>
          <p>Trips: {tripCount}</p>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-gray-700">Activity Timeline</h3>
      <div className="space-y-0">
        {activities.map((activity, i) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              {i < activities.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200" />
              )}
            </div>
            <div className="pb-4">
              <div className="text-sm font-medium text-gray-900">
                {ACTIVITY_LABELS[activity.activity_type as ActivityType] || activity.activity_type}
              </div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
                {activity.location && ` · ${(activity.location as { name: string }).name}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
