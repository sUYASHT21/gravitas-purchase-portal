const fs = require('fs');

let content = fs.readFileSync('components/DeliveryTracking.tsx', 'utf8');

// 1. Add Loader2 to lucide-react if missing (it might already be there)
if (!content.includes('Loader2')) {
  content = content.replace(/import { (.*) } from 'lucide-react';/, "import { $1, Loader2 } from 'lucide-react';");
}

// 2. Update Confirm Delivery button
const oldConfirmBtn = \`<button 
                  onClick={confirmDelivery}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all"
                >
                  Confirm Delivery
                </button>\`;

const newConfirmBtn = \`<button 
                  onClick={confirmDelivery}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex justify-center items-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Delivery'}
                </button>\`;
content = content.replace(oldConfirmBtn, newConfirmBtn);

// 3. Update Create Domain button
const oldCreateBtn = \`<button 
                    type="submit"
                    className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02] transition-all"
                  >
                    Create Domain
                  </button>\`;

const newCreateBtn = \`<button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-fuchsia-500/25 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex justify-center items-center"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                    {isLoading ? 'Creating...' : 'Create Domain'}
                  </button>\`;
content = content.replace(oldCreateBtn, newCreateBtn);

// 4. Update Upload CSV box to show spinner
const oldUploadBox = \`<div className="w-20 h-20 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Upload Master Sheet</h3>\`;

const newUploadBox = \`<div className="w-20 h-20 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300">
                {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{isLoading ? 'Syncing with Supabase...' : 'Upload Master Sheet'}</h3>\`;
content = content.replace(oldUploadBox, newUploadBox);

fs.writeFileSync('components/DeliveryTracking.tsx', content);
