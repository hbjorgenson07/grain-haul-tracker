'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Profile } from '@/lib/types/database';

export function GpsFilters({
  drivers,
  currentFilters,
}: {
  drivers: Profile[];
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

  const clearFilters = () => router.push('?');

  return (
    <div className="flex flex-wrap gap-3 rounded-lg bg-white p-4 shadow-sm">
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

      <input
        type="date"
        value={currentFilters.dateFrom ?? ''}
        onChange={(e) => updateFilter('dateFrom', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
        placeholder="From"
      />

      <input
        type="date"
        value={currentFilters.dateTo ?? ''}
        onChange={(e) => updateFilter('dateTo', e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
        placeholder="To"
      />

      <button
        onClick={clearFilters}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
      >
        Clear
      </button>
    </div>
  );
}
