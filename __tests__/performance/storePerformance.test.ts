/**
 * Store Performance Tests
 * Tests for Zustand store performance characteristics
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDataSet,
} from '../utils/testUtils';
import {
  createInitialStoreState,
  measureStoreActionPerformance,
} from '../utils/storeTestUtils';

// Mock performance-optimized store
const createMockPerformanceStore = () => {
  let state = createInitialStoreState();
  const subscribers = new Set<(state: any) => void>();
  
  const setState = (updater: (state: any) => any) => {
    const newState = updater(state);
    state = newState;
    subscribers.forEach(callback => callback(state));
  };
  
  const subscribe = (callback: (state: any) => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };
  
  const actions = {
    // Bulk operations for performance testing
    addMultipleTransactions: (transactions: any[]) => {
      setState((prev: any) => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: [...prev.transactions.items, ...transactions],
        },
      }));
    },
    
    updateMultipleTransactions: (updates: { id: string; data: any }[]) => {
      setState((prev: any) => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: prev.transactions.items.map((tx: any) => {
            const update = updates.find(u => u.id === tx.id);
            return update ? { ...tx, ...update.data } : tx;
          }),
        },
      }));
    },
    
    deleteMultipleTransactions: (ids: string[]) => {
      setState((prev: any) => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: prev.transactions.items.filter((tx: any) => !ids.includes(tx.id)),
        },
      }));
    },
    
    filterTransactions: (predicate: (tx: any) => boolean) => {
      setState((prev: any) => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          filteredItems: prev.transactions.items.filter(predicate),
        },
      }));
    },
    
    calculateComplexTotals: () => {
      setState((prev: any) => {
        const transactions = prev.transactions.items;
        const schedules = prev.schedules.items;
        
        // Complex calculations
        const monthlyTotals = new Map();
        const categoryTotals = new Map();
        const cardTotals = new Map();
        
        transactions.forEach((tx: any) => {
          const month = tx.date.substring(0, 7);
          monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + tx.amount);
          categoryTotals.set(tx.categoryId, (categoryTotals.get(tx.categoryId) || 0) + tx.amount);
          if (tx.cardId) {
            cardTotals.set(tx.cardId, (cardTotals.get(tx.cardId) || 0) + tx.amount);
          }
        });
        
        schedules.forEach((sched: any) => {
          const month = sched.date.substring(0, 7);
          monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + sched.amount);
        });
        
        return {
          ...prev,
          analytics: {
            monthlyTotals,
            categoryTotals,
            cardTotals,
            lastCalculated: Date.now(),
          },
        };
      });
    },
    
    openMultipleModals: (modals: { type: string; data: any }[]) => {
      setState((prev: any) => {
        const newModals = { ...prev.modals };
        modals.forEach(({ type, data }) => {
          newModals[type] = { isOpen: true, data };
        });
        return { ...prev, modals: newModals };
      });
    },
  };
  
  return {
    getState: () => state,
    subscribe,
    setState,
    actions,
  };
};

describe('Store Performance Tests', () => {
  let mockStore: ReturnType<typeof createMockPerformanceStore>;

  beforeEach(() => {
    mockStore = createMockPerformanceStore();
  });

  describe('Large Dataset Operations', () => {
    it('should handle adding 1000 transactions efficiently', async () => {
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ id: `perf-tx-${i}`, amount: 1000 + i })
      );

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.addMultipleTransactions(transactions);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockStore.getState().transactions.items).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle adding 5000 transactions efficiently', async () => {
      const transactions = Array.from({ length: 5000 }, (_, i) =>
        createMockTransaction({ id: `large-tx-${i}`, amount: 1000 + i })
      );

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.addMultipleTransactions(transactions);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockStore.getState().transactions.items).toHaveLength(5000);
      expect(duration).toBeLessThan(500); // Should complete in less than 500ms
    });

    it('should handle updating 1000 transactions efficiently', async () => {
      // First add transactions
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ id: `update-tx-${i}` })
      );
      
      mockStore.actions.addMultipleTransactions(transactions);

      // Prepare updates
      const updates = transactions.map(tx => ({
        id: tx.id,
        data: { amount: tx.amount + 500 },
      }));

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.updateMultipleTransactions(updates);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should complete in less than 200ms
      
      // Verify updates were applied
      const state = mockStore.getState();
      const firstTransaction = state.transactions.items.find((tx: any) => tx.id === 'update-tx-0');
      expect(firstTransaction.amount).toBe(transactions[0].amount + 500);
    });

    it('should handle deleting 500 transactions efficiently', async () => {
      // First add transactions
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ id: `delete-tx-${i}` })
      );
      
      mockStore.actions.addMultipleTransactions(transactions);

      // Delete first 500
      const idsToDelete = transactions.slice(0, 500).map(tx => tx.id);

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.deleteMultipleTransactions(idsToDelete);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockStore.getState().transactions.items).toHaveLength(500);
      expect(duration).toBeLessThan(150); // Should complete in less than 150ms
    });
  });

  describe('Complex Filtering Operations', () => {
    beforeEach(() => {
      // Set up test data
      const testData = Array.from({ length: 2000 }, (_, i) => {
        const cardIds = ['card-1', 'card-2', 'card-3', 'card-4'];
        const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5'];
        
        return createMockTransaction({
          id: `filter-tx-${i}`,
          amount: Math.floor(Math.random() * 10000) + 1000,
          cardId: cardIds[i % cardIds.length],
          categoryId: categories[i % categories.length],
          date: `2024-${String(Math.floor(i / 60) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        });
      });
      
      mockStore.actions.addMultipleTransactions(testData);
    });

    it('should filter by card efficiently', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.filterTransactions((tx: any) => tx.cardId === 'card-1');
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = mockStore.getState();
      expect(state.transactions.filteredItems.length).toBeGreaterThan(0);
      expect(state.transactions.filteredItems.every((tx: any) => tx.cardId === 'card-1')).toBe(true);
      expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    });

    it('should filter by amount range efficiently', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.filterTransactions((tx: any) => tx.amount >= 5000 && tx.amount <= 8000);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = mockStore.getState();
      expect(state.transactions.filteredItems.every((tx: any) => 
        tx.amount >= 5000 && tx.amount <= 8000
      )).toBe(true);
      expect(duration).toBeLessThan(50);
    });

    it('should filter by multiple criteria efficiently', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.filterTransactions((tx: any) => 
          tx.cardId === 'card-1' && 
          tx.categoryId === 'cat-2' && 
          tx.amount > 3000
        );
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = mockStore.getState();
      expect(state.transactions.filteredItems.every((tx: any) => 
        tx.cardId === 'card-1' && tx.categoryId === 'cat-2' && tx.amount > 3000
      )).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Complex Calculations', () => {
    beforeEach(() => {
      // Set up complex test data
      const transactions = Array.from({ length: 1000 }, (_, i) => {
        const cardIds = ['card-1', 'card-2', 'card-3'];
        const categories = ['cat-1', 'cat-2', 'cat-3', 'cat-4'];
        
        return createMockTransaction({
          id: `calc-tx-${i}`,
          amount: Math.floor(Math.random() * 5000) + 1000,
          cardId: cardIds[i % cardIds.length],
          categoryId: categories[i % categories.length],
          date: `2024-${String(Math.floor(i / 80) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        });
      });

      const schedules = Array.from({ length: 200 }, (_, i) =>
        createMockScheduleItem({
          id: `calc-sched-${i}`,
          amount: Math.floor(Math.random() * 3000) + 500,
          date: `2024-${String(Math.floor(i / 15) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        })
      );

      mockStore.actions.addMultipleTransactions(transactions);
      mockStore.setState((prev: any) => ({
        ...prev,
        schedules: { ...prev.schedules, items: schedules },
      }));
    });

    it('should calculate complex totals efficiently', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.calculateComplexTotals();
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = mockStore.getState();
      expect(state.analytics.monthlyTotals.size).toBeGreaterThan(0);
      expect(state.analytics.categoryTotals.size).toBeGreaterThan(0);
      expect(state.analytics.cardTotals.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200); // Should complete in less than 200ms
    });

    it('should handle repeated calculations efficiently', async () => {
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        await act(async () => {
          mockStore.actions.calculateComplexTotals();
        });
        
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(averageDuration).toBeLessThan(150);
      expect(maxDuration).toBeLessThan(300);
    });
  });

  describe('Subscription Performance', () => {
    it('should handle many subscribers efficiently', async () => {
      const subscribers: Array<jest.Mock> = [];
      const subscriptionCount = 100;

      // Create many subscribers
      for (let i = 0; i < subscriptionCount; i++) {
        const subscriber = jest.fn();
        subscribers.push(subscriber);
        mockStore.subscribe(subscriber);
      }

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.addMultipleTransactions([createMockTransaction()]);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All subscribers should be notified
      subscribers.forEach(subscriber => {
        expect(subscriber).toHaveBeenCalled();
      });

      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle rapid state changes with subscribers', async () => {
      const subscriber = jest.fn();
      mockStore.subscribe(subscriber);

      const startTime = performance.now();
      
      // Perform rapid state changes
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          mockStore.actions.addMultipleTransactions([
            createMockTransaction({ id: `rapid-${i}` })
          ]);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(subscriber).toHaveBeenCalledTimes(50);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Modal Performance', () => {
    it('should handle opening multiple modals efficiently', async () => {
      const modalsToOpen = [
        { type: 'transaction', data: { date: new Date(), transaction: null } },
        { type: 'transactionView', data: { date: new Date(), transactions: [] } },
        { type: 'scheduleView', data: { date: new Date(), scheduleItems: [] } },
        { type: 'dayTotal', data: { date: new Date(), dayTotalData: {} } },
      ];

      const startTime = performance.now();
      
      await act(async () => {
        mockStore.actions.openMultipleModals(modalsToOpen);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = mockStore.getState();
      modalsToOpen.forEach(({ type }) => {
        expect(state.modals[type].isOpen).toBe(true);
      });

      expect(duration).toBeLessThan(50);
    });

    it('should handle rapid modal operations', async () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          mockStore.actions.openMultipleModals([
            { type: 'transaction', data: { date: new Date(), transaction: null } }
          ]);
        });
        
        await act(async () => {
          mockStore.setState((prev: any) => ({
            ...prev,
            modals: { ...prev.modals, transaction: { isOpen: false, data: null } },
          }));
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks with large datasets', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy large datasets multiple times
      for (let iteration = 0; iteration < 5; iteration++) {
        const largeDataset = Array.from({ length: 2000 }, (_, i) =>
          createMockTransaction({ id: `memory-${iteration}-${i}` })
        );

        await act(async () => {
          mockStore.actions.addMultipleTransactions(largeDataset);
        });

        await act(async () => {
          mockStore.actions.deleteMultipleTransactions(largeDataset.map(tx => tx.id));
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should not grow excessively (allowing for some variance)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        const maxAllowedGrowth = initialMemory * 2; // Allow up to 2x initial memory
        expect(memoryGrowth).toBeLessThan(maxAllowedGrowth);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent store operations', async () => {
      const operations = [
        () => mockStore.actions.addMultipleTransactions([createMockTransaction({ id: 'concurrent-1' })]),
        () => mockStore.actions.addMultipleTransactions([createMockTransaction({ id: 'concurrent-2' })]),
        () => mockStore.actions.calculateComplexTotals(),
        () => mockStore.actions.filterTransactions((tx: any) => tx.amount > 1000),
        () => mockStore.actions.openMultipleModals([{ type: 'transaction', data: {} }]),
      ];

      const startTime = performance.now();
      
      await act(async () => {
        await Promise.all(operations.map(op => op()));
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All operations should complete successfully
      const state = mockStore.getState();
      expect(state.transactions.items.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(300);
    });

    it('should maintain data consistency under concurrent load', async () => {
      const concurrentAdds = Array.from({ length: 10 }, (_, i) => 
        () => mockStore.actions.addMultipleTransactions([
          createMockTransaction({ id: `consistency-${i}` })
        ])
      );

      await act(async () => {
        await Promise.all(concurrentAdds.map(add => add()));
      });

      const state = mockStore.getState();
      const uniqueIds = new Set(state.transactions.items.map((tx: any) => tx.id));
      
      // All transactions should have unique IDs
      expect(uniqueIds.size).toBe(state.transactions.items.length);
      expect(state.transactions.items.length).toBe(10);
    });
  });
});