import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppStore, StoreConfig } from './types';
import { createModalSlice, createModalActions } from './slices/modalSlice';
import { createTransactionSlice, createTransactionHelpers } from './slices/transactionSlice';
import { createScheduleSlice, createScheduleHelpers } from './slices/scheduleSlice';
import { createUISlice, createUIHelpers } from './slices/uiSlice';

// Create the store with all slices combined
const createAppStore = (config: StoreConfig = {}) =>
  create<AppStore>()(
    devtools(
      (...args) => ({
        // Combine all slices
        ...createModalSlice(...args),
        ...createTransactionSlice(...args),
        ...createScheduleSlice(...args),
        ...createUISlice(...args),
      }),
      {
        name: 'bank-payment-schedule-store',
        enabled: config.enableDevtools ?? process.env.NODE_ENV === 'development',
      }
    )
  );

// Create the main store instance
export const useAppStore = createAppStore({
  enableDevtools: true,
  cacheEnabled: true,
});

// Helper hook for accessing store actions with enhanced API
export const useStoreActions = () => {
  const store = useAppStore();
  
  return {
    // Modal actions with enhanced API
    modal: {
      ...store.modalActions,
      ...createModalActions(useAppStore.getState, useAppStore.setState),
    },
    
    // Transaction actions with enhanced API
    transaction: {
      ...store.transactionActions,
      ...createTransactionHelpers(useAppStore.getState, useAppStore.setState),
    },
    
    // Schedule actions with enhanced API
    schedule: {
      ...store.scheduleActions,
      ...createScheduleHelpers(useAppStore.getState),
    },
    
    // UI actions with enhanced API
    ui: {
      ...store.uiActions,
      ...createUIHelpers(useAppStore.getState),
    },
  };
};

// Convenience hooks for specific store slices
export const useModalStore = () => {
  return useAppStore((state) => ({
    modalStates: state.modalStates,
    selectedData: state.selectedData,
    actions: state.modalActions,
  }));
};

export const useTransactionStore = () => {
  return useAppStore((state) => ({
    transactions: state.transactions,
    banks: state.banks,
    cards: state.cards,
    actions: state.transactionActions,
  }));
};

export const useScheduleStore = () => {
  return useAppStore((state) => ({
    schedules: state.schedules,
    actions: state.scheduleActions,
  }));
};

export const useUIStore = () => {
  return useAppStore((state) => ({
    loading: state.loading,
    errors: state.errors,
    actions: state.uiActions,
  }));
};

// Selector hooks for optimized re-renders
export const useModalState = (modalType?: string) => {
  return useAppStore((state) => {
    if (modalType) {
      return state.modalStates[modalType as keyof typeof state.modalStates];
    }
    return state.modalStates;
  });
};

export const useSelectedData = () => {
  return useAppStore((state) => state.selectedData);
};

export const useTransactions = () => {
  return useAppStore((state) => state.transactions);
};

export const useBanks = () => {
  return useAppStore((state) => state.banks);
};

export const useCards = () => {
  return useAppStore((state) => state.cards);
};

export const useSchedules = () => {
  return useAppStore((state) => state.schedules);
};

export const useLoadingStates = () => {
  return useAppStore((state) => state.loading);
};

export const useErrorStates = () => {
  return useAppStore((state) => state.errors);
};

// Derived state hooks
export const useIsLoading = (key?: keyof AppStore['loading']) => {
  return useAppStore((state) => {
    if (key) {
      return state.loading[key];
    }
    return Object.values(state.loading).some(Boolean);
  });
};

export const useHasError = (key?: keyof AppStore['errors']) => {
  return useAppStore((state) => {
    if (key) {
      return state.errors[key] !== null;
    }
    return Object.values(state.errors).some(Boolean);
  });
};

// Store initialization and cleanup (non-hook functions)
export const initializeStore = async () => {
  const state = useAppStore.getState();
  
  try {
    // Initialize with basic data - these would need to be implemented in the slices
    // await Promise.all([
    //   state.actions.fetchBanks(),
    //   state.actions.fetchCards(),
    // ]);
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};

export const clearStore = () => {
  const state = useAppStore.getState();
  
  // Clear all caches and close modals
  state.modalActions.closeAllModals();
  state.uiActions.clearErrors();
};

// Store persistence helpers (for future use)
export const getStoreState = () => useAppStore.getState();

export const setStoreState = (state: Partial<AppStore>) => {
  useAppStore.setState(state);
};

// Export types for external use
export type {
  AppStore,
  ModalType,
  ModalStates,
  SelectedData,
  LoadingStates,
  ErrorStates,
  StoreConfig,
} from './types';

// Export selectors for external use
export { selectors, derivedSelectors } from './selectors';

// Export individual slice creators for testing
export {
  createModalSlice,
  createTransactionSlice,
  createScheduleSlice,
  createUISlice,
};