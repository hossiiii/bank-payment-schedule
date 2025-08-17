import { useCallback } from 'react';
import { 
  useAppStore, 
  useStoreActions, 
  selectors 
} from '@/store';
import { 
  ModalManagerConfig, 
  UseModalManagerReturn 
} from './useModalManager';
import { logError, logWarn } from '@/lib/utils/logger';
import { Transaction, TransactionInput, ScheduleItem } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

/**
 * Migration adapter hook that provides the same API as useModalManager
 * but uses the new Zustand store underneath for backward compatibility.
 * 
 * This allows existing components to work without changes while using
 * the new global state management system.
 */
export function useModalManagerAdapter(config: ModalManagerConfig = {}): UseModalManagerReturn {
  const modalStates = useAppStore((state) => state.modalStates);
  const selectedData = useAppStore((state) => state.selectedData);
  const { modal, transaction, schedule } = useStoreActions();
  
  // Cross-modal operation handlers
  const handleTransactionViewTransactionClick = useCallback((transaction: Transaction) => {
    modal.handleTransactionViewTransactionClick(transaction);
  }, [modal]);

  const handleScheduleTransactionClick = useCallback(async (transactionId: string) => {
    await modal.handleScheduleTransactionClick(transactionId);
  }, [modal]);

  // Data operation handlers that integrate with store and config callbacks
  const handleTransactionSave = useCallback(async (transactionInput: TransactionInput) => {
    try {
      if (selectedData.transaction) {
        // Update existing transaction
        // TODO: Implement updateTransaction in store slice
        logWarn('updateTransaction not yet implemented in Zustand store', undefined, 'useModalManagerAdapter');
      } else {
        // Create new transaction
        // TODO: Implement createTransaction in store slice
        logWarn('createTransaction not yet implemented in Zustand store', undefined, 'useModalManagerAdapter');
      }
      
      // Call config callback if provided
      if (config.onTransactionSave) {
        await config.onTransactionSave(transactionInput);
      }
    } catch (error) {
      logError('Failed to save transaction', error, 'useModalManagerAdapter');
      throw error;
    }
  }, [selectedData.transaction, config]);

  const handleTransactionDelete = useCallback(async (transactionId: string) => {
    try {
      await transaction.deleteTransaction(transactionId);
      
      // Call config callback if provided
      if (config.onTransactionDelete) {
        await config.onTransactionDelete(transactionId);
      }
    } catch (error) {
      logError('Failed to delete transaction', error, 'useModalManagerAdapter');
      throw error;
    }
  }, [transaction, config]);

  const handleScheduleSave = useCallback(async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    try {
      await schedule.updateScheduleItem(scheduleId, updates);
      
      // Call config callback if provided
      if (config.onScheduleSave) {
        await config.onScheduleSave(scheduleId, updates);
      }
    } catch (error) {
      logError('Failed to save schedule', error, 'useModalManagerAdapter');
      throw error;
    }
  }, [schedule, config]);

  const handleScheduleDelete = useCallback(async (scheduleId: string) => {
    try {
      await schedule.deleteScheduleItem(scheduleId);
      
      // Call config callback if provided
      if (config.onScheduleDelete) {
        await config.onScheduleDelete(scheduleId);
      }
    } catch (error) {
      logError('Failed to delete schedule', error, 'useModalManagerAdapter');
      throw error;
    }
  }, [schedule, config]);

  // Return the same interface as useModalManager
  return {
    // Modal states
    modalStates,
    selectedData,
    
    // Modal control handlers - these map directly to the new store actions
    openTransactionModal: modal.openTransactionModal,
    openTransactionViewModal: modal.openTransactionViewModal,
    openScheduleViewModal: modal.openScheduleViewModal,
    openScheduleEditModal: modal.openScheduleEditModal,
    openDayTotalModal: modal.openDayTotalModal,
    
    // Close handlers
    closeTransactionModal: modal.closeTransactionModal,
    closeTransactionViewModal: modal.closeTransactionViewModal,
    closeScheduleViewModal: modal.closeScheduleViewModal,
    closeScheduleEditModal: modal.closeScheduleEditModal,
    closeDayTotalModal: modal.closeDayTotalModal,
    closeAllModals: modal.closeAllModals,
    
    // Cross-modal handlers
    handleTransactionViewTransactionClick,
    handleScheduleTransactionClick,
    
    // Data operation handlers that integrate config callbacks
    handleTransactionSave,
    handleTransactionDelete,
    handleScheduleSave,
    handleScheduleDelete,
  };
}

