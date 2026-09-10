export function autoCategorize(itemName: string): string {
  if (!itemName) return 'General';
  
  const lower = itemName.toLowerCase();
  
  const electricalsKeywords = ['motor', 'battery', 'esc', 'propeller', 'frame', 'receiver', 'flight controller', 'breadboard', 'sensor', 'mpu', 'flux', 'soldering', 'wire', 'lipo', 'bldc', 'zero pcb', 'node mcu', 'connector', 'tape', 'module', 'cable', 'plug', 'led', 'bulb', 'switch', 'socket'];
  
  if (electricalsKeywords.some(kw => lower.includes(kw))) {
    return 'Electricals';
  } 
  
  const culinaryKeywords = ['apple', 'water', 'biscuit', 'juice', 'coffee', 'tea', 'food', 'plate', 'cup', 'snack'];
  
  if (culinaryKeywords.some(kw => lower.includes(kw))) {
    return 'Culinary';
  } 
  
  const chemicalsKeywords = ['powder', 'oxide', 'charcoal', 'calcium', 'zinc', 'vials', 'dropper', 'acid', 'solution', 'pigment', 'chemical', 'liquid'];
  
  if (chemicalsKeywords.some(kw => lower.includes(kw))) {
    return 'Chemicals';
  } 
  
  const stationeryKeywords = ['paper', 'folder', 'pen', 'marker', 'stapler', 'staple', 'keychains', 'spoons', 'scissors', 'scissor', 'binder', 'glue', 'chart', 'pencil', 'file', 'tag'];
  
  if (stationeryKeywords.some(kw => lower.includes(kw))) {
    return 'Stationery';
  }
  
  return 'General';
}
