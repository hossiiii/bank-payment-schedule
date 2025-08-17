import { 
  AppStore, 
  ModalType, 
  LoadingStates, 
  ErrorStates,
  SelectedData 
} from '../types';
import { 
  Transaction, 
  ScheduleItem, 
  MonthlySchedule, 
  Bank, 
  Card, 
  DatabaseError 
} from '@/types/database';

// Modal selectors
export const modalSelectors = {
  // Check if a specific modal is open
  isModalOpen: (state: AppStore, modalType: ModalType): boolean => {
    return state.modalStates[modalType];
  },

  // Check if any modal is open
  isAnyModalOpen: (state: AppStore): boolean => {
    return Object.values(state.modalStates).some(Boolean);
  },

  // Get all selected data
  getSelectedData: (state: AppStore): SelectedData => {
    return state.selectedData;
  },

  // Get selected transaction
  getSelectedTransaction: (state: AppStore): Transaction | null => {
    return state.selectedData.transaction;
  },

  // Get selected transactions array
  getSelectedTransactions: (state: AppStore): Transaction[] => {
    return state.selectedData.transactions;
  },

  // Get selected schedule item
  getSelectedScheduleItem: (state: AppStore): ScheduleItem | null => {
    return state.selectedData.scheduleItem;
  },

  // Get selected schedule items array
  getSelectedScheduleItems: (state: AppStore): ScheduleItem[] => {
    return state.selectedData.scheduleItems;
  },

  // Get selected date
  getSelectedDate: (state: AppStore): Date | null => {
    return state.selectedData.date;
  },

  // Get selected day total data
  getSelectedDayTotalData: (state: AppStore) => {
    return state.selectedData.dayTotalData;
  },
};

// Transaction selectors
export const transactionSelectors = {
  // Get all transactions
  getTransactions: (state: AppStore): Transaction[] => {
    return state.transactions;
  },

  // Get transaction by ID
  getTransactionById: (state: AppStore, id: string): Transaction | null => {
    return state.transactions.find(t => t.id === id) || null;
  },

  // Get transactions by date range
  getTransactionsByDateRange: (state: AppStore, start: number, end: number): Transaction[] => {
    return state.transactions.filter(
      transaction => transaction.date >= start && transaction.date <= end
    );
  },

  // Get transactions by payment type
  getTransactionsByPaymentType: (state: AppStore, paymentType: 'bank' | 'card'): Transaction[] => {
    return state.transactions.filter(
      transaction => transaction.paymentType === paymentType
    );
  },

  // Get transactions by bank ID
  getTransactionsByBank: (state: AppStore, bankId: string): Transaction[] => {
    return state.transactions.filter(
      transaction => transaction.bankId === bankId
    );
  },

  // Get transactions by card ID
  getTransactionsByCard: (state: AppStore, cardId: string): Transaction[] => {
    return state.transactions.filter(
      transaction => transaction.cardId === cardId
    );
  },

  // Get all banks
  getBanks: (state: AppStore): Bank[] => {
    return state.banks;
  },

  // Get bank by ID
  getBankById: (state: AppStore, id: string): Bank | null => {
    return state.banks.find(b => b.id === id) || null;
  },

  // Get all cards
  getCards: (state: AppStore): Card[] => {
    return state.cards;
  },

  // Get card by ID
  getCardById: (state: AppStore, id: string): Card | null => {
    return state.cards.find(c => c.id === id) || null;
  },

  // Get cards by bank ID
  getCardsByBank: (state: AppStore, bankId: string): Card[] => {
    return state.cards.filter(card => card.bankId === bankId);
  },

  // Calculate total amount for transactions
  getTransactionTotal: (state: AppStore, transactions?: Transaction[]): number => {
    const targetTransactions = transactions || state.transactions;
    return targetTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  },

  // Get transaction count
  getTransactionCount: (state: AppStore): number => {
    return state.transactions.length;
  },

  // Get transactions for today
  getTodayTransactions: (state: AppStore): Transaction[] => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    
    return state.transactions.filter(
      transaction => transaction.date >= startOfDay && transaction.date <= endOfDay
    );
  },

  // Get transactions for current month
  getCurrentMonthTransactions: (state: AppStore): Transaction[] => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    
    return state.transactions.filter(
      transaction => transaction.date >= startOfMonth && transaction.date <= endOfMonth
    );
  },
};

// Schedule selectors
export const scheduleSelectors = {
  // Get monthly schedule
  getMonthlySchedule: (state: AppStore, year: number, month: number): MonthlySchedule | null => {
    const key = `${year}-${month}`;
    return state.schedules[key] || null;
  },

  // Get schedule items for a specific month
  getScheduleItems: (state: AppStore, year: number, month: number): ScheduleItem[] => {
    const schedule = scheduleSelectors.getMonthlySchedule(state, year, month);
    return schedule?.items || [];
  },

  // Get schedule items for a specific date
  getScheduleItemsForDate: (state: AppStore, year: number, month: number, date: Date): ScheduleItem[] => {
    const items = scheduleSelectors.getScheduleItems(state, year, month);
    const targetDate = date.toDateString();
    return items.filter(item => item.date.toDateString() === targetDate);
  },

  // Get schedule items by bank
  getScheduleItemsByBank: (state: AppStore, year: number, month: number, bankName: string): ScheduleItem[] => {
    const items = scheduleSelectors.getScheduleItems(state, year, month);
    return items.filter(item => item.bankName === bankName);
  },

  // Get monthly schedule total
  getMonthlyScheduleTotal: (state: AppStore, year: number, month: number): number => {
    const schedule = scheduleSelectors.getMonthlySchedule(state, year, month);
    return schedule?.totalAmount || 0;
  },

  // Get bank totals for a month
  getBankTotalsForMonth: (state: AppStore, year: number, month: number) => {
    const schedule = scheduleSelectors.getMonthlySchedule(state, year, month);
    return schedule?.bankTotals || [];
  },

  // Check if schedule data exists
  hasScheduleData: (state: AppStore, year: number, month: number): boolean => {
    return scheduleSelectors.getMonthlySchedule(state, year, month) !== null;
  },

  // Get editable schedule items
  getEditableScheduleItems: (state: AppStore, year: number, month: number): ScheduleItem[] => {
    const items = scheduleSelectors.getScheduleItems(state, year, month);
    return items.filter(item => item.isScheduleEditable);
  },

  // Get upcoming schedule items (next 7 days)
  getUpcomingScheduleItems: (state: AppStore): ScheduleItem[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const allItems: ScheduleItem[] = [];
    
    // Collect items from all loaded schedules
    Object.values(state.schedules).forEach(schedule => {
      schedule.items.forEach(item => {
        if (item.date >= today && item.date <= nextWeek) {
          allItems.push(item);
        }
      });
    });
    
    // Sort by date
    return allItems.sort((a, b) => a.date.getTime() - b.date.getTime());
  },
};

