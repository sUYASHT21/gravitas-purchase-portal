import { getItems } from '../actions';
import InventoryDashboard from '@/components/InventoryDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const items = await getItems();

  return (
    <main className="min-h-screen bg-slate-950 text-gray-200 overflow-x-hidden selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-10 text-center relative">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 tracking-tight">
            PR Room Inventory
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Manage surplus inventory from previous fests. Utilize existing stock before generating new indents!
          </p>
        </div>

        <InventoryDashboard initialItems={items} />
      </div>
    </main>
  );
}
