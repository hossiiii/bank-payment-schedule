import { Transaction, ScheduleItem } from './database';

// Calendar-specific type definitions for total amount display

/**
 * Individual transaction item for a specific day
 */
export interface DayTransactionItem {
  id: string;
  type: 'transaction' | 'schedule';
  amount: number;
  storeName: string;
  paymentType: 'card' | 'bank';
  bankName?: string;
  cardName?: string;
  transaction?: Transaction;
  scheduleItem?: ScheduleItem;
}

/**
 * Grouped bank data for a specific day
 */
export interface BankGroup {
  bankId: string;
  bankName: string;
  totalAmount: number;
  transactionCount: number;
  items: DayTransactionItem[];
}

/**
 * Payment item for a specific day (used for schedule items)
 */
export interface PaymentItem {
  type: 'payment';
  bankName: string;
  cardName?: string;
  paymentType: 'card' | 'bank';
  amount: number;
  storeName: string;
}

/**
 * Total data for a specific day in the calendar
 */
export interface DayTotalData {
  date: string; // ISO date string (YYYY-MM-DD)
  totalAmount: number; // 総合計（互換性のため保持）
  transactionCount: number;
  scheduleCount: number;
  // 分離されたデータ
  transactionTotal: number; // 取引合計（全取引）
  cardTransactionTotal: number; // カード払い取引合計のみ
  bankTransactionTotal: number; // 銀行引落取引合計のみ
  scheduleTotal: number; // 引落予定合計
  bankGroups: BankGroup[];
  transactions: Transaction[];
  scheduleItems: ScheduleItem[]; // From schedule data
  hasData: boolean;
  hasTransactions: boolean; // 取引データがあるかどうか
  hasCardTransactions: boolean; // カード払い取引データがあるかどうか
  hasBankTransactions: boolean; // 銀行引落取引データがあるかどうか
  hasSchedule: boolean; // 引落予定データがあるかどうか
}

/**
 * Calendar day display configuration
 */
export interface CalendarDayDisplay {
  showIndividualItems: boolean; // true = show individual items, false = show total only
  maxItemsVisible: number; // Maximum items to show before "more" indicator
  showTotalWhenMultiple: boolean; // Show total instead of items when multiple exist
}

/**
 * Calendar total calculation result
 */
export interface CalendarTotalsResult {
  totals: Map<string, DayTotalData>;
  monthTotal: number;
  dayCount: number;
}

/**
 * 引落予定表示用の銀行グループ型
 */
export interface ScheduleBankGroup {
  bankId: string;
  bankName: string;
  totalAmount: number;
  scheduleCount: number;
  items: ScheduleDisplayItem[];
}

/**
 * 引落予定表示項目型
 */
export interface ScheduleDisplayItem {
  id: string;
  amount: number;
  paymentType: 'card' | 'bank';
  bankName: string;
  cardName: string;
  storeName: string;
  usage?: string;
  memo?: string;
  scheduleItem: ScheduleItem;
}

/**
 * Calendar-specific error handling type
 */
export interface CalendarError {
  type: 'validation' | 'network' | 'permission' | 'unknown';
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * Calendar operation result type
 */
export interface CalendarOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: CalendarError;
}