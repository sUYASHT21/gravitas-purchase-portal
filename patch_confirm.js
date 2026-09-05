const fs = require('fs');
let content = fs.readFileSync('components/DeliveryTracking.tsx', 'utf8');

const oldConfirm = \`  const confirmDelivery = () => {
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
  };\`;

const newConfirm = \`  const confirmDelivery = async () => {
    if (!activeDomainId || !itemPendingDelivery) return;
    const amount = typeof deliveryQuantity === 'number' ? deliveryQuantity : 0;
    if (amount <= 0) return;
    
    setIsLoading(true);

    const domain = domains[activeDomainId];
    const itemState = domain.items[itemPendingDelivery];
    const qtyToDeliver = Math.min(amount, itemState.undeliveredQty);
    
    const isFullDelivery = qtyToDeliver === itemState.undeliveredQty;

    // First fetch the 'Undelivered' record
    const { data: undeliveredRow } = await supabase
      .from('domain_requirements')
      .select('id, quantity')
      .eq('domain_id', activeDomainId)
      .eq('normalized_name', itemPendingDelivery)
      .eq('status', 'Undelivered')
      .single();

    if (undeliveredRow) {
      if (isFullDelivery) {
        // Full Delivery: check if a 'Delivered' row already exists to avoid duplicates
        const { data: deliveredRow } = await supabase
          .from('domain_requirements')
          .select('id, quantity')
          .eq('domain_id', activeDomainId)
          .eq('normalized_name', itemPendingDelivery)
          .eq('status', 'Delivered')
          .single();
          
        if (deliveredRow) {
          // Add to existing Delivered and delete Undelivered
          await supabase.from('domain_requirements').update({ quantity: deliveredRow.quantity + qtyToDeliver }).eq('id', deliveredRow.id);
          await supabase.from('domain_requirements').delete().eq('id', undeliveredRow.id);
        } else {
          // Just swap status to Delivered
          await supabase.from('domain_requirements').update({ status: 'Delivered' }).eq('id', undeliveredRow.id);
        }
      } else {
        // Partial Delivery
        // 1. Reduce Undelivered row
        await supabase
          .from('domain_requirements')
          .update({ quantity: undeliveredRow.quantity - qtyToDeliver })
          .eq('id', undeliveredRow.id);
          
        // 2. Add to Delivered row or insert
        const { data: deliveredRow } = await supabase
          .from('domain_requirements')
          .select('id, quantity')
          .eq('domain_id', activeDomainId)
          .eq('normalized_name', itemPendingDelivery)
          .eq('status', 'Delivered')
          .single();
          
        if (deliveredRow) {
          await supabase
            .from('domain_requirements')
            .update({ quantity: deliveredRow.quantity + qtyToDeliver })
            .eq('id', deliveredRow.id);
        } else {
          await supabase
            .from('domain_requirements')
            .insert([{
              domain_id: activeDomainId,
              original_name: itemState.originalName,
              normalized_name: itemPendingDelivery,
              quantity: qtyToDeliver,
              status: 'Delivered'
            }]);
        }
      }
    }

    setIsLoading(false);
    setItemPendingDelivery(null);
    showToast('Delivery confirmed!', 'success');
    fetchDomainRequirements(activeDomainId);
  };\`;

content = content.replace(oldConfirm, newConfirm);
fs.writeFileSync('components/DeliveryTracking.tsx', content);
