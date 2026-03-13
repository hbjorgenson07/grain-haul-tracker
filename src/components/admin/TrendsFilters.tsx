'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const RANGE_OPTIONS = [
  { label: '7 Days', value: '7' },
  { label: '14 Days', value: '14' },
  { label: '30 Days', value: '30' },
];

export function TrendsFilters({ currentDays }: { currentDays: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setRange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('days', value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setRange(opt.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            currentDays === Number(opt.value)
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
