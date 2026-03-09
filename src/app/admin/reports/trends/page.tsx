import { createClient } from '@/lib/supabase/server';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { TrendsCharts } from '@/components/admin/TrendsCharts';

export default async function TrendsPage() {
  const supabase = await createClient();
  const days = 14;
  const startDate = startOfDay(subDays(new Date(), days - 1));

  // Get all activity logs for the date range
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('activity_type, timestamp, driver_id, session_id')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });

  // Get driver names
  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'driver');

  const driverMap = new Map(drivers?.map(d => [d.id, d.full_name]) ?? []);

  // Calculate daily stats
  const dailyStats: Record<string, {
    date: string;
    trips: number;
    sessions: number;
    loadEvents: number;
    unloadEvents: number;
  }> = {};

  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), days - 1 - i);
    const key = format(d, 'yyyy-MM-dd');
    dailyStats[key] = { date: format(d, 'MMM d'), trips: 0, sessions: 0, loadEvents: 0, unloadEvents: 0 };
  }

  const sessionDays = new Set<string>();
  for (const a of activities ?? []) {
    const day = format(new Date(a.timestamp), 'yyyy-MM-dd');
    if (!dailyStats[day]) continue;

    if (a.activity_type === 'loaded_leaving') dailyStats[day].trips++;
    if (a.activity_type === 'shift_start') dailyStats[day].sessions++;
    if (a.activity_type === 'loading') dailyStats[day].loadEvents++;
    if (a.activity_type === 'unloading') dailyStats[day].unloadEvents++;
  }

  // Driver trip counts
  const driverTrips: Record<string, number> = {};
  for (const a of activities ?? []) {
    if (a.activity_type === 'loaded_leaving') {
      const name = driverMap.get(a.driver_id) ?? 'Unknown';
      driverTrips[name] = (driverTrips[name] || 0) + 1;
    }
  }

  const chartData = Object.values(dailyStats);
  const driverChartData = Object.entries(driverTrips).map(([name, trips]) => ({
    name,
    trips,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Trends (Last {days} Days)</h1>
      <TrendsCharts dailyData={chartData} driverData={driverChartData} />
    </div>
  );
}
