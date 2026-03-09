'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Profile, Truck } from '@/lib/types/database';

export function DailyReportFilters({
  drivers,
  trucks,
  currentDate,
  currentFilters,
}: {
  drivers: Profile[];
  trucks: Truck[];
  currentDate: string;
  currentFilters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
      <input
        type="date"
        value={currentDate}
        onChange={(e) => updateFilter('date', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
      />

      <select
        value={currentFilters.driverId ?? ''}
        onChange={(e) => updateFilter('driverId', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
      >
        <option value="">All Drivers</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>{d.full_name}</option>
        ))}
      </select>

      <select
        value={currentFilters.truckId ?? ''}
        onChange={(e) => updateFilter('truckId', e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
      >
        <option value="">All Trucks</option>
        {trucks.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
