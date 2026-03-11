'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startSession } from '@/lib/actions/sessions';
import { useGps } from '@/hooks/useGps';
import { Truck, Play, Navigation } from 'lucide-react';
import type { Truck as TruckType, CropType } from '@/lib/types/database';
import {
  SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  DESTINATION_TYPES,
  DESTINATION_TYPE_LABELS,
  type SourceType,
} from '@/lib/constants';

export function StartShiftForm({
  trucks,
  cropTypes,
}: {
  trucks: TruckType[];
  cropTypes: CropType[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType | ''>('');
  const { gpsStatus, requestPermission, getCurrentPosition } = useGps();

  // Request GPS permission early
  useEffect(() => { requestPermission(); }, [requestPermission]);

  const isStorage = sourceType === 'storage';

  // Storage source can't deliver to bins (same place)
  const allowedDestinations = DESTINATION_TYPES.filter(
    dt => !(isStorage && dt === 'bins')
  );

  // Filter crops by source type
  const harvestCrops = cropTypes.filter(c => ['corn', 'soybeans'].includes(c.name.toLowerCase()));
  const cornCrop = cropTypes.filter(c => c.name.toLowerCase() === 'corn');
  const filteredCropTypes = isStorage
    ? cornCrop
    : sourceType === 'field'
      ? harvestCrops
      : cropTypes;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    // Capture GPS for shift_start activity
    const coords = await getCurrentPosition();
    if (coords) {
      formData.set('latitude', String(coords.latitude));
      formData.set('longitude', String(coords.longitude));
      formData.set('gpsAccuracy', String(coords.accuracy));
    }

    const result = await startSession(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/driver/session');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Truck className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Ready to Start?</h2>
        <p className="mt-1 text-sm text-gray-500">Select your truck and begin your shift</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="truckId" className="block text-sm font-medium text-gray-700">
            Truck *
          </label>
          <select
            id="truckId"
            name="truckId"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select a truck</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.name}{truck.license_plate ? ` (${truck.license_plate})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source *
          </label>
          <div className="mt-1 flex gap-2">
            {SOURCE_TYPES.map((st) => (
              <label
                key={st}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50 has-[:checked]:text-green-700 border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              >
                <input
                  type="radio"
                  name="sourceType"
                  value={st}
                  required
                  className="sr-only"
                  onChange={() => setSourceType(st)}
                />
                {SOURCE_TYPE_LABELS[st]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="cropTypeId" className="block text-sm font-medium text-gray-700">
            Crop Type *
          </label>
          <select
            id="cropTypeId"
            name="cropTypeId"
            required
            key={sourceType}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select crop type</option>
            {filteredCropTypes.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
          {isStorage && (
            <p className="mt-1 text-xs text-amber-600">Storage deliveries are corn only</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Destination Type *
          </label>
          <div className="mt-1 flex gap-2">
            {allowedDestinations.map((dt) => (
              <label
                key={dt}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-3 py-3 text-sm font-medium transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50 has-[:checked]:text-green-700 border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              >
                <input
                  type="radio"
                  name="destinationType"
                  value={dt}
                  required
                  className="sr-only"
                />
                {DESTINATION_TYPE_LABELS[dt]}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="activity-btn mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-5 text-lg font-bold text-white shadow-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
        >
          <Play className="h-6 w-6" />
          {loading ? 'Starting...' : 'Start Shift'}
        </button>
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
          <Navigation className="h-3 w-3" />
          GPS: {gpsStatus === 'granted' ? 'Active' : gpsStatus === 'denied' ? 'Denied' : gpsStatus === 'unavailable' ? 'Unavailable' : 'Waiting...'}
          <span className={`ml-1 inline-block h-2 w-2 rounded-full ${
            gpsStatus === 'granted' ? 'bg-green-500' : gpsStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
        </div>
      </form>
    </div>
  );
}
