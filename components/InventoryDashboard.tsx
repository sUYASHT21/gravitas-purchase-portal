'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { InventoryItem, addSingleItem } from '@/app/actions';
import InventoryItemCard from './InventoryItemCard';
import UploadExcel from './UploadExcel';
import { Search, Package, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

export default function InventoryDashboard({ initialItems }: { initialItems: InventoryItem[] }) {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'view-only';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');

  // Derive categories from items
  const categories = useMemo(() => {
    const cats = new Set(initialItems.map(item => item.category));
    return ['All', ...Array.from(cats)].sort();
  }, [initialItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return initialItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [initialItems, searchQuery, selectedCategory]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategory.trim()) return;

    startTransition(async () => {
      const qty = parseInt(newItemQty, 10) || 1;
      await addSingleItem(newItemName.trim(), newItemCategory.trim(), qty);
      setIsAddModalOpen(false);
      setNewItemName('');
      setNewItemCategory('');
      setNewItemQty('1');
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Stats & Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {!isReadOnly ? (
          <div className="md:col-span-2 flex flex-col justify-center bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Bulk Upload</h3>
              <span className="text-sm font-medium text-gray-400">CSV/Excel: Name | Category | Quantity</span>
            </div>
            <UploadExcel />
          </div>
        ) : (
          <div className="md:col-span-2 flex flex-col justify-center bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 shadow-2xl items-center text-center">
            <h3 className="text-xl font-bold text-white mb-2">View-Only Mode</h3>
            <p className="text-gray-400">You do not have permissions to modify inventory.</p>
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-r from-purple-600/80 to-fuchsia-600/80 p-8 rounded-[2rem] shadow-2xl border border-white/10 text-white flex items-center justify-between h-full">
            <div>
              <p className="text-sm text-fuchsia-200 font-bold uppercase tracking-wider">Total Inventory Items</p>
              <h4 className="text-5xl font-black mt-2">{initialItems.length}</h4>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl leading-5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all shadow-inner"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex-grow">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category 
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg border border-transparent' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-shrink-0 flex items-center px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </button>
          )}
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <InventoryItemCard key={item.id} item={item} isReadOnly={isReadOnly} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 border-dashed">
          <Package className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">No items found</h3>
          <p className="mt-2 text-gray-500">
            {initialItems.length === 0 
              ? 'Get started by uploading an Excel file or adding an item manually.' 
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      )}

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1325]/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20 border border-purple-500/20 relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white mb-6">Manually Add Item</h2>
              
              <form onSubmit={handleManualAdd} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name</label>
                  <input 
                    required
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                    placeholder="e.g. A4 Sheets"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <input 
                    required
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                    placeholder="e.g. Stationery"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity</label>
                  <input 
                    required
                    type="number"
                    min="0"
                    value={newItemQty}
                    onChange={e => setNewItemQty(e.target.value)}
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isPending}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Adding...' : 'Add Item'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
