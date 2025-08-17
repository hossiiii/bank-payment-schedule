import { StateCreator } from 'zustand';
import { 
  ModalSlice, 
  ModalType, 
  ModalStates, 
  SelectedData, 
  AppStore 
} from '../types';
import { Transaction, ScheduleItem } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

// Initial state
const initialModalStates: ModalStates = {
  transaction: false,
  transactionView: false,
  scheduleView: false,
  scheduleEdit: false,
  dayTotal: false,
};

const initialSelectedData: SelectedData = {
  date: null,
  transaction: null,
  transactions: [],
  scheduleItems: [],
  scheduleItem: null,
  dayTotalData: null,
};

export const createModalSlice: StateCreator<
  AppStore,
  [],
  [],
  ModalSlice
> = (set, get) => ({
  modalStates: initialModalStates,
  selectedData: initialSelectedData,
  
  modalActions: {
    // Open a specific modal with optional data
    openModal: (modalType: ModalType, data?: Partial<SelectedData>) => {
      set((state) => ({
        modalStates: {
          ...state.modalStates,
          [modalType]: true,
        },
        selectedData: data ? {
          ...state.selectedData,
          ...data,
        } : state.selectedData,
      }));
    },

    // Close a specific modal and clear related data
    closeModal: (modalType: ModalType) => {
      set((state) => {
        const newSelectedData = { ...state.selectedData };
        
        // Clear modal-specific data when closing
        switch (modalType) {
          case 'transaction':
            newSelectedData.transaction = null;
            newSelectedData.date = null;
            break;
          case 'transactionView':
            newSelectedData.transactions = [];
            break;
          case 'scheduleView':
            newSelectedData.scheduleItems = [];
            break;
          case 'scheduleEdit':
            newSelectedData.scheduleItem = null;
            break;
          case 'dayTotal':
            newSelectedData.dayTotalData = null;
            break;
        }

        return {
          modalStates: {
            ...state.modalStates,
            [modalType]: false,
          },
          selectedData: newSelectedData,
        };
      });
    },

    // Close all modals and clear all data
    closeAllModals: () => {
      set({
        modalStates: initialModalStates,
        selectedData: initialSelectedData,
      });
    },

    // Set selected data directly
    setSelectedData: (data: Partial<SelectedData>) => {
      set((state) => ({
        selectedData: {
          ...state.selectedData,
          ...data,
        },
      }));
    },

    // Clear all selected data
    clearSelectedData: () => {
      set({
        selectedData: initialSelectedData,
      });
    },

    // Cross-modal operation: Transaction view modal -> Transaction modal
    handleTransactionViewTransactionClick: (transaction: Transaction) => {
      const { actions } = get();
      
      // Close transaction view modal
      actions.closeModal('transactionView');
      
      // Open transaction modal with the selected transaction
      actions.openModal('transaction', {
        date: new Date(transaction.date),
        transaction: transaction,
      });
    },

    // Cross-modal operation: Schedule modal -> Transaction modal
    handleScheduleTransactionClick: async (transactionId: string) => {
      const { transactionActions } = get();
      
      try {
        // Fetch the transaction by ID
        const transaction = await transactionActions.fetchTransactionById(transactionId);
        
        if (transaction) {
          // Close any open modals first
          get().modalActions.closeAllModals();
          
          // Open transaction modal with the fetched transaction
          get().modalActions.openModal('transaction', {
            date: new Date(transaction.date),
            transaction: transaction,
          });
        }
      } catch (error) {
        console.error('Failed to fetch transaction for cross-modal operation:', error);
        // Optionally set an error state here
      }
    },

    // Proxy method for fetching transactions
    fetchTransactionById: async (id: string): Promise<Transaction | null> => {
      const { transactionActions } = get();
      return await transactionActions.fetchTransactionById(id);
    },
  },
});

// Convenience functions that match the original useModalManager API
export const createModalActions = (get: () => AppStore, set: (partial: Partial<AppStore>) => void) => ({
  // Individual modal openers
  openTransactionModal: (date: Date, transaction?: Transaction) => {
    get().modalActions.openModal('transaction', { date, transaction: transaction || null });
  },

  openTransactionViewModal: (date: Date, transactions: Transaction[]) => {
    get().modalActions.openModal('transactionView', { date, transactions });
  },

  openScheduleViewModal: (date: Date, scheduleItems: ScheduleItem[]) => {
    get().modalActions.openModal('scheduleView', { date, scheduleItems });
  },

  openScheduleEditModal: (scheduleItem: ScheduleItem) => {
    get().modalActions.openModal('scheduleEdit', { scheduleItem });
  },

  openDayTotalModal: (date: Date, dayTotalData: DayTotalData) => {
    get().modalActions.openModal('dayTotal', { date, dayTotalData });
  },

  // Individual modal closers
  closeTransactionModal: () => get().actions.closeModal('transaction'),
  closeTransactionViewModal: () => get().actions.closeModal('transactionView'),
  closeScheduleViewModal: () => get().actions.closeModal('scheduleView'),
  closeScheduleEditModal: () => get().actions.closeModal('scheduleEdit'),
  closeDayTotalModal: () => get().actions.closeModal('dayTotal'),
  closeAllModals: () => get().actions.closeAllModals(),

  // Cross-modal handlers
  handleTransactionViewTransactionClick: (transaction: Transaction) => {
    get().modalActions.handleTransactionViewTransactionClick(transaction);
  },

  handleScheduleTransactionClick: async (transactionId: string) => {
    await get().actions.handleScheduleTransactionClick(transactionId);
  },
});