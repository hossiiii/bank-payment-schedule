import { 
  transformToPaymentScheduleView,
  filterTransactionsForMonth,
  groupTransactionsByScheduledDate,
  createPaymentSummaries,
  calculateBankTotals,
  formatAmount,
  validatePaymentScheduleView
} from '@/lib/utils/scheduleUtils';
import { Transaction, Card, Bank } from '@/types/database';
import { ScheduleCalculationParams } from '@/types/schedule';

// Mock data for testing
const mockBanks: Bank[] = [
  { id: 'bank1', name: 'SBIネット銀行', createdAt: Date.now() },
  { id: 'bank2', name: 'みずほ銀行', createdAt: Date.now() },
  { id: 'bank3', name: 'イオン銀行', createdAt: Date.now() }
];

const mockCards: Card[] = [
  {
    id: 'card1',
    name: 'イオンカード',
    bankId: 'bank3',
    closingDay: '10',
    paymentDay: '2',
    paymentMonthShift: 1,
    adjustWeekend: true,
    createdAt: Date.now()
  },
  {
    id: 'card2',
    name: '楽天カード',
    bankId: 'bank1',
    closingDay: '月末',
    paymentDay: '27',
    paymentMonthShift: 1,
    adjustWeekend: true,
    createdAt: Date.now()
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    date: new Date('2025-08-04').getTime(),
    storeName: 'Amazon',
    usage: '通販',
    amount: 2500,
    paymentType: 'card',
    cardId: 'card1',
    scheduledPayDate: new Date('2025-09-02').getTime(),
    createdAt: Date.now()
  },
  {
    id: 'tx2',
    date: new Date('2025-08-15').getTime(),
    storeName: '楽天',
    usage: 'ネットショッピング',
    amount: 5000,
    paymentType: 'card',
    cardId: 'card2',
    scheduledPayDate: new Date('2025-09-27').getTime(),
    createdAt: Date.now()
  },
  {
    id: 'tx3',
    date: new Date('2025-08-20').getTime(),
    storeName: '電気代',
    usage: '公共料金',
    amount: 8000,
    paymentType: 'bank',
    bankId: 'bank2',
    scheduledPayDate: new Date('2025-08-20').getTime(),
    createdAt: Date.now()
  }
];

