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
  totalAmount: number;
  transactionCount: number;
  scheduleCount: number;
  bankGroups: BankGroup[];
  transactions: Transaction[];
  scheduleItems: any[]; // From schedule data
  hasData: boolean;
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