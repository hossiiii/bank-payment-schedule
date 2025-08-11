/**
 * Test utilities and shared setup for the Bank Payment Schedule PWA
 * 
 * Provides common testing utilities, mocks, and helpers
 * for unit and integration tests.
 */

import 'fake-indexeddb/auto';
import { Card, Bank, Transaction } from '@/types/database';
import { createJapanDate } from '@/lib/utils/dateUtils';

// Mock test data factories
export const createMockBank = (overrides: Partial<Bank> = {}): Bank => ({
  id: 'test-bank-id',
  name: 'テスト銀行',
  memo: 'テスト用の銀行',
  createdAt: Date.now(),
  ...overrides
});

export const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'test-card-id',
  name: 'テストカード',
  bankId: 'test-bank-id',
  closingDay: '15',
  paymentDay: '27',
  paymentMonthShift: 1,
  adjustWeekend: true,
  memo: 'テスト用のカード',
  createdAt: Date.now(),
  ...overrides
});

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'test-transaction-id',
  date: createJapanDate(2024, 1, 10).getTime(),
  storeName: 'テスト店舗',
  usage: '食費',
  amount: 1000,
  cardId: 'test-card-id',
  memo: 'テスト取引',
  createdAt: Date.now(),
  ...overrides
});

// Test data arrays
export const mockBanks: Bank[] = [
  createMockBank({ 
    id: 'bank-1', 
    name: 'みずほ銀行',
    memo: '本店 普通 1234567'
  }),
  createMockBank({ 
    id: 'bank-2', 
    name: '三菱UFJ銀行',
    memo: '新宿支店 普通 9876543'
  })
];

export const mockCards: Card[] = [
  createMockCard({
    id: 'card-1',
    name: '楽天カード',
    bankId: 'bank-1',
    closingDay: '月末',
    paymentDay: '27'
  }),
  createMockCard({
    id: 'card-2',
    name: 'イオンカード',
    bankId: 'bank-1',
    closingDay: '10',
    paymentDay: '2',
    paymentMonthShift: 2
  }),
  createMockCard({
    id: 'card-3',
    name: '三井住友カード',
    bankId: 'bank-2',
    closingDay: '15',
    paymentDay: '10'
  })
];

export const mockTransactions: Transaction[] = [
  createMockTransaction({
    id: 'tx-1',
    date: createJapanDate(2024, 1, 5).getTime(),
    storeName: 'コンビニA',
    amount: 500,
    cardId: 'card-1'
  }),
  createMockTransaction({
    id: 'tx-2',
    date: createJapanDate(2024, 1, 12).getTime(),
    storeName: 'スーパーB',
    amount: 2000,
    cardId: 'card-1'
  }),
  createMockTransaction({
    id: 'tx-3',
    date: createJapanDate(2024, 1, 20).getTime(),
    storeName: 'レストランC',
    amount: 3000,
    cardId: 'card-2'
  })
];

// Database mock utilities
export const clearMockDatabase = () => {
  // Clear fake-indexeddb
  if (typeof window !== 'undefined' && window.indexedDB) {
    const databases = ['PaymentScheduleDB'];
    databases.forEach(dbName => {
      const deleteRequest = window.indexedDB.deleteDatabase(dbName);
      deleteRequest.onsuccess = () => {
        console.log(`Cleared test database: ${dbName}`);
      };
    });
  }
};

// Component test utilities
export const waitForLoadingToFinish = async (container: HTMLElement) => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  
  // Wait for loading spinners to disappear
  try {
    await waitForElementToBeRemoved(
      () => container.querySelector('.animate-spin'),
      { timeout: 3000 }
    );
  } catch (error) {
    // Loading spinner might not be present, which is fine
  }
  
  // Wait for "読み込み中..." text to disappear
  try {
    await waitForElementToBeRemoved(
      () => container.querySelector('text*="読み込み中"'),
      { timeout: 3000 }
    );
  } catch (error) {
    // Loading text might not be present, which is fine
  }
};

// Mock implementations for hooks
export const mockUseDatabase = {
  useBanks: () => ({
    banks: mockBanks,
    isLoading: false,
    error: null,
    createBank: jest.fn(),
    updateBank: jest.fn(),
    deleteBank: jest.fn(),
    refetch: jest.fn()
  }),
  
  useCards: () => ({
    cards: mockCards,
    isLoading: false,
    error: null,
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    refetch: jest.fn()
  }),
  
  useTransactions: () => ({
    transactions: mockTransactions,
    isLoading: false,
    error: null,
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    refetch: jest.fn()
  }),
  
  useMonthlySchedule: () => ({
    schedule: {
      year: 2024,
      month: 1,
      totalAmount: 5500,
      totalTransactions: 3,
      banks: {
        'bank-1': {
          bankName: 'みずほ銀行',
          totalAmount: 2500,
          cards: [
            {
              cardId: 'card-1',
              cardName: '楽天カード',
              transactions: [
                {
                  transactionId: 'tx-1',
                  transactionDate: createJapanDate(2024, 1, 5).getTime(),
                  paymentDate: createJapanDate(2024, 2, 27).getTime(),
                  amount: 500,
                  storeName: 'コンビニA'
                },
                {
                  transactionId: 'tx-2',
                  transactionDate: createJapanDate(2024, 1, 12).getTime(),
                  paymentDate: createJapanDate(2024, 2, 27).getTime(),
                  amount: 2000,
                  storeName: 'スーパーB'
                }
              ]
            }
          ]
        },
        'bank-2': {
          bankName: '三菱UFJ銀行',
          totalAmount: 3000,
          cards: [
            {
              cardId: 'card-3',
              cardName: '三井住友カード',
              transactions: [
                {
                  transactionId: 'tx-3',
                  transactionDate: createJapanDate(2024, 1, 20).getTime(),
                  paymentDate: createJapanDate(2024, 2, 10).getTime(),
                  amount: 3000,
                  storeName: 'レストランC'
                }
              ]
            }
          ]
        }
      }
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  }),
  
  useDatabaseStats: () => ({
    stats: {
      banks: 2,
      cards: 3,
      transactions: 3,
      totalSize: 2048
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })
};

// Mock encryption hook
export const mockUseEncryption = () => ({
  isUnlocked: true,
  hasStoredKey: true,
  sessionExpiresAt: Date.now() + 3600000, // 1 hour from now
  isLoading: false,
  error: null,
  setupEncryption: jest.fn(),
  unlock: jest.fn(),
  lock: jest.fn(),
  changePassword: jest.fn(),
  extendSession: jest.fn(),
  resetEncryption: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  getSessionInfo: jest.fn(() => ({
    expiresAt: new Date(Date.now() + 3600000),
    timeRemaining: 3600000,
    minutesRemaining: 60,
    isExpiringSoon: false
  }))
});

// Date utilities for tests
export const getTestDateRange = (year: number = 2024, month: number = 1) => ({
  start: createJapanDate(year, month, 1),
  end: createJapanDate(year, month, 31),
  middle: createJapanDate(year, month, 15)
});

// Async test helpers
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));