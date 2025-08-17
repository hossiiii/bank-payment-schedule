import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Transaction, TransactionInput, ScheduleItem, Bank, Card } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

/**
 * Test utilities for comprehensive testing
 * Phase 2 refactoring support
 */

// Mock data factories
export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-123',
  amount: 5000,
  description: 'テスト取引',
  date: '2024-02-15',
  isRecurring: false,
  categoryId: 'cat-1',
  cardId: 'card-1',
  bankId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTransactionInput = (overrides: Partial<TransactionInput> = {}): TransactionInput => ({
  amount: 5000,
  description: 'テスト取引',
  date: '2024-02-15',
  categoryId: 'cat-1',
  cardId: 'card-1',
  bankId: null,
  isRecurring: false,
  ...overrides,
});

export const createMockScheduleItem = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  id: 'sched-123',
  title: 'テスト予定',
  amount: 3000,
  date: '2024-02-15',
  categoryId: 'cat-1',
  cardId: 'card-1',
  bankId: null,
  isRecurring: true,
  recurringType: 'monthly',
  description: 'テスト予定の詳細',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockBank = (overrides: Partial<Bank> = {}): Bank => ({
  id: 'bank-123',
  name: 'テスト銀行',
  accountNumber: '1234567',
  accountType: 'savings',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-123',
  name: 'テストカード',
  lastFourDigits: '1234',
  brand: 'VISA',
  type: 'credit',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockDayTotalData = (overrides: Partial<DayTotalData> = {}): DayTotalData => ({
  date: '2024-02-15',
  totalAmount: 20000,
  transactionTotal: 15000,
  cardTransactionTotal: 15000,
  bankTransactionTotal: 0,
  scheduleTotal: 5000,
  transactionCount: 1,
  scheduleCount: 1,
  bankGroups: [],
  transactions: [],
  scheduleItems: [],
  hasData: true,
  hasTransactions: true,
  hasCardTransactions: true,
  hasBankTransactions: false,
  hasSchedule: true,
  ...overrides,
});

// Date utilities for tests
export const createMockDate = (dateString = '2024-02-15'): Date => new Date(dateString);

export const createDateRange = (start: string, end: string): Date[] => {
  const dates: Date[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  return dates;
};

// Async operation utilities
export const createAsyncMock = <T>(
  returnValue: T,
  delay = 0,
  shouldReject = false
): jest.Mock<Promise<T>> => {
  return jest.fn().mockImplementation(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldReject) {
          reject(new Error('Mock async operation failed'));
        } else {
          resolve(returnValue);
        }
      }, delay);
    });
  });
};

// Error simulation utilities
export const createErrorMock = (message = 'Test error'): jest.Mock => {
  return jest.fn().mockRejectedValue(new Error(message));
};

// State assertion utilities
export const expectModalState = (
  modalStates: Record<string, boolean>,
  expectedStates: Record<string, boolean>
) => {
  Object.entries(expectedStates).forEach(([modalType, expectedState]) => {
    expect(modalStates[modalType]).toBe(expectedState);
  });
};

export const expectSelectedData = (
  selectedData: any,
  expectedData: Partial<any>
) => {
  Object.entries(expectedData).forEach(([key, expectedValue]) => {
    if (expectedValue === null) {
      expect(selectedData[key]).toBeNull();
    } else if (Array.isArray(expectedValue)) {
      expect(selectedData[key]).toEqual(expectedValue);
    } else {
      expect(selectedData[key]).toEqual(expectedValue);
    }
  });
};

// Performance testing utilities
export const measureHookPerformance = async (
  hookFn: () => void,
  iterations = 100
): Promise<number> => {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    hookFn();
  }
  
  const end = performance.now();
  return end - start;
};

// Store testing utilities (for Zustand)
export const createStoreTestWrapper = (initialState: any = {}) => {
  return ({ children }: { children: React.ReactNode }) => {
    // This will be updated when Zustand store is implemented
    return <>{children}</>;
  };
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  withStore?: boolean;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialState, withStore = false, ...renderOptions } = options;
  
  let Wrapper: React.ComponentType<{ children: React.ReactNode }> | undefined;
  
  if (withStore) {
    Wrapper = createStoreTestWrapper(initialState);
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data collections
export const createMockDataSet = () => {
  const banks = [
    createMockBank({ id: 'bank-1', name: 'みずほ銀行' }),
    createMockBank({ id: 'bank-2', name: '三菱UFJ銀行' }),
  ];
  
  const cards = [
    createMockCard({ id: 'card-1', name: 'メインカード', brand: 'VISA' }),
    createMockCard({ id: 'card-2', name: 'サブカード', brand: 'MasterCard' }),
  ];
  
  const transactions = [
    createMockTransaction({ id: 'tx-1', amount: 5000, cardId: 'card-1' }),
    createMockTransaction({ id: 'tx-2', amount: 3000, cardId: 'card-2' }),
  ];
  
  const scheduleItems = [
    createMockScheduleItem({ id: 'sched-1', amount: 2000, cardId: 'card-1' }),
    createMockScheduleItem({ id: 'sched-2', amount: 1500, bankId: 'bank-1' }),
  ];
  
  return {
    banks,
    cards,
    transactions,
    scheduleItems,
  };
};

// Validation utilities
export const validateTransactionInput = (input: TransactionInput): boolean => {
  return !!(
    input.amount &&
    input.amount > 0 &&
    input.description &&
    input.date &&
    input.categoryId &&
    (input.cardId || input.bankId)
  );
};

export const validateScheduleItem = (item: ScheduleItem): boolean => {
  return !!(
    item.title &&
    item.amount &&
    item.amount > 0 &&
    item.date &&
    item.categoryId &&
    (item.cardId || item.bankId)
  );
};