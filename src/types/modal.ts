import { Transaction, ScheduleItem, Bank, Card } from './database';
import { DayTotalData } from './calendar';

/**
 * Modal display states management
 */
export interface ModalStates {
  transactionView: boolean;
  scheduleView: boolean;
  transactionEdit: boolean;
  scheduleEdit: boolean;
  dayTotal: boolean;
}

/**
 * Modal management handlers
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
 * Integrated modal management context type
 */
export interface CalendarModalContext {
  // State
  modalStates: ModalStates;
  selectedDate: Date | null;
  selectedTransactions: Transaction[];
  selectedScheduleItems: ScheduleItem[];
  selectedTransaction: Transaction | null;
  selectedScheduleItem: ScheduleItem | null;
  selectedDayTotalData: DayTotalData | null;
  
  // Handlers
  handlers: ModalHandlers;
  
  // Common data
  banks: Bank[];
  cards: Card[];
  
  // Data operations
  onTransactionSave: (transaction: Partial<Transaction> & { id?: string }) => Promise<void>;
  onTransactionDelete: (transactionId: string) => Promise<void>;
  onScheduleSave: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onScheduleDelete: (scheduleId: string) => Promise<void>;
}

/**
 * Schedule modal state management
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
 * Schedule edit form data type
 */
export interface ScheduleEditFormData {
  amount: number;
  storeName?: string;
  usage?: string;
  memo?: string;
}

/**
 * Schedule edit event handlers type
 */
export interface ScheduleEditHandlers {
  onScheduleClick: (scheduleItem: ScheduleItem) => void;
  onScheduleEdit: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onScheduleDelete?: (scheduleId: string) => Promise<void>;
}

/**
 * Modal manager hook return type
 */
export interface ModalManagerReturn {
  // Modal states
  transactionViewModal: {
    isOpen: boolean;
    transactions: Transaction[];
    selectedDate: Date | null;
  };
  scheduleViewModal: {
    isOpen: boolean;
    scheduleItems: ScheduleItem[];
    selectedDate: Date | null;
  };
  transactionEditModal: {
    isOpen: boolean;
    transaction: Transaction | null;
  };
  scheduleEditModal: {
    isOpen: boolean;
    scheduleItem: ScheduleItem | null;
  };
  dayTotalModal: {
    isOpen: boolean;
    selectedDate: Date | null;
    dayTotalData: DayTotalData | null;
  };

  // Modal actions
  openTransactionViewModal: (transactions: Transaction[], date: Date) => void;
  openScheduleViewModal: (scheduleItems: ScheduleItem[], date: Date) => void;
  openTransactionEditModal: (transaction?: Transaction) => void;
  openScheduleEditModal: (scheduleItem: ScheduleItem) => void;
  openDayTotalModal: (date: Date, dayTotalData: DayTotalData) => void;
  closeAllModals: () => void;
}

/**
 * Error handling type
 */
export interface ModalError {
  type: 'validation' | 'network' | 'permission' | 'unknown';
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * Modal operation result type
 */
export interface ModalOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: ModalError;
}