import { 
  Transaction, 
  TransactionInput, 
  ScheduleItem, 
  Bank, 
  Card, 
  MonthlySchedule,
  DatabaseError 
} from '@/types/database';
import { DayTotalData } from '@/types/calendar';

// Modal types from existing useModalManager
export type ModalType = 
  | 'transaction'
  | 'transactionView'
  | 'scheduleView'
  | 'scheduleEdit'
  | 'dayTotal';

export interface ModalStates {
  transaction: boolean;
  transactionView: boolean;
  scheduleView: boolean;
  scheduleEdit: boolean;
  dayTotal: boolean;
}

export interface SelectedData {
  date: Date | null;
  transaction: Transaction | null;
  transactions: Transaction[];
  scheduleItems: ScheduleItem[];
  scheduleItem: ScheduleItem | null;
  dayTotalData: DayTotalData | null;
}

// UI state types
export interface LoadingStates {
  transactions: boolean;
  schedules: boolean;
  banks: boolean;
  cards: boolean;
  saving: boolean;
  deleting: boolean;
}

export interface ErrorStates {
  transactions: DatabaseError | null;
  schedules: DatabaseError | null;
  banks: DatabaseError | null;
  cards: DatabaseError | null;
  saving: DatabaseError | null;
  deleting: DatabaseError | null;
}

// Cache types for performance optimization
export interface TransactionCache {
  [key: string]: {
    data: Transaction[];
    timestamp: number;
    expiresAt: number;
  };
}

export interface ScheduleCache {
  [key: string]: {
    data: MonthlySchedule;
    timestamp: number;
    expiresAt: number;
  };
}

// Store action types
export interface ModalActions {
  // Modal state management
  openModal: (modalType: ModalType, data?: Partial<SelectedData>) => void;
  closeModal: (modalType: ModalType) => void;
  closeAllModals: () => void;
  
  // Selected data management
  setSelectedData: (data: Partial<SelectedData>) => void;
  clearSelectedData: () => void;
  
  // Cross-modal operations
  handleTransactionViewTransactionClick: (transaction: Transaction) => void;
  handleScheduleTransactionClick: (transactionId: string) => Promise<void>;
  fetchTransactionById: (id: string) => Promise<Transaction | null>;
}

export interface TransactionActions {
  // Data fetching
  fetchTransactions: (filters?: { dateRange?: { start: number; end: number } }) => Promise<Transaction[]>;
  fetchTransactionById: (id: string) => Promise<Transaction | null>;
  
  // CRUD operations
  createTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Cache management
  invalidateTransactionCache: (key?: string) => void;
  clearTransactionCache: () => void;
  
  // Cross-store operations
  withAsyncOperation: <T>(operationKey: keyof LoadingStates, operation: () => Promise<T>) => Promise<T>;
}

export interface ScheduleActions {
  // Schedule fetching
  fetchMonthlySchedule: (year: number, month: number) => Promise<MonthlySchedule>;
  
  // Schedule operations
  updateScheduleItem: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (scheduleId: string) => Promise<void>;
  
  // Cache management
  invalidateScheduleCache: (key?: string) => void;
  clearScheduleCache: () => void;
  
  // Cross-store operations
  withAsyncOperation: <T>(operationKey: keyof LoadingStates, operation: () => Promise<T>) => Promise<T>;
  invalidateTransactionCache: (key?: string) => void;
}

export interface UIActions {
  // Loading state management
  setLoading: (key: keyof LoadingStates, loading: boolean) => void;
  
  // Error state management
  setError: (key: keyof ErrorStates, error: DatabaseError | null) => void;
  clearErrors: () => void;
  clearError: (key: keyof ErrorStates) => void;
  
  // Async operation wrapper
  withAsyncOperation: <T>(operationKey: keyof LoadingStates, operation: () => Promise<T>) => Promise<T>;
}

// Store state interfaces
export interface ModalSlice {
  modalStates: ModalStates;
  selectedData: SelectedData;
  modalActions: ModalActions;
}

export interface TransactionSlice {
  transactions: Transaction[];
  transactionCache: TransactionCache;
  banks: Bank[];
  cards: Card[];
  transactionActions: TransactionActions;
}

export interface ScheduleSlice {
  schedules: { [key: string]: MonthlySchedule };
  scheduleCache: ScheduleCache;
  scheduleActions: ScheduleActions;
}

export interface UISlice {
  loading: LoadingStates;
  errors: ErrorStates;
  uiActions: UIActions;
}

// Combined store interface
export interface AppStore extends ModalSlice, TransactionSlice, ScheduleSlice, UISlice {}

// Selector types
export interface ModalSelectors {
  isModalOpen: (modalType: ModalType) => boolean;
  getSelectedData: () => SelectedData;
  getSelectedTransaction: () => Transaction | null;
  getSelectedScheduleItem: () => ScheduleItem | null;
}

export interface TransactionSelectors {
  getTransactions: () => Transaction[];
  getTransactionById: (id: string) => Transaction | null;
  getTransactionsByDateRange: (start: number, end: number) => Transaction[];
  getBanks: () => Bank[];
  getCards: () => Card[];
  isTransactionsLoading: () => boolean;
  getTransactionsError: () => DatabaseError | null;
}

export interface ScheduleSelectors {
  getMonthlySchedule: (year: number, month: number) => MonthlySchedule | null;
  isSchedulesLoading: () => boolean;
  getSchedulesError: () => DatabaseError | null;
}

export interface UISelectors {
  isLoading: (key: keyof LoadingStates) => boolean;
  getError: (key: keyof ErrorStates) => DatabaseError | null;
  hasAnyError: () => boolean;
  isAnythingLoading: () => boolean;
}

// Cache configuration
export const CACHE_DURATIONS = {
  TRANSACTIONS: 5 * 60 * 1000, // 5 minutes
  SCHEDULES: 10 * 60 * 1000,   // 10 minutes
  BANKS: 30 * 60 * 1000,       // 30 minutes
  CARDS: 30 * 60 * 1000,       // 30 minutes
} as const;

// Store configuration
export interface StoreConfig {
  enableDevtools?: boolean;
  persistState?: boolean;
  cacheEnabled?: boolean;
}