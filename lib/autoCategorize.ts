export function autoCategorize(itemName: string): string {
  if (!itemName) return 'General';
  
  const lower = itemName.toLowerCase();
  
  const foodKeywords = ['milk', 'milk powder', 'turmeric', 'spinach', 'tea', 'coffee', 'sugar', 'salt', 'flour', 'biscuit', 'juice', 'food', 'edible', 'oil', 'grain', 'snack', 'syrup'];
  
  if (foodKeywords.some(kw => lower.includes(kw))) {
    return 'Food / Provisions';
  } 
  
  const electricalsKeywords = ['clip', 'alligator', 'key set', 'allen', 'charger', 'b3', 'nodemcu', 'esp8266', 'board', 'receiver', 'transmitter', 'fsi6', 'fs-i6', 'voltage', 'checker', 'battery', 'lipo', 'motor', 'bldc', 'esc', 'propeller', 'wire', 'pcb', 'soldering', 'flux', 'sensor', 'module', 'cable', 'switch', 'led', 'resistor'];
  
  if (electricalsKeywords.some(kw => lower.includes(kw))) {
    return 'Electricals & Hardware';
  } 
  
  const chemicalsKeywords = ['sodium', 'carbonate', 'acid', 'oxide', 'charcoal', 'calcium', 'zinc', 'pigment', 'dropper', 'vials', 'iron filings', 'filings', 'citric', 'solution', 'reagent', 'sulfate', 'nitrate', 'ethanol', 'acetone'];
  
  if (chemicalsKeywords.some(kw => lower.includes(kw))) {
    return 'Chemicals & Lab Supplies';
  } 
  
  return 'Stationery';
}
