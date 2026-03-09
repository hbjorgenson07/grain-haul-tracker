import { getAllLocations } from '@/lib/queries/admin';
import { LocationsManager } from '@/components/admin/LocationsManager';

export default async function LocationsPage() {
  const locations = await getAllLocations();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Location Management</h1>
      <LocationsManager locations={locations} />
    </div>
  );
}
