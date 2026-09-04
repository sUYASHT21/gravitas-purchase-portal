'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  lastUpdated: string;
}

export async function getItems(): Promise<InventoryItem[]> {
  const db = await getDb();
  return db.all('SELECT * FROM items ORDER BY name ASC');
}

export async function updateQuantity(id: number, change: number) {
  const db = await getDb();
  
  await db.run('BEGIN TRANSACTION');
  try {
    const item = await db.get('SELECT quantity FROM items WHERE id = ?', id);
    if (!item) throw new Error('Item not found');
    
    const newQuantity = Math.max(0, item.quantity + change);
    
    await db.run(
      'UPDATE items SET quantity = ?, lastUpdated = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, id]
    );
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
  
  revalidatePath('/');
}

export async function importExcelData(data: { name: string, category: string, quantity: number }[]) {
  const db = await getDb();
  
  await db.run('BEGIN TRANSACTION');
  try {
    for (const row of data) {
      if (!row.name || !row.category) continue;
      
      const qty = parseInt(row.quantity as any) || 0;
      
      await db.run(`
        INSERT INTO items (name, category, quantity) 
        VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET quantity = quantity + ?, lastUpdated = CURRENT_TIMESTAMP
      `, [row.name, row.category, qty, qty]);
    }
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
  
  revalidatePath('/');
}

export async function compileSheets(urls: string[]) {
  const categories = {
    Stationery: [] as any[],
    Culinary: [] as any[],
    Chemicals: [] as any[],
    Electricals: [] as any[],
    AmazonItems: [] as any[]
  };

  for (const url of urls) {
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) continue;
      
      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const res = await fetch(exportUrl);
      if (!res.ok) continue;
      
      const csvText = await res.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      for (const row of data) {
        const getVal = (search: string) => {
          const key = Object.keys(row).find(k => k.toLowerCase().includes(search));
          return key ? String(row[key]).trim() : '';
        };

        const name = getVal('name') || getVal('item');
        const quantity = getVal('quantity') || getVal('qty');
        const amazonLink = getVal('amazon') || getVal('link') || getVal('url');
        const category = getVal('category') || getVal('type');

        if (!name) continue;
        const item = { name, quantity, amazonLink };

        if (amazonLink && amazonLink.startsWith('http')) {
          categories.AmazonItems.push(item);
          continue;
        }

        const catLower = category.toLowerCase();
        if (catLower.includes('stationery') || catLower.includes('pen') || catLower.includes('paper')) categories.Stationery.push(item);
        else if (catLower.includes('culinary') || catLower.includes('food') || catLower.includes('beverage')) categories.Culinary.push(item);
        else if (catLower.includes('chemical') || catLower.includes('liquid')) categories.Chemicals.push(item);
        else if (catLower.includes('electrical') || catLower.includes('wire') || catLower.includes('cable')) categories.Electricals.push(item);
        else {
          // Default fallback to stationery if unknown, or maybe skip? The prompt asks for strict separation into these 4.
          // Let's assume they are categorized correctly by users, fallback to Stationery.
          categories.Stationery.push(item);
        }
      }
    } catch (e) {
      console.error('Error fetching sheet', url, e);
    }
  }

  const sortFn = (a: any, b: any) => a.name.localeCompare(b.name);
  categories.Stationery.sort(sortFn);
  categories.Culinary.sort(sortFn);
  categories.Chemicals.sort(sortFn);
  categories.Electricals.sort(sortFn);
  categories.AmazonItems.sort(sortFn);

  return categories;
}
