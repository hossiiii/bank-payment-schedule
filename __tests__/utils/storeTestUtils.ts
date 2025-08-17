/**
 * Enhanced Zustand Store Testing Utilities
 * Phase 3 comprehensive testing support
 * Production-ready testing infrastructure
 */

import { act } from '@testing-library/react';
import { create } from 'zustand';
import { StateCreator, UseBoundStore } from 'zustand';
import { AppStore, StoreConfig } from '@/store/types';
import { 
  createModalSlice, 
  createTransactionSlice, 
  createScheduleSlice, 
  createUISlice 
} from '@/store';

// Store state utilities
export const createInitialStoreState = () => ({
  // Modal slice state
  modals: {
    transaction: { isOpen: false, data: null },
    transactionView: { isOpen: false, data: null },
    scheduleView: { isOpen: false, data: null },
    scheduleEdit: { isOpen: false, data: null },
    dayTotal: { isOpen: false, data: null },
  },
  
  // Transaction slice state
  transactions: {
    items: [],
    loading: false,
    error: null,
    filter: {
      dateRange: null,
      cardId: null,
      bankId: null,
      categoryId: null,
    },
  },
  
  // Schedule slice state
  schedules: {
    items: [],
    loading: false,
    error: null,
    filter: {
      dateRange: null,
      cardId: null,
      bankId: null,
      categoryId: null,
    },
  },
  
  // Calendar slice state
  calendar: {
    currentDate: new Date(),
    viewMode: 'month',
    selectedDate: null,
    dayTotals: new Map(),
    loading: false,
    error: null,
  },
});

// Store action test utilities
export const createStoreActionTester = () => {
  const actionResults: any[] = [];
  
  const captureAction = (actionName: string, payload?: any) => {
    actionResults.push({ actionName, payload, timestamp: Date.now() });
  };
  
  const getLastAction = () => actionResults[actionResults.length - 1];
  
  const getActionsByName = (name: string) => 
    actionResults.filter(action => action.actionName === name);
  
  const clearActions = () => {
    actionResults.length = 0;
  };
  
  return {
    captureAction,
    getLastAction,
    getActionsByName,
    clearActions,
    getAllActions: () => [...actionResults],
  };
};

// Async action testing utilities
export const testAsyncAction = async (
  actionFn: () => Promise<any>,
  expectedStates: any[],
  stateGetter: () => any
) => {
  const states: any[] = [];
  
  // Capture initial state
  states.push(stateGetter());
  
  // Execute action and capture intermediate states
  await act(async () => {
    const promise = actionFn();
    
    // Capture loading state if it changes quickly
    setTimeout(() => {
      states.push(stateGetter());
    }, 0);
    
    await promise;
  });
  
  // Capture final state
  states.push(stateGetter());
  
  // Validate state transitions
  expectedStates.forEach((expectedState, index) => {
    if (states[index]) {
      expect(states[index]).toMatchObject(expectedState);
    }
  });
  
  return states;
};

// Store subscription test utilities
export const createStoreSubscriptionTester = () => {
  const subscriptionCalls: any[] = [];
  
  const mockSubscribe = (callback: (state: any) => void) => {
    return (state: any) => {
      subscriptionCalls.push({ state, timestamp: Date.now() });
      callback(state);
    };
  };
  
  const getSubscriptionCalls = () => [...subscriptionCalls];
  
  const clearSubscriptionCalls = () => {
    subscriptionCalls.length = 0;
  };
  
  return {
    mockSubscribe,
    getSubscriptionCalls,
    clearSubscriptionCalls,
  };
};

// State comparison utilities
export const compareStoreStates = (
  state1: any,
  state2: any,
  ignorePaths: string[] = []
): { isEqual: boolean; differences: string[] } => {
  const differences: string[] = [];
  
  const compareRecursive = (obj1: any, obj2: any, path = '') => {
    if (ignorePaths.includes(path)) return;
    
    if (typeof obj1 !== typeof obj2) {
      differences.push(`${path}: type mismatch`);
      return;
    }
    
    if (obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences.push(`${path}: null mismatch`);
      }
      return;
    }
    
    if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      const allKeys = new Set([...keys1, ...keys2]);
      
      allKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        compareRecursive(obj1[key], obj2[key], newPath);
      });
    } else if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        differences.push(`${path}: array length mismatch`);
        return;
      }
      
      obj1.forEach((item, index) => {
        const newPath = `${path}[${index}]`;
        compareRecursive(item, obj2[index], newPath);
      });
    } else if (obj1 !== obj2) {
      differences.push(`${path}: value mismatch`);
    }
  };
  
  compareRecursive(state1, state2);
  
  return {
    isEqual: differences.length === 0,
    differences,
  };
};

// Performance testing utilities for store
export const measureStoreActionPerformance = async (
  actionFn: () => void | Promise<void>,
  iterations = 100
): Promise<{ averageTime: number; totalTime: number; results: number[] }> => {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    await act(async () => {
      const result = actionFn();
      if (result instanceof Promise) {
        await result;
      }
    });
    
    const end = performance.now();
    results.push(end - start);
  }
  
  const totalTime = results.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  
  return {
    averageTime,
    totalTime,
    results,
  };
};

// Store error testing utilities
export const createStoreErrorTester = () => {
  const errors: any[] = [];
  
  const captureError = (error: Error, context: string) => {
    errors.push({
      error: error.message,
      context,
      timestamp: Date.now(),
    });
  };
  
  const getLastError = () => errors[errors.length - 1];
  
  const getErrorsByContext = (context: string) =>
    errors.filter(err => err.context === context);
  
  const clearErrors = () => {
    errors.length = 0;
  };
  
  return {
    captureError,
    getLastError,
    getErrorsByContext,
    clearErrors,
    getAllErrors: () => [...errors],
  };
};

// Store middleware testing utilities
export const createMiddlewareTester = () => {
  const middlewareCalls: any[] = [];
  
  const captureMiddlewareCall = (
    type: 'before' | 'after',
    actionName: string,
    state: any,
    payload?: any
  ) => {
    middlewareCalls.push({
      type,
      actionName,
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      payload,
      timestamp: Date.now(),
    });
  };
  
  const getMiddlewareCalls = () => [...middlewareCalls];
  
  const getCallsByAction = (actionName: string) =>
    middlewareCalls.filter(call => call.actionName === actionName);
  
  const clearMiddlewareCalls = () => {
    middlewareCalls.length = 0;
  };
  
  return {
    captureMiddlewareCall,
    getMiddlewareCalls,
    getCallsByAction,
    clearMiddlewareCalls,
  };
};

// Store persistence testing utilities
export const createPersistenceTester = () => {
  const mockStorage = new Map<string, string>();
  
  const mockPersistence = {
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
    clear: () => {
      mockStorage.clear();
    },
  };
  
  const getStorageKeys = () => Array.from(mockStorage.keys());
  
  const getStorageValue = (key: string) => {
    const value = mockStorage.get(key);
    return value ? JSON.parse(value) : null;
  };
  
  return {
    mockStorage: mockPersistence,
    getStorageKeys,
    getStorageValue,
    clearStorage: () => mockStorage.clear(),
  };
};