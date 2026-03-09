'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, updateUser, deleteUser, toggleUserActive } from '@/lib/actions/admin/users';
import type { Profile } from '@/lib/types/database';
import { Plus, X, UserCheck, UserX, Pencil, Trash2 } from 'lucide-react';

export function DriversManager({ drivers }: { drivers: Profile[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createUser(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleToggle(userId: string) {
    await toggleUserActive(userId);
    router.refresh();
  }

  function startEditing(d: Profile) {
    setEditingId(d.id);
    setEditName(d.full_name || '');
    setEditPhone(d.phone || '');
    setDeletingId(null);
  }

  async function handleSaveEdit(userId: string) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set('fullName', editName);
    formData.set('phone', editPhone);
    const result = await updateUser(userId, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(userId: string) {
    setLoading(true);
    setError(null);
    const result = await deleteUser(userId);
    if (result?.error) {
      setError(result.error);
    } else {
      setDeletingId(null);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{drivers.length} driver(s)</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add Driver'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">New Driver</h3>
          {error && !editingId && !deletingId && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="role" value="driver" />
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                name="fullName"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                type="tel"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Driver'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (editingId || deletingId) && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                {editingId === d.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                        placeholder="Full Name"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                        placeholder="Phone"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          d.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveEdit(d.id)}
                          disabled={loading}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setError(null); }}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : deletingId === d.id ? (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900" colSpan={2}>
                      <span className="text-red-600">Delete {d.full_name}? This is permanent.</span>
                    </td>
                    <td className="px-4 py-3" colSpan={2}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={loading}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => { setDeletingId(null); setError(null); }}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          d.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(d)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingId(d.id); setEditingId(null); }}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(d.id)}
                          className="text-gray-400 hover:text-gray-700"
                          title={d.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {d.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
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
