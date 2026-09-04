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
    <div className={`p-4 rounded-xl border flex flex-col justify-between transition-shadow hover:shadow-md ${
      isOutOfStock ? 'bg-red-50 border-red-200' : isLowStock ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 line-clamp-1" title={item.name}>{item.name}</h3>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
        
        {isLowStock && (
          <div className={`p-1.5 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`} title={isOutOfStock ? 'Out of stock' : 'Low stock'}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-baseline space-x-1">
          <span className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-800'}`}>
            {item.quantity}
          </span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">in stock</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleUpdate(-1)}
            disabled={isPending || isOutOfStock}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleUpdate(1)}
            disabled={isPending}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
