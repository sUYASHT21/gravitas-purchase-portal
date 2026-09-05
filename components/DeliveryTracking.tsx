'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Briefcase, Plus, Upload, CheckCircle, ArrowLeft, Package, Check, X, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

// ----- Types -----
type ItemState = {
  originalName: string;
  normalizedName: string;
  undeliveredQty: number;
  deliveredQty: number;
};

type Domain = {
  id: string;
  name: string;
  organizer: string;
  contact: string;
  items: Record<string, ItemState>;
};

// ----- Utility: Simple NLP Stemming -----
function normalizeItemName(str: string): string {
  let s = str.trim().toLowerCase();
  s = s.replace(/[^a-z0-9\s]/g, '');
  
  if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
  if (s.endsWith('es') && /(ch|sh|x|s|o)$/.test(s.slice(0, -2))) return s.slice(0, -2);
  if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
  
  return s;
}

// ----- Animation Variants -----
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.4, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

export default function DeliveryTracking() {
  const [view, setView] = useState<'LANDING' | 'DOMAINS' | 'EVENTS_STUB' | 'DOMAIN_DETAIL'>('LANDING');
  const [domains, setDomains] = useState<Record<string, Domain>>({});
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  const [newDomainName, setNewDomainName] = useState('');
  const [newOrganizer, setNewOrganizer] = useState('');
  const [newContact, setNewContact] = useState('');

  const [itemPendingDelivery, setItemPendingDelivery] = useState<string | null>(null);
  const [deliveryQuantity, setDeliveryQuantity] = useState<number | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gravitas-delivery-domains');
    if (saved) {
      try {
        setDomains(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse domains', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gravitas-delivery-domains', JSON.stringify(domains));
  }, [domains]);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    const exists = Object.values(domains).some(d => d.name.toLowerCase() === newDomainName.trim().toLowerCase());
    if (exists) {
      showToast('Domain already exists!', 'error');
      return;
    }

    const id = Date.now().toString();
    const newDomain: Domain = {
      id,
      name: newDomainName.trim(),
      organizer: newOrganizer.trim(),
      contact: newContact.trim(),
      items: {}
    };

    setDomains(prev => ({ ...prev, [id]: newDomain }));
    setNewDomainName('');
    setNewOrganizer('');
    setNewContact('');
    showToast('Domain added successfully!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDomainId) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) {
        showToast('Uploaded file is empty.', 'error');
        return;
      }

      setDomains(prev => {
        const next = { ...prev };
        const domain = { ...next[activeDomainId] };
        const items = { ...domain.items };

        jsonData.forEach(row => {
          const getVal = (searchItems: string[]) => {
            for (const s of searchItems) {
              const key = Object.keys(row).find(k => k.toLowerCase().includes(s));
              if (key) return String(row[key]).trim();
            }
            return '';
          };

          const name = getVal(['item', 'name', 'description']);
          const qtyStr = getVal(['qty', 'quantity', 'count', 'amount']);
          
          if (!name) return;
          const parsedQty = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10) || 1;
          const norm = normalizeItemName(name);

          if (items[norm]) {
            items[norm] = {
              ...items[norm],
              undeliveredQty: items[norm].undeliveredQty + parsedQty
            };
          } else {
            items[norm] = {
              originalName: name,
              normalizedName: norm,
              undeliveredQty: parsedQty,
              deliveredQty: 0
            };
          }
        });

        domain.items = items;
        next[activeDomainId] = domain;
        return next;
      });

      showToast('Requirements merged successfully!', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmDelivery = () => {
    if (!activeDomainId || !itemPendingDelivery) return;
    const amount = typeof deliveryQuantity === 'number' ? deliveryQuantity : 0;
    if (amount <= 0) return;
    
    setDomains(prev => {
      const next = { ...prev };
      const domain = { ...next[activeDomainId] };
      const items = { ...domain.items };
      const item = { ...items[itemPendingDelivery] };

      const qtyToDeliver = Math.min(amount, item.undeliveredQty);
      item.deliveredQty += qtyToDeliver;
      item.undeliveredQty -= qtyToDeliver;

      items[itemPendingDelivery] = item;
      domain.items = items;
      next[activeDomainId] = domain;
      return next;
    });
    
    setItemPendingDelivery(null);
  };

  const exportDomainData = () => {
    if (!activeDomainId || !domains[activeDomainId]) return;
    const activeDomain = domains[activeDomainId];
    const data = Object.values(activeDomain.items)
      .sort((a, b) => a.originalName.localeCompare(b.originalName))
      .map(item => ({
        'Item Name': item.originalName,
        'Undelivered Quantity': item.undeliveredQty,
        'Delivered Quantity': item.deliveredQty,
        'Total Quantity': item.undeliveredQty + item.deliveredQty
      }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Domain Data");
    XLSX.writeFile(wb, `${activeDomain.name.replace(/\s+/g, '_')}_Inventory.csv`);
  };

  const activeDomain = activeDomainId ? domains[activeDomainId] : null;

  return (
    <div className="relative text-gray-200">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              toast.type === 'error' ? 'bg-red-950/80 text-red-200 border-red-500/50' : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {toast.type === 'error' ? <X className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemPendingDelivery && activeDomain && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-[#1a1325]/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20 border border-purple-500/20 relative"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-purple-400 border border-purple-500/30 rounded-full flex items-center justify-center mb-6 shadow-inner mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white text-center mb-4">Confirm Delivery</h2>
              <p className="text-gray-400 text-center mb-4 text-lg">
                Are you sure you want to mark <strong className="text-white bg-white/10 px-2 py-0.5 rounded">{activeDomain.items[itemPendingDelivery]?.originalName}</strong> as delivered?
              </p>
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Delivery Quantity</label>
                <input 
                  type="number"
                  min="1"
                  max={activeDomain.items[itemPendingDelivery]?.undeliveredQty}
                  value={deliveryQuantity}
                  onChange={(e) => setDeliveryQuantity(parseInt(e.target.value, 10) || '')}
                  className="w-full px-5 py-4 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-center text-xl font-bold"
                />
                <p className="text-center text-xs text-gray-500 mt-2">Max available: {activeDomain.items[itemPendingDelivery]?.undeliveredQty}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemPendingDelivery(null)}
                  className="flex-1 py-3 px-4 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white font-bold rounded-xl transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelivery}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all"
                >
                  Confirm Delivery
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center py-12 md:py-24">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 mb-6 text-center tracking-tight">
              Delivery Tracking Engine
            </h1>
            <p className="text-gray-400 mb-16 text-center max-w-2xl text-lg">
              Manage requirements, track inventory status, and oversee logistics for domains and events through a unified, intelligent interface.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => setView('EVENTS_STUB')}
                className="group cursor-pointer bg-white/5 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl border border-white/10 hover:border-purple-500/50 transition-colors relative overflow-hidden flex flex-col h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Calendar className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Events</h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8 flex-grow">Track specific event deliveries, manage individual organizing committees, and sync specific requirements directly to the schedule.</p>
                <div className="flex items-center text-indigo-400 font-bold uppercase tracking-wider text-sm">
                  Open Module <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => setView('DOMAINS')}
                className="group cursor-pointer bg-white/5 backdrop-blur-md rounded-[2rem] p-10 shadow-2xl border border-white/10 hover:border-fuchsia-500/50 transition-colors relative overflow-hidden flex flex-col h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-20 h-20 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Briefcase className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Domains</h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8 flex-grow">Oversee master sheets, manage bulk inventory requirements, and process real-time deliveries for primary domains.</p>
                <div className="flex items-center text-fuchsia-400 font-bold uppercase tracking-wider text-sm">
                  Open Module <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {view === 'EVENTS_STUB' && (
          <motion.div key="events" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8">
              <Calendar className="w-16 h-16 text-indigo-400/50" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Event Tracking</h2>
            <p className="text-gray-400 mb-12 text-lg">This module is currently in development and arriving soon.</p>
            <button 
              onClick={() => setView('LANDING')}
              className="px-8 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3"
            >
              <ArrowLeft className="w-5 h-5" /> Return to Hub
            </button>
          </motion.div>
        )}

        {view === 'DOMAINS' && (
          <motion.div key="domains" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <button 
              onClick={() => setView('LANDING')}
              className="flex items-center text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors mb-10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Engine
            </button>

            <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
              {/* Add Domain Form Sidebar (35%) */}
              <div className="w-full lg:w-[35%] lg:sticky lg:top-8 bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-8 flex items-center">
                  <Plus className="w-6 h-6 mr-3 text-fuchsia-500" /> Add Domain
                </h3>
                <form onSubmit={handleAddDomain} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Domain Name</label>
                    <input 
                      required
                      value={newDomainName}
                      onChange={e => setNewDomainName(e.target.value)}
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                      placeholder="e.g. Finance, R&R..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Organizer Name</label>
                    <input 
                      required
                      value={newOrganizer}
                      onChange={e => setNewOrganizer(e.target.value)}
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact No.</label>
                    <input 
                      required
                      value={newContact}
                      onChange={e => setNewContact(e.target.value)}
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-600 transition-colors"
                      placeholder="+91..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02] transition-all"
                  >
                    Create Domain
                  </button>
                </form>
              </div>

              {/* Domains Grid (65%) */}
              <div className="w-full lg:w-[65%]">
                <h3 className="text-2xl font-black text-white mb-8">Active Domains</h3>
                {Object.keys(domains).length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                    <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No domains added yet. Create one on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.values(domains).map(domain => (
                      <motion.div 
                        whileHover={{ scale: 1.03, y: -2 }}
                        key={domain.id}
                        onClick={() => {
                          setActiveDomainId(domain.id);
                          setView('DOMAIN_DETAIL');
                        }}
                        className="bg-white/5 p-8 rounded-3xl shadow-xl border border-white/10 cursor-pointer hover:border-fuchsia-500/50 hover:bg-white/10 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-fuchsia-500/20 transition-colors" />
                        <h4 className="text-2xl font-black text-white mb-3 relative z-10">{domain.name}</h4>
                        <p className="text-base text-gray-400 flex flex-col gap-2 relative z-10 mb-6">
                          <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-fuchsia-400" /> {domain.organizer}</span>
                          <span className="font-mono text-sm bg-black/30 px-3 py-1.5 rounded-lg w-max text-gray-300 border border-white/5">{domain.contact}</span>
                        </p>
                        <div className="pt-5 border-t border-white/10 flex items-center justify-between relative z-10">
                          <span className="text-sm font-bold text-fuchsia-400 uppercase tracking-wide flex items-center">
                            Tracking <ArrowLeft className="w-4 h-4 ml-1 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <span className="bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
                            {Object.keys(domain.items).length} Items
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={exportDomainData}
                className="flex items-center px-6 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-lg"
              >
                Export Domain Data (CSV)
              </button>
            </div>
          </motion.div>
        )}

        {view === 'DOMAIN_DETAIL' && activeDomain && (
          <motion.div key="detail" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <button 
              onClick={() => {
                setView('DOMAINS');
                setActiveDomainId(null);
              }}
              className="flex items-center text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors mb-10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
            </button>

            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {Object.keys(activeDomain.items).length === 0 
                  ? `Initialize ${activeDomain.name}` 
                  : "Additional Requirements"}
              </h2>
              <p className="text-gray-400 mt-4 text-lg">
                Managing inventory for <strong className="text-fuchsia-400">{activeDomain.name}</strong> &mdash; Organized by {activeDomain.organizer}
              </p>
            </div>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-fuchsia-500/50 transition-all group mb-16"
            >
              <input 
                type="file"
                accept=".csv, .xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <div className="w-20 h-20 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Upload Master Sheet</h3>
              <p className="text-lg text-gray-500">Drop a .csv or .xlsx file to instantly merge new requirements</p>
            </motion.div>

            <div className="space-y-12">
              {/* UNDELIVERED SECTION */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500/20 to-orange-500/10 px-8 py-6 border-b border-white/10 flex items-center">
                  <Package className="w-6 h-6 text-rose-400 mr-3" />
                  <h3 className="text-xl font-bold text-rose-200">Undelivered (Pending)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 text-xs uppercase tracking-widest">
                        <th className="p-6 font-bold w-24">SR NO</th>
                        <th className="p-6 font-bold">Item Name</th>
                        <th className="p-6 font-bold w-40">Quantity</th>
                        <th className="p-6 font-bold w-56 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.values(activeDomain.items).filter(item => item.undeliveredQty > 0).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-500 text-lg">No pending items remaining.</td>
                        </tr>
                      ) : (
                        Object.values(activeDomain.items)
                          .filter(item => item.undeliveredQty > 0)
                          .sort((a, b) => a.originalName.localeCompare(b.originalName))
                          .map((item, index) => (
                            <tr key={item.normalizedName} className="hover:bg-white/5 transition-colors group">
                              <td className="p-6 font-mono text-sm text-gray-500">{index + 1}</td>
                              <td className="p-6 font-bold text-gray-200 text-lg">{item.originalName}</td>
                              <td className="p-6">
                                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-4 py-2 rounded-xl">
                                  {item.undeliveredQty}
                                </span>
                              </td>
                              <td className="p-6 text-right">
                                <button 
                                  onClick={() => {
                                  setItemPendingDelivery(item.normalizedName);
                                  setDeliveryQuantity(item.undeliveredQty);
                                }}
                                  className="inline-flex items-center px-6 py-3 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl font-bold text-sm transition-all hover:scale-105"
                                >
                                  <Check className="w-4 h-4 mr-2" /> Delivered
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DELIVERED SECTION */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden opacity-90">
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 px-8 py-6 border-b border-white/10 flex items-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mr-3" />
                  <h3 className="text-xl font-bold text-emerald-200">Successfully Delivered</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 text-xs uppercase tracking-widest">
                        <th className="p-6 font-bold w-24">SR NO</th>
                        <th className="p-6 font-bold">Item Name</th>
                        <th className="p-6 font-bold">Total Delivered Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.values(activeDomain.items).filter(item => item.deliveredQty > 0).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-12 text-center text-gray-500 text-lg">No items delivered yet.</td>
                        </tr>
                      ) : (
                        Object.values(activeDomain.items)
                          .filter(item => item.deliveredQty > 0)
                          .sort((a, b) => a.originalName.localeCompare(b.originalName))
                          .map((item, index) => (
                            <tr key={item.normalizedName} className="bg-black/10">
                              <td className="p-6 font-mono text-sm text-gray-500">{index + 1}</td>
                              <td className="p-6 font-semibold text-gray-400 text-lg">{item.originalName}</td>
                              <td className="p-6">
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-4 py-2 rounded-xl">
                                  {item.deliveredQty}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
