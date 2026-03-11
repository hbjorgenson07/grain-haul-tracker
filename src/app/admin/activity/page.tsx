import { getRecentActivities } from '@/lib/queries/activities';
import { getAllDrivers, getAllTrucks, getAllLocations } from '@/lib/queries/admin';
import { ACTIVITY_LABELS, ACTIVITY_TYPES, type ActivityType } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { ActivityFilters } from '@/components/admin/ActivityFilters';

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    driverId: params.driverId,
    truckId: params.truckId,
    locationId: params.locationId,
    activityType: params.activityType,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const activities = await getRecentActivities(100, filters);
  const drivers = await getAllDrivers();
  const trucks = await getAllTrucks();
  const locations = await getAllLocations();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Activity Log</h1>

      <ActivityFilters
        drivers={drivers}
        trucks={trucks}
        locations={locations}
        activityTypes={ACTIVITY_TYPES as unknown as string[]}
        activityLabels={ACTIVITY_LABELS}
        currentFilters={filters}
      />

      <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Truck</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Activity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">GPS</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No activity found.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                    {formatDateTime(a.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(a.driver as { full_name: string })?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(a.truck as { name: string })?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {ACTIVITY_LABELS[a.activity_type as ActivityType] || a.activity_type}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.location ? (a.location as { name: string }).name : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {a.latitude != null && a.longitude != null ? (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        title={a.gps_accuracy != null ? `Accuracy: ${Math.round(a.gps_accuracy)}m` : undefined}
                      >
                        {Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
