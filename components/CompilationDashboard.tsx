'use client';

import React, { useState, useRef } from 'react';
import { Loader2, FileSpreadsheet, Printer, AlertCircle, Info, Upload } from 'lucide-react';
import { compileData, CompilePayload } from '@/app/actions';

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
  const [compileErrors, setCompileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCompile = async () => {
    if (!links.trim()) return;
    
    setIsCompiling(true);
    setCompileErrors([]);

    const payloads: CompilePayload[] = [];
    
    // If the input doesn't start with HTTP, assume it's raw CSV data pasted.
    if (!links.trim().startsWith('http')) {
      payloads.push({ type: 'raw', content: links, sourceName: 'Pasted CSV Data' });
    } else {
      const urls = links.split('\n').filter(l => l.trim().length > 0);
      urls.forEach(url => {
        payloads.push({ type: 'url', content: url, sourceName: url });
      });
    }
    
    try {
      const result = await compileData(payloads);
      setCompiledData(result.categories);
      setCompileErrors(result.errors);
    } catch (error) {
      console.error(error);
      setCompileErrors(['A fatal error occurred while compiling data.']);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompiling(true);
    setCompileErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const b64 = content.split(',')[1] || content;
      
      const payload: CompilePayload = {
        type: 'base64',
        content: b64,
        sourceName: file.name
      };

      try {
        const result = await compileData([payload]);
        setCompiledData(result.categories);
        setCompileErrors(result.errors);
      } catch (error) {
        console.error(error);
        setCompileErrors(['A fatal error occurred while processing the file.']);
      } finally {
        setIsCompiling(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Input Section (Hidden when printing) */}
      <div className="print:hidden flex justify-between items-center mb-6">
        <a href="/" className="text-purple-600 font-bold hover:underline">← Back to Dashboard</a>
      </div>

      <div className="print:hidden bg-white/70 backdrop-blur-lg p-6 md:p-8 rounded-3xl border border-white/40 shadow-xl shadow-purple-900/5">
        <div className="mb-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg flex items-start">
          <Info className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-purple-900 font-bold text-sm">Required Format</h4>
            <p className="text-purple-800 text-sm mt-1">
              For links, sheets must be set to <strong>"Anyone with the link can view"</strong>. You can also paste raw CSV data or upload a file directly. Must include these exact column headers: <strong>SR NO | Item | Quantity | (Optional: Amazon Links)</strong>
            </p>
          </div>
        </div>

        <label className="block text-sm font-bold text-gray-700 mb-2">
          Paste Google Sheet Links OR Raw CSV Data
        </label>
        <textarea
          className="w-full h-40 p-4 border border-gray-200 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-mono text-gray-900 placeholder-gray-400"
          placeholder="https://docs.google.com/spreadsheets/d/... OR paste raw CSV here"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        />
        
        <div className="mt-4 flex flex-col md:flex-row justify-end items-center gap-4">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompiling}
            className="flex items-center px-6 py-3 bg-white border border-purple-200 text-purple-700 font-bold rounded-xl shadow-sm hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            <Upload className="w-5 h-5 mr-2" /> Upload CSV/Excel
          </button>
          <span className="text-gray-400 font-bold text-sm hidden md:inline">OR</span>
          <button
            onClick={handleCompile}
            disabled={isCompiling || !links.trim()}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md shadow-pink-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {isCompiling ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><FileSpreadsheet className="w-5 h-5 mr-2" /> Compile from Text</>
            )}
          </button>
        </div>
      </div>

      {compileErrors.length > 0 && (
        <div className="print:hidden bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-red-800 font-bold flex items-center mb-3">
            <AlertCircle className="w-5 h-5 mr-2" /> Compilation Errors
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {compileErrors.map((err, i) => (
              <li key={i} className="text-red-600 text-sm">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Printable Indent Output */}
      {compiledData && (
        <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
          <div className="print:hidden flex justify-end mb-6 max-w-4xl mx-auto">
            <button 
              onClick={() => window.print()}
              className="flex items-center px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Indent
            </button>
          </div>

          {/* Strict A4 Container with Background */}
          <div className="shadow-2xl print:shadow-none letterhead-print-bg text-black text-base font-serif bg-white relative">
            
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
              <table className="w-full text-left border-collapse border border-black bg-white/50">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-2 font-bold w-16 text-center bg-gray-100/80">SR NO</th>
                    <th className="border border-black px-3 py-2 font-bold bg-gray-100/80">Item</th>
                    <th className="border border-black px-3 py-2 font-bold w-24 text-center bg-gray-100/80">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let runningIndex = 1;
                    return Object.entries(compiledData).map(([category, items]) => {
                      if (items.length === 0) return null;
                      
                      const isAmazon = category === 'AmazonItems';
                      const categoryHeader = (
                        <tr key={`header-${category}`} className="bg-gray-50/50">
                          <td colSpan={3} className="border border-black px-3 py-2 font-bold underline text-lg">
                            {isAmazon ? 'Amazon Online Orders' : category}
                          </td>
                        </tr>
                      );

                      const itemRows = items.map((item) => {
                        const isAmazonLink = isAmazon && item.amazonLink;
                        return (
                          <tr key={`${category}-${runningIndex}`}>
                            <td className="border border-black px-3 py-2 text-center">{runningIndex++}</td>
                            <td className="border border-black px-3 py-2">
                              {item.name}
                              {isAmazonLink && (
                                <div className="text-sm text-blue-800 mt-1 break-all">
                                  Link: <a href={item.amazonLink} target="_blank" rel="noreferrer" className="underline font-sans">{item.amazonLink}</a>
                                </div>
                              )}
                            </td>
                            <td className="border border-black px-3 py-2 text-center">{item.quantity}</td>
                          </tr>
                        );
                      });

                      return [categoryHeader, ...itemRows];
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Signature Blocks */}
            <div className="mt-32 pt-8 flex justify-between items-end break-inside-avoid relative z-10">
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
