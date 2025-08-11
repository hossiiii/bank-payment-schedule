import { z } from 'zod';

// Database entity interfaces
export interface Bank {
  id: string;           // UUID
  name: string;         // 銀行名
  memo?: string;        // 任意メモ
  createdAt: number;    // timestamp
}

export interface Card {
  id: string;                    // UUID
  name: string;                  // カード名  
  bankId: string;               // 引落銀行のID
  closingDay: string;           // 締日（"数値" or "月末"）
  paymentDay: string;           // 引落日（"数値" or "月末"）
  paymentMonthShift: number;    // 0=当月, 1=翌月, 2=翌々月
  adjustWeekend: boolean;       // 土日祝調整有無
  memo?: string;                // メモ（任意）
  createdAt: number;           // 登録日時
}

export interface Transaction {
  id: string;                   // UUID
  date: number;                // 取引日（timestamp）
  storeName?: string;          // 使用店舗（任意）
  usage?: string;              // 用途（任意）
  amount: number;              // 金額
  cardId: string;              // カードID
  scheduledPayDate: number;    // 引落予定日（timestamp）
  memo?: string;               // メモ（任意）
  createdAt: number;           // 登録日時
}

// Zod validation schemas
export const BankSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  memo: z.string().max(200).optional(),
  createdAt: z.number()
});

export const CardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  bankId: z.string().uuid(),
  closingDay: z.string(),
  paymentDay: z.string(),
  paymentMonthShift: z.number().int().min(0).max(2),
  adjustWeekend: z.boolean(),
  memo: z.string().max(200).optional(),
  createdAt: z.number()
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  date: z.number(),
  storeName: z.string().max(100).optional(),
  usage: z.string().max(100).optional(),
  amount: z.number().positive(),
  cardId: z.string().uuid(),
  scheduledPayDate: z.number(),
  memo: z.string().max(200).optional(),
  createdAt: z.number()
});

// Input schemas for forms (without id and createdAt)
export const BankInputSchema = BankSchema.omit({ id: true, createdAt: true });
export const CardInputSchema = CardSchema.omit({ id: true, createdAt: true });
export const TransactionInputSchema = TransactionSchema.omit({ id: true, createdAt: true, scheduledPayDate: true });

// Internal schema for transaction creation (includes calculated scheduledPayDate)
export const TransactionCreateSchema = TransactionSchema.omit({ id: true });

// Types derived from schemas
export type BankInput = z.infer<typeof BankInputSchema>;
export type CardInput = z.infer<typeof CardInputSchema>;
export type TransactionInput = z.infer<typeof TransactionInputSchema>;

// Utility types
export type DatabaseEntity = Bank | Card | Transaction;
export type DatabaseEntityType = 'banks' | 'cards' | 'transactions';

// Query types
export interface DateRange {
  start: number;
  end: number;
}

export interface TransactionFilters {
  dateRange?: DateRange;
  bankId?: string;
  cardId?: string;
  methodType?: 'bank' | 'card';
  minAmount?: number;
  maxAmount?: number;
}

// Aggregation types
export interface BankTotal {
  bankId: string;
  bankName: string;
  totalAmount: number;
  transactionCount: number;
}

export interface MonthlySchedule {
  year: number;
  month: number;
  items: ScheduleItem[];
  bankTotals: BankTotal[];
  monthTotal: number;
  totalAmount: number;
  totalTransactions: number;
}

export interface ScheduleItem {
  transactionId: string;
  date: Date;
  bankName: string;
  storeName?: string;
  usage?: string;
  amount: number;
  methodType: 'bank' | 'card';
  cardId?: string;
  cardName?: string;
  transactionDate?: number;
  paymentDate?: number;
}

// Error types
export interface DatabaseError extends Error {
  code: string;
  details?: unknown;
}

export class ValidationError extends Error implements DatabaseError {
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class EncryptionError extends Error implements DatabaseError {
  code = 'ENCRYPTION_ERROR';
  
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DatabaseOperationError extends Error implements DatabaseError {
  code = 'DATABASE_OPERATION_ERROR';
  
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'DatabaseOperationError';
  }
}