// UI selectors
export const uiSelectors = {
  // Check if specific operation is loading
  isLoading: (state: AppStore, key: keyof LoadingStates): boolean => {
    return state.loading[key];
  },

  // Check if any operation is loading
  isAnythingLoading: (state: AppStore): boolean => {
    return Object.values(state.loading).some(Boolean);
  },

  // Get specific error
  getError: (state: AppStore, key: keyof ErrorStates): DatabaseError | null => {
    return state.errors[key];
  },

  // Check if any error exists
  hasAnyError: (state: AppStore): boolean => {
    return Object.values(state.errors).some(Boolean);
  },

  // Get all active errors
  getActiveErrors: (state: AppStore): Array<{ key: keyof ErrorStates; error: DatabaseError }> => {
    return Object.entries(state.errors)
      .filter(([, error]) => error !== null)
      .map(([key, error]) => ({ 
        key: key as keyof ErrorStates, 
        error: error as DatabaseError 
      }));
  },

  // Get loading states
  getLoadingStates: (state: AppStore): LoadingStates => {
    return state.loading;
  },

  // Get error states
  getErrorStates: (state: AppStore): ErrorStates => {
    return state.errors;
  },

  // Check if transactions are loading
  isTransactionsLoading: (state: AppStore): boolean => {
    return state.loading.transactions;
  },

  // Check if schedules are loading
  isSchedulesLoading: (state: AppStore): boolean => {
    return state.loading.schedules;
  },

  // Check if saving
  isSaving: (state: AppStore): boolean => {
    return state.loading.saving;
  },

  // Check if deleting
  isDeleting: (state: AppStore): boolean => {
    return state.loading.deleting;
  },

  // Get transactions error
  getTransactionsError: (state: AppStore): DatabaseError | null => {
    return state.errors.transactions;
  },

  // Get schedules error
  getSchedulesError: (state: AppStore): DatabaseError | null => {
    return state.errors.schedules;
  },
};

// Combined selectors object for easy import
export const selectors = {
  modal: modalSelectors,
  transaction: transactionSelectors,
  schedule: scheduleSelectors,
  ui: uiSelectors,
};

// Selector factory functions for memoization
export const createTransactionSelector = (id: string) => (state: AppStore) => 
  transactionSelectors.getTransactionById(state, id);

export const createScheduleSelector = (year: number, month: number) => (state: AppStore) => 
  scheduleSelectors.getMonthlySchedule(state, year, month);

export const createTransactionsByDateRangeSelector = (start: number, end: number) => (state: AppStore) => 
  transactionSelectors.getTransactionsByDateRange(state, start, end);

export const createScheduleItemsForDateSelector = (year: number, month: number, date: Date) => (state: AppStore) => 
  scheduleSelectors.getScheduleItemsForDate(state, year, month, date);

// Derived state selectors (computed values)
export const derivedSelectors = {
  // Get transaction statistics
  getTransactionStats: (state: AppStore) => {
    const transactions = state.transactions;
    const total = transactionSelectors.getTransactionTotal(state);
    const count = transactions.length;
    const cardTransactions = transactionSelectors.getTransactionsByPaymentType(state, 'card');
    const bankTransactions = transactionSelectors.getTransactionsByPaymentType(state, 'bank');
    
    return {
      total,
      count,
      cardTotal: transactionSelectors.getTransactionTotal(state, cardTransactions),
      bankTotal: transactionSelectors.getTransactionTotal(state, bankTransactions),
      cardCount: cardTransactions.length,
      bankCount: bankTransactions.length,
    };
  },

  // Get current month summary
  getCurrentMonthSummary: (state: AppStore) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const transactions = transactionSelectors.getCurrentMonthTransactions(state);
    const schedule = scheduleSelectors.getMonthlySchedule(state, year, month);
    
    return {
      transactionTotal: transactionSelectors.getTransactionTotal(state, transactions),
      transactionCount: transactions.length,
      scheduleTotal: schedule?.totalAmount || 0,
      scheduleCount: schedule?.items.length || 0,
    };
  },

  // Get data loading status summary
  getLoadingStatus: (state: AppStore) => {
    return {
      isAnyLoading: uiSelectors.isAnythingLoading(state),
      isTransactionsLoading: uiSelectors.isTransactionsLoading(state),
      isSchedulesLoading: uiSelectors.isSchedulesLoading(state),
      isSaving: uiSelectors.isSaving(state),
      isDeleting: uiSelectors.isDeleting(state),
    };
  },
};