import { getDatabase } from './schema';
import { SessionKeyManager, deriveKeyFromPassword } from './encryption';
import { Bank, Card, Transaction } from '@/types/database';
import { logError, logInfo } from '@/lib/utils/logger';

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
    logInfo('Step 1: Exporting current data...', undefined, 'MigrationUtils');
    const exportedData = await db.exportAllData();
    const { banks, cards, transactions } = exportedData;
    
    // Step 2: Close current database
    logInfo('Step 2: Closing current database...', undefined, 'MigrationUtils');
    await db.close();
    
    // Step 3: Delete the existing database to start fresh
    logInfo('Step 3: Preparing for encrypted database...', undefined, 'MigrationUtils');
    await deleteDatabase('PaymentScheduleDB');
    
    // Step 4: Setup encryption and reinitialize database
    logInfo('Step 4: Setting up encryption...', undefined, 'MigrationUtils');
    const derivedKey = await deriveKeyFromPassword(password);
    await sessionManager.createSession(derivedKey);
    await sessionManager.storeKeyHash(derivedKey);
    
    // Step 5: Initialize encrypted database
    logInfo('Step 5: Initializing encrypted database...', undefined, 'MigrationUtils');
    await db.initializeWithPassword(password);
    
    // Step 6: Import data into encrypted database
    logInfo('Step 6: Importing data into encrypted database...', undefined, 'MigrationUtils');
    await db.importAllData({ banks, cards, transactions });
    
    logInfo('Migration completed successfully!', undefined, 'MigrationUtils');
  } catch (error) {
    logError('Migration failed', error, 'MigrationUtils');
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
    logError('Failed to check migration status', error, 'MigrationUtils');
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
      logInfo(`Database ${name} deleted successfully`, undefined, 'MigrationUtils');
      resolve();
    };
    
    deleteReq.onerror = () => {
      reject(new Error(`Failed to delete database ${name}`));
    };
    
    deleteReq.onblocked = () => {
      logError(`Delete blocked for database ${name}`, undefined, 'MigrationUtils');
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