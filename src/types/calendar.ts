import { Transaction, ScheduleItem, Bank, Card } from './database';

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

/**
 * 引落予定編集用のフォームデータ型
 */
export interface ScheduleEditFormData {
  amount: number;
  storeName?: string;
  usage?: string;
  memo?: string;
}

/**
 * 引落予定編集用のイベントハンドラ型
 */
export interface ScheduleEditHandlers {
  onScheduleClick: (scheduleItem: ScheduleItem) => void;
  onScheduleEdit: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onScheduleDelete?: (scheduleId: string) => Promise<void>;
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
  storeName?: string;
  usage?: string;
  memo?: string;
  scheduleItem: ScheduleItem;
}

/**
 * 引落予定モーダルの状態管理型
 */
export interface ScheduleModalState {
  view: {
    isOpen: boolean;
    scheduleItems: ScheduleItem[];
    selectedDate: Date | null;
  };
  edit: {
    isOpen: boolean;
    scheduleItem: ScheduleItem | null;
  };
}

/**
 * モーダル表示状態管理型
 */
export interface ModalStates {
  transactionView: boolean;
  scheduleView: boolean;
  transactionEdit: boolean;
  scheduleEdit: boolean;
  dayTotal: boolean;
}

/**
 * モーダル管理のハンドラ型
 */
export interface ModalHandlers {
  openTransactionView: (transactions: Transaction[], selectedDate: Date) => void;
  openScheduleView: (scheduleItems: ScheduleItem[], selectedDate: Date) => void;
  openTransactionEdit: (transaction?: Transaction) => void;
  openScheduleEdit: (scheduleItem: ScheduleItem) => void;
  openDayTotal: (dayTotalData: DayTotalData, selectedDate: Date) => void;
  closeAll: () => void;
}

/**
 * 統合モーダル管理のコンテキスト型
 */
export interface CalendarModalContext {
  // 状態
  modalStates: ModalStates;
  selectedDate: Date | null;
  selectedTransactions: Transaction[];
  selectedScheduleItems: ScheduleItem[];
  selectedTransaction: Transaction | null;
  selectedScheduleItem: ScheduleItem | null;
  selectedDayTotalData: DayTotalData | null;
  
  // ハンドラ
  handlers: ModalHandlers;
  
  // 共通データ
  banks: Bank[];
  cards: Card[];
  
  // データ操作
  onTransactionSave: (transaction: any) => Promise<void>;
  onTransactionDelete: (transactionId: string) => Promise<void>;
  onScheduleSave: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onScheduleDelete: (scheduleId: string) => Promise<void>;
}

/**
 * エラーハンドリング型
 */
export interface CalendarError {
  type: 'validation' | 'network' | 'permission' | 'unknown';
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * 操作結果型
 */
export interface CalendarOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: CalendarError;
}