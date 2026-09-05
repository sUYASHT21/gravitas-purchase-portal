const fs = require('fs');

let content = fs.readFileSync('components/CompilationDashboard.tsx', 'utf8');

// Replace standard white/gray theme with dark theme
content = content.replace(
  /<div className="print:hidden bg-white\/70 backdrop-blur-lg p-6 md:p-8 rounded-3xl border border-white\/40 shadow-xl shadow-purple-900\/5">/g,
  '<div className="print:hidden bg-white/5 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-2xl">'
);

content = content.replace(
  /<a href="\/" className="text-purple-600 font-bold hover:underline">← Back to Dashboard<\/a>/g,
  '<a href="/" className="text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors">← Back to Inventory</a>'
);

content = content.replace(
  /<div className="mb-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg flex items-start">/g,
  '<div className="mb-6 bg-fuchsia-500/10 border-l-4 border-fuchsia-500 p-4 rounded-r-xl flex items-start">'
);
content = content.replace(/text-purple-900/g, 'text-fuchsia-200');
content = content.replace(/text-purple-800/g, 'text-fuchsia-100');
content = content.replace(/text-purple-600/g, 'text-fuchsia-400');
content = content.replace(/text-gray-700/g, 'text-gray-300');
content = content.replace(/text-gray-800/g, 'text-white');

content = content.replace(
  /className="w-full h-40 p-4 border border-gray-200 rounded-xl bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm font-mono text-gray-900 placeholder-gray-400"/g,
  'className="w-full h-40 p-4 border border-white/10 rounded-xl bg-black/20 shadow-inner focus:outline-none focus:border-fuchsia-500 transition-all text-sm font-mono text-gray-200 placeholder-gray-500"'
);

// Buttons
content = content.replace(
  /className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 w-full md:w-auto justify-center"/g,
  'className="flex items-center px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 w-full md:w-auto justify-center"'
);
content = content.replace(
  /className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 w-full md:w-auto justify-center"/g,
  'className="flex items-center px-6 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 w-full md:w-auto justify-center"'
);
content = content.replace(
  /className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 w-full md:w-auto justify-center"/g,
  'className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 w-full md:w-auto justify-center"'
);

content = content.replace(
  /className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100"/g,
  'className="print:hidden flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/10"'
);
content = content.replace(
  /className="flex items-center px-6 py-2.5 bg-black text-white font-bold rounded-lg shadow-md hover:bg-gray-800 transition-colors"/g,
  'className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all"'
);

// Preview container: ensure it remains strictly black on white since it is an A4 preview
// The safe zone should still render standard colors
content = content.replace(
  /className="mx-auto shadow-2xl print:shadow-none text-black text-base font-serif bg-white relative"/g,
  'className="mx-auto shadow-2xl shadow-fuchsia-900/20 print:shadow-none text-black text-base font-serif bg-white relative"'
);


fs.writeFileSync('components/CompilationDashboard.tsx', content);
