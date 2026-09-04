'use client';

import React, { useState } from 'react';
import { Loader2, FileSpreadsheet, Printer } from 'lucide-react';
import { compileSheets } from '@/app/actions';

export type CompiledItem = {
  name: string;
  quantity: string | number;
  amazonLink?: string;
};

export type CategorizedIndent = {
  Stationery: CompiledItem[];
  Culinary: CompiledItem[];
  Chemicals: CompiledItem[];
  Electricals: CompiledItem[];
  AmazonItems: CompiledItem[];
};

export default function CompilationDashboard() {
  const [links, setLinks] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledData, setCompiledData] = useState<CategorizedIndent | null>(null);

  const handleCompile = async () => {
    if (!links.trim()) return;
    
    setIsCompiling(true);
    const urls = links.split('\n').filter(l => l.trim().length > 0);
    
    try {
      const data = await compileSheets(urls);
      setCompiledData(data);
    } catch (error) {
      console.error(error);
      alert('Failed to compile sheets. Ensure they are public and valid Google Sheet URLs.');
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section (Hidden when printing) */}
      <div className="print:hidden flex justify-between items-center mb-6">
        <a href="/" className="text-purple-600 font-bold hover:underline">← Back to Dashboard</a>
      </div>

      <div className="print:hidden bg-white/70 backdrop-blur-lg p-6 rounded-3xl border border-white/40 shadow-xl shadow-purple-900/5">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Paste Google Sheet Links (One per line)
        </label>
        <textarea
          className="w-full h-40 p-4 border-none rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-mono"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCompile}
            disabled={isCompiling || !links.trim()}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md shadow-pink-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isCompiling ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Compiling...</>
            ) : (
              <><FileSpreadsheet className="w-5 h-5 mr-2" /> Compile Requirements</>
            )}
          </button>
        </div>
      </div>

      {/* Printable Indent Output */}
      {compiledData && (
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl print:shadow-none print:p-0">
          <div className="print:hidden flex justify-end mb-6">
            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Indent
            </button>
          </div>

          <div className="print-area bg-white text-black text-base max-w-4xl mx-auto font-serif letterhead-print-bg">
            {/* Top Date */}
            <div className="text-right mb-4">
              <p>{new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {/* Top Left To Address */}
            <div className="mb-6">
              <p>To</p>
              <p>Purchase Office</p>
              <p>VIT</p>
            </div>

            {/* Subject Line */}
            <div className="text-center font-bold mb-6">
              <p>Sub.: Request to purchase the items for GraVITas’26 – reg.</p>
            </div>

            {/* Salutation & Body */}
            <div className="mb-8">
              <p>Dear sir,</p>
              <p className="mt-2 indent-8">
                Herewith I have mentioned the items which is urgently need for GraVITas’26. Kindly approve and issue the following items.
              </p>
            </div>

            {/* Render Categories */}
            <div className="space-y-10">
              {Object.entries(compiledData).map(([category, items]) => {
                if (items.length === 0) return null;
                
                const isAmazon = category === 'AmazonItems';
                return (
                  <div key={category} className="break-inside-avoid">
                    <h4 className="text-lg font-bold underline mb-3">
                      {isAmazon ? 'Amazon Online Orders' : category}
                    </h4>
                    <table className="w-full text-left border-collapse border border-black">
                      <thead>
                        <tr>
                          <th className="border border-black px-3 py-2 font-bold w-16 text-center">Sr No</th>
                          <th className="border border-black px-3 py-2 font-bold">Items</th>
                          <th className="border border-black px-3 py-2 font-bold w-24 text-center">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-3 py-2 text-center">{idx + 1}</td>
                            <td className="border border-black px-3 py-2">
                              {item.name}
                              {isAmazon && item.amazonLink && (
                                <div className="text-sm text-blue-600 mt-1 break-all">
                                  Link: <a href={item.amazonLink} target="_blank" rel="noreferrer" className="underline">{item.amazonLink}</a>
                                </div>
                              )}
                            </td>
                            <td className="border border-black px-3 py-2 text-center">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Signature Blocks */}
            <div className="mt-32 pt-8 flex justify-between items-end break-inside-avoid">
              <div className="text-center w-48 font-bold">
                Faculty Organiser (Purchase)
              </div>
              <div className="text-center w-48 font-bold">
                Co-Convenor (Purchase)
              </div>
              <div className="text-center w-48 font-bold">
                Convenor
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
