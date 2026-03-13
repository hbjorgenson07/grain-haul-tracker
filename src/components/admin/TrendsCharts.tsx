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

interface DailyEfficiency {
  date: string;
  loading: number;
  travel: number;
  unloading: number;
  idle: number;
}

interface DriverData {
  name: string;
  trips: number;
}

export function TrendsCharts({
  dailyData,
  efficiencyData,
  driverData,
}: {
  dailyData: DailyData[];
  efficiencyData: DailyEfficiency[];
  driverData: DriverData[];
}) {
  const hasData = dailyData.some((d) => d.trips > 0 || d.sessions > 0);
  const hasEfficiencyData = efficiencyData.some(
    (d) => d.loading > 0 || d.travel > 0 || d.unloading > 0 || d.idle > 0
  );

  return (
    <div className="space-y-8">
      {/* Trips & shifts per day */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Trips & Shifts Per Day</h2>
        {!hasData ? (
          <p className="py-12 text-center text-sm text-gray-500">No data for this period.</p>
        ) : (
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
        )}
      </div>

      {/* Efficiency breakdown */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Daily Time Breakdown (minutes)</h2>
        {!hasEfficiencyData ? (
          <p className="py-12 text-center text-sm text-gray-500">No data for this period.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `${value} min`}
                />
                <Legend />
                <Bar dataKey="loading" stackId="time" fill="#f59e0b" name="Loading" />
                <Bar dataKey="travel" stackId="time" fill="#2563eb" name="Travel" />
                <Bar dataKey="unloading" stackId="time" fill="#8b5cf6" name="Unloading" />
                <Bar dataKey="idle" stackId="time" fill="#d1d5db" name="Idle" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trips by driver */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Trips by Driver (Period Total)</h2>
        {driverData.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No trip data for this period.</p>
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
