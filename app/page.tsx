import { getItems } from './actions';
import InventoryDashboard from '@/components/InventoryDashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const items = await getItems();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center relative">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
            PR Room Inventory
          </h1>
          <p className="mt-3 text-base text-gray-700 max-w-2xl mx-auto">
            Manage surplus inventory from previous fests. Utilize existing stock before generating new indents!
          </p>
          <div className="mt-6">
            <Link 
              href="/compile"
              className="inline-flex items-center px-6 py-2.5 bg-white text-purple-700 font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all border border-purple-100"
            >
              Go to Compilation Engine ✨
            </Link>
          </div>
        </div>

        <InventoryDashboard initialItems={items} />
      </div>
    </main>
  );
}
