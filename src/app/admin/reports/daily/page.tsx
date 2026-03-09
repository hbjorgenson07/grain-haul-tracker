import { getDailySummary } from '@/lib/queries/dashboard';
import { getAllDrivers, getAllTrucks } from '@/lib/queries/admin';
import { formatDurationMinutes } from '@/lib/utils';
import { DailyReportFilters } from '@/components/admin/DailyReportFilters';

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const dateStr = params.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr + 'T12:00:00');

  const summaries = await getDailySummary(date, {
    driverId: params.driverId,
    truckId: params.truckId,
  });

  const drivers = await getAllDrivers();
  const trucks = await getAllTrucks();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Daily Summary</h1>

      <DailyReportFilters
        drivers={drivers}
        trucks={trucks}
        currentDate={dateStr}
        currentFilters={{
          driverId: params.driverId,
          truckId: params.truckId,
        }}
      />

      <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Truck</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Crop</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Trips</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Loading</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Unloading</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Travel</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Idle</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Shift</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No sessions found for this date.
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {(s.driver as { full_name: string })?.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {(s.truck as { name: string })?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {(s.crop_type as { name: string })?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {s.tripCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatDurationMinutes(s.totalLoadingMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatDurationMinutes(s.totalUnloadingMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatDurationMinutes(s.totalTravelMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatDurationMinutes(s.idleMinutes)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatDurationMinutes(s.totalShiftMinutes)}
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
