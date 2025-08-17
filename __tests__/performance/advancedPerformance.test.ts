/**
 * Advanced Performance Testing Suite
 * Phase 3 comprehensive performance validation
 * Production-ready performance benchmarks
 */

import { renderHook, act } from '@testing-library/react';
import {
  createTestStore,
  measureStoreActionPerformance,
  detectMemoryLeaks,
  createConcurrencyTester,
  createRealisticTestData,
  PerformanceTestResult,
  MemoryLeakTestResult,
} from '../utils/storeTestUtils';
import { 
  createMockTransaction, 
  createMockScheduleItem,
  createMockDataSet,
} from '../utils/testUtils';

describe('Advanced Performance Testing', () => {
  let performanceResults: Map<string, PerformanceTestResult>;
  let memoryLeakResults: Map<string, MemoryLeakTestResult>;

  beforeAll(() => {
    performanceResults = new Map();
    memoryLeakResults = new Map();
    
    // Enable garbage collection for memory tests if available
    if (global.gc) {
      global.gc();
    }
  });

  afterAll(() => {
    // Generate performance report
    console.log('\n=== Performance Test Results ===');
    performanceResults.forEach((result, testName) => {
      console.log(`${testName}:`);
      console.log(`  Average Time: ${result.averageTime.toFixed(3)}ms`);
      console.log(`  Total Time: ${result.totalTime.toFixed(3)}ms`);
      
      if (result.percentiles) {
        console.log(`  P50: ${result.percentiles.p50.toFixed(3)}ms`);
        console.log(`  P95: ${result.percentiles.p95.toFixed(3)}ms`);
        console.log(`  P99: ${result.percentiles.p99.toFixed(3)}ms`);
      }
    });

    console.log('\n=== Memory Leak Test Results ===');
    memoryLeakResults.forEach((result, testName) => {
      console.log(`${testName}:`);
      console.log(`  Has Leak: ${result.hasLeak}`);
      console.log(`  Memory Growth: ${(result.memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      
      if (result.recommendations.length > 0) {
        console.log(`  Recommendations: ${result.recommendations.join(', ')}`);
      }
    });
  });

  describe('Store Action Performance', () => {
    it('should measure modal operations performance', async () => {
      const store = createTestStore();
      const mockTransaction = createMockTransaction();

      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            store.getState().actions.openModal('transaction', { 
              date: new Date(), 
              transaction: mockTransaction 
            });
            store.getState().actions.closeModal('transaction');
          });
        },
        100,
        {
          warmupIterations: 10,
          collectDetailedTimings: true,
          collectMemoryStats: process.env.NODE_ENV === 'test',
        }
      );

      performanceResults.set('modalOperations', result);

      // Performance assertions
      expect(result.averageTime).toBeLessThan(5); // Should be under 5ms
      expect(result.percentiles?.p95).toBeLessThan(10); // 95th percentile under 10ms
      
      // Verify no significant performance degradation
      if (result.results.length > 10) {
        const firstQuarter = result.results.slice(0, Math.floor(result.results.length / 4));
        const lastQuarter = result.results.slice(-Math.floor(result.results.length / 4));
        
        const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
        
        // Last quarter should not be more than 50% slower than first quarter
        expect(lastAvg).toBeLessThan(firstAvg * 1.5);
      }
    });

    it('should measure transaction CRUD operations performance', async () => {
      const store = createTestStore();
      const { generateTransactionBatch } = createRealisticTestData();
      
      const transactions = generateTransactionBatch(10, {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      });

      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            // Add transaction
            store.getState().actions.addTransaction(transactions[0]);
            
            // Update transaction
            const currentTransactions = store.getState().transactions;
            if (currentTransactions.length > 0) {
              store.getState().actions.updateTransaction(
                currentTransactions[0].id, 
                { amount: 10000 }
              );
            }
            
            // Delete transaction
            if (currentTransactions.length > 0) {
              store.getState().actions.deleteTransaction(currentTransactions[0].id);
            }
          });
        },
        50,
        {
          warmupIterations: 5,
          collectDetailedTimings: true,
          collectMemoryStats: true,
        }
      );

      performanceResults.set('transactionCRUD', result);

      expect(result.averageTime).toBeLessThan(15); // Should be under 15ms
      expect(result.percentiles?.p99).toBeLessThan(50); // 99th percentile under 50ms
    });

    it('should measure batch operations performance', async () => {
      const store = createTestStore();
      const { generateTransactionBatch } = createRealisticTestData();
      
      const largeBatch = generateTransactionBatch(100, {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      });

      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            largeBatch.forEach(transaction => {
              store.getState().actions.addTransaction(transaction);
            });
          });
        },
        10,
        {
          warmupIterations: 2,
          collectDetailedTimings: true,
          collectMemoryStats: true,
        }
      );

      performanceResults.set('batchOperations', result);

      expect(result.averageTime).toBeLessThan(100); // Should be under 100ms for 100 items
      
      // Verify linear scaling (roughly)
      const expectedMaxTime = largeBatch.length * 1; // 1ms per item
      expect(result.averageTime).toBeLessThan(expectedMaxTime);
    });

    it('should measure store subscription performance', async () => {
      const store = createTestStore();
      const subscriptionCallbacks: Array<() => void> = [];
      
      // Create multiple subscriptions
      for (let i = 0; i < 50; i++) {
        const unsubscribe = store.subscribe(() => {
          // Simulate subscription work
          Math.random() * 1000;
        });
        subscriptionCallbacks.push(unsubscribe);
      }

      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            store.getState().actions.openModal('transaction', { date: new Date() });
            store.getState().actions.closeModal('transaction');
          });
        },
        50,
        {
          warmupIterations: 5,
          collectDetailedTimings: true,
        }
      );

      // Cleanup subscriptions
      subscriptionCallbacks.forEach(cleanup => cleanup());

      performanceResults.set('subscriptionPerformance', result);

      // With 50 subscriptions, should still be fast
      expect(result.averageTime).toBeLessThan(10);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect memory leaks in store creation/destruction', async () => {
      const result = await detectMemoryLeaks(
        () => {
          const store = createTestStore();
          return store;
        },
        async (store) => {
          // Perform typical operations
          const { actions } = store.getState();
          
          actions.openModal('transaction', { date: new Date() });
          actions.addTransaction(createMockTransaction());
          actions.closeModal('transaction');
          
          // Add some subscriptions
          const unsubscribe1 = store.subscribe(() => {});
          const unsubscribe2 = store.subscribe(() => {});
          
          // Cleanup subscriptions
          unsubscribe1();
          unsubscribe2();
        },
        30
      );

      memoryLeakResults.set('storeCreationDestruction', result);

      expect(result.hasLeak).toBe(false);
      
      if (result.hasLeak) {
        console.warn('Memory leak detected in store operations:', result.recommendations);
      }
    });

    it('should detect memory leaks in heavy modal operations', async () => {
      const result = await detectMemoryLeaks(
        () => createTestStore(),
        async (store) => {
          const { actions } = store.getState();
          
          // Simulate heavy modal usage
          for (let i = 0; i < 20; i++) {
            actions.openModal('transaction', { 
              date: new Date(), 
              transaction: createMockTransaction({ id: `tx-${i}` })
            });
            actions.openModal('scheduleModal', { 
              scheduleItem: createMockScheduleItem({ id: `sched-${i}` })
            });
            actions.closeAllModals();
          }
        },
        25
      );

      memoryLeakResults.set('heavyModalOperations', result);

      expect(result.hasLeak).toBe(false);
    });

    it('should detect memory leaks in data operations', async () => {
      const result = await detectMemoryLeaks(
        () => createTestStore(),
        async (store) => {
          const { actions } = store.getState();
          const { generateTransactionBatch } = createRealisticTestData();
          
          // Simulate data churn
          const batch = generateTransactionBatch(20, {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31'),
          });
          
          // Add all transactions
          batch.forEach(tx => actions.addTransaction(tx));
          
          // Update them
          const transactions = store.getState().transactions;
          transactions.forEach(tx => {
            actions.updateTransaction(tx.id, { amount: tx.amount + 1000 });
          });
          
          // Delete them
          transactions.forEach(tx => {
            actions.deleteTransaction(tx.id);
          });
        },
        25
      );

      memoryLeakResults.set('dataOperations', result);

      expect(result.hasLeak).toBe(false);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent modal operations efficiently', async () => {
      const store = createTestStore();
      const concurrencyTester = createConcurrencyTester();
      
      const operations = [
        () => store.getState().actions.openModal('transaction', { date: new Date() }),
        () => store.getState().actions.openModal('scheduleModal', { scheduleItem: null }),
        () => store.getState().actions.openModal('dayTotal', { dayTotalData: null }),
        () => store.getState().actions.closeModal('transaction'),
        () => store.getState().actions.closeModal('scheduleModal'),
        () => store.getState().actions.closeAllModals(),
      ];

      const result = await concurrencyTester.createConcurrentTest(
        store,
        operations,
        {
          delay: 10,
          randomizeOrder: true,
          expectRaceConditions: false,
        }
      );

      expect(result.errors).toHaveLength(0);
      expect(result.totalTime).toBeLessThan(100);
      expect(result.raceConditionsDetected).toBe(false);
    });

    it('should handle concurrent data operations efficiently', async () => {
      const store = createTestStore();
      const concurrencyTester = createConcurrencyTester();
      const mockDataSet = createMockDataSet();
      
      const operations = [
        () => store.getState().actions.addTransaction(mockDataSet.transactions[0]),
        () => store.getState().actions.addTransaction(mockDataSet.transactions[1]),
        () => store.getState().actions.addSchedule(mockDataSet.scheduleItems[0]),
        () => store.getState().actions.addSchedule(mockDataSet.scheduleItems[1]),
        () => store.getState().actions.setLoading('transactions', true),
        () => store.getState().actions.setLoading('transactions', false),
      ];

      const result = await concurrencyTester.createConcurrentTest(
        store,
        operations,
        {
          delay: 5,
          randomizeOrder: true,
        }
      );

      expect(result.errors).toHaveLength(0);
      expect(result.totalTime).toBeLessThan(200);
      
      // Verify final state is consistent
      const finalState = store.getState();
      expect(finalState.transactions).toHaveLength(2);
      expect(finalState.schedules).toHaveLength(2);
      expect(finalState.loading.transactions).toBe(false);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle calendar month load scenario efficiently', async () => {
      const store = createTestStore();
      const { generateTransactionBatch, generateScheduleBatch } = createRealisticTestData();
      
      // Simulate loading a month's worth of data
      const monthStart = new Date('2024-02-01');
      const monthEnd = new Date('2024-02-29');
      
      const transactions = generateTransactionBatch(50, { start: monthStart, end: monthEnd });
      const schedules = generateScheduleBatch(20, { start: monthStart, end: monthEnd });

      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            const { actions } = store.getState();
            
            // Simulate initial loading
            actions.setLoading('transactions', true);
            actions.setLoading('schedules', true);
            
            // Load data
            transactions.forEach(tx => actions.addTransaction(tx));
            schedules.forEach(sched => actions.addSchedule(sched));
            
            // Complete loading
            actions.setLoading('transactions', false);
            actions.setLoading('schedules', false);
            
            // Simulate calendar calculations (accessing data multiple times)
            const state = store.getState();
            const transactionCount = state.transactions.length;
            const scheduleCount = state.schedules.length;
            
            // Clear for next iteration
            state.transactions.forEach(tx => actions.deleteTransaction(tx.id));
            state.schedules.forEach(sched => actions.deleteSchedule(sched.id));
          });
        },
        10,
        {
          warmupIterations: 2,
          collectDetailedTimings: true,
          collectMemoryStats: true,
        }
      );

      performanceResults.set('calendarMonthLoad', result);

      // Should handle month load efficiently
      expect(result.averageTime).toBeLessThan(200); // Under 200ms for 70 items
      expect(result.percentiles?.p95).toBeLessThan(300);
    });

    it('should handle user interaction burst scenario efficiently', async () => {
      const store = createTestStore();
      
      // Simulate rapid user interactions
      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            const { actions } = store.getState();
            
            // Rapid modal operations
            actions.openModal('transaction', { date: new Date() });
            actions.closeModal('transaction');
            actions.openModal('scheduleModal', { scheduleItem: null });
            actions.closeModal('scheduleModal');
            actions.openModal('dayTotal', { dayTotalData: null });
            actions.closeAllModals();
            
            // Rapid data operations
            const tx = createMockTransaction();
            actions.addTransaction(tx);
            actions.updateTransaction(tx.id, { amount: 10000 });
            actions.deleteTransaction(tx.id);
          });
        },
        50,
        {
          warmupIterations: 5,
          collectDetailedTimings: true,
        }
      );

      performanceResults.set('userInteractionBurst', result);

      // Should handle burst interactions smoothly
      expect(result.averageTime).toBeLessThan(20);
      expect(result.percentiles?.p99).toBeLessThan(50);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baselines', async () => {
      const store = createTestStore();
      
      // Basic operation baseline
      const basicResult = await measureStoreActionPerformance(
        () => {
          act(() => {
            store.getState().actions.openModal('transaction', { date: new Date() });
            store.getState().actions.closeModal('transaction');
          });
        },
        100
      );

      // Complex operation baseline
      const complexResult = await measureStoreActionPerformance(
        () => {
          act(() => {
            const { actions } = store.getState();
            const tx = createMockTransaction();
            
            actions.setLoading('transactions', true);
            actions.addTransaction(tx);
            actions.openModal('transactionView', { transactions: [tx] });
            actions.updateTransaction(tx.id, { amount: 10000 });
            actions.closeModal('transactionView');
            actions.deleteTransaction(tx.id);
            actions.setLoading('transactions', false);
          });
        },
        50
      );

      // Store baselines for future regression testing
      performanceResults.set('basicOperationBaseline', basicResult);
      performanceResults.set('complexOperationBaseline', complexResult);

      // Performance baselines should be reasonable
      expect(basicResult.averageTime).toBeLessThan(5);
      expect(complexResult.averageTime).toBeLessThan(25);
      
      // Complex operations should not be more than 10x slower than basic
      expect(complexResult.averageTime).toBeLessThan(basicResult.averageTime * 10);
    });
  });
});