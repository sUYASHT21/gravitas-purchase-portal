'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Plus, Upload, Loader2, Package, CheckCircle, 
  Check, Trash2, Edit3, X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthProvider';

interface EventMaster {
  event_id: string;
  event_name: string;
  club_name: string;
  poc_name: string;
  poc_mobile: string;
}

interface EventRequirement {
  id: number;
  event_id: string;
  item_name: string;
  required_qty: number;
  delivered_qty: number;
}

export default function EventsDashboard() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'view-only';

  const [view, setView] = useState<'LANDING' | 'DETAIL'>('LANDING');
  const [trackedEvents, setTrackedEvents] = useState<(EventMaster & { requirements: EventRequirement[], percentDelivered: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Event Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EventMaster[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventMaster | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Detail View
  const [activeEvent, setActiveEvent] = useState<EventMaster | null>(null);
  const [activeRequirements, setActiveRequirements] = useState<EventRequirement[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delivery Tracking State
  const [deliveryInputs, setDeliveryInputs] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchTrackedEvents();
  }, []);

  const fetchTrackedEvents = async () => {
    setIsLoading(true);
    const { data: activeEvents, error: activeError } = await supabase.from('events_active').select('event_id');
    if (activeError || !activeEvents) {
      setIsLoading(false);
      return;
    }

    const eventIds = activeEvents.map(a => a.event_id);
    if (eventIds.length === 0) {
      setTrackedEvents([]);
      setIsLoading(false);
      return;
    }

    const { data: events, error: eventError } = await supabase.from('events_master').select('*').in('event_id', eventIds);
    if (eventError || !events) {
      setIsLoading(false);
      return;
    }

    const { data: reqs } = await supabase.from('event_requirements').select('*').in('event_id', eventIds);
    const validReqs = reqs || [];

    const merged = events.map(ev => {
      const evReqs = validReqs.filter(r => r.event_id === ev.event_id);
      const totalReq = evReqs.reduce((sum, r) => sum + r.required_qty, 0);
      const totalDeliv = evReqs.reduce((sum, r) => sum + r.delivered_qty, 0);
      const percentDelivered = totalReq === 0 ? 0 : (totalDeliv / totalReq) * 100;
      return { ...ev, requirements: evReqs, percentDelivered };
    });

    setTrackedEvents(merged);
    setIsLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedEvent(null); // Fix sticky selection bug
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase
      .from('events_master')
      .select('*')
      .or(`event_name.ilike.%${query}%,event_id.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleAddEvent = async () => {
    if (!selectedEvent) return;
    // Check if already tracked
    if (trackedEvents.some(e => e.event_id === selectedEvent.event_id)) {
      alert("Event is already being tracked!");
      return;
    }
    // Insert into events_active
    await supabase.from('events_active').insert([{
      event_id: selectedEvent.event_id
    }]);
    
    setIsAddModalOpen(false);
    setSearchQuery('');
    setSelectedEvent(null);
    setSearchResults([]);
    fetchTrackedEvents();
  };

  const openEventDetail = async (ev: EventMaster) => {
    setActiveEvent(ev);
    // Fetch fresh reqs for this event
    const { data } = await supabase.from('event_requirements').select('*').eq('event_id', ev.event_id);
    const filteredReqs = data || [];
    setActiveRequirements(filteredReqs);
    
    const initialInputs: Record<number, number> = {};
    filteredReqs.forEach(r => initialInputs[r.id] = r.delivered_qty);
    setDeliveryInputs(initialInputs);
    
    setView('DETAIL');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvent) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const newReqs: any[] = [];
        for (const row of data as any[]) {
          // Look for item/name and qty/quantity
          const getVal = (keys: string[]) => {
            const matchedKey = Object.keys(row).find(k => keys.some(search => k.toLowerCase().includes(search)));
            return matchedKey ? row[matchedKey] : null;
          };
          const item = getVal(['item', 'name', 'description']);
          const qty = getVal(['qty', 'quantity', 'count']);
          
          if (item && qty) {
            newReqs.push({
              event_id: activeEvent.event_id,
              item_name: String(item).trim(),
              required_qty: parseInt(String(qty).replace(/[^0-9]/g, ''), 10) || 0,
              delivered_qty: 0
            });
          }
        }

        if (newReqs.length > 0) {
          await supabase.from('event_requirements').insert(newReqs);
          await openEventDetail(activeEvent);
          fetchTrackedEvents();
        } else {
          alert("Could not find Item and Quantity columns in the uploaded file.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing file.");
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleEditRequirements = async () => {
    if (!activeEvent) return;
    if (window.confirm("WARNING: This will delete all existing requirements and their delivery progress. Continue?")) {
      await supabase.from('event_requirements').delete().eq('event_id', activeEvent.event_id);
      setActiveRequirements([]);
      setDeliveryInputs({});
      fetchTrackedEvents();
    }
  };

  const updateDeliveryQty = async (reqId: number, qty: number) => {
    const req = activeRequirements.find(r => r.id === reqId);
    if (!req) return;
    let safeQty = Math.max(0, Math.min(qty, req.required_qty));
    setDeliveryInputs(prev => ({ ...prev, [reqId]: safeQty }));
    await supabase.from('event_requirements').update({ delivered_qty: safeQty }).eq('id', reqId);
    // Refresh background data
    const newReqs = activeRequirements.map(r => r.id === reqId ? { ...r, delivered_qty: safeQty } : r);
    setActiveRequirements(newReqs);
    fetchTrackedEvents();
  };

  const handleCompleteDelivery = async () => {
    if (!activeEvent) return;
    if (window.confirm("Mark all items for this event as fully delivered?")) {
      const updates = activeRequirements.map(r => ({
        id: r.id,
        event_id: r.event_id,
        item_name: r.item_name,
        required_qty: r.required_qty,
        delivered_qty: r.required_qty
      }));
      
      // Update one by one or bulk upsert. Bulk upsert is safe if we pass id
      const { error } = await supabase.from('event_requirements').upsert(updates);
      if (error) {
        alert("Error updating: " + error.message);
      } else {
        await openEventDetail(activeEvent);
        fetchTrackedEvents();
      }
    }
  };

  if (isLoading && view === 'LANDING') {
    return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-fuchsia-500" /></div>;
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {view === 'LANDING' && (
          <motion.div key="landing" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="w-full">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 tracking-tight mb-4">
                  Events Delivery
                </h1>
                <p className="text-gray-400 text-lg">Track requirement deliveries for technical and non-technical events.</p>
              </div>
              {!isReadOnly && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Event
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackedEvents.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-500 text-lg bg-white/5 border border-white/10 rounded-3xl">
                  No events are currently being tracked.
                </div>
              ) : (
                trackedEvents.map(ev => {
                  const isComplete = ev.requirements.length > 0 && ev.percentDelivered === 100;
                  return (
                    <motion.div 
                      key={ev.event_id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => openEventDetail(ev)}
                      className={`p-6 rounded-[2rem] border cursor-pointer transition-all shadow-xl ${
                        isComplete ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <h3 className="text-xl font-bold text-white mb-2">{ev.event_name}</h3>
                      <p className="text-sm text-fuchsia-400 font-medium mb-4">{ev.club_name}</p>
                      
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>POC:</span>
                          <span className="text-gray-200">{ev.poc_name} ({ev.poc_mobile})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                            {ev.percentDelivered.toFixed(0)}% Delivered
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {view === 'DETAIL' && activeEvent && (
          <motion.div key="detail" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="w-full">
            <button 
              onClick={() => setView('LANDING')}
              className="flex items-center text-fuchsia-400 hover:text-fuchsia-300 font-bold mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </button>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] mb-8 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">{activeEvent.event_name}</h2>
                <p className="text-fuchsia-400 font-medium text-lg mt-2">{activeEvent.club_name}</p>
              </div>
              <div className="text-right text-gray-400">
                <p>POC: <span className="text-white font-bold">{activeEvent.poc_name}</span></p>
                <p>{activeEvent.poc_mobile}</p>
              </div>
            </div>

            {activeRequirements.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[2rem]">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-300 mb-2">No Requirements Found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Upload a CSV/Excel sheet with 'Item' and 'Quantity' columns to start tracking delivery for this event.</p>
                {!isReadOnly && (
                  <>
                    <input type="file" accept=".csv, .xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-fuchsia-500/25 transition-all disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                      Upload Requirements
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex gap-4">
                    {!isReadOnly && (
                      <>
                        <button 
                          onClick={handleEditRequirements}
                          className="flex items-center px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 mr-2" /> Edit Requirements
                        </button>
                        <input type="file" accept=".csv, .xlsx" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      </>
                    )}
                  </div>
                  {!isReadOnly && (
                    <button 
                      onClick={handleCompleteDelivery}
                      className="flex items-center px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold hover:bg-emerald-500/30 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> Complete Delivery
                    </button>
                  )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/20 text-gray-400 text-xs uppercase tracking-widest border-b border-white/10">
                        <th className="p-6 font-bold w-16">#</th>
                        <th className="p-6 font-bold">Item Name</th>
                        <th className="p-6 font-bold w-40 text-center">Required</th>
                        <th className="p-6 font-bold w-40 text-center">Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {activeRequirements.map((req, i) => (
                        <tr key={req.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6 font-mono text-sm text-gray-500">{i + 1}</td>
                          <td className="p-6 font-bold text-gray-200">{req.item_name}</td>
                          <td className="p-6 text-center">
                            <span className="bg-white/10 text-white font-bold px-4 py-2 rounded-xl">
                              {req.required_qty}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center justify-center">
                              <input 
                                type="number"
                                min="0"
                                max={req.required_qty}
                                value={deliveryInputs[req.id] || 0}
                                disabled={isReadOnly}
                                onChange={(e) => updateDeliveryQty(req.id, parseInt(e.target.value) || 0)}
                                className="w-24 px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-center font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div 
              initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}}
              className="relative w-full max-w-xl bg-[#0B0A0F] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-visible"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white mb-6">Add Event for Tracking</h2>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Event (Name or ID)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Type at least 3 characters..."
                      className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                    />
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fuchsia-500 animate-spin" />}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {searchResults.length > 0 && !selectedEvent && (
                    <div className="absolute z-50 w-full mt-2 bg-[#1a1525] border border-fuchsia-500/30 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                      {searchResults.map(res => (
                        <div 
                          key={res.event_id}
                          onClick={() => {
                            setSelectedEvent(res);
                            setSearchQuery(res.event_name);
                            setSearchResults([]);
                          }}
                          className="p-4 hover:bg-fuchsia-500/20 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-white">{res.event_name}</div>
                          <div className="text-xs text-gray-400">{res.event_id} &bull; {res.club_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedEvent && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">Club / Association</label>
                      <div className="text-white font-medium text-lg">{selectedEvent.club_name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">POC Name</label>
                        <div className="text-white font-medium">{selectedEvent.poc_name}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">POC Mobile</label>
                        <div className="text-white font-medium">{selectedEvent.poc_mobile}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <button 
                  onClick={handleAddEvent}
                  disabled={!selectedEvent}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Track Event Delivery
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
