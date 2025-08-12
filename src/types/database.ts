import { z } from 'zod';

// Database entity interfaces
export interface Bank {
  id: string;           // UUID
  name: string;         // 銀行名
  memo?: string | undefined;        // 任意メモ
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
  memo?: string | undefined;                // メモ（任意）
  createdAt: number;           // 登録日時
}

export interface Transaction {
  id: string;                   // UUID
  date: number;                // 取引日（timestamp）
  storeName?: string | undefined;          // 使用店舗（任意）
  usage?: string | undefined;              // 用途（任意）
  amount: number;              // 金額
  paymentType: 'card' | 'bank'; // 支払いタイプ
  cardId?: string | undefined;             // カードID（カード払いの場合）
  bankId?: string | undefined;             // 銀行ID（銀行引落の場合）
  scheduledPayDate: number;    // 引落予定日（timestamp）
  isScheduleEditable?: boolean | undefined; // スケジュール編集可能フラグ
  memo?: string | undefined;               // メモ（任意）
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
  paymentType: z.enum(['card', 'bank']),
  cardId: z.string().uuid().optional(),
  bankId: z.string().uuid().optional(),
  scheduledPayDate: z.number(),
  isScheduleEditable: z.boolean().optional(),
  memo: z.string().max(200).optional(),
  createdAt: z.number()
}).refine(data => {
  // カード払いの場合はcardIdが必須、銀行引落の場合はbankIdが必須
  if (data.paymentType === 'card') {
    return !!data.cardId;
  } else {
    return !!data.bankId;
  }
}, {
  message: 'Payment type requires corresponding ID (cardId for card, bankId for bank)'
});

// Input schemas for forms (without id and createdAt)
export const BankInputSchema = BankSchema.omit({ id: true, createdAt: true });
export const CardInputSchema = CardSchema.omit({ id: true, createdAt: true });

// Input schema for transactions (without id and createdAt, scheduledPayDate is optional for manual editing)
export const TransactionInputSchema = z.object({
  date: z.number(),
  storeName: z.string().max(100).optional(),
  usage: z.string().max(100).optional(),
  amount: z.number().positive(),
  paymentType: z.enum(['card', 'bank']),
  cardId: z.string().uuid().optional(),
  bankId: z.string().uuid().optional(),
  scheduledPayDate: z.number().optional(),
  isScheduleEditable: z.boolean().optional(),
  memo: z.string().max(200).optional()
}).refine(data => {
  // カード払いの場合はcardIdが必須、銀行引落の場合はbankIdが必須
  if (data.paymentType === 'card') {
    return !!data.cardId;
  } else {
    return !!data.bankId;
  }
}, {
  message: 'Payment type requires corresponding ID (cardId for card, bankId for bank)'
});

// Internal schema for transaction creation (includes calculated scheduledPayDate)
export const TransactionCreateSchema = z.object({
  date: z.number(),
  storeName: z.string().max(100).optional(),
  usage: z.string().max(100).optional(),
  amount: z.number().positive(),
  paymentType: z.enum(['card', 'bank']),
  cardId: z.string().uuid().optional(),
  bankId: z.string().uuid().optional(),
  scheduledPayDate: z.number(),
  isScheduleEditable: z.boolean().optional(),
  memo: z.string().max(200).optional(),
  createdAt: z.number()
}).refine(data => {
  // カード払いの場合はcardIdが必須、銀行引落の場合はbankIdが必須
  if (data.paymentType === 'card') {
    return !!data.cardId;
  } else {
    return !!data.bankId;
  }
}, {
  message: 'Payment type requires corresponding ID (cardId for card, bankId for bank)'
});

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
  paymentType?: 'bank' | 'card';
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
  storeName?: string | undefined;
  usage?: string | undefined;
  amount: number;
  paymentType: 'bank' | 'card';
  cardId?: string | undefined;
  cardName?: string | undefined;
  transactionDate?: number | undefined;
  paymentDate?: number | undefined;
  isScheduleEditable?: boolean | undefined;
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