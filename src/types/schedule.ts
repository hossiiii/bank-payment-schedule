import { Transaction } from './database';

// New data structure for cross-table view (日付×銀行マトリックス)
export interface PaymentScheduleView {
  month: string;                    // "2025年8月"
  payments: PaymentSummary[];       // 日付別の引落サマリー
  bankTotals: Map<string, number>;  // 銀行ID -> 合計金額
  monthTotal: number;               // 月合計
  uniqueBanks: Bank[];              // 動的カラム生成用の銀行一覧
}

export interface PaymentSummary {
  date: string;                     // "2025/8/4"
  dayOfWeek: string;                // "月"
  paymentName: string;              // カード名 or "銀行引落"
  closingDay?: string;              // "10日締" (カードの場合のみ)
  paymentDay: string;               // "翌月2日"
  bankPayments: BankPayment[];      // 銀行別の引落額
  totalAmount: number;              // 行の合計金額
  transactions: Transaction[];      // 元となる取引明細
  sortKey: number;                  // ソート用の日付キー (timestamp)
}

export interface BankPayment {
  bankId: string;                   // 銀行ID
  bankName: string;                 // "SBIネット銀行"
  amount: number;                   // 20555
  transactionCount: number;         // この銀行での取引数
}

// Filtering interfaces
export interface ScheduleFilters {
  dateRange?: { start: Date; end: Date };
  amountRange?: { min?: number | undefined; max?: number | undefined } | undefined;
  searchText?: string;              // 店舗名/用途検索
  bankIds?: string[];               // 銀行絞り込み
  paymentTypes?: ('card' | 'bank')[]; // 支払い方法絞り込み
}

// Modal interfaces
export interface TransactionDetailModalData {
  paymentDate: string;              // 引落予定日
  paymentName: string;              // カード名 or 銀行名
  bankName: string;                 // 銀行名
  transactions: TransactionDetail[]; // 取引明細
  totalAmount: number;              // 合計金額
}

export interface TransactionDetail {
  id: string;                       // 取引ID
  date: string;                     // 取引日
  storeName?: string | undefined;   // 店舗名
  usage?: string | undefined;       // 用途
  amount: number;                   // 金額
  paymentType: 'card' | 'bank';     // 支払い方法
  cardName?: string | undefined;    // カード名（カードの場合）
}

// Bank information for column generation
export interface Bank {
  id: string;
  name: string;
}

// Hook return types
export interface UseScheduleDataResult {
  scheduleData: PaymentScheduleView | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFilteredScheduleResult {
  filteredData: PaymentScheduleView | null;
  appliedFilters: ScheduleFilters;
  updateFilters: (filters: Partial<ScheduleFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

// Utility types for component props
export interface CrossTableProps {
  scheduleData: PaymentScheduleView;
  onAmountClick: (modalData: TransactionDetailModalData) => void;
  className?: string;
}

export interface PaymentRowProps {
  payment: PaymentSummary;
  banks: Bank[];
  onAmountClick: (modalData: TransactionDetailModalData) => void;
  className?: string;
}

export interface ScheduleFiltersProps {
  filters: ScheduleFilters;
  onFiltersChange: (filters: ScheduleFilters) => void;
  availableBanks: Bank[];
  className?: string;
}

export interface MobileScheduleCardProps {
  scheduleData: PaymentScheduleView;
  onTransactionClick: (modalData: TransactionDetailModalData) => void;
  className?: string;
}

export interface TransactionDetailModalProps {
  data: TransactionDetailModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

// Data transformation types
export interface GroupedTransaction {
  date: string;
  dayOfWeek: string;
  transactions: Transaction[];
  cardInfo?: {
    name: string;
    closingDay: string;
    paymentDay: string;
  };
}

// Validation and processing types
export interface ScheduleCalculationParams {
  transactions: Transaction[];
  banks: Bank[];
  cards: Card[];
  year: number;
  month: number;
}

export interface Card {
  id: string;
  name: string;
  bankId: string;
  closingDay: string;
  paymentDay: string;
  paymentMonthShift: number;
  adjustWeekend: boolean;
}

// Error types specific to schedule processing
export interface ScheduleProcessingErrorDetails {
  transactionId?: string;
  cardId?: string;
  bankId?: string;
  originalError?: Error;
}

export class ScheduleProcessingError extends Error {
  public readonly code: 'INVALID_DATE' | 'MISSING_CARD' | 'MISSING_BANK' | 'CALCULATION_ERROR';
  public readonly details?: ScheduleProcessingErrorDetails;

  constructor(
    message: string, 
    code: 'INVALID_DATE' | 'MISSING_CARD' | 'MISSING_BANK' | 'CALCULATION_ERROR',
    details?: ScheduleProcessingErrorDetails
  ) {
    super(message);
    this.name = 'ScheduleProcessingError';
    this.code = code;
    this.details = details;
  }
}

// Sort options for the table
export type SortField = 'date' | 'paymentName' | 'totalAmount';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// Export utility type guards
export const isValidPaymentSummary = (obj: any): obj is PaymentSummary => {
  return obj && 
    typeof obj.date === 'string' &&
    typeof obj.dayOfWeek === 'string' &&
    typeof obj.paymentName === 'string' &&
    typeof obj.totalAmount === 'number' &&
    Array.isArray(obj.bankPayments) &&
    Array.isArray(obj.transactions);
};

export const isValidScheduleFilters = (obj: any): obj is ScheduleFilters => {
  return obj && typeof obj === 'object';
};