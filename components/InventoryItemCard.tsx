'use client';

import React, { useTransition } from 'react';
import { updateQuantity, InventoryItem } from '@/app/actions';
import { Minus, Plus } from 'lucide-react';

export default function InventoryItemCard({ item }: { item: InventoryItem }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (change: number) => {
    startTransition(() => {
      updateQuantity(item.id, change);
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col justify-between transition-all hover:scale-[1.02] hover:border-purple-500/50 hover:bg-white/10 shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-xl text-white line-clamp-1" title={item.name}>{item.name}</h3>
          <span className="inline-block px-3 py-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold uppercase tracking-wider mt-2">
            {item.category}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10">
        <div className="flex items-baseline space-x-2">
          <span className={`text-4xl font-black ${item.quantity === 0 ? 'text-gray-500' : 'text-gray-100'}`}>
            {item.quantity}
          </span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">stock</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => handleUpdate(-1)}
            disabled={isPending || item.quantity === 0}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-gray-300 hover:bg-rose-500/20 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Minus className="w-6 h-6" />
          </button>
          <button 
            onClick={() => handleUpdate(1)}
            disabled={isPending}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-gray-300 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
