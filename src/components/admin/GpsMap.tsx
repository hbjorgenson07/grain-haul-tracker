'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

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

const ACTIVITY_MARKER_COLORS: Record<string, string> = {
  shift_start: '#16a34a',
  arrived_at_field: '#2563eb',
  loading: '#f97316',
  loaded_leaving: '#15803d',
  arrived_at_destination: '#7c3aed',
  unloading: '#ea580c',
  finished_unloading: '#059669',
  return_trip: '#0891b2',
  shift_end: '#dc2626',
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const boundsKey = points.map((p) => `${p[0]},${p[1]}`).join('|');

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      const L = require('leaflet');
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [boundsKey, map, points]);

  return null;
}

export function GpsMap({
  activities,
  tripLegs,
}: {
  activities: GpsPoint[];
  tripLegs: TripLeg[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);

  const points = useMemo(
    () => activities.map((a) => [a.latitude, a.longitude] as [number, number]),
    [activities]
  );

  const center: [number, number] = points.length > 0
    ? [
        points.reduce((s, p) => s + p[0], 0) / points.length,
        points.reduce((s, p) => s + p[1], 0) / points.length,
      ]
    : [41.25, -96.0]; // Default: central Nebraska

  if (activities.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        No GPS data to display on map.
      </div>
    );
  }

  // Group activities by session for polylines
  const sessionGroups = useMemo(() => {
    const groups: Record<string, GpsPoint[]> = {};
    for (const a of activities) {
      if (!groups[a.session_id]) groups[a.session_id] = [];
      groups[a.session_id].push(a);
    }
    // Sort each group by timestamp
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return groups;
  }, [activities]);

  const sessionColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div ref={mapRef} className="h-[500px] w-full overflow-hidden rounded-lg border shadow-sm">
      <MapContainer
        center={center}
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={points} />

        {/* Draw session route lines */}
        {Object.entries(sessionGroups).map(([sessionId, pts], idx) => (
          <Polyline
            key={sessionId}
            positions={pts.map((p) => [p.latitude, p.longitude] as [number, number])}
            color={sessionColors[idx % sessionColors.length]}
            weight={2}
            opacity={0.5}
            dashArray="6 4"
          />
        ))}

        {/* Plot markers */}
        {activities.map((a) => (
          <CircleMarker
            key={a.id}
            center={[a.latitude, a.longitude]}
            radius={7}
            fillColor={ACTIVITY_MARKER_COLORS[a.activity_type] || '#6b7280'}
            fillOpacity={0.9}
            color="#fff"
            weight={2}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">
                  {ACTIVITY_LABELS[a.activity_type as ActivityType] || a.activity_type}
                </p>
                <p>{formatDateTime(a.timestamp)}</p>
                <p className="text-gray-600">
                  Driver: {a.driver?.full_name ?? '—'}
                </p>
                {a.truck && (
                  <p className="text-gray-600">Truck: {a.truck.name}</p>
                )}
                {a.location && (
                  <p className="text-gray-600">Location: {a.location.name}</p>
                )}
                {a.gps_accuracy != null && (
                  <p className="text-gray-400">Accuracy: {Math.round(a.gps_accuracy)}m</p>
                )}
                <p className="mt-1 font-mono text-xs text-gray-400">
                  {Number(a.latitude).toFixed(6)}, {Number(a.longitude).toFixed(6)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
