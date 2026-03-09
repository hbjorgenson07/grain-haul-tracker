'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/actions/activities';
import { endSession } from '@/lib/actions/sessions';
import {
  ACTIVITY_LABELS,
  ACTIVITY_COLORS,
  NEXT_ACTIVITY,
  LOCATION_REQUIRED_ACTIVITIES,
  type ActivityType,
} from '@/lib/constants';
import { formatElapsedTime, formatTimestamp } from '@/lib/utils';
import { MapPin, StopCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Location } from '@/lib/types/database';

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
  crop_type: { name: string } | null;
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

  // Determine current state from last activity
  const lastActivity = activities[activities.length - 1];
  const lastType = (lastActivity?.activity_type ?? 'shift_start') as ActivityType;
  const nextActivity = NEXT_ACTIVITY[lastType];

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

    const result = await logActivity({
      sessionId: session.id,
      activityType: nextActivity,
      locationId: needsLocation ? selectedLocation : undefined,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSelectedLocation('');
      setLoading(false);
      router.refresh();
    }
  }, [nextActivity, needsLocation, selectedLocation, session.id, router]);

  const handleEndShift = useCallback(async () => {
    if (!confirm('Are you sure you want to end your shift?')) return;
    setLoading(true);
    const result = await endSession(session.id);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/driver');
      router.refresh();
    }
  }, [session.id, router]);

  const statusText = ACTIVITY_LABELS[lastType] || 'In Progress';
  const buttonColor = nextActivity ? ACTIVITY_COLORS[nextActivity] : 'bg-gray-400';
  const buttonLabel = nextActivity ? ACTIVITY_LABELS[nextActivity] : 'Shift Complete';

  return (
    <div className="flex flex-1 flex-col p-4">
      {/* Status bar */}
      <div className="mb-4 rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">{session.truck.name}</span>
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
        {session.crop_type && (
          <div className="mt-1 text-xs text-gray-400">{session.crop_type.name}</div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Location selector (when needed) */}
      {needsLocation && nextActivity && (
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            {nextActivity === 'arrived_at_field' ? 'Select Field' : 'Select Destination'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {relevantLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocation(loc.id)}
                className={`activity-btn rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors ${
                  selectedLocation === loc.id
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
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
