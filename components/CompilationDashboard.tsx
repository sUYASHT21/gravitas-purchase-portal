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

  const handleCompileLinks = async () => {
    if (!links.trim()) return;
    setIsCompiling(true);
    setCompileErrors([]);

    const payloads: CompilePayload[] = [];
    const urls = links.split('\n').filter(l => l.trim().length > 0);
    urls.forEach(url => {
      payloads.push({ type: 'url', content: url.trim(), sourceName: url.trim() });
    });
    
    await executeCompile(payloads);
  };

  const handleCompileRawText = async () => {
    if (!links.trim()) return;
    setIsCompiling(true);
    setCompileErrors([]);

    const payloads: CompilePayload[] = [{ type: 'raw', content: links, sourceName: 'Pasted CSV Data' }];
    await executeCompile(payloads);
  };

  const executeCompile = async (payloads: CompilePayload[]) => {
    try {
      const result = await compileData(payloads);
      
      // Check for strict server-side network blocks requiring client proxy fallback
      const fallbackErrors = result.errors.filter(e => e.startsWith('CLIENT_FALLBACK_REQUIRED|'));
      const normalErrors = result.errors.filter(e => !e.startsWith('CLIENT_FALLBACK_REQUIRED|'));
      
      if (fallbackErrors.length > 0) {
        setCompileErrors([...normalErrors, "Server network blocked. Attempting client-side proxy fallback..."]);
        
        const fallbackPayloads: CompilePayload[] = [];
        for (const errStr of fallbackErrors) {
          const [, exportUrl] = errStr.split('|');
          try {
            // Client-side fallback via public CORS proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`;
            const proxyRes = await fetch(proxyUrl);
            if (!proxyRes.ok) throw new Error('Proxy fetch failed');
            
            const rawCsv = await proxyRes.text();
            if (rawCsv.trim().toLowerCase().startsWith('<html') || rawCsv.trim().toLowerCase().startsWith('<!doctype')) {
              normalErrors.push(`Sheet is private. Please change access to 'Anyone with the link can view'. (${exportUrl})`);
              continue;
            }
            
            fallbackPayloads.push({ type: 'raw', content: rawCsv, sourceName: exportUrl });
          } catch (e: any) {
             normalErrors.push(`Client proxy fallback also failed for ${exportUrl}: ${e.message}`);
          }
        }
        
        if (fallbackPayloads.length > 0) {
           // Resubmit both the originally successful (raw/base64) payloads and the new proxy-fetched raw payloads together
           const successfulOriginals = payloads.filter(p => !fallbackErrors.some(err => err.includes(p.content)));
           const retryResult = await compileData([...successfulOriginals, ...fallbackPayloads]);
           setCompiledData(retryResult.categories);
           setCompileErrors([...normalErrors, ...retryResult.errors]);
           return;
        }
        
        // If all fallbacks failed, just show the normal errors
        setCompiledData(result.categories);
        setCompileErrors(normalErrors);
        return;
      }

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
    await executeCompile(payloads);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Input Section (Hidden when printing) */}
      <div className="print:hidden flex justify-between items-center mb-6">
        <a href="/" className="text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors">← Back to Inventory</a>
      </div>

      <div className="print:hidden bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl">
        <div className="mb-6 bg-fuchsia-500/10 border-l-4 border-fuchsia-500 p-4 rounded-r-xl flex items-start">
          <Info className="w-6 h-6 text-fuchsia-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-fuchsia-200 font-bold text-sm">Required Format</h4>
            <p className="text-fuchsia-100 text-sm mt-1">
              For links, sheets must be set to <strong>"Anyone with the link can view"</strong>. You can also paste raw CSV data or upload a file directly. Must include these exact column headers: <strong>SR NO | Item | Quantity | (Optional: Amazon Links)</strong>
            </p>
          </div>
        </div>

        <label className="block text-sm font-bold text-gray-300 mb-2">
          Paste Google Sheet Links OR Raw CSV Data
        </label>
        <textarea
          className="w-full h-40 p-4 border border-white/10 rounded-xl bg-black/20 shadow-inner focus:outline-none focus:border-fuchsia-500 transition-all text-sm font-mono text-gray-200 placeholder-gray-500"
          placeholder="https://docs.google.com/spreadsheets/d/... OR paste raw CSV here"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        />
        
        <div className="mt-6 flex flex-col md:flex-row justify-end items-center gap-4">
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
            className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-300 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 w-full md:w-auto justify-center"
          >
            <Upload className="w-5 h-5 mr-2" /> Upload Files
          </button>
          
          <button
            onClick={handleCompileRawText}
            disabled={isCompiling || !links.trim()}
            className="flex items-center px-6 py-3 bg-white border border-purple-200 text-purple-700 font-bold rounded-xl shadow-sm hover:bg-purple-50 transition-all disabled:opacity-50 w-full md:w-auto justify-center"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" /> Compile Raw Text
          </button>

          <button
            onClick={handleCompileLinks}
            disabled={isCompiling || !links.trim()}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md shadow-pink-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 w-full md:w-auto justify-center"
          >
            {isCompiling ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Fetching...</>
            ) : (
              <><FileSpreadsheet className="w-5 h-5 mr-2" /> Fetch & Compile Links</>
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
          <div className="print:hidden flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10">
            <h2 className="text-xl font-bold text-white">Preview Indent</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all"
            >
              <Printer className="w-5 h-5 mr-2" /> Print Official Indent
            </button>
          </div>

          {/* Strict A4 Container with Background */}
          <div 
            className="mx-auto shadow-2xl shadow-fuchsia-900/20 print:shadow-none text-black text-base font-serif bg-white relative"
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
