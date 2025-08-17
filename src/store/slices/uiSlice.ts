import { StateCreator } from 'zustand';
import { UISlice, LoadingStates, ErrorStates, AppStore } from '../types';
import { DatabaseError } from '@/types/database';

// Initial states
const initialLoadingStates: LoadingStates = {
  transactions: false,
  schedules: false,
  banks: false,
  cards: false,
  saving: false,
  deleting: false,
};

const initialErrorStates: ErrorStates = {
  transactions: null,
  schedules: null,
  banks: null,
  cards: null,
  saving: null,
  deleting: null,
};

export const createUISlice: StateCreator<
  AppStore,
  [],
  [],
  UISlice
> = (set, get) => ({
  loading: initialLoadingStates,
  errors: initialErrorStates,
  
  actions: {
    // Set loading state for a specific operation
    setLoading: (key: keyof LoadingStates, loading: boolean) => {
      set((state) => ({
        loading: {
          ...state.loading,
          [key]: loading,
        },
      }));
    },

    // Set error state for a specific operation
    setError: (key: keyof ErrorStates, error: DatabaseError | null) => {
      set((state) => ({
        errors: {
          ...state.errors,
          [key]: error,
        },
      }));
    },

    // Clear all errors
    clearErrors: () => {
      set({
        errors: initialErrorStates,
      });
    },

    // Clear specific error
    clearError: (key: keyof ErrorStates) => {
      set((state) => ({
        errors: {
          ...state.errors,
          [key]: null,
        },
      }));
    },
  },
});

// Helper functions for common loading/error patterns
export const createUIHelpers = (get: () => AppStore) => ({
  // Start an async operation with loading/error handling
  withAsyncOperation: async <T>(
    operationKey: keyof LoadingStates,
    operation: () => Promise<T>
  ): Promise<T> => {
    const { actions } = get();
    
    try {
      // Set loading state
      actions.setLoading(operationKey, true);
      actions.clearError(operationKey as keyof ErrorStates);
      
      // Execute operation
      const result = await operation();
      
      return result;
    } catch (error) {
      // Set error state
      actions.setError(
        operationKey as keyof ErrorStates, 
        error as DatabaseError
      );
      throw error;
    } finally {
      // Clear loading state
      actions.setLoading(operationKey, false);
    }
  },

  // Check if any loading state is active
  isAnythingLoading: (): boolean => {
    const { loading } = get();
    return Object.values(loading).some(Boolean);
  },

  // Check if any error state is active
  hasAnyError: (): boolean => {
    const { errors } = get();
    return Object.values(errors).some(Boolean);
  },

  // Get all active errors
  getActiveErrors: (): Array<{ key: keyof ErrorStates; error: DatabaseError }> => {
    const { errors } = get();
    return Object.entries(errors)
      .filter(([, error]) => error !== null)
      .map(([key, error]) => ({ 
        key: key as keyof ErrorStates, 
        error: error as DatabaseError 
      }));
  },

  // Get loading status for specific operation
  isLoading: (key: keyof LoadingStates): boolean => {
    return get().loading[key];
  },

  // Get error for specific operation
  getError: (key: keyof ErrorStates): DatabaseError | null => {
    return get().errors[key];
  },
});