describe('scheduleUtils', () => {
  describe('filterTransactionsForMonth', () => {
    it('should filter transactions for September 2025', () => {
      const filtered = filterTransactionsForMonth(mockTransactions, 2025, 9);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['tx1', 'tx2']);
    });

    it('should filter transactions for August 2025', () => {
      const filtered = filterTransactionsForMonth(mockTransactions, 2025, 8);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe('tx3');
    });

    it('should return empty array for months with no transactions', () => {
      const filtered = filterTransactionsForMonth(mockTransactions, 2025, 10);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('groupTransactionsByScheduledDate', () => {
    it('should group transactions by scheduled payment date', () => {
      const septTransactions = filterTransactionsForMonth(mockTransactions, 2025, 9);
      const grouped = groupTransactionsByScheduledDate(septTransactions, mockCards);
      
      expect(grouped.size).toBe(2);
      expect(grouped.has('2025-09-02')).toBe(true);
      expect(grouped.has('2025-09-27')).toBe(true);
      
      const group1 = grouped.get('2025-09-02');
      expect(group1?.transactions).toHaveLength(1);
      expect(group1?.cardInfo?.name).toBe('イオンカード');
    });

    it('should handle empty transaction list', () => {
      const grouped = groupTransactionsByScheduledDate([], mockCards);
      expect(grouped.size).toBe(0);
    });
  });

  describe('createPaymentSummaries', () => {
    it('should create payment summaries from grouped transactions', () => {
      const septTransactions = filterTransactionsForMonth(mockTransactions, 2025, 9);
      const grouped = groupTransactionsByScheduledDate(septTransactions, mockCards);
      const summaries = createPaymentSummaries(grouped, mockBanks, mockCards);
      
      expect(summaries).toHaveLength(2);
      
      const summary1 = summaries.find(s => s.date === '2025-09-02');
      expect(summary1).toBeDefined();
      expect(summary1?.paymentName).toBe('イオンカード');
      expect(summary1?.totalAmount).toBe(2500);
      expect(summary1?.bankPayments).toHaveLength(1);
      expect(summary1?.bankPayments[0]?.bankId).toBe('bank3');
      expect(summary1?.bankPayments[0]?.amount).toBe(2500);
    });
  });

  describe('calculateBankTotals', () => {
    it('should calculate correct bank totals', () => {
      const params: ScheduleCalculationParams = {
        transactions: mockTransactions,
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 9
      };
      
      const scheduleView = transformToPaymentScheduleView(params);
      const bankTotals = calculateBankTotals(scheduleView.payments);
      
      expect(bankTotals.get('bank1')).toBe(5000); // 楽天カード
      expect(bankTotals.get('bank3')).toBe(2500); // イオンカード
      expect(bankTotals.get('bank2')).toBeUndefined(); // No transactions for this bank in September
    });
  });

  describe('formatAmount', () => {
    it('should format amounts in Japanese yen', () => {
      expect(formatAmount(1000)).toBe('¥1,000');
      expect(formatAmount(12345)).toBe('¥12,345');
      expect(formatAmount(0)).toBe('¥0');
    });

    it('should handle negative amounts', () => {
      expect(formatAmount(-1000)).toBe('-¥1,000');
    });
  });

  describe('validatePaymentScheduleView', () => {
    it('should validate correct PaymentScheduleView', () => {
      const params: ScheduleCalculationParams = {
        transactions: mockTransactions,
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 9
      };
      
      const scheduleView = transformToPaymentScheduleView(params);
      const validation = validatePaymentScheduleView(scheduleView);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid PaymentScheduleView', () => {
      const invalidSchedule = {
        month: '',
        payments: null,
        bankTotals: null,
        monthTotal: -1,
        uniqueBanks: null
      } as any;
      
      const validation = validatePaymentScheduleView(invalidSchedule);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('transformToPaymentScheduleView', () => {
    it('should transform complete schedule correctly', () => {
      const params: ScheduleCalculationParams = {
        transactions: mockTransactions,
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 9
      };
      
      const result = transformToPaymentScheduleView(params);
      
      expect(result.month).toBe('2025年9月');
      expect(result.payments).toHaveLength(2);
      expect(result.monthTotal).toBe(7500); // 2500 + 5000
      expect(result.uniqueBanks).toHaveLength(2); // bank1 and bank3
      
      // Check that payments are sorted by date
      expect(result.payments[0]?.sortKey).toBeLessThanOrEqual(result.payments[1]?.sortKey ?? 0);
    });

    it('should handle empty transactions gracefully', () => {
      const params: ScheduleCalculationParams = {
        transactions: [],
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 10
      };
      
      const result = transformToPaymentScheduleView(params);
      
      expect(result.month).toBe('2025年10月');
      expect(result.payments).toHaveLength(0);
      expect(result.monthTotal).toBe(0);
      expect(result.uniqueBanks).toHaveLength(0);
    });

    it('should handle month with only bank transactions', () => {
      const transaction = mockTransactions[2];
      if (!transaction) throw new Error('Mock transaction not found');
      const bankOnlyTransactions = [transaction]; // Only bank transaction
      
      const params: ScheduleCalculationParams = {
        transactions: bankOnlyTransactions,
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 8
      };
      
      const result = transformToPaymentScheduleView(params);
      
      expect(result.month).toBe('2025年8月');
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0]?.paymentName).toBe('銀行引落');
      expect(result.payments[0]?.totalAmount).toBe(8000);
    });
  });

  describe('edge cases', () => {
    it('should handle transactions without store names', () => {
      const baseTransaction = mockTransactions[0];
      if (!baseTransaction) throw new Error('Mock transaction not found');
      
      const transactionWithoutStore: Transaction = {
        ...baseTransaction,
        id: 'test-tx',
        storeName: '',
        usage: '',
        createdAt: Date.now()
      };
      
      const params: ScheduleCalculationParams = {
        transactions: [transactionWithoutStore],
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 9
      };
      
      const result = transformToPaymentScheduleView(params);
      expect(result.payments).toHaveLength(1);
      expect(result.payments[0]?.transactions[0]?.storeName).toBe('');
    });

    it('should handle missing card data', () => {
      const baseTransaction2 = mockTransactions[0];
      if (!baseTransaction2) throw new Error('Mock transaction not found');
      
      const transactionWithInvalidCard: Transaction = {
        ...baseTransaction2,
        id: 'test-invalid-tx',
        cardId: 'non-existent-card',
        createdAt: Date.now()
      };
      
      const params: ScheduleCalculationParams = {
        transactions: [transactionWithInvalidCard],
        banks: mockBanks,
        cards: mockCards,
        year: 2025,
        month: 9
      };
      
      // Should not throw error but handle gracefully
      expect(() => transformToPaymentScheduleView(params)).not.toThrow();
    });

    it('should handle month-end dates correctly', () => {
      const monthEndCard: Card = {
        id: 'test-card',
        name: 'テストカード',
        bankId: 'bank1',
        closingDay: '月末',
        paymentDay: '月末',
        paymentMonthShift: 1,
        adjustWeekend: true,
        createdAt: Date.now()
      };
      
      const params: ScheduleCalculationParams = {
        transactions: mockTransactions[1] ? [mockTransactions[1]] : [],
        banks: mockBanks,
        cards: [monthEndCard],
        year: 2025,
        month: 9
      };
      
      expect(() => transformToPaymentScheduleView(params)).not.toThrow();
    });
  });
});