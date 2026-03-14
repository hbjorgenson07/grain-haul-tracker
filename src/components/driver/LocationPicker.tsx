'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, ChevronDown } from 'lucide-react';
import type { Location } from '@/lib/types/database';

interface LocationPickerProps {
  locations: Location[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
}

export function LocationPicker({ locations, selectedId, onSelect, label }: LocationPickerProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLocation = locations.find(l => l.id === selectedId);

  const filtered = search
    ? locations.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    : locations;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="mb-4" ref={containerRef}>
      <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
        <MapPin className="h-4 w-4" />
        {label}
      </label>

      {/* Selected display / trigger */}
      {selectedLocation && !open ? (
        <button
          type="button"
          onClick={() => { setOpen(true); setSearch(''); }}
          className="flex w-full items-center justify-between rounded-lg border-2 border-green-600 bg-green-50 px-3 py-3 text-sm font-medium text-green-700"
        >
          <span>{selectedLocation.name}</span>
          <X
            className="h-4 w-4 text-green-600"
            onClick={(e) => { e.stopPropagation(); onSelect(''); }}
          />
        </button>
      ) : (
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search locations..."
              className="w-full rounded-lg border-2 border-gray-200 py-3 pl-9 pr-9 text-sm focus:border-green-500 focus:outline-none"
              autoComplete="off"
            />
            <ChevronDown
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 cursor-pointer"
              onClick={() => setOpen(!open)}
            />
          </div>

          {open && (
            <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500">No locations found</div>
              ) : (
                filtered.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelect(loc.id);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={`flex w-full items-center px-3 py-3 text-left text-sm font-medium transition-colors ${
                      selectedId === loc.id
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
