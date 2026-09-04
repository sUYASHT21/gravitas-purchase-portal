import React from 'react';
import CompilationDashboard from '@/components/CompilationDashboard';

export const metadata = {
  title: 'Compile Indents | Purchase Portal',
};

export default function CompilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 print:bg-white print:min-h-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0 print:px-0">
        <div className="mb-10 text-center print:hidden">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-tight">
            Indent Compilation Engine
          </h1>
          <p className="mt-3 text-base text-gray-700 max-w-2xl mx-auto">
            Paste Google Sheet links from event POCs. We will extract, categorize, and prepare the printable indent.
          </p>
        </div>

        <CompilationDashboard />
      </div>
    </main>
  );
}
