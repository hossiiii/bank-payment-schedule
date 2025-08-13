import { getDatabase } from './schema';
import { SessionKeyManager, deriveKeyFromPassword } from './encryption';
import { Bank, Card, Transaction } from '@/types/database';

/**
 * Data migration utilities for transitioning from unencrypted to encrypted database
 */

export interface MigrationStatus {
  isInProgress: boolean;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  error?: string;
}

/**
 * Migrate existing unencrypted data to encrypted format
 */
export async function migrateToEncrypted(password: string): Promise<void> {
  const db = getDatabase();
  const sessionManager = new SessionKeyManager();
  
  try {
    // Step 1: Export all current data
    console.log('Step 1: Exporting current data...');
    const exportedData = await db.exportAllData();
    const { banks, cards, transactions } = exportedData;
    
    // Step 2: Close current database
    console.log('Step 2: Closing current database...');
    await db.close();
    
    // Step 3: Delete the existing database to start fresh
    console.log('Step 3: Preparing for encrypted database...');
    await deleteDatabase('PaymentScheduleDB');
    
    // Step 4: Setup encryption and reinitialize database
    console.log('Step 4: Setting up encryption...');
    const derivedKey = await deriveKeyFromPassword(password);
    await sessionManager.createSession(derivedKey);
    await sessionManager.storeKeyHash(derivedKey);
    
    // Step 5: Initialize encrypted database
    console.log('Step 5: Initializing encrypted database...');
    await db.initializeWithPassword(password);
    
    // Step 6: Import data into encrypted database
    console.log('Step 6: Importing data into encrypted database...');
    await db.importAllData({ banks, cards, transactions });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error(`Failed to migrate to encrypted database: ${error}`);
  }
}

/**
 * Check if database needs migration (has unencrypted data)
 */
export async function needsMigration(): Promise<boolean> {
  const db = getDatabase();
  const sessionManager = new SessionKeyManager();
  
  try {
    // Check if we have stored encryption key but database is not encrypted
    const hasStoredKey = await sessionManager.hasStoredKey();
    const hasData = await db.isInitialized();
    
    if (!hasData) {
      return false; // No data to migrate
    }
    
    // If we have data but no encryption key, migration might be needed
    // However, we should also check if the data is already encrypted
    // For now, we'll assume if there's no stored key and there's data, migration is needed
    return !hasStoredKey;
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return false;
  }
}

/**
 * Delete IndexedDB database
 */
async function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase(name);
    
    deleteReq.onsuccess = () => {
      console.log(`Database ${name} deleted successfully`);
      resolve();
    };
    
    deleteReq.onerror = () => {
      reject(new Error(`Failed to delete database ${name}`));
    };
    
    deleteReq.onblocked = () => {
      console.warn(`Delete blocked for database ${name}`);
      // Still resolve as the database will be deleted when connections close
      resolve();
    };
  });
}

/**
 * Create a backup of current data before migration
 */
export async function createBackup(): Promise<Blob> {
  const db = getDatabase();
  
  try {
    const data = await db.exportAllData();
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  } catch (error) {
    throw new Error(`Failed to create backup: ${error}`);
  }
}

/**
 * Restore data from backup
 */
export async function restoreFromBackup(backupData: string): Promise<void> {
  const db = getDatabase();
  
  try {
    const data = JSON.parse(backupData) as {
      banks: Bank[];
      cards: Card[];
      transactions: Transaction[];
    };
    
    await db.importAllData(data);
  } catch (error) {
    throw new Error(`Failed to restore from backup: ${error}`);
  }
}