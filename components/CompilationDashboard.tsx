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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompiling(true);
    setCompileErrors([]);

    const payloads: CompilePayload[] = [];

    const readPromises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target?.result as string;
          const b64 = content.split(',')[1] || content;
          payloads.push({
            type: 'base64',
            content: b64,
            sourceName: file.name
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(readPromises);

    try {
      const result = await compileData(payloads);
      setCompiledData(result.categories);
      setCompileErrors(result.errors);
    } catch (error) {
      console.error(error);
      setCompileErrors(['A fatal error occurred while processing the files.']);
    } finally {
      setIsCompiling(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            multiple
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

      {/* Output Section */}
      {compileErrors.length > 0 && (
        <div className="print:hidden bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-md">
          <h4 className="text-red-900 font-bold flex items-center mb-2">
            <AlertCircle className="w-5 h-5 mr-2" /> Compilation Errors
          </h4>
          <ul className="list-disc pl-5 text-red-700 space-y-1 text-sm font-medium">
            {compileErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {compiledData && (
        <div className="space-y-6">
          <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Preview Indent</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center px-6 py-2.5 bg-black text-white font-bold rounded-lg shadow-md hover:bg-gray-800 transition-colors"
            >
              <Printer className="w-5 h-5 mr-2" /> Print Official Indent
            </button>
          </div>

          {/* Strict A4 Container with Background */}
          <div 
            className="mx-auto shadow-2xl print:shadow-none text-black text-base font-serif bg-white relative"
            style={{
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}
          >
            
            {/* Screen Repeating Background (Visible only on monitor to maintain 1:1 preview) */}
            <div 
              className="absolute top-0 left-0 w-full h-full z-0 print:hidden"
              style={{
                backgroundImage: "url('/indentbackground.png')",
                backgroundSize: '210mm 297mm',
                backgroundRepeat: 'repeat-y',
              }}
            ></div>

            {/* Print Fixed Background (Repeats on every printed page seamlessly via position fixed pseudo-element technique) */}
            <div 
              className="fixed top-0 left-0 w-[210mm] h-[297mm] z-0 hidden print:block"
            >
              <img 
                src="/indentbackground.png" 
                className="w-full h-full" 
                style={{ objectFit: '100% 100%', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} 
              />
            </div>

            {/* Inner Content padding boundaries acting as the strict safe zone */}
            <div className="relative z-10" style={{ paddingLeft: '25mm', paddingRight: '25mm' }}>
              <table className="w-full border-none">
                {/* 45mm Top Safe Zone (Repeats every page) */}
                <thead className="table-header-group">
                  <tr><th style={{ height: '45mm', border: 'none' }}></th></tr>
                </thead>
                
                {/* 35mm Bottom Safe Zone (Repeats every page) */}
                <tfoot className="table-footer-group">
                  <tr><td style={{ height: '35mm', border: 'none' }}></td></tr>
                </tfoot>

                <tbody>
                  <tr>
                    <td className="align-top border-none p-0 m-0">
                      
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

                      {/* Inner Data Table (The headers will automatically repeat on page break) */}
                      <table className="w-full text-left border-collapse border border-black bg-white/50">
                        <thead className="table-header-group">
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
                                <tr key={`header-${category}`} className="bg-gray-50/50 break-after-avoid">
                                  <td colSpan={3} className="border border-black px-3 py-2 font-bold underline text-lg">
                                    {isAmazon ? 'Amazon Online Orders' : category}
                                  </td>
                                </tr>
                              );

                              const itemRows = items.map((item) => {
                                const isAmazonLink = isAmazon && item.amazonLink;
                                return (
                                  <tr key={`${category}-${runningIndex}`} className="break-inside-avoid">
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

                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
