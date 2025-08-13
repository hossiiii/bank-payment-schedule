import Dexie, { Table } from 'dexie';
import { Bank, Card, Transaction, DatabaseOperationError } from '@/types/database';
import { SessionKeyManager } from './encryption';
import { DatabaseMigrationError, DatabaseInitializationError } from './errors';
import { VersionManager } from './versionManager';
import { initializeMigrationErrorHandling, handleMigrationError } from './migrationHandler';
import { generateDexieEncryptionConfig } from './encryptionConfig';

// Database schema version (match current database version)
// Version 12: Added encryption support with dexie-encrypted middleware
const CURRENT_VERSION = 12;

// Sample data removed - no automatic seeding

/**
 * Main database class using Dexie with encryption middleware
 */
export class PaymentDatabase extends Dexie {
  // Table definitions with proper typing
  banks!: Table<Bank, string>;
  cards!: Table<Card, string>;
  transactions!: Table<Transaction, string>;
  
  private encryptionMiddlewareApplied: boolean = false;
  
  constructor() {
    super('PaymentScheduleDB');
    
    // Initialize error handling
    initializeMigrationErrorHandling(this);
    
    // Define database schema with migration
    this.version(CURRENT_VERSION).stores({
      // Banks table - indexed by id, name, and createdAt for queries
      banks: 'id, name, createdAt',
      
      // Cards table - indexed by id, name, bankId, and createdAt for queries
      cards: 'id, name, bankId, createdAt',
      
      // Transactions table - indexed by key fields for efficient queries  
      transactions: 'id, date, paymentType, cardId, bankId, scheduledPayDate, createdAt'
    }).upgrade(async tx => {
      try {
        // Record migration attempt
        const fromVersion = await VersionManager.getCurrentVersion();
        console.log(`Migrating database from v${fromVersion} to v${CURRENT_VERSION}`);
        
        // Migrate existing transactions to new schema
        await tx.table('transactions').toCollection().modify(transaction => {
        // Add default values for new fields if they don't exist
        if (!transaction.paymentType) {
          transaction.paymentType = 'card'; // Default to card for existing transactions
        }
        if (!transaction.bankId && transaction.paymentType === 'card') {
          // For card transactions, bankId can be derived from cardId later
          transaction.bankId = undefined;
        }
        if (transaction.isScheduleEditable === undefined) {
          transaction.isScheduleEditable = false; // Default to auto-calculated
        }
      });
        
        // Record successful migration
        VersionManager.recordMigration(fromVersion || 0, CURRENT_VERSION, true);
      } catch (error) {
        // Handle migration error
        const migrationError = new DatabaseMigrationError(
          `Failed to migrate database to v${CURRENT_VERSION}`,
          await VersionManager.getCurrentVersion() || 0,
          CURRENT_VERSION,
          error as Error
        );
        
        // Record failed migration
        VersionManager.recordMigration(
          await VersionManager.getCurrentVersion() || 0,
          CURRENT_VERSION,
          false,
          (error as Error).message
        );
        
        throw migrationError;
      }
    });
    
    // Set up hooks for validation and auto-generated fields
    this.setupHooks();
  }
  
  /**
   * Set up encryption middleware if session key is available
   * Must be called BEFORE database.open() and AFTER encryption key is available
   */
  async setupEncryption(sessionManager?: SessionKeyManager): Promise<void> {
    // Skip encryption in test environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      console.log('Skipping encryption setup in test environment');
      return;
    }
    
    // Skip if already applied
    if (this.encryptionMiddlewareApplied) {
      console.log('Encryption middleware already applied, skipping');
      return;
    }
    
