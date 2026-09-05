'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function SignOutButton() {
  const { logout } = useAuth();

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="fixed top-4 right-4 z-50 flex items-center px-4 py-2 bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl transition-all shadow-lg backdrop-blur-md font-bold text-sm"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </button>
  );
}
