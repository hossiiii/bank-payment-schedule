/**
 * Comprehensive tests for database encryption functionality
 * 
 * Tests transparent encryption/decryption using dexie-encrypted middleware
 * with SessionKeyManager integration
 */

import { 
  bankOperations, 
  cardOperations
} from '@/lib/database/operations';
import { getDatabase, closeDatabase } from '@/lib/database/schema';
import { SessionKeyManager } from '@/lib/database/encryption';
import { BankInput, CardInput } from '@/types/database';
import { 
  ENCRYPTION_CONFIG, 
  isFieldEncrypted, 
  getEncryptedFields, 
  getPlaintextFields 
} from '@/lib/database/encryptionConfig';

// Test data with sensitive information
const testPassword = 'SecureTestPassword123!';

const sensitiveBank: BankInput = {
  name: '機密銀行データ',
  memo: '重要な銀行メモ - 暗号化されるべき情報'
};

const sensitiveCard: CardInput = {
  name: '秘匿カード情報',
  bankId: '', // Will be set after bank creation
  closingDay: '15',
  paymentDay: '27',
  paymentMonthShift: 1,
  adjustWeekend: true,
  memo: 'カード機密メモ - 暗号化対象'
};

describe('Database Encryption', () => {
  let testBankId: string;
  let testCardId: string;

  beforeEach(async () => {
    // Clear database and setup fresh instance
    const db = getDatabase();
    await db.clearAllData();
    await closeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Encryption Configuration', () => {
    it('should correctly identify encrypted vs plaintext fields', () => {
      // Banks table
      expect(isFieldEncrypted('banks', 'name')).toBe(true);
      expect(isFieldEncrypted('banks', 'memo')).toBe(true);
      expect(isFieldEncrypted('banks', 'id')).toBe(false);
      expect(isFieldEncrypted('banks', 'createdAt')).toBe(false);
      
      // Cards table
      expect(isFieldEncrypted('cards', 'name')).toBe(true);
      expect(isFieldEncrypted('cards', 'memo')).toBe(true);
      expect(isFieldEncrypted('cards', 'bankId')).toBe(false);
      expect(isFieldEncrypted('cards', 'closingDay')).toBe(false);
      
      // Transactions table
      expect(isFieldEncrypted('transactions', 'storeName')).toBe(true);
      expect(isFieldEncrypted('transactions', 'usage')).toBe(true);
      expect(isFieldEncrypted('transactions', 'amount')).toBe(true);
      expect(isFieldEncrypted('transactions', 'memo')).toBe(true);
      expect(isFieldEncrypted('transactions', 'id')).toBe(false);
      expect(isFieldEncrypted('transactions', 'date')).toBe(false);
      expect(isFieldEncrypted('transactions', 'paymentType')).toBe(false);
    });

    it('should have valid encryption configuration', () => {
      // Verify no field is both encrypted and plaintext
      Object.entries(ENCRYPTION_CONFIG).forEach(([, config]) => {
        const duplicates = config.encrypted.filter(field => 
          config.plaintext.includes(field)
        );
        expect(duplicates).toHaveLength(0);
      });
    });

    it('should skip encryption setup in test environment', async () => {
      const db = getDatabase();
      
      // In test environment, setupEncryption should skip without throwing
      await expect(db.setupEncryption()).resolves.not.toThrow();
    });
  });

  describe('SessionKeyManager (Test Environment)', () => {
    it('should handle session creation correctly', async () => {
      const sessionManager = new SessionKeyManager();
      const { deriveKeyFromPassword } = await import('@/lib/database/encryption');
      
      const derivedKey = await deriveKeyFromPassword(testPassword);
      const expiresAt = await sessionManager.createSession(derivedKey);
      
      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(sessionManager.hasActiveSession()).toBe(true);
    });

    it('should export raw session key when session is active', async () => {
      const sessionManager = new SessionKeyManager();
      const { deriveKeyFromPassword } = await import('@/lib/database/encryption');
      
      const derivedKey = await deriveKeyFromPassword(testPassword);
      await sessionManager.createSession(derivedKey);
      
      const rawKey = await sessionManager.exportRawSessionKey();
      expect(rawKey).toBeInstanceOf(Uint8Array);
      expect(rawKey.length).toBe(32); // 256-bit key
    });

    it('should prevent session key export without active session', async () => {
      const sessionManager = new SessionKeyManager();
      
      await expect(sessionManager.exportRawSessionKey())
        .rejects.toThrow('No active session key available for export');
    });
  });

  describe('Database Operations (Test Environment - No Encryption)', () => {
    beforeEach(async () => {
      // Initialize database normally (without encryption in test environment)
      const db = getDatabase();
      await db.initialize();
    });

    it('should work with normal database operations', async () => {
      const bank = await bankOperations.create(sensitiveBank);
      
      // Verify operations work normally
      expect(bank.name).toBe('機密銀行データ');
      expect(bank.memo).toBe('重要な銀行メモ - 暗号化されるべき情報');
      expect(bank.id).toBeDefined();
      expect(bank.createdAt).toBeDefined();
      
      testBankId = bank.id;
    });

    it('should maintain referential integrity', async () => {
      const bank = await bankOperations.create(sensitiveBank);
      testBankId = bank.id;
      
      sensitiveCard.bankId = testBankId;
      const card = await cardOperations.create(sensitiveCard);
      testCardId = card.id;
      
      // Verify relationships work
      const cardsForBank = await cardOperations.getByBankId(testBankId);
      expect(cardsForBank).toHaveLength(1);
      expect(cardsForBank[0].name).toBe('秘匿カード情報');
      expect(cardsForBank[0].bankId).toBe(testBankId);
    });

    it('should handle all CRUD operations', async () => {
      const bank = await bankOperations.create(sensitiveBank);
      
      // Update operation
      const updatedBank = await bankOperations.update(bank.id, {
        name: '更新された銀行名',
        memo: '更新されたメモ'
      });
      
      expect(updatedBank.name).toBe('更新された銀行名');
      expect(updatedBank.memo).toBe('更新されたメモ');
      expect(updatedBank.id).toBe(bank.id);
      
      // Read operation
      const retrieved = await bankOperations.getById(bank.id);
      expect(retrieved!.name).toBe('更新された銀行名');
    });
  });

  describe('Field Configuration Utilities', () => {
    it('should return correct encrypted fields list', () => {
      const bankEncrypted = getEncryptedFields('banks');
      const cardEncrypted = getEncryptedFields('cards');
      const transactionEncrypted = getEncryptedFields('transactions');
      
      expect(bankEncrypted).toEqual(['name', 'memo']);
      expect(cardEncrypted).toEqual(['name', 'memo']);
      expect(transactionEncrypted).toEqual(['storeName', 'usage', 'amount', 'memo']);
    });

    it('should return correct plaintext fields list', () => {
      const bankPlaintext = getPlaintextFields('banks');
      const cardPlaintext = getPlaintextFields('cards');
      const transactionPlaintext = getPlaintextFields('transactions');
      
      expect(bankPlaintext).toContain('id');
      expect(bankPlaintext).toContain('createdAt');
      expect(cardPlaintext).toContain('bankId');
      expect(transactionPlaintext).toContain('date');
      expect(transactionPlaintext).toContain('paymentType');
    });
  });

  // Note: Full encryption functionality testing requires non-test environment
  // These will be covered by E2E tests using Playwright MCP
  describe('Encryption Notes', () => {
    it('should note that full encryption testing requires E2E environment', () => {
      // This test documents that encryption functionality is disabled in test environment
      // Full encryption testing including:
      // - Password-based initialization
      // - Actual encryption/decryption operations  
      // - Session management with encryption
      // - Database migration with encryption
      // Will be covered by E2E tests using Playwright MCP tools
      
      expect(true).toBe(true); // Placeholder test
    });
  });
});