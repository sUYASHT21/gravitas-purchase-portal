export function autoCategorize(itemName: string): string {
  if (!itemName) return 'General';
  
  const lower = itemName.toLowerCase();
  
  if (
    lower.includes('wire') || 
    lower.includes('cable') || 
    lower.includes('plug') || 
    lower.includes('led') || 
    lower.includes('battery') || 
    lower.includes('bulb') ||
    lower.includes('switch') ||
    lower.includes('socket')
  ) {
    return 'Electricals';
  } 
  
  if (
    lower.includes('apple') || 
    lower.includes('water') || 
    lower.includes('biscuit') || 
    lower.includes('juice') || 
    lower.includes('coffee') || 
    lower.includes('tea') || 
    lower.includes('food') ||
    lower.includes('plate') ||
    lower.includes('cup') ||
    lower.includes('snack')
  ) {
    return 'Culinary';
  } 
  
  if (
    lower.includes('chemical') || 
    lower.includes('liquid') || 
    lower.includes('acid') || 
    lower.includes('solution') || 
    lower.includes('powder')
  ) {
    return 'Chemicals';
  } 
  
  if (
    lower.includes('tape') || 
    lower.includes('pen') || 
    lower.includes('paper') || 
    lower.includes('staple') || 
    lower.includes('marker') || 
    lower.includes('glue') || 
    lower.includes('scissor') || 
    lower.includes('chart') || 
    lower.includes('pencil') ||
    lower.includes('folder') ||
    lower.includes('file') ||
    lower.includes('tag') ||
    lower.includes('tag')
  ) {
    return 'Stationery';
  }
  
  return 'General';
}
