import { getAllTrucks } from '@/lib/queries/admin';
import { TrucksManager } from '@/components/admin/TrucksManager';

export default async function TrucksPage() {
  const trucks = await getAllTrucks();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Truck Management</h1>
      <TrucksManager trucks={trucks} />
    </div>
  );
}
