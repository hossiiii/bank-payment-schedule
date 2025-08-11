/**
 * Database module exports
 * 
 * This module provides a complete database layer for the payment schedule application
 * including encryption, schema definition, and CRUD operations.
 */

// Core database functionality
export {
  PaymentDatabase,
  getDatabase,
  initializeDatabase,
  closeDatabase
} from './schema';

// Encryption utilities
export {
  type EncryptedData,
  type EncryptionKey,
  generateSalt,
  generateIV,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  encryptWithPassword,
  decryptWithPassword,
  validatePassword,
  wipeSensitiveData,
  generatePasswordTestPayload,
  SessionKeyManager
} from './encryption';

// Database operations
export {
  BankOperations,
  CardOperations,
  TransactionOperations,
  bankOperations,
  cardOperations,
  transactionOperations
} from './operations';

// Re-export types for convenience
export type {
  Bank,
  Card,
  Transaction,
  BankInput,
  CardInput,
  TransactionInput,
  TransactionFilters,
  BankTotal,
  MonthlySchedule,
  ScheduleItem,
  DatabaseError,
  ValidationError,
  EncryptionError,
  DatabaseOperationError
} from '@/types/database';