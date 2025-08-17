import { useState, useCallback } from 'react';
import { Transaction, TransactionInput, ScheduleItem, Bank, Card } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

// Modal types for type safety
export type ModalType = 
  | 'transaction'
  | 'transactionView'
  | 'scheduleView'
  | 'scheduleEdit'
  | 'dayTotal';

// Combined modal state interface
export interface ModalStates {
  transaction: boolean;
  transactionView: boolean;
  scheduleView: boolean;
  scheduleEdit: boolean;
  dayTotal: boolean;
}

// Selected data interface
export interface SelectedData {
  date: Date | null;
  transaction: Transaction | null;
  transactions: Transaction[];
  scheduleItems: ScheduleItem[];
  scheduleItem: ScheduleItem | null;
  dayTotalData: DayTotalData | null;
}

// Modal manager configuration
export interface ModalManagerConfig {
  // Data operation handlers
  onTransactionSave?: (transactionInput: TransactionInput) => Promise<void>;
  onTransactionDelete?: (transactionId: string) => Promise<void>;
  onScheduleSave?: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onScheduleDelete?: (scheduleId: string) => Promise<void>;
  onScheduleTransactionClick?: (transactionId: string) => Promise<void>;
  
  // Cross-modal handlers
  onTransactionViewTransactionClick?: (transaction: Transaction) => void;
  
  // Data providers
  banks?: Bank[];
  cards?: Card[];
  isLoading?: boolean;
}

// Return type for the hook
export interface UseModalManagerReturn {
  // Modal states
  modalStates: ModalStates;
  selectedData: SelectedData;
  
  // Modal control handlers
  openTransactionModal: (date: Date, transaction?: Transaction) => void;
  openTransactionViewModal: (date: Date, transactions: Transaction[]) => void;
  openScheduleViewModal: (date: Date, scheduleItems: ScheduleItem[]) => void;
  openScheduleEditModal: (scheduleItem: ScheduleItem) => void;
  openDayTotalModal: (date: Date, dayTotalData: DayTotalData) => void;
  
  // Close handlers
  closeTransactionModal: () => void;
  closeTransactionViewModal: () => void;
  closeScheduleViewModal: () => void;
  closeScheduleEditModal: () => void;
  closeDayTotalModal: () => void;
  closeAllModals: () => void;
  
  // Internal handlers for cross-modal operations
  handleTransactionViewTransactionClick: (transaction: Transaction) => void;
  handleScheduleTransactionClick: (transactionId: string) => Promise<void>;
  
  // Direct event handlers for Transaction operations
  handleTransactionSave: (transactionInput: TransactionInput) => Promise<void>;
  handleTransactionDelete: (transactionId: string) => Promise<void>;
  handleScheduleSave: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  handleScheduleDelete: (scheduleId: string) => Promise<void>;
}

