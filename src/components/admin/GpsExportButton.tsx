'use client';

interface GpsRow {
  time: string;
  driver: string;
  activity: string;
  location: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | string;
}

export function GpsExportButton({ data }: { data: GpsRow[] }) {
  const exportCsv = () => {
    if (data.length === 0) return;

    const headers = ['Time', 'Driver', 'Activity', 'Location', 'Latitude', 'Longitude', 'Accuracy (m)'];
    const rows = data.map((r) =>
      [r.time, r.driver, r.activity, r.location, r.latitude, r.longitude, r.accuracy_m]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-data-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCsv}
      disabled={data.length === 0}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
    >
      Export CSV
    </button>
  );
}
