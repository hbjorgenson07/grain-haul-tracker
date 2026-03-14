import { getTodayStats, getActiveSessionsWithDrivers } from '@/lib/queries/dashboard';
import { getRecentActivities } from '@/lib/queries/activities';
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/constants';
import { formatTimestamp } from '@/lib/utils';
import { Users, Truck, Activity, TrendingUp, Trash2 } from 'lucide-react';
import { DeleteDataByDate } from '@/components/admin/DeleteDataByDate';

export default async function AdminDashboard() {
  const stats = await getTodayStats();
  const activeSessions = await getActiveSessionsWithDrivers();
  const recentActivities = await getRecentActivities(15);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-6 w-6 text-blue-600" />}
          label="Active Drivers"
          value={stats.activeSessions}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Activity className="h-6 w-6 text-green-600" />}
          label="Shifts Today"
          value={stats.todaySessions}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Truck className="h-6 w-6 text-orange-600" />}
          label="Trips Today"
          value={stats.totalTripsToday}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          label="Active Sessions"
          value={activeSessions.length}
          bg="bg-purple-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active sessions */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Active Sessions</h2>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No active sessions right now.</p>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {(s.driver as { full_name: string })?.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(s.truck as { name: string })?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    {s.latestActivity && (
                      <>
                        <div className="text-sm font-medium text-gray-700">
                          {ACTIVITY_LABELS[s.latestActivity.activity_type as ActivityType] || s.latestActivity.activity_type}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTimestamp(s.latestActivity.timestamp)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">
                      {(a.driver as { full_name: string })?.full_name}
                    </span>
                    <span className="ml-2 text-gray-500">
                      {ACTIVITY_LABELS[a.activity_type as ActivityType] || a.activity_type}
                    </span>
                    {a.location && (
                      <span className="ml-1 text-gray-400">
                        @ {(a.location as { name: string }).name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatTimestamp(a.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Delete all sessions and activity logs for a specific date. Use this to clean up test data.
        </p>
        <DeleteDataByDate />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
