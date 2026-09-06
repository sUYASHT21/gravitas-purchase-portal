'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, FileSpreadsheet, Truck, Calendar, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Compilation', href: '/compile', icon: FileSpreadsheet },
    { name: 'Domains Delivery', href: '/delivery', icon: Truck },
    { name: 'Events Delivery', href: '/events', icon: Calendar },
  ];

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <aside className="print:hidden group fixed top-0 left-0 h-screen w-16 hover:w-64 bg-[#0B0A0F]/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300 z-50 overflow-hidden">
      <div className="flex-1 py-8 flex flex-col gap-4 mt-4">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center px-4 py-3 mx-2 rounded-xl transition-all ${
                isActive ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="ml-4 font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/10 mb-4">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-2 py-3 rounded-xl text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-6 h-6 shrink-0 ml-2" />
          <span className="ml-4 font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
