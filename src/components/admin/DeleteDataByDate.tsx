'use client';

import { useState } from 'react';
import { deleteDataByDate } from '@/lib/actions/admin/data';
import { Trash2 } from 'lucide-react';

export function DeleteDataByDate() {
  const [date, setDate] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleDelete() {
    if (!date) return;
    setLoading(true);
    setMessage(null);

    const result = await deleteDataByDate(date);

    if ('error' in result) {
      setMessage({ type: 'error', text: result.error! });
    } else {
      setMessage({
        type: 'success',
        text: `Deleted ${result.deletedCount} session(s) and their activity logs for ${date}.`,
      });
      setDate('');
    }

    setConfirming(false);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="delete-date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            id="delete-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setConfirming(false);
              setMessage(null);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={!date || loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {confirming && !loading && (
        <p className="text-sm text-red-600 font-medium">
          This will permanently delete all sessions and activity logs for {date}. Are you sure?
        </p>
      )}

      {message && (
        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
