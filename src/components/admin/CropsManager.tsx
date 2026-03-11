'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCrop, updateCrop, deleteCrop, toggleCropActive } from '@/lib/actions/admin/crops';
import type { CropType } from '@/lib/types/database';
import { Plus, X, Check, Ban, Pencil, Trash2 } from 'lucide-react';

export function CropsManager({ crops }: { crops: CropType[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createCrop(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleUpdate(id: string, formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateCrop(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete crop type "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteCrop(id);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggle(id: string) {
    await toggleCropActive(id);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{crops.length} crop type(s)</p>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setError(null); }}
          className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Crop Type'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">New Crop Type</h3>
          <form action={handleCreate} className="flex gap-4">
            <div className="flex-1">
              <input
                name="name"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Corn"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                {editingId === c.id ? (
                  <td colSpan={3} className="px-4 py-3">
                    <form
                      action={(formData) => handleUpdate(c.id, formData)}
                      className="flex items-end gap-3"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500">Name *</label>
                        <input
                          name="name"
                          required
                          defaultValue={c.name}
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingId(null); setError(null); }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingId(c.id); setShowForm(false); setError(null); }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(c.id)}
                          className="text-gray-400 hover:text-gray-700"
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {c.is_active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