    try {
      console.log('Starting encryption setup...');
      
      // Dynamically import dexie-encrypted to avoid issues in test environment
      const dexieEncrypted = await import('dexie-encrypted');
      const { applyEncryptionMiddleware, clearEncryptedTables } = dexieEncrypted;
      // Try different ways to access encrypt
      const encrypt = dexieEncrypted.encrypt || (dexieEncrypted as any).default?.encrypt || dexieEncrypted;
      console.log('Available exports:', Object.keys(dexieEncrypted));
      console.log('encrypt object:', encrypt);
      console.log('dexie-encrypted imported successfully');
      
      // Use provided session manager or create new one
      const manager = sessionManager || new SessionKeyManager();
      console.log('Session manager:', sessionManager ? 'provided' : 'created new');
      
      if (!manager.hasActiveSession()) {
        throw new Error('No active encryption session available');
      }
      console.log('Active session found');
      
      // Export raw key for dexie-encrypted
      const rawKey = await manager.exportRawSessionKey();
      console.log('Raw key exported, length:', rawKey.byteLength);
      
      // Generate encryption configuration dynamically
      const encryptionConfig = generateDexieEncryptionConfig(encrypt);
      console.log('Generated encryption config:', encryptionConfig);
      
      // Apply encryption middleware with configuration
      // The 4th parameter is onKeyChange callback - we'll use the clearEncryptedTables option
      applyEncryptionMiddleware(this, rawKey, encryptionConfig, clearEncryptedTables);
      
      this.encryptionMiddlewareApplied = true;
      console.log('Database encryption middleware applied successfully');
    } catch (error) {
      console.error('Detailed encryption setup error:', error);
      throw new DatabaseInitializationError(
        'Failed to setup database encryption',
        error as Error
      );
    }
  }
  
  /**
   * Initializes the database (encryption temporarily disabled)
   */
  async initialize(): Promise<void> {
    try {
      // Check if migration is needed
      const currentDbVersion = await VersionManager.getCurrentVersion();
      if (currentDbVersion !== null && currentDbVersion < CURRENT_VERSION) {
        console.log(`Database migration needed: v${currentDbVersion} -> v${CURRENT_VERSION}`);
        
        // Check if backup is recommended
        if (VersionManager.isBackupRecommended()) {
          console.warn('Backup recommended before migration');
        }
      }
      
      // Open the database (will trigger migration if needed)
      await this.open();
      
      // Record database info after successful opening
      await VersionManager.getDatabaseInfo();
      
      // Sample data seeding removed - database starts empty
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      
      // Check if it's a migration error
      if (error instanceof DatabaseMigrationError) {
        // Let the migration handler deal with it
        const recovered = await handleMigrationError(error, this);
        if (!recovered) {
          throw error;
        }
      } else {
        // Other initialization errors
        throw new DatabaseInitializationError(
          'Failed to initialize database',
          error as Error
        );
      }
    }
  }
  
  /**
   * Initializes the database with encryption using existing session
   */
  async initializeWithEncryption(sessionManager?: SessionKeyManager): Promise<void> {
    try {
      // Check if migration is needed
      const currentDbVersion = await VersionManager.getCurrentVersion();
      if (currentDbVersion !== null && currentDbVersion < CURRENT_VERSION) {
        console.log(`Database migration needed: v${currentDbVersion} -> v${CURRENT_VERSION}`);
        
        // Check if backup is recommended
        if (VersionManager.isBackupRecommended()) {
          console.warn('Backup recommended before migration');
        }
      }
      
      // Setup encryption middleware before opening database
      await this.setupEncryption(sessionManager);
      
      // Open the database (will trigger migration if needed)
      await this.open();
      
      // Record database info after successful opening
      await VersionManager.getDatabaseInfo();
      
      // Sample data seeding removed - database starts empty
      
    } catch (error) {
      console.error('Failed to initialize encrypted database:', error);
      
      // Check if it's a migration error
      if (error instanceof DatabaseMigrationError) {
        // Let the migration handler deal with it
        const recovered = await handleMigrationError(error, this);
        if (!recovered) {
          throw error;
        }
      } else {
        // Other initialization errors
        throw new DatabaseInitializationError(
          'Failed to initialize encrypted database',
          error as Error
        );
      }
    }
  }
  
  /**
   * Initializes the database with encryption using the provided password
   */
  async initializeWithPassword(password: string): Promise<void> {
    try {
      // Import required functions
      const { deriveKeyFromPassword } = await import('./encryption');
      
      // Check if migration is needed
      const currentDbVersion = await VersionManager.getCurrentVersion();
      if (currentDbVersion !== null && currentDbVersion < CURRENT_VERSION) {
        console.log(`Database migration needed: v${currentDbVersion} -> v${CURRENT_VERSION}`);
        
        // Check if backup is recommended
        if (VersionManager.isBackupRecommended()) {
          console.warn('Backup recommended before migration');
        }
      }
      
      // Derive key using existing SessionKeyManager
      const sessionManager = new SessionKeyManager();
      const derivedKey = await deriveKeyFromPassword(password);
      
      // Create session and apply encryption
      await sessionManager.createSession(derivedKey);
      
      // Setup encryption middleware before opening database
      await this.setupEncryption(sessionManager);
      
      // Open the database (will trigger migration if needed)
      await this.open();
      
      // Record database info after successful opening
      await VersionManager.getDatabaseInfo();
      
      // Sample data seeding removed - database starts empty
      
    } catch (error) {
      console.error('Failed to initialize encrypted database:', error);
      
      // Check if it's a migration error
      if (error instanceof DatabaseMigrationError) {
        // Let the migration handler deal with it
        const recovered = await handleMigrationError(error, this);
        if (!recovered) {
          throw error;
        }
      } else {
        // Other initialization errors
        throw new DatabaseInitializationError(
          'Failed to initialize encrypted database',
          error as Error
        );
      }
    }
  }
  
  /**
   * Sets up database hooks for validation and auto-generated fields
   */
  private setupHooks(): void {
    // Hook for banks table
    this.banks.hook('creating', (_primKey, obj, _trans) => {
      if (!obj.id) {
        obj.id = this.generateUUID();
      }
      if (!obj.createdAt) {
        obj.createdAt = Date.now();
      }
    });
    
    // Hook for cards table
    this.cards.hook('creating', (_primKey, obj, _trans) => {
      if (!obj.id) {
        obj.id = this.generateUUID();
      }
      if (!obj.createdAt) {
        obj.createdAt = Date.now();
      }
    });
    
    // Hook for transactions table
    this.transactions.hook('creating', (_primKey, obj, _trans) => {
      if (!obj.id) {
        obj.id = this.generateUUID();
      }
      if (!obj.createdAt) {
        obj.createdAt = Date.now();
      }
    });
    
    // Validation hooks
    this.banks.hook('updating', (modifications: any, _primKey, _obj, _trans) => {
      // Prevent updating createdAt
      if (modifications.createdAt !== undefined) {
        delete modifications.createdAt;
      }
    });
    
    this.cards.hook('updating', (modifications: any, _primKey, _obj, _trans) => {
      if (modifications.createdAt !== undefined) {
        delete modifications.createdAt;
      }
    });
    
    this.transactions.hook('updating', (modifications: any, _primKey, _obj, _trans) => {
      if (modifications.createdAt !== undefined) {
        delete modifications.createdAt;
      }
    });
  }
  
  /**
   * Sample data seeding removed
   */
  async seedSampleData(): Promise<void> {
    // No sample data - database starts empty
    console.log('Sample data seeding disabled - database starts empty');
  }
  
  /**
   * Clears all data from the database
   */
  async clearAllData(): Promise<void> {
    try {
      await this.transaction('rw', [this.banks, this.cards, this.transactions], async () => {
        await this.transactions.clear();
        await this.cards.clear();
        await this.banks.clear();
      });
    } catch (error) {
      throw new DatabaseOperationError('Failed to clear all data', error);
    }
  }
  
  /**
   * Performs database backup (exports all data)
   */
  async exportAllData(): Promise<{
    banks: Bank[];
    cards: Card[];
    transactions: Transaction[];
    exportedAt: number;
  }> {
    try {
      const [banks, cards, transactions] = await Promise.all([
        this.banks.toArray(),
        this.cards.toArray(),
        this.transactions.toArray()
      ]);
      
      return {
        banks,
        cards,
        transactions,
        exportedAt: Date.now()
      };
    } catch (error) {
      throw new DatabaseOperationError('Failed to export data', error);
    }
  }
  
  /**
   * Imports data from backup (replaces all existing data)
   */
  async importAllData(data: {
    banks: Bank[];
    cards: Card[];
    transactions: Transaction[];
  }): Promise<void> {
    try {
      await this.transaction('rw', [this.banks, this.cards, this.transactions], async () => {
        // Clear existing data
        await this.transactions.clear();
        await this.cards.clear();
        await this.banks.clear();
        
        // Import new data
        await this.banks.bulkAdd(data.banks);
        await this.cards.bulkAdd(data.cards);
        await this.transactions.bulkAdd(data.transactions);
      });
    } catch (error) {
      throw new DatabaseOperationError('Failed to import data', error);
    }
  }
  
  /**
   * Checks if the database is properly initialized and accessible
   */
  async isInitialized(): Promise<boolean> {
    try {
      await this.banks.count();
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Gets database statistics
   */
  async getStatistics(): Promise<{
    banks: number;
    cards: number;
    transactions: number;
    totalSize: number;
  }> {
    try {
      const [bankCount, cardCount, transactionCount] = await Promise.all([
        this.banks.count(),
        this.cards.count(),
        this.transactions.count()
      ]);
      
      // Estimate total size (rough calculation)
      const totalSize = (bankCount + cardCount + transactionCount) * 1000; // Rough estimate
      
      return {
        banks: bankCount,
        cards: cardCount,
        transactions: transactionCount,
        totalSize
      };
    } catch (error) {
      throw new DatabaseOperationError('Failed to get statistics', error);
    }
  }
  
  /**
   * Generates a UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Singleton instance
let dbInstance: PaymentDatabase | null = null;

/**
 * Gets the singleton database instance
 */
export function getDatabase(): PaymentDatabase {
  if (!dbInstance) {
    dbInstance = new PaymentDatabase();
  }
  return dbInstance;
}

/**
 * Initializes the database with password
 */
export async function initializeDatabase(password: string): Promise<PaymentDatabase> {
  const db = getDatabase();
  await db.initializeWithPassword(password);
  return db;
}

/**
 * Initializes the database with existing encryption session
 */
export async function initializeDatabaseWithEncryption(sessionManager?: SessionKeyManager): Promise<PaymentDatabase> {
  const db = getDatabase();
  await db.initializeWithEncryption(sessionManager);
  return db;
}

/**
 * Closes and resets the database instance
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
  
  // Clear session key (skip in test environment)
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    const keyManager = new SessionKeyManager();
    keyManager.clearSession();
  }
}