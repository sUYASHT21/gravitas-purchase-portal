'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

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

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
    setMounted(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== 'gravitas2026') {
      setError('Invalid password. Hint: gravitas2026');
      return;
    }
    
    let role: Role | null = null;
    const lowerEmail = email.trim().toLowerCase();
    if (lowerEmail === 'teampurchase@gravitas.com') role = 'admin';
    else if (lowerEmail === 'facultypurchase@gravitas.com') role = 'view-only';
    
    if (role) {
      const userData = { email: lowerEmail, role };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setError('');
    } else {
      setError('Unauthorized email address');
    }
  };

  const logout = () => {
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
                placeholder="teampurchase@gravitas.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
            <button 
              type="submit" 
              className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all"
            >
              Authenticate
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
