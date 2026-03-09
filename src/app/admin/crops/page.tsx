import { getAllCropTypes } from '@/lib/queries/admin';
import { CropsManager } from '@/components/admin/CropsManager';

export default async function CropsPage() {
  const crops = await getAllCropTypes();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Crop Type Management</h1>
      <CropsManager crops={crops} />
    </div>
  );
}