export function useModalManager(config: ModalManagerConfig = {}): UseModalManagerReturn {
  // Modal states
  const [modalStates, setModalStates] = useState<ModalStates>({
    transaction: false,
    transactionView: false,
    scheduleView: false,
    scheduleEdit: false,
    dayTotal: false,
  });
  
  // Selected data
  const [selectedData, setSelectedData] = useState<SelectedData>({
    date: null,
    transaction: null,
    transactions: [],
    scheduleItems: [],
    scheduleItem: null,
    dayTotalData: null,
  });
  
  // Helper function to update modal state
  const updateModalState = useCallback((modalType: ModalType, isOpen: boolean) => {
    setModalStates(prev => ({
      ...prev,
      [modalType]: isOpen,
    }));
  }, []);
  
  // Helper function to clear selected data
  const clearSelectedData = useCallback(() => {
    setSelectedData({
      date: null,
      transaction: null,
      transactions: [],
      scheduleItems: [],
      scheduleItem: null,
      dayTotalData: null,
    });
  }, []);
  
  // Open transaction modal (for new transaction or edit existing)
  const openTransactionModal = useCallback((date: Date, transaction?: Transaction) => {
    setSelectedData(prev => ({
      ...prev,
      date,
      transaction: transaction || null,
    }));
    updateModalState('transaction', true);
  }, [updateModalState]);
  
  // Open transaction view modal (for viewing multiple transactions)
  const openTransactionViewModal = useCallback((date: Date, transactions: Transaction[]) => {
    setSelectedData(prev => ({
      ...prev,
      date,
      transactions,
    }));
    updateModalState('transactionView', true);
  }, [updateModalState]);
  
  // Open schedule view modal (for viewing multiple schedule items)
  const openScheduleViewModal = useCallback((date: Date, scheduleItems: ScheduleItem[]) => {
    setSelectedData(prev => ({
      ...prev,
      date,
      scheduleItems,
    }));
    updateModalState('scheduleView', true);
  }, [updateModalState]);
  
  // Open schedule edit modal (for editing a single schedule item)
  const openScheduleEditModal = useCallback((scheduleItem: ScheduleItem) => {
    setSelectedData(prev => ({
      ...prev,
      scheduleItem,
    }));
    updateModalState('scheduleEdit', true);
  }, [updateModalState]);
  
  // Open day total modal (for viewing day totals)
  const openDayTotalModal = useCallback((date: Date, dayTotalData: DayTotalData) => {
    setSelectedData(prev => ({
      ...prev,
      date,
      dayTotalData,
    }));
    updateModalState('dayTotal', true);
  }, [updateModalState]);
  
  // Close individual modals
  const closeTransactionModal = useCallback(() => {
    updateModalState('transaction', false);
    setSelectedData(prev => ({
      ...prev,
      transaction: null,
      date: null,
    }));
  }, [updateModalState]);
  
  const closeTransactionViewModal = useCallback(() => {
    updateModalState('transactionView', false);
    setSelectedData(prev => ({
      ...prev,
      transactions: [],
    }));
  }, [updateModalState]);
  
  const closeScheduleViewModal = useCallback(() => {
    updateModalState('scheduleView', false);
    setSelectedData(prev => ({
      ...prev,
      scheduleItems: [],
    }));
  }, [updateModalState]);
  
  const closeScheduleEditModal = useCallback(() => {
    updateModalState('scheduleEdit', false);
    setSelectedData(prev => ({
      ...prev,
      scheduleItem: null,
    }));
  }, [updateModalState]);
  
  const closeDayTotalModal = useCallback(() => {
    updateModalState('dayTotal', false);
    setSelectedData(prev => ({
      ...prev,
      dayTotalData: null,
    }));
  }, [updateModalState]);
  
  // Close all modals and clear data
  const closeAllModals = useCallback(() => {
    setModalStates({
      transaction: false,
      transactionView: false,
      scheduleView: false,
      scheduleEdit: false,
      dayTotal: false,
    });
    clearSelectedData();
  }, [clearSelectedData]);
  
  // Cross-modal operation: Transaction view modal -> Transaction modal
  const handleTransactionViewTransactionClick = useCallback((transaction: Transaction) => {
    // Close transaction view modal
    updateModalState('transactionView', false);
    setSelectedData(prev => ({
      ...prev,
      transactions: [],
    }));
    
    // Open transaction modal with the selected transaction
    openTransactionModal(new Date(transaction.date), transaction);
  }, [updateModalState, openTransactionModal]);
  
  // Cross-modal operation: Schedule modal -> Transaction modal
  const handleScheduleTransactionClick = useCallback(async (transactionId: string) => {
    if (config.onScheduleTransactionClick) {
      await config.onScheduleTransactionClick(transactionId);
    }
  }, [config]);
  
  // Transaction save handler with modal management
  const handleTransactionSave = useCallback(async (transactionInput: TransactionInput) => {
    if (config.onTransactionSave) {
      await config.onTransactionSave(transactionInput);
      
      // Close all modals after successful save
      closeAllModals();
    }
  }, [config, closeAllModals]);
  
  // Transaction delete handler with modal management
  const handleTransactionDelete = useCallback(async (transactionId: string) => {
    if (config.onTransactionDelete) {
      await config.onTransactionDelete(transactionId);
      
      // Close all modals after successful delete
      closeAllModals();
    }
  }, [config, closeAllModals]);
  
  // Schedule save handler
  const handleScheduleSave = useCallback(async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    if (config.onScheduleSave) {
      await config.onScheduleSave(scheduleId, updates);
    }
  }, [config]);
  
  // Schedule delete handler
  const handleScheduleDelete = useCallback(async (scheduleId: string) => {
    if (config.onScheduleDelete) {
      await config.onScheduleDelete(scheduleId);
    }
  }, [config]);
  
  return {
    // State
    modalStates,
    selectedData,
    
    // Modal control
    openTransactionModal,
    openTransactionViewModal,
    openScheduleViewModal,
    openScheduleEditModal,
    openDayTotalModal,
    
    // Close handlers
    closeTransactionModal,
    closeTransactionViewModal,
    closeScheduleViewModal,
    closeScheduleEditModal,
    closeDayTotalModal,
    closeAllModals,
    
    // Cross-modal handlers
    handleTransactionViewTransactionClick,
    handleScheduleTransactionClick,
    
    // Data operation handlers
    handleTransactionSave,
    handleTransactionDelete,
    handleScheduleSave,
    handleScheduleDelete,
  };
}