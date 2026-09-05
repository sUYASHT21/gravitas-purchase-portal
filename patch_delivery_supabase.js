const fs = require('fs');

let content = fs.readFileSync('components/DeliveryTracking.tsx', 'utf8');

// 1. Add Supabase import
content = content.replace(
  /import { motion, AnimatePresence } from 'framer-motion';/,
  "import { motion, AnimatePresence } from 'framer-motion';\nimport { supabase } from '@/lib/supabaseClient';"
);

// 2. We need a loading state
content = content.replace(
  /const \[toast, setToast\] = useState<\{ message: string; type: 'error' \| 'success' \} \| null>\(null\);/,
  "const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);\n  const [isLoading, setIsLoading] = useState(false);"
);

// 3. Replace useEffect for domains
const oldUseEffect = `  useEffect(() => {
    const saved = localStorage.getItem('gravitas-delivery-domains');
    if (saved) {
      try {
        setDomains(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse domains', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gravitas-delivery-domains', JSON.stringify(domains));
  }, [domains]);`;

const newUseEffect = `  const fetchDomains = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('domains').select('*');
    setIsLoading(false);
    if (error) {
      console.error(error);
      showToast('Failed to fetch domains', 'error');
      return;
    }
    const newDomains: Record<string, Domain> = {};
    for (const d of data) {
      newDomains[d.id] = { ...d, items: {} };
    }
    setDomains(newDomains);
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomainRequirements = async (domainId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('domain_requirements').select('*').eq('domain_id', domainId);
    setIsLoading(false);
    
    if (error) {
      console.error(error);
      showToast('Failed to fetch requirements', 'error');
      return;
    }

    setDomains(prev => {
      const next = { ...prev };
      if (!next[domainId]) return prev;
      
      const domain = { ...next[domainId] };
      const items: Record<string, ItemState> = {};
      
      data.forEach(req => {
        const norm = req.normalized_name;
        if (!items[norm]) {
          items[norm] = {
            originalName: req.original_name,
            normalizedName: norm,
            undeliveredQty: 0,
            deliveredQty: 0
          };
        }
        if (req.status === 'Undelivered') {
          items[norm].undeliveredQty += req.quantity;
        } else if (req.status === 'Delivered') {
          items[norm].deliveredQty += req.quantity;
        }
      });
      
      domain.items = items;
      next[domainId] = domain;
      return next;
    });
  };

  // Watch for activeDomainId changes
  useEffect(() => {
    if (activeDomainId) {
      fetchDomainRequirements(activeDomainId);
    }
  }, [activeDomainId]);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Update handleAddDomain
const oldAddDomain = `  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    const exists = Object.values(domains).some(d => d.name.toLowerCase() === newDomainName.trim().toLowerCase());
    if (exists) {
      showToast('Domain already exists!', 'error');
      return;
    }

    const id = Date.now().toString();
    const newDomain: Domain = {
      id,
      name: newDomainName.trim(),
      organizer: newOrganizer.trim(),
      contact: newContact.trim(),
      items: {}
    };

    setDomains(prev => ({ ...prev, [id]: newDomain }));
    setNewDomainName('');
    setNewOrganizer('');
    setNewContact('');
    showToast('Domain added successfully!', 'success');
  };`;

const newAddDomain = `  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('domains')
      .insert([{ 
        name: newDomainName.trim(),
        organizer: newOrganizer.trim(),
        contact: newContact.trim()
      }])
      .select();
    
    setIsLoading(false);

    if (error) {
      console.error(error);
      if (error.code === '23505') {
        showToast('Domain already exists!', 'error');
      } else {
        showToast('Failed to add domain', 'error');
      }
      return;
    }

    if (data && data[0]) {
      const newDomain: Domain = { ...data[0], items: {} };
      setDomains(prev => ({ ...prev, [data[0].id]: newDomain }));
      setNewDomainName('');
      setNewOrganizer('');
      setNewContact('');
      showToast('Domain added successfully!', 'success');
    }
  };`;

content = content.replace(oldAddDomain, newAddDomain);

fs.writeFileSync('components/DeliveryTracking.tsx', content);