/**
 * Enhanced version of the modal manager adapter that includes additional
 * store functionality not available in the original useModalManager
 */
export function useEnhancedModalManager(config: ModalManagerConfig = {}) {
  const adapter = useModalManagerAdapter(config);
  const storeActions = useStoreActions();
  const isLoading = useAppStore(selectors.ui.isAnythingLoading);
  const hasError = useAppStore(selectors.ui.hasAnyError);
  const activeErrors = useAppStore(selectors.ui.getActiveErrors);
  
  return {
    ...adapter,
    
    // Additional store functionality
    store: {
      // Loading states
      isLoading,
      isTransactionsLoading: useAppStore(selectors.ui.isTransactionsLoading),
      isSchedulesLoading: useAppStore(selectors.ui.isSchedulesLoading),
      isSaving: useAppStore(selectors.ui.isSaving),
      isDeleting: useAppStore(selectors.ui.isDeleting),
      
      // Error states
      hasError,
      activeErrors,
      transactionsError: useAppStore(selectors.ui.getTransactionsError),
      schedulesError: useAppStore(selectors.ui.getSchedulesError),
      
      // Data access
      transactions: useAppStore(selectors.transaction.getTransactions),
      banks: useAppStore(selectors.transaction.getBanks),
      cards: useAppStore(selectors.transaction.getCards),
      
      // Utility functions
      clearErrors: storeActions.ui.clearErrors,
      invalidateCache: () => {
        storeActions.transaction.clearTransactionCache();
        storeActions.schedule.clearScheduleCache();
      },
      
      // Data fetching
      fetchTransactions: storeActions.transaction.fetchTransactions,
      fetchBanks: storeActions.transaction.fetchBanks,
      fetchCards: storeActions.transaction.fetchCards,
      fetchMonthlySchedule: storeActions.schedule.fetchMonthlySchedule,
    },
  };
}

/**
 * Hook that provides only the data operations from the store
 * for components that don't need modal management
 */
export function useStoreDataOperations() {
  const { transaction, schedule, ui } = useStoreActions();
  
  return {
    // Transaction operations
    createTransaction: transaction.createTransaction,
    updateTransaction: transaction.updateTransaction,
    deleteTransaction: transaction.deleteTransaction,
    fetchTransactions: transaction.fetchTransactions,
    fetchTransactionById: transaction.fetchTransactionById,
    
    // Schedule operations
    updateScheduleItem: schedule.updateScheduleItem,
    deleteScheduleItem: schedule.deleteScheduleItem,
    fetchMonthlySchedule: schedule.fetchMonthlySchedule,
    
    // Supporting data
    fetchBanks: transaction.fetchBanks,
    fetchCards: transaction.fetchCards,
    
    // Cache management
    invalidateTransactionCache: transaction.invalidateTransactionCache,
    invalidateScheduleCache: schedule.invalidateScheduleCache,
    
    // Error management
    clearErrors: ui.clearErrors,
    clearError: ui.clearError,
  };
}

/**
 * Hook for accessing derived/computed state from the store
 */
export function useStoreComputedState() {
  return {
    // Modal state
    isAnyModalOpen: useAppStore(selectors.modal.isAnyModalOpen),
    
    // Transaction statistics
    transactionStats: useAppStore(selectors.derivedSelectors.getTransactionStats),
    currentMonthSummary: useAppStore(selectors.derivedSelectors.getCurrentMonthSummary),
    
    // Loading status
    loadingStatus: useAppStore(selectors.derivedSelectors.getLoadingStatus),
    
    // Upcoming schedules
    upcomingScheduleItems: useAppStore(selectors.schedule.getUpcomingScheduleItems),
    
    // Today's data
    todayTransactions: useAppStore(selectors.transaction.getTodayTransactions),
    currentMonthTransactions: useAppStore(selectors.transaction.getCurrentMonthTransactions),
  };
}