'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLocation, toggleLocationActive, importFieldsFromCsv, deleteLocations } from '@/lib/actions/admin/locations';
import { LOCATION_TYPES } from '@/lib/constants';
import type { Location } from '@/lib/types/database';
import { Plus, X, Check, Ban, Upload, Trash2 } from 'lucide-react';

export function LocationsManager({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createLocation(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggle(id: string) {
    await toggleLocationActive(id);
    router.refresh();
  }

  async function handleImport(formData: FormData) {
    setLoading(true);
    setError(null);
    setImportResult(null);
    const result = await importFieldsFromCsv(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result && 'imported' in result) {
      const parts = [];
      if (result.imported && result.imported > 0) parts.push(`Imported ${result.imported} field(s)`);
      if (result.skipped && result.skipped > 0) parts.push(`${result.skipped} skipped (duplicates)`);
      setImportResult(parts.join(', ') || 'No fields to import');
      router.refresh();
    }
    setLoading(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === locations.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(locations.map(l => l.id)));
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} location(s)? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteLocations(Array.from(selected));
    if (result?.error) {
      setError(result.error);
    } else {
      if (result && 'skipped' in result && result.skipped && result.skipped > 0) {
        setError(`Deleted ${result.deleted}, but ${result.skipped} location(s) are in use by activity logs and cannot be deleted.`);
      }
      setSelected(new Set());
      router.refresh();
    }
    setLoading(false);
  }

  const typeLabels: Record<string, string> = {
    field: 'Field',
    elevator: 'Elevator',
    bin_site: 'Bin Site',
    plant: 'Plant',
    other: 'Other',
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{locations.length} location(s)</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Location'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">New Location</h3>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. North Field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                name="type"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select type</option>
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Import Fields from CSV</h3>
        <p className="mb-3 text-xs text-gray-500">Upload a CSV or text file with one field name per line. All entries are added as type &quot;Field&quot;.</p>
        {importResult && (
          <div className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">{importResult}</div>
        )}
        <form action={handleImport} className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="file"
              name="file"
              accept=".csv,.txt"
              required
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Importing...' : 'Import'}
          </button>
        </form>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2">
          <span className="text-sm text-red-700">{selected.size} selected</span>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {loading ? 'Deleting...' : `Delete (${selected.size})`}
          </button>
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={locations.length > 0 && selected.size === locations.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} className={`border-b last:border-0 hover:bg-gray-50 ${selected.has(l.id) ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => toggleSelect(l.id)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3 text-gray-500">{typeLabels[l.type] || l.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      l.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {l.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleToggle(l.id)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    title={l.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {l.is_active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
