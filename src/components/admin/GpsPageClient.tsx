'use client';

import dynamic from 'next/dynamic';

const GpsMap = dynamic(() => import('@/components/admin/GpsMap').then((m) => m.GpsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-lg bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface GpsPoint {
  id: string;
  latitude: number;
  longitude: number;
  gps_accuracy: number | null;
  timestamp: string;
  activity_type: string;
  session_id: string;
  driver: { full_name: string } | null;
  location: { name: string } | null;
  truck: { name: string } | null;
}

interface TripLeg {
  sessionId: string;
  points: [number, number][];
  miles: number | null;
}

export function GpsPageClient({
  activities,
  tripLegs,
}: {
  activities: GpsPoint[];
  tripLegs: TripLeg[];
}) {
  return <GpsMap activities={activities} tripLegs={tripLegs} />;
}
