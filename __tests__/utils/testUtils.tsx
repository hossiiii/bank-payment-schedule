import React from 'react';
import { render } from '@testing-library/react';
import { Transaction, Bank, Card } from '@/types/database';

// Simple test utilities to resolve TypeScript errors
export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-123',
  date: Date.now(),
  storeName: 'テスト店舗',
  usage: 'テスト用途',
  amount: 5000,
  paymentType: 'card',
  cardId: 'card-1',
  scheduledPayDate: Date.now() + 86400000,
  isScheduleEditable: true,
  memo: 'テストメモ',
  createdAt: Date.now(),
  ...overrides,
});

export const createMockBank = (overrides: Partial<Bank> = {}): Bank => ({
  id: 'bank-123',
  name: 'テスト銀行',
  memo: 'テスト銀行のメモ',
  createdAt: Date.now(),
  ...overrides,
});

export const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-123',
  name: 'テストカード',
  bankId: 'bank-123',
  closingDay: '15',
  paymentDay: '10',
  paymentMonthShift: 1,
  adjustWeekend: true,
  memo: 'テストカードのメモ',
  createdAt: Date.now(),
  ...overrides,
});

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui);
};