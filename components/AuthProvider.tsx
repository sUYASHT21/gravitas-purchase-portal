'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import SignOutButton from './SignOutButton';

type Role = 'admin' | 'view-only';

interface AuthContextType {
  user: { email: string; role: Role } | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: Role } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
    setMounted(true);
  }, []);

  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSigningIn(false);
      return;
    }

    if (data.session?.user?.email) {
      const lowerEmail = data.session.user.email.toLowerCase();
      let role: Role | null = null;
      if (lowerEmail === 'teampurchase@gravitas.com') role = 'admin';
      else if (lowerEmail === 'facultypurchase@gravitas.com') role = 'view-only';

      if (role) {
        const userData = { email: lowerEmail, role };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        setError('Unauthorized email role mapping');
      }
    }
    
    setIsSigningIn(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-purple-500/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl backdrop-blur-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center border border-fuchsia-500/30">
              <Lock className="w-8 h-8 text-fuchsia-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2">Secure Portal</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Sign in to access the GraVITas Purchase Portal</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white transition-colors"
                placeholder="suyash_is_funny@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
            <button 
              type="submit" 
              disabled={isSigningIn}
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isSigningIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <SignOutButton />
      {children}
    </AuthContext.Provider>
  );
}
