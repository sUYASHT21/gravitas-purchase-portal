import { getItems } from './actions';
import InventoryDashboard from '@/components/InventoryDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const items = await getItems();

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">PR Room Inventory</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage surplus inventory from previous fests. Utilize existing stock before generating new indents.
          </p>
        </div>

        <InventoryDashboard initialItems={items} />
      </div>
    </main>
  );
}
