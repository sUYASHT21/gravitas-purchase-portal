'use server';

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import https from 'node:https';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

function fetchCsvIPv4(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      
      const req = https.get(targetUrl, { family: 4 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      });
      
      req.on('error', (err) => reject(err));
      req.end();
    };
    
    request(url);
  });
}

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

export async function addSingleItem(name: string, category: string, quantity: number) {
  const db = await getDb();
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      INSERT INTO items (name, category, quantity) 
      VALUES (?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET quantity = quantity + ?, lastUpdated = CURRENT_TIMESTAMP
    `, [name, category, quantity, quantity]);
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

export type CompilePayload = {
  type: 'url' | 'raw' | 'base64';
  content: string;
  sourceName: string;
};

export async function compileData(payloads: CompilePayload[]) {
  const categories = {
    Stationery: [] as any[],
    Culinary: [] as any[],
    Chemicals: [] as any[],
    Electricals: [] as any[],
    AmazonItems: [] as any[]
  };
  const errors: string[] = [];

  for (const payload of payloads) {
    try {
      let fileData: any[] = [];
      let workbook: XLSX.WorkBook;

      if (payload.type === 'url') {
        const url = payload.content;
        
        // Strict SHEET_ID extraction exactly as requested, ignoring queries and /edit
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
          errors.push(`Invalid Google Sheet URL format: ${url}`);
          continue;
        }
        
        const sheetId = match[1];
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        try {
          console.log(">>> EXACT URL BEING FETCHED VIA NATIVE IPV4 HTTPS:", exportUrl);
          
          const csvText = await fetchCsvIPv4(exportUrl);
          
          if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || csvText.trim().toLowerCase().startsWith('<html')) {
            errors.push(`Sheet is private. Please change access to 'Anyone with the link can view'. (${exportUrl})`);
            continue;
          }
  
          workbook = XLSX.read(csvText, { type: 'string' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          fileData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        } catch (fetchErr: any) {
          console.error('Fetch Error:', fetchErr);
          // Special fallback flag string to trigger client-side fetch in the frontend if needed
          errors.push(`CLIENT_FALLBACK_REQUIRED|${exportUrl}|${fetchErr.message || fetchErr}`);
          continue;
        }
      } else {
        const workbook = XLSX.read(payload.content, { type: payload.type === 'base64' ? 'base64' : 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        fileData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }

      if (fileData.length === 0) {
        errors.push(`Source is empty: ${payload.sourceName}`);
        continue;
      }

      // Flexible header validation
      const firstRow = fileData[0];
      const headers = Object.keys(firstRow).map(k => k.toLowerCase());
      const hasItems = headers.some(h => h.includes('item') || h.includes('name'));
      const hasQty = headers.some(h => h.includes('qty') || h.includes('quantity') || h.includes('count'));
      
      if (!hasItems || !hasQty) {
        errors.push(`Missing required headers (Item | Quantity) in source: ${payload.sourceName}`);
        continue;
      }

      for (const row of fileData) {
        const getVal = (searchItems: string[]) => {
          for (const s of searchItems) {
            const key = Object.keys(row).find(k => k.toLowerCase().includes(s));
            if (key) return String(row[key]).trim();
          }
          return '';
        };

        const name = getVal(['item', 'name', 'description']);
        const quantity = getVal(['qty', 'quantity', 'count', 'amount']);
        const amazonLink = getVal(['amazon', 'link', 'url']);
        const category = getVal(['category', 'type', 'dept']) || '';

        if (!name) continue;

        // Deduplication & Quantity Summing
        const parsedQty = parseInt(String(quantity).replace(/[^0-9]/g, ''), 10) || 1;
        const targetCategory = amazonLink && amazonLink.startsWith('http') ? categories.AmazonItems :
          category.toLowerCase().includes('culinary') || category.toLowerCase().includes('food') || category.toLowerCase().includes('beverage') ? categories.Culinary :
          category.toLowerCase().includes('chemical') || category.toLowerCase().includes('liquid') ? categories.Chemicals :
          category.toLowerCase().includes('electrical') || category.toLowerCase().includes('wire') || category.toLowerCase().includes('cable') ? categories.Electricals :
          categories.Stationery; // Fallback

        const normalizedName = name.trim().toLowerCase();
        const existingItem = targetCategory.find(i => i.name.trim().toLowerCase() === normalizedName);
        
        if (existingItem) {
          const currentQty = parseInt(String(existingItem.quantity).replace(/[^0-9]/g, ''), 10) || 1;
          existingItem.quantity = currentQty + parsedQty;
          if (amazonLink && amazonLink.startsWith('http') && !existingItem.amazonLink) {
            existingItem.amazonLink = amazonLink;
          }
        } else {
          targetCategory.push({ name, quantity: parsedQty, amazonLink });
        }
      }
    } catch (e: any) {
      console.error('Error processing source', payload.sourceName, e);
      errors.push(`Unexpected error processing ${payload.sourceName} (${e.message})`);
    }
  }

  const sortFn = (a: any, b: any) => a.name.localeCompare(b.name);
  categories.Stationery.sort(sortFn);
  categories.Culinary.sort(sortFn);
  categories.Chemicals.sort(sortFn);
  categories.Electricals.sort(sortFn);
  categories.AmazonItems.sort(sortFn);

  return { categories, errors };
}
