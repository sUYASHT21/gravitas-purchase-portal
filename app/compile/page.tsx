import React from 'react';
import CompilationDashboard from '@/components/CompilationDashboard';

export const metadata = {
  title: 'Compile Indents | Purchase Portal',
};

export default function CompilePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-gray-200 overflow-x-hidden selection:bg-purple-500/30 print:bg-white print:text-black print:min-h-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0 print:px-0 w-full">
        <div className="mb-10 text-center print:hidden">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500 tracking-tight">
            Indent Compilation Engine
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Paste Google Sheet links from event POCs. We will extract, categorize, and prepare the printable indent.
          </p>
        </div>

        <CompilationDashboard />
      </div>
    </main>
  );
}
