import { createServiceClient } from '@/lib/supabase/server';
import { getAllDrivers } from '@/lib/queries/admin';
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { getRoadDistance } from '@/lib/utils/distance';
import { GpsFilters } from '@/components/admin/GpsFilters';
import { GpsExportButton } from '@/components/admin/GpsExportButton';
import { GpsPageClient } from '@/components/admin/GpsPageClient';

async function getGpsActivities(limit = 200, filters?: {
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createServiceClient();
  let query = supabase
    .from('activity_logs')
    .select('*, location:locations(name), driver:profiles(full_name), truck:trucks(name)')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (filters?.driverId) query = query.eq('driver_id', filters.driverId);
  if (filters?.dateFrom) query = query.gte('timestamp', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('timestamp', filters.dateTo);

  const { data } = await query;
  return data ?? [];
}

interface TripLeg {
  sessionId: string;
  driverName: string;
  fromActivity: string;
  toActivity: string;
  fromLocation: string;
  toLocation: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  miles: number | null;
  durationMinutes: number | null;
}

async function calculateTripLegs(activities: Awaited<ReturnType<typeof getGpsActivities>>): Promise<TripLeg[]> {
  // Group by session, sorted by time ascending
  const sessions: Record<string, typeof activities> = {};
  for (const a of activities) {
    if (!sessions[a.session_id]) sessions[a.session_id] = [];
    sessions[a.session_id].push(a);
  }

  const legs: TripLeg[] = [];

  for (const [sessionId, acts] of Object.entries(sessions)) {
    const sorted = [...acts].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Find trip legs: loaded_leaving → arrived_at_destination, return_trip → arrived_at_field
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      const isTripLeg =
        (curr.activity_type === 'loaded_leaving' && next.activity_type === 'arrived_at_destination') ||
        (curr.activity_type === 'return_trip' && next.activity_type === 'arrived_at_field');

      if (isTripLeg && curr.latitude && curr.longitude && next.latitude && next.longitude) {
        legs.push({
          sessionId,
          driverName: (curr.driver as { full_name: string })?.full_name ?? '—',
          fromActivity: ACTIVITY_LABELS[curr.activity_type as ActivityType] || curr.activity_type,
          toActivity: ACTIVITY_LABELS[next.activity_type as ActivityType] || next.activity_type,
          fromLocation: curr.location ? (curr.location as { name: string }).name : '—',
          toLocation: next.location ? (next.location as { name: string }).name : '—',
          fromCoords: [curr.latitude, curr.longitude],
          toCoords: [next.latitude, next.longitude],
          miles: null,
          durationMinutes: null,
        });
      }
    }
  }

  // Fetch road distances (limit concurrent requests)
  const results = await Promise.all(
    legs.map((leg) =>
      getRoadDistance(leg.fromCoords[0], leg.fromCoords[1], leg.toCoords[0], leg.toCoords[1])
    )
  );

  for (let i = 0; i < legs.length; i++) {
    const result = results[i];
    if (result) {
      legs[i].miles = result.miles;
      legs[i].durationMinutes = result.durationMinutes;
    }
  }

  return legs;
}

export default async function GpsDataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    driverId: params.driverId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };

  const [activities, drivers] = await Promise.all([
    getGpsActivities(200, filters),
    getAllDrivers(),
  ]);

  const tripLegs = await calculateTripLegs(activities);
  const totalMiles = tripLegs.reduce((sum, l) => sum + (l.miles ?? 0), 0);

  const csvData = activities.map((a) => ({
    time: a.timestamp,
    driver: (a.driver as { full_name: string })?.full_name ?? '',
    activity: ACTIVITY_LABELS[a.activity_type as ActivityType] || a.activity_type,
    location: a.location ? (a.location as { name: string }).name : '',
    latitude: a.latitude,
    longitude: a.longitude,
    accuracy_m: a.gps_accuracy != null ? Math.round(a.gps_accuracy) : '',
  }));

  // Serialize activities for client map component
  const mapActivities = activities.map((a) => ({
    id: a.id,
    latitude: a.latitude as number,
    longitude: a.longitude as number,
    gps_accuracy: a.gps_accuracy,
    timestamp: a.timestamp,
    activity_type: a.activity_type,
    session_id: a.session_id,
    driver: a.driver as { full_name: string } | null,
    location: a.location as { name: string } | null,
    truck: a.truck as { name: string } | null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GPS Data</h1>
          {tripLegs.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {tripLegs.length} trip leg{tripLegs.length !== 1 ? 's' : ''} &middot;{' '}
              <span className="font-medium text-gray-700">{totalMiles.toFixed(1)} miles</span> total road distance
            </p>
          )}
        </div>
        <GpsExportButton data={csvData} />
      </div>

      <GpsFilters drivers={drivers} currentFilters={filters} />

      {/* Map View */}
      <div className="mt-4">
        <GpsPageClient activities={mapActivities} tripLegs={tripLegs.map((l) => ({
          sessionId: l.sessionId,
          points: [l.fromCoords, l.toCoords],
          miles: l.miles,
        }))} />
      </div>

      {/* Trip Legs Mileage Table */}
      {tripLegs.length > 0 && (
        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Trip Mileage</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">From</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">To</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Road Miles</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Est. Drive Time</th>
                </tr>
              </thead>
              <tbody>
                {tripLegs.map((leg, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{leg.driverName}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {leg.fromLocation !== '—' ? leg.fromLocation : leg.fromActivity}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {leg.toLocation !== '—' ? leg.toLocation : leg.toActivity}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {leg.miles != null ? `${leg.miles.toFixed(1)} mi` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {leg.durationMinutes != null ? `${Math.round(leg.durationMinutes)} min` : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-gray-900">{totalMiles.toFixed(1)} mi</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {Math.round(tripLegs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0))} min
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw GPS Data Table */}
      <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">All GPS Points</h2>
        <p className="mb-4 text-sm text-gray-500">
          Showing {activities.length} activities with GPS coordinates.
          {activities.length === 200 && ' Use filters to narrow results.'}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Driver</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Activity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Latitude</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Longitude</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Accuracy</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Map</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No GPS data found. Activities without coordinates are excluded.
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
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ACTIVITY_LABELS[a.activity_type as ActivityType] || a.activity_type}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.location ? (a.location as { name: string }).name : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {Number(a.latitude).toFixed(6)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {Number(a.longitude).toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {a.gps_accuracy != null ? `${Math.round(a.gps_accuracy)}m` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
