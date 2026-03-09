'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DailyData {
  date: string;
  trips: number;
  sessions: number;
}

interface DriverData {
  name: string;
  trips: number;
}

export function TrendsCharts({
  dailyData,
  driverData,
}: {
  dailyData: DailyData[];
  driverData: DriverData[];
}) {
  return (
    <div className="space-y-8">
      {/* Trips per day */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Trips Per Day</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="trips"
                stroke="#16a34a"
                strokeWidth={2}
                name="Trips"
              />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#2563eb"
                strokeWidth={2}
                name="Shifts"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trips by driver */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Trips by Driver (Period Total)</h2>
        {driverData.length === 0 ? (
          <p className="text-sm text-gray-500">No trip data for this period.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="trips" fill="#16a34a" name="Trips" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
