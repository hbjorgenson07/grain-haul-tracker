'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/actions/activities';
import { endSession, updateSessionDestination } from '@/lib/actions/sessions';
import {
  ACTIVITY_LABELS,
  ACTIVITY_COLORS,
  getNextActivity,
  LOCATION_REQUIRED_ACTIVITIES,
  SOURCE_TYPE_LABELS,
  DESTINATION_TYPES,
  DESTINATION_TYPE_LABELS,
  type ActivityType,
  type SourceType,
  type DestinationType,
} from '@/lib/constants';
import { formatElapsedTime, formatTimestamp } from '@/lib/utils';
import { useGps } from '@/hooks/useGps';
import { StopCircle, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import type { Location } from '@/lib/types/database';
import { LocationPicker } from './LocationPicker';

interface ActivityLogEntry {
  id: string;
  activity_type: string;
  timestamp: string;
  location: { name: string } | null;
}

interface SessionData {
  id: string;
  started_at: string;
  truck: { name: string };
  crop_type: { name: string };
  source_type: 'field' | 'storage';
  destination_type: 'bins' | 'elevator' | 'plant';
}

export function ActivityLogger({
  session,
  activities,
  locations,
}: {
  session: SessionData;
  activities: ActivityLogEntry[];
  locations: Location[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [editingDestination, setEditingDestination] = useState(false);
  const { gpsStatus, getCurrentPosition } = useGps();

  const isStorage = session.source_type === 'storage';
  const allowedDestinations = DESTINATION_TYPES.filter(
    dt => !(isStorage && dt === 'bins')
  );

  const handleUpdateDestination = useCallback(async (newDest: DestinationType) => {
    setLoading(true);
    const result = await updateSessionDestination(session.id, newDest);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingDestination(false);
      router.refresh();
    }
    setLoading(false);
  }, [session.id, router]);

  // Determine current state from last activity
  const lastActivity = activities[activities.length - 1];
  const lastType = (lastActivity?.activity_type ?? 'shift_start') as ActivityType;
  const nextActivity = getNextActivity(lastType, session.source_type as SourceType);

  // Count trips (number of loaded_leaving events)
  const tripCount = activities.filter(a => a.activity_type === 'loaded_leaving').length;

  // Elapsed timer
  useEffect(() => {
    const start = new Date(session.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.started_at]);

  const needsLocation = nextActivity
    ? LOCATION_REQUIRED_ACTIVITIES.includes(nextActivity)
    : false;

  const fieldLocations = locations.filter(l => l.type === 'field');
  const destinationLocations = locations.filter(l => l.type !== 'field');

  const relevantLocations = nextActivity === 'arrived_at_field'
    ? fieldLocations
    : destinationLocations;

  const handleLogActivity = useCallback(async () => {
    if (!nextActivity) return;
    if (needsLocation && !selectedLocation) {
      setError('Please select a location.');
      return;
    }

    setLoading(true);
    setError(null);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    // Capture GPS coordinates
    const coords = await getCurrentPosition();

    const result = await logActivity({
      sessionId: session.id,
      activityType: nextActivity,
      locationId: needsLocation ? selectedLocation : undefined,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      gpsAccuracy: coords?.accuracy,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSelectedLocation('');
      setLoading(false);
      router.refresh();
    }
  }, [nextActivity, needsLocation, selectedLocation, session.id, router, getCurrentPosition]);

  const handleEndShift = useCallback(async () => {
    if (!confirm('Are you sure you want to end your shift?')) return;
    setLoading(true);
    const coords = await getCurrentPosition();
    const result = await endSession(session.id, coords ? { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy } : null);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/driver');
      router.refresh();
    }
  }, [session.id, router, getCurrentPosition]);

  const statusText = ACTIVITY_LABELS[lastType] || 'In Progress';
  const buttonColor = nextActivity ? ACTIVITY_COLORS[nextActivity] : 'bg-gray-400';
  const buttonLabel = nextActivity ? ACTIVITY_LABELS[nextActivity] : 'Shift Complete';

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Status bar */}
      <div className="mb-4 rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900">{session.truck.name}</span>
            <span className={`inline-block h-2 w-2 rounded-full ${
              gpsStatus === 'granted' ? 'bg-green-500' : gpsStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
            }`} title={`GPS: ${gpsStatus}`} />
          </div>
          <span className="font-mono text-gray-600">{formatElapsedTime(elapsed)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Status: <span className="font-medium text-gray-700">{statusText}</span>
          </span>
          <span className="text-gray-500">
            Trip #{tripCount + (lastType === 'loaded_leaving' || lastType === 'arrived_at_destination' || lastType === 'unloading' || lastType === 'finished_unloading' ? 0 : 1)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <span>
            {session.crop_type.name} &middot; {SOURCE_TYPE_LABELS[session.source_type as SourceType]} &rarr; {DESTINATION_TYPE_LABELS[session.destination_type as DestinationType]}
          </span>
          <button
            type="button"
            onClick={() => setEditingDestination(!editingDestination)}
            className="ml-1 rounded p-0.5 text-gray-400 hover:text-gray-600"
            title="Change destination"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        {editingDestination && (
          <div className="mt-2 flex gap-2">
            {allowedDestinations.map((dt) => (
              <button
                key={dt}
                type="button"
                disabled={loading || dt === session.destination_type}
                onClick={() => handleUpdateDestination(dt)}
                className={`flex-1 rounded-lg border-2 px-2 py-1.5 text-xs font-medium transition-colors ${
                  dt === session.destination_type
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                } disabled:opacity-50`}
              >
                {DESTINATION_TYPE_LABELS[dt]}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Location selector (when needed) */}
      {needsLocation && nextActivity && (
        <LocationPicker
          locations={relevantLocations}
          selectedId={selectedLocation}
          onSelect={setSelectedLocation}
          label={nextActivity === 'arrived_at_field' ? 'Select Field' : 'Select Destination'}
        />
      )}

      {/* Main action button */}
      <div className="flex flex-1 flex-col justify-center">
        {nextActivity && (
          <button
            onClick={handleLogActivity}
            disabled={loading || (needsLocation && !selectedLocation)}
            className={`activity-btn w-full rounded-2xl ${buttonColor} py-12 text-2xl font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-50 transition-transform`}
          >
            {loading ? 'Logging...' : buttonLabel}
          </button>
        )}
      </div>

      {/* End shift button */}
      <div className="mt-4 space-y-3">
        <button
          onClick={handleEndShift}
          disabled={loading}
          className="activity-btn flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <StopCircle className="h-4 w-4" />
          End Shift
        </button>

        {/* Activity history toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex w-full items-center justify-center gap-1 py-2 text-sm text-gray-500"
        >
          {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showHistory ? 'Hide' : 'Show'} Activity Log
        </button>

        {showHistory && (
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <div className="space-y-2">
              {[...activities].reverse().map((activity) => (
                <div key={activity.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {ACTIVITY_LABELS[activity.activity_type as ActivityType] || activity.activity_type}
                    {activity.location && (
                      <span className="ml-1 text-gray-400">@ {activity.location.name}</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
