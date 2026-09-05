const fs = require('fs');

let content = fs.readFileSync('components/DeliveryTracking.tsx', 'utf8');

const oldHandleFileUpload = `  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDomainId) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) {
        showToast('Uploaded file is empty.', 'error');
        return;
      }

      setDomains(prev => {
        const next = { ...prev };
        const domain = { ...next[activeDomainId] };
        const items = { ...domain.items };

        jsonData.forEach(row => {
          const getVal = (searchItems: string[]) => {
            for (const s of searchItems) {
              const key = Object.keys(row).find(k => k.toLowerCase().includes(s));
              if (key) return String(row[key]).trim();
            }
            return '';
          };

          const name = getVal(['item', 'name', 'description']);
          const qtyStr = getVal(['qty', 'quantity', 'count', 'amount']);
          
          if (!name) return;
          const parsedQty = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10) || 1;
          const norm = normalizeItemName(name);

          if (items[norm]) {
            items[norm] = {
              ...items[norm],
              undeliveredQty: items[norm].undeliveredQty + parsedQty
            };
          } else {
            items[norm] = {
              originalName: name,
              normalizedName: norm,
              undeliveredQty: parsedQty,
              deliveredQty: 0
            };
          }
        });

        domain.items = items;
        next[activeDomainId] = domain;
        return next;
      });

      showToast('Requirements merged successfully!', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };`;

const newHandleFileUpload = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDomainId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) {
        showToast('Uploaded file is empty.', 'error');
        return;
      }
      
      setIsLoading(true);

      for (const row of jsonData) {
        const getVal = (searchItems: string[]) => {
          for (const s of searchItems) {
            const key = Object.keys(row).find(k => k.toLowerCase().includes(s));
            if (key) return String(row[key]).trim();
          }
          return '';
        };

        const name = getVal(['item', 'name', 'description']);
        const qtyStr = getVal(['qty', 'quantity', 'count', 'amount']);
        
        if (!name) continue;
        const parsedQty = parseInt(qtyStr.replace(/[^0-9]/g, ''), 10) || 1;
        const norm = normalizeItemName(name);

        // Check if exists
        const { data: existingData, error: findError } = await supabase
          .from('domain_requirements')
          .select('id, quantity')
          .eq('domain_id', activeDomainId)
          .eq('normalized_name', norm)
          .eq('status', 'Undelivered')
          .single();

        if (existingData) {
          await supabase
            .from('domain_requirements')
            .update({ quantity: existingData.quantity + parsedQty })
            .eq('id', existingData.id);
        } else {
          await supabase
            .from('domain_requirements')
            .insert([{
              domain_id: activeDomainId,
              original_name: name,
              normalized_name: norm,
              quantity: parsedQty,
              status: 'Undelivered'
            }]);
        }
      }
      
      setIsLoading(false);
      showToast('Requirements merged successfully!', 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh list
      fetchDomainRequirements(activeDomainId);
    };
    reader.readAsArrayBuffer(file);
  };`;

content = content.replace(oldHandleFileUpload, newHandleFileUpload);
fs.writeFileSync('components/DeliveryTracking.tsx', content);
