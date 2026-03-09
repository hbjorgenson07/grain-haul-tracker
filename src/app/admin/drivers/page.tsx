import { getAllProfiles } from '@/lib/queries/admin';
import { DriversManager } from '@/components/admin/DriversManager';

export default async function DriversPage() {
  const profiles = await getAllProfiles();
  const drivers = profiles.filter(p => p.role === 'driver');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Driver Management</h1>
      <DriversManager drivers={drivers} />
    </div>
  );
}
