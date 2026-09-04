'use client';

import React, { useTransition } from 'react';
import { updateQuantity, InventoryItem } from '@/app/actions';
import { Minus, Plus, AlertTriangle } from 'lucide-react';

export default function InventoryItemCard({ item }: { item: InventoryItem }) {
  const [isPending, startTransition] = useTransition();

  const isLowStock = item.quantity <= 5;
  const isOutOfStock = item.quantity === 0;

  const handleUpdate = (change: number) => {
    startTransition(() => {
      updateQuantity(item.id, change);
    });
  };

  return (
    <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-xl ${
      isOutOfStock 
        ? 'bg-white border-red-200 shadow-red-100' 
        : isLowStock 
          ? 'bg-white border-amber-200 shadow-amber-100' 
          : 'bg-white border-purple-100 hover:border-purple-300 shadow-purple-50'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-xl text-gray-900 line-clamp-1" title={item.name}>{item.name}</h3>
          <span className="inline-block px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mt-1">{item.category}</span>
        </div>
        
        {isLowStock && (
          <div className={`p-2 rounded-xl ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`} title={isOutOfStock ? 'Out of stock' : 'Low stock'}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50">
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-3xl font-extrabold ${isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>
            {item.quantity}
          </span>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">in stock</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleUpdate(-1)}
            disabled={isPending || isOutOfStock}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleUpdate(1)}
            disabled={isPending}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
