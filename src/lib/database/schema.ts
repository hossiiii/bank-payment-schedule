import Dexie, { Table } from 'dexie';
// Conditionally import dexie-encrypted (skip in test environment)
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  require('dexie-encrypted');
}
import { Bank, Card, Transaction, DatabaseOperationError } from '@/types/database';
import { SessionKeyManager } from './encryption';
import { DatabaseMigrationError, DatabaseInitializationError } from './errors';
import { VersionManager } from './versionManager';
import { initializeMigrationErrorHandling, handleMigrationError } from './migrationHandler';

// Database schema version (match current database version)
const CURRENT_VERSION = 11;

// Sample data for development and testing
const SAMPLE_BANKS: Bank[] = [
  {
    id: 'bank-001',
    name: 'SBIネット銀行',
    memo: 'メイン銀行',
    createdAt: Date.now()
  },
  {
    id: 'bank-002',
    name: 'りそな銀行',
    memo: '給与振込先',
    createdAt: Date.now()
  },
  {
    id: 'bank-003',
    name: 'イオン銀行',
    memo: 'イオンカード引落',
    createdAt: Date.now()
  },
  {
    id: 'bank-004',
    name: 'みずほ銀行',
    memo: '住宅ローン',
    createdAt: Date.now()
  }
];

const SAMPLE_CARDS: Card[] = [
  {
    id: 'card-001',
    name: 'イオンカード',
    bankId: 'bank-003',
    closingDay: '10',
    paymentDay: '2',
    paymentMonthShift: 1,
    adjustWeekend: true,
    memo: '食費・日用品用',
    createdAt: Date.now()
  },
  {
    id: 'card-002',
    name: '三菱UFJニコス',
    bankId: 'bank-001',
    closingDay: '月末',
    paymentDay: '10',
    paymentMonthShift: 2,
    adjustWeekend: true,
    memo: '光熱費・通信費',
    createdAt: Date.now()
  },
  {
    id: 'card-003',
    name: '楽天カード',
    bankId: 'bank-001',
    closingDay: '月末',
    paymentDay: '27',
    paymentMonthShift: 1,
    adjustWeekend: true,
    memo: 'ネットショッピング用',
    createdAt: Date.now()
  }
];

/**
 * Main database class using Dexie with encryption middleware
 */
export class PaymentDatabase extends Dexie {
  // Table definitions with proper typing
  banks!: Table<Bank, string>;
  cards!: Table<Card, string>;
  transactions!: Table<Transaction, string>;
  
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
      
      // Check if this is the first initialization
      const bankCount = await this.banks.count();
      if (bankCount === 0) {
        await this.seedSampleData();
      }
      
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
   * TODO: Re-implement with working encryption
   * Initializes the database with encryption using the provided password
   */
  async initializeWithPassword(_password: string): Promise<void> {
    // Temporarily delegate to basic initialization
    return this.initialize();
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
    this.banks.hook('updating', (modifications, _primKey, _obj, _trans) => {
      // Prevent updating createdAt
      if ('createdAt' in modifications) {
        delete (modifications as any).createdAt;
      }
    });
    
    this.cards.hook('updating', (modifications, _primKey, _obj, _trans) => {
      if ('createdAt' in modifications) {
        delete (modifications as any).createdAt;
      }
    });
    
    this.transactions.hook('updating', (modifications, _primKey, _obj, _trans) => {
      if ('createdAt' in modifications) {
        delete (modifications as any).createdAt;
      }
    });
  }
  
  /**
   * Seeds the database with sample data for development
   */
  async seedSampleData(): Promise<void> {
    try {
      await this.transaction('rw', [this.banks, this.cards], async () => {
        await this.banks.bulkAdd(SAMPLE_BANKS);
        await this.cards.bulkAdd(SAMPLE_CARDS);
      });
    } catch (error) {
      throw new DatabaseOperationError('Failed to seed sample data', error);
    }
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
 * Closes and resets the database instance
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
  
  // Clear session key (skip in test environment)
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
    const keyManager = SessionKeyManager.getInstance();
    keyManager.clear();
  }
}