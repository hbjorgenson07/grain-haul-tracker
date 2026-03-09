'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startSession } from '@/lib/actions/sessions';
import { Truck, Play } from 'lucide-react';
import type { Truck as TruckType, CropType } from '@/lib/types/database';

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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
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
          <label htmlFor="cropTypeId" className="block text-sm font-medium text-gray-700">
            Crop Type (optional)
          </label>
          <select
            id="cropTypeId"
            name="cropTypeId"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Select crop type</option>
            {cropTypes.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="activity-btn mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-5 text-lg font-bold text-white shadow-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50"
        >
          <Play className="h-6 w-6" />
          {loading ? 'Starting...' : 'Start Shift'}
        </button>
      </form>
    </div>
  );
}
