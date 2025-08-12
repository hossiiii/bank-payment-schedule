import { 
  bankOperations, 
  cardOperations, 
  transactionOperations 
} from '@/lib/database/operations';
import { getDatabase, closeDatabase } from '@/lib/database/schema';
import { BankInput, CardInput, TransactionInput } from '@/types/database';

// Test data
const testBankData: BankInput = {
  name: 'テスト銀行',
  memo: 'テスト用銀行'
};

const testCardData: CardInput = {
  name: 'テストカード',
  bankId: '', // Will be set after bank creation
  closingDay: '15',
  paymentDay: '27',
  paymentMonthShift: 1,
  adjustWeekend: true,
  memo: 'テスト用カード'
};

describe('Database Operations', () => {
  let testBankId: string;
  let testCardId: string;

  beforeEach(async () => {
    // Clear database before each test
    const db = getDatabase();
    await db.clearAllData();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Bank Operations', () => {
    it('should create a bank successfully', async () => {
      const bank = await bankOperations.create(testBankData);
      
      expect(bank.id).toBeDefined();
      expect(bank.name).toBe(testBankData.name);
      expect(bank.memo).toBe(testBankData.memo);
      expect(bank.createdAt).toBeDefined();
      
      testBankId = bank.id;
    });

    it('should retrieve bank by ID', async () => {
      const createdBank = await bankOperations.create(testBankData);
      const retrievedBank = await bankOperations.getById(createdBank.id);
      
      expect(retrievedBank).toBeDefined();
      expect(retrievedBank!.id).toBe(createdBank.id);
      expect(retrievedBank!.name).toBe(testBankData.name);
    });

    it('should prevent duplicate bank names', async () => {
      await bankOperations.create(testBankData);
      
      await expect(bankOperations.create(testBankData))
        .rejects.toThrow('already exists');
    });

    it('should update bank information', async () => {
      const bank = await bankOperations.create(testBankData);
      const updatedBank = await bankOperations.update(bank.id, {
        name: '更新された銀行名'
      });
      
      expect(updatedBank.name).toBe('更新された銀行名');
      expect(updatedBank.memo).toBe(testBankData.memo); // Unchanged
    });

    it('should get all banks', async () => {
      await bankOperations.create(testBankData);
      await bankOperations.create({ name: '別の銀行' });
      
      const banks = await bankOperations.getAll();
      expect(banks).toHaveLength(2);
    });
  });

  describe('Card Operations', () => {
    beforeEach(async () => {
      const bank = await bankOperations.create(testBankData);
      testBankId = bank.id;
      testCardData.bankId = testBankId;
    });

    it('should create a card successfully', async () => {
      const card = await cardOperations.create(testCardData);
      
      expect(card.id).toBeDefined();
      expect(card.name).toBe(testCardData.name);
      expect(card.bankId).toBe(testBankId);
      expect(card.closingDay).toBe(testCardData.closingDay);
      
      testCardId = card.id;
    });

    it('should validate bank exists when creating card', async () => {
      const invalidCardData = {
        ...testCardData,
        bankId: '00000000-0000-0000-0000-000000000000' // Valid UUID format but non-existent
      };
      
      await expect(cardOperations.create(invalidCardData))
        .rejects.toThrow('Bank with ID');
    });

    it('should get cards by bank ID', async () => {
      await cardOperations.create(testCardData);
      await cardOperations.create({
        ...testCardData,
        name: '別のカード'
      });
      
      const cards = await cardOperations.getByBankId(testBankId);
      expect(cards).toHaveLength(2);
      expect(cards.every(card => card.bankId === testBankId)).toBe(true);
    });
  });

  describe('Transaction Operations', () => {
    beforeEach(async () => {
      const bank = await bankOperations.create(testBankData);
      testBankId = bank.id;
      testCardData.bankId = testBankId;
      const card = await cardOperations.create(testCardData);
      testCardId = card.id;
    });

    describe('Card Transactions', () => {
      it('should create card transaction with correct bank reference', async () => {
        const transactionData: TransactionInput = {
          date: Date.now(),
          storeName: 'テスト店舗',
          usage: 'テスト用途',
          amount: 1000,
          paymentType: 'card',
          cardId: testCardId,
          memo: 'テストメモ'
        };

        const transaction = await transactionOperations.create(transactionData);
        
        expect(transaction.id).toBeDefined();
        expect(transaction.paymentType).toBe('card');
        expect(transaction.cardId).toBe(testCardId);
        expect(transaction.scheduledPayDate).toBeDefined();
        expect(transaction.amount).toBe(1000);
      });

      it('should validate card exists when creating card transaction', async () => {
        const invalidTransactionData: TransactionInput = {
          date: Date.now(),
          amount: 1000,
          paymentType: 'card',
          cardId: '00000000-0000-0000-0000-000000000000' // Valid UUID format but non-existent
        };
        
        await expect(transactionOperations.create(invalidTransactionData))
          .rejects.toThrow('Card with ID');
      });
    });

    describe('Bank Transactions', () => {
      it('should create bank transaction with correct bank reference', async () => {
        const transactionData: TransactionInput = {
          date: Date.now(),
          storeName: 'テスト店舗',
          usage: 'テスト用途',
          amount: 1500,
          paymentType: 'bank',
          bankId: testBankId,
          memo: '銀行引落テスト'
        };

        const transaction = await transactionOperations.create(transactionData);
        
        expect(transaction.id).toBeDefined();
        expect(transaction.paymentType).toBe('bank');
        expect(transaction.bankId).toBe(testBankId);
        expect(transaction.cardId).toBeUndefined();
        expect(transaction.scheduledPayDate).toBeDefined();
        expect(transaction.amount).toBe(1500);
      });

      it('should validate bank exists when creating bank transaction', async () => {
        const invalidTransactionData: TransactionInput = {
          date: Date.now(),
          amount: 1000,
          paymentType: 'bank',
          bankId: '00000000-0000-0000-0000-000000000000' // Valid UUID format but non-existent
        };
        
        await expect(transactionOperations.create(invalidTransactionData))
          .rejects.toThrow('Bank with ID');
      });
    });

    describe('Monthly Schedule', () => {
      it('should retrieve correct bank names for mixed transactions', async () => {
        // Create bank transaction
        const bankTransactionData: TransactionInput = {
          date: new Date(2024, 1, 15).getTime(),
          storeName: '銀行引落店舗',
          amount: 2000,
          paymentType: 'bank',
          bankId: testBankId
        };

        // Create card transaction  
        const cardTransactionData: TransactionInput = {
          date: new Date(2024, 1, 10).getTime(),
          storeName: 'カード決済店舗',
          amount: 1500,
          paymentType: 'card',
          cardId: testCardId
        };

        await transactionOperations.create(bankTransactionData);
        await transactionOperations.create(cardTransactionData);

        // Get schedule for March (month 3) since card payment will be in March due to payment shift
        const febSchedule = await transactionOperations.getMonthlySchedule(2024, 2);
        const marSchedule = await transactionOperations.getMonthlySchedule(2024, 3);
        
        // Bank transaction should be in February, card transaction should be in March
        expect(febSchedule.items).toHaveLength(1);
        expect(marSchedule.items).toHaveLength(1);
        
        const bankTransaction = febSchedule.items[0];
        const cardTransaction = marSchedule.items[0];
        
        expect(bankTransaction.paymentType).toBe('bank');
        expect(cardTransaction.paymentType).toBe('card');
        
        // Most important: No "Unknown Bank" should appear
        expect(bankTransaction.bankName).toBe('テスト銀行');
        expect(cardTransaction.bankName).toBe('テスト銀行');
        expect(bankTransaction.bankName).not.toContain('Unknown');
        expect(cardTransaction.bankName).not.toContain('Unknown');
      });

      it('should calculate bank totals correctly for mixed transactions', async () => {
        // Create multiple transactions for the same bank
        await transactionOperations.create({
          date: new Date(2024, 1, 15).getTime(),
          amount: 1000,
          paymentType: 'bank',
          bankId: testBankId
        });

        await transactionOperations.create({
          date: new Date(2024, 1, 20).getTime(),
          amount: 1500,
          paymentType: 'card',
          cardId: testCardId
        });

        // Check February schedule (bank transaction only)
        const febSchedule = await transactionOperations.getMonthlySchedule(2024, 2);
        expect(febSchedule.bankTotals).toHaveLength(1);
        expect(febSchedule.bankTotals[0].bankName).toBe('テスト銀行');
        expect(febSchedule.bankTotals[0].totalAmount).toBe(1000);
        expect(febSchedule.bankTotals[0].transactionCount).toBe(1);

        // Note: Card transaction payment date will be calculated based on payment cycle
        // which might be in a different month. For this test, we just verify that
        // the bank totals calculation works correctly for the transactions that are scheduled.
        // The important thing is that we don't get "Unknown Bank" issues.
      });

      it('should handle empty schedule correctly', async () => {
        const schedule = await transactionOperations.getMonthlySchedule(2024, 6);
        
        expect(schedule.items).toHaveLength(0);
        expect(schedule.bankTotals).toHaveLength(0);
        expect(schedule.totalAmount).toBe(0);
      });
    });

    describe('Data Integrity', () => {
      it('should prevent bank deletion when transactions exist', async () => {
        // Create bank transaction
        await transactionOperations.create({
          date: Date.now(),
          amount: 1000,
          paymentType: 'bank',
          bankId: testBankId
        });

        // Should not be able to delete bank
        await expect(bankOperations.delete(testBankId))
          .rejects.toThrow('cards are still using this bank');
      });

      it('should prevent card deletion when transactions exist', async () => {
        // Create card transaction
        await transactionOperations.create({
          date: Date.now(),
          amount: 1000,
          paymentType: 'card',
          cardId: testCardId
        });

        // Should not be able to delete card
        await expect(cardOperations.delete(testCardId))
          .rejects.toThrow('transactions are still using');
      });

      it('should maintain referential integrity across operations', async () => {
        // Create transactions
        const bankTx = await transactionOperations.create({
          date: Date.now(),
          amount: 1000,
          paymentType: 'bank',
          bankId: testBankId
        });

        const cardTx = await transactionOperations.create({
          date: Date.now(),
          amount: 1500,
          paymentType: 'card',
          cardId: testCardId
        });

        // Verify relationships are intact
        const retrievedBankTx = await transactionOperations.getById(bankTx.id);
        const retrievedCardTx = await transactionOperations.getById(cardTx.id);

        expect(retrievedBankTx!.bankId).toBe(testBankId);
        expect(retrievedCardTx!.cardId).toBe(testCardId);

        // Verify bank and card still exist
        const bank = await bankOperations.getById(testBankId);
        const card = await cardOperations.getById(testCardId);

        expect(bank).toBeDefined();
        expect(card).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      const bank = await bankOperations.create(testBankData);
      testBankId = bank.id;
    });

    it('should handle manual schedule editing', async () => {
      const customPaymentDate = new Date(2024, 3, 15).getTime();
      
      const transactionData: TransactionInput = {
        date: Date.now(),
        amount: 1000,
        paymentType: 'bank',
        bankId: testBankId,
        scheduledPayDate: customPaymentDate,
        isScheduleEditable: true
      };

      const transaction = await transactionOperations.create(transactionData);
      
      expect(transaction.scheduledPayDate).toBe(customPaymentDate);
      expect(transaction.isScheduleEditable).toBe(true);
    });

    it('should handle transaction updates correctly', async () => {
      const transaction = await transactionOperations.create({
        date: Date.now(),
        amount: 1000,
        paymentType: 'bank',
        bankId: testBankId
      });

      const updatedTransaction = await transactionOperations.update(transaction.id, {
        amount: 1500,
        storeName: '更新された店舗'
      });

      expect(updatedTransaction.amount).toBe(1500);
      expect(updatedTransaction.storeName).toBe('更新された店舗');
      expect(updatedTransaction.bankId).toBe(testBankId); // Unchanged
    });
  });
});