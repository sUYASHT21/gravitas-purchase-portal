import { getItems } from './actions';
import InventoryDashboard from '@/components/InventoryDashboard';
import Link from 'next/link';

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
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              href="/compile"
              className="inline-flex items-center px-6 py-3 bg-white/5 text-purple-400 font-bold rounded-xl hover:bg-white/10 hover:text-purple-300 transition-all border border-purple-500/30 shadow-lg shadow-purple-900/20"
            >
              Compilation Engine ✨
            </Link>
            <Link 
              href="/delivery"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02] transition-all"
            >
              Delivery Tracking 🚚
            </Link>
          </div>
        </div>

        <InventoryDashboard initialItems={items} />
      </div>
    </main>
  );
}
