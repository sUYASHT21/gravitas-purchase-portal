'use client';

import React, { useState, useMemo } from 'react';
import { InventoryItem } from '@/app/actions';
import InventoryItemCard from './InventoryItemCard';
import UploadExcel from './UploadExcel';
import { Search, Package, AlertCircle } from 'lucide-react';

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
        <div className="md:col-span-2">
          <UploadExcel />
        </div>
        
        <div className="flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Items</p>
              <h4 className="text-2xl font-bold text-gray-800">{initialItems.length}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-amber-700 font-medium">Low Stock Alerts</p>
              <h4 className="text-2xl font-bold text-amber-900">{lowStockCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-red-700 font-medium">Out of Stock</p>
              <h4 className="text-2xl font-bold text-red-900">{outOfStockCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-red-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
