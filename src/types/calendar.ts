import { Transaction, ScheduleItem } from './database';

// Calendar-specific type definitions for total amount display

/**
 * Individual transaction item for a specific day
 */
export interface DayTransactionItem {
  id: string;
  type: 'transaction' | 'schedule';
  amount: number;
  storeName?: string;
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
  storeName?: string;
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
  transactionTotal: number; // 取引合計
  scheduleTotal: number; // 引落予定合計
  bankGroups: BankGroup[];
  transactions: Transaction[];
  scheduleItems: any[]; // From schedule data
  hasData: boolean;
  hasTransactions: boolean; // 取引データがあるかどうか
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