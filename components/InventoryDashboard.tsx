'use client';

import React, { useState, useMemo } from 'react';
import { InventoryItem } from '@/app/actions';
import InventoryItemCard from './InventoryItemCard';
import UploadExcel from './UploadExcel';
import { Search, Package, AlertCircle, Info } from 'lucide-react';

export default function InventoryDashboard({ initialItems }: { initialItems: InventoryItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  const lowStockCount = initialItems.filter(i => i.quantity <= 5 && i.quantity > 0).length;
  const outOfStockCount = initialItems.filter(i => i.quantity === 0).length;

  return (
    <div className="space-y-8">
      {/* Top Stats & Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-start">
            <Info className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-900 font-bold text-sm">Required CSV/Excel Format</h4>
              <p className="text-blue-800 text-sm mt-1">
                Your file must have these exact column headers: <strong>Name | Category | Quantity</strong>
              </p>
            </div>
          </div>
          <UploadExcel />
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-lg shadow-blue-200 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 font-semibold uppercase tracking-wider">Total Items</p>
              <h4 className="text-3xl font-extrabold mt-1">{initialItems.length}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-5 rounded-2xl shadow-lg shadow-amber-200 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100 font-semibold uppercase tracking-wider">Low Stock</p>
              <h4 className="text-3xl font-extrabold mt-1">{lowStockCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-red-600 p-5 rounded-2xl shadow-lg shadow-red-200 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100 font-semibold uppercase tracking-wider">Out of Stock</p>
              <h4 className="text-3xl font-extrabold mt-1">{outOfStockCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-white/40 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl shadow-purple-900/5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border-none rounded-xl leading-5 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
            placeholder="Search vibrant inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === category 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-200 scale-105' 
                  : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-100 hover:text-purple-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <InventoryItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {initialItems.length === 0 
              ? 'Get started by uploading an Excel file with your inventory.' 
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
