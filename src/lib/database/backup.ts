/**
 * Database backup and restore utilities
 */

import { getDatabase } from './schema';
import { Bank, Card, Transaction } from '@/types/database';
import { logDebug, logError } from '@/lib/utils/logger';

export interface DatabaseBackup {
  version: number;
  timestamp: number;
  data: {
    banks: Bank[];
    cards: Card[];
    transactions: Transaction[];
  };
}

/**
 * Export all database data to a backup object
 */
export async function exportDatabase(): Promise<DatabaseBackup> {
  const db = getDatabase();
  
  try {
    // Ensure database is open
    if (!db.isOpen()) {
      await db.open();
    }
    
    // Get all data from tables
    const [banks, cards, transactions] = await Promise.all([
      db.banks.toArray(),
      db.cards.toArray(),
      db.transactions.toArray()
    ]);
    
    return {
      version: db.verno,
      timestamp: Date.now(),
      data: {
        banks,
        cards,
        transactions
      }
    };
  } catch (error) {
    logError('Failed to export database:', error);
    throw new Error('データのエクスポートに失敗しました');
  }
}

/**
 * Import database data from a backup object
 */
export async function importDatabase(backup: DatabaseBackup): Promise<void> {
  const db = getDatabase();
  
  try {
    // Validate backup data
    if (!backup.data || !backup.data.banks || !backup.data.cards || !backup.data.transactions) {
      throw new Error('Invalid backup data format');
    }
    
    // Ensure database is open
    if (!db.isOpen()) {
      await db.open();
    }
    
    // Clear existing data and import new data in a transaction
    await db.transaction('rw', db.banks, db.cards, db.transactions, async () => {
      // Clear all tables
      await Promise.all([
        db.banks.clear(),
        db.cards.clear(),
        db.transactions.clear()
      ]);
      
      // Import new data
      await Promise.all([
        db.banks.bulkAdd(backup.data.banks),
        db.cards.bulkAdd(backup.data.cards),
        db.transactions.bulkAdd(backup.data.transactions)
      ]);
    });
    
    logDebug('Database imported successfully');
  } catch (error) {
    logError('Failed to import database:', error);
    throw new Error('データのインポートに失敗しました');
  }
}

/**
 * Create a downloadable backup file
 */
export function downloadBackup(backup: DatabaseBackup, filename?: string): void {
  const data = JSON.stringify(backup, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `payment-schedule-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Read backup file from user input
 */
export function readBackupFile(file: File): Promise<DatabaseBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content) as DatabaseBackup;
        
        // Validate backup structure
        if (!backup.version || !backup.timestamp || !backup.data) {
          throw new Error('Invalid backup file format');
        }
        
        resolve(backup);
      } catch (error) {
        reject(new Error('バックアップファイルの読み込みに失敗しました'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    reader.readAsText(file);
  });
}