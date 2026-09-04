'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
  
  // Use a transaction for atomic update to prevent glitches
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
      
      // Upsert: Insert new or update quantity if it exists
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
