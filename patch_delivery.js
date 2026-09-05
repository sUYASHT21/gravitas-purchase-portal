const fs = require('fs');
let content = fs.readFileSync('components/DeliveryTracking.tsx', 'utf8');

// 1. Add deliveryQuantity state
content = content.replace(
  /const \[itemPendingDelivery, setItemPendingDelivery\] = useState<string \| null>\(null\);/,
  "const [itemPendingDelivery, setItemPendingDelivery] = useState<string | null>(null);\n  const [deliveryQuantity, setDeliveryQuantity] = useState<number | ''>('');"
);

// 2. Update onClick in button
content = content.replace(
  /onClick=\{\(\) => setItemPendingDelivery\(item.normalizedName\)\}/g,
  `onClick={() => {\n                                  setItemPendingDelivery(item.normalizedName);\n                                  setDeliveryQuantity(item.undeliveredQty);\n                                }}`
);

// 3. Update confirmDelivery logic
const confirmDeliveryOld = `  const confirmDelivery = () => {
    if (!activeDomainId || !itemPendingDelivery) return;
    
    setDomains(prev => {
      const next = { ...prev };
      const domain = { ...next[activeDomainId] };
      const items = { ...domain.items };
      const item = { ...items[itemPendingDelivery] };

      item.deliveredQty += item.undeliveredQty;
      item.undeliveredQty = 0;

      items[itemPendingDelivery] = item;
      domain.items = items;
      next[activeDomainId] = domain;
      return next;
    });
    
    setItemPendingDelivery(null);
  };`;

const confirmDeliveryNew = `  const confirmDelivery = () => {
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
    XLSX.writeFile(wb, \`\${activeDomain.name.replace(/\\s+/g, '_')}_Inventory.csv\`);
  };`;

content = content.replace(confirmDeliveryOld, confirmDeliveryNew);

// 4. Update the modal UI
const modalOld = `<p className="text-gray-400 text-center mb-8 text-lg">
                Are you sure you want to mark <strong className="text-white bg-white/10 px-2 py-0.5 rounded">{activeDomain.items[itemPendingDelivery]?.undeliveredQty}x {activeDomain.items[itemPendingDelivery]?.originalName}</strong> as delivered for this domain?
              </p>`;

const modalNew = `<p className="text-gray-400 text-center mb-4 text-lg">
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
              </div>`;

content = content.replace(modalOld, modalNew);

// 5. Add Export button
const exportButton = `</div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={exportDomainData}
                className="flex items-center px-6 py-3 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-lg"
              >
                Export Domain Data (CSV)
              </button>
            </div>
          </motion.div>`;

content = content.replace(/<\/div>\n            <\/div>\n          <\/motion.div>/, exportButton);

fs.writeFileSync('components/DeliveryTracking.tsx', content);
