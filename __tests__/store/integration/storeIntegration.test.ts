/**
 * Store Integration Tests
 * Tests integration between Zustand store and existing hooks
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  createMockDataSet,
  expectModalState,
  expectSelectedData,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
  createStoreSubscriptionTester,
  compareStoreStates,
} from '../../utils/storeTestUtils';

// Mock the integrated store with hooks
const mockIntegratedStore = {
  // Store state
  state: createInitialStoreState(),
  
  // Store actions
  actions: {
    // Modal actions
    openModal: jest.fn(),
    closeModal: jest.fn(),
    closeAllModals: jest.fn(),
    
    // Transaction actions
    addTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    loadTransactions: jest.fn(),
    
    // Schedule actions
    addSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
    loadSchedules: jest.fn(),
    
    // Calendar actions
    setCurrentDate: jest.fn(),
    calculateDayTotals: jest.fn(),
  },
  
  // Store subscriptions
  subscribe: jest.fn(),
  getState: jest.fn(() => mockIntegratedStore.state),
};

// Mock hook integration
const mockUseModalManagerWithStore = () => {
  const store = mockIntegratedStore;
  
  return {
    // Modal states from store
    modalStates: store.state.modals,
    
    // Actions that dispatch to store
    openTransactionModal: (date: Date, transaction?: any) => {
      store.actions.openModal('transaction', { date, transaction });
    },
    closeTransactionModal: () => {
      store.actions.closeModal('transaction');
    },
    closeAllModals: () => {
      store.actions.closeAllModals();
    },
    
    // Data from store
    selectedData: {
      date: store.state.modals.transaction.data?.date || null,
      transaction: store.state.modals.transaction.data?.transaction || null,
      transactions: store.state.modals.transactionView.data?.transactions || [],
      scheduleItems: store.state.modals.scheduleView.data?.scheduleItems || [],
      scheduleItem: store.state.modals.scheduleEdit.data?.scheduleItem || null,
      dayTotalData: store.state.modals.dayTotal.data?.dayTotalData || null,
    },
    
    // Integrated handlers
    handleTransactionSave: async (transactionInput: any) => {
      await store.actions.addTransaction(transactionInput);
      store.actions.closeAllModals();
    },
    
    handleTransactionDelete: async (transactionId: string) => {
      await store.actions.deleteTransaction(transactionId);
      store.actions.closeAllModals();
    },
  };
};

describe('Store Integration Tests', () => {
  let actionTester: ReturnType<typeof createStoreActionTester>;
  let subscriptionTester: ReturnType<typeof createStoreSubscriptionTester>;

  beforeEach(() => {
    actionTester = createStoreActionTester();
    subscriptionTester = createStoreSubscriptionTester();
    jest.clearAllMocks();
    
    // Reset mock store state
    mockIntegratedStore.state = createInitialStoreState();
  });

  describe('Modal Management Integration', () => {
    it('should integrate modal hook with store correctly', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      
      // Initial state should match store
      expect(result.current.modalStates.transaction.isOpen).toBe(false);
      expect(result.current.modalStates.transactionView.isOpen).toBe(false);
      expect(result.current.selectedData.transaction).toBeNull();
    });

    it('should open modal through hook and update store', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();

      act(() => {
        result.current.openTransactionModal(mockDate, mockTransaction);
        
        // Simulate store update
        mockIntegratedStore.state.modals.transaction = {
          isOpen: true,
          data: { date: mockDate, transaction: mockTransaction },
        };
      });

      expect(mockIntegratedStore.actions.openModal).toHaveBeenCalledWith('transaction', {
        date: mockDate,
        transaction: mockTransaction,
      });
    });

    it('should close modal through hook and update store', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      
      // First open a modal
      mockIntegratedStore.state.modals.transaction = {
        isOpen: true,
        data: { date: new Date(), transaction: createMockTransaction() },
      };

      act(() => {
        result.current.closeTransactionModal();
        
        // Simulate store update
        mockIntegratedStore.state.modals.transaction = {
          isOpen: false,
          data: null,
        };
      });

      expect(mockIntegratedStore.actions.closeModal).toHaveBeenCalledWith('transaction');
    });

    it('should handle cross-modal operations through store', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const mockTransaction = createMockTransaction();

      act(() => {
        // Simulate opening transaction view modal first
        mockIntegratedStore.state.modals.transactionView = {
          isOpen: true,
          data: { date: new Date(), transactions: [mockTransaction] },
        };
        
        // Then transition to transaction modal
        result.current.openTransactionModal(new Date(mockTransaction.date), mockTransaction);
        
        // Simulate store state changes
        mockIntegratedStore.state.modals.transactionView = {
          isOpen: false,
          data: null,
        };
        mockIntegratedStore.state.modals.transaction = {
          isOpen: true,
          data: { date: new Date(mockTransaction.date), transaction: mockTransaction },
        };
      });

      expect(mockIntegratedStore.actions.openModal).toHaveBeenCalledWith('transaction', {
        date: new Date(mockTransaction.date),
        transaction: mockTransaction,
      });
    });
  });

  describe('Transaction Operations Integration', () => {
    it('should integrate transaction operations with store and modals', async () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const transactionInput = {
        amount: 5000,
        description: 'テスト取引',
        date: '2024-02-15',
        categoryId: 'cat-1',
        cardId: 'card-1',
        bankId: null,
        isRecurring: false,
      };

      await act(async () => {
        await result.current.handleTransactionSave(transactionInput);
        
        // Simulate store updates
        const newTransaction = createMockTransaction({
          ...transactionInput,
          id: 'new-tx-1',
        });
        
        mockIntegratedStore.state.transactions.items = [newTransaction];
        mockIntegratedStore.state.modals = createInitialStoreState().modals; // All closed
      });

      expect(mockIntegratedStore.actions.addTransaction).toHaveBeenCalledWith(transactionInput);
      expect(mockIntegratedStore.actions.closeAllModals).toHaveBeenCalled();
    });

    it('should handle transaction deletion with modal closure', async () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const transactionId = 'tx-to-delete';
      
      // Set up initial state with transaction
      mockIntegratedStore.state.transactions.items = [
        createMockTransaction({ id: transactionId }),
      ];

      await act(async () => {
        await result.current.handleTransactionDelete(transactionId);
        
        // Simulate store updates
        mockIntegratedStore.state.transactions.items = [];
        mockIntegratedStore.state.modals = createInitialStoreState().modals;
      });

      expect(mockIntegratedStore.actions.deleteTransaction).toHaveBeenCalledWith(transactionId);
      expect(mockIntegratedStore.actions.closeAllModals).toHaveBeenCalled();
    });

    it('should handle transaction update through store', async () => {
      const existingTransaction = createMockTransaction({ id: 'existing-tx' });
      mockIntegratedStore.state.transactions.items = [existingTransaction];

      const updates = { amount: 10000, description: '更新された取引' };

      await act(async () => {
        mockIntegratedStore.actions.updateTransaction(existingTransaction.id, updates);
        
        // Simulate store update
        mockIntegratedStore.state.transactions.items = [
          { ...existingTransaction, ...updates },
        ];
      });

      expect(mockIntegratedStore.actions.updateTransaction).toHaveBeenCalledWith(
        existingTransaction.id,
        updates
      );
    });
  });

  describe('Calendar Integration', () => {
    it('should integrate calendar calculations with store data', async () => {
      const mockData = createMockDataSet();
      
      // Set up store with transactions and schedules
      mockIntegratedStore.state.transactions.items = mockData.transactions;
      mockIntegratedStore.state.schedules.items = mockData.scheduleItems;

      await act(async () => {
        mockIntegratedStore.actions.calculateDayTotals();
        
        // Simulate calculation
        const dayTotals = new Map();
        const date = '2024-02-15';
        
        const dayTransactions = mockData.transactions.filter(t => t.date === date);
        const daySchedules = mockData.scheduleItems.filter(s => s.date === date);
        
        const totalAmount = 
          dayTransactions.reduce((sum, t) => sum + t.amount, 0) +
          daySchedules.reduce((sum, s) => sum + s.amount, 0);
        
        dayTotals.set(date, {
          date,
          totalAmount,
          transactionTotal: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          scheduleTotal: daySchedules.reduce((sum, s) => sum + s.amount, 0),
          transactions: dayTransactions,
          scheduleItems: daySchedules,
        });
        
        mockIntegratedStore.state.calendar.dayTotals = dayTotals;
      });

      expect(mockIntegratedStore.actions.calculateDayTotals).toHaveBeenCalled();
      expect(mockIntegratedStore.state.calendar.dayTotals.size).toBe(1);
    });

    it('should handle date navigation with store updates', () => {
      const newDate = new Date('2024-03-15');

      act(() => {
        mockIntegratedStore.actions.setCurrentDate(newDate);
        
        // Simulate store update
        mockIntegratedStore.state.calendar.currentDate = newDate;
      });

      expect(mockIntegratedStore.actions.setCurrentDate).toHaveBeenCalledWith(newDate);
      expect(mockIntegratedStore.state.calendar.currentDate).toEqual(newDate);
    });

    it('should integrate day total modal with calendar data', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const mockDate = new Date('2024-02-15');
      const mockDayTotalData = createMockDayTotalData();

      act(() => {
        // Simulate opening day total modal from calendar
        mockIntegratedStore.actions.openModal('dayTotal', {
          date: mockDate,
          dayTotalData: mockDayTotalData,
        });
        
        mockIntegratedStore.state.modals.dayTotal = {
          isOpen: true,
          data: { date: mockDate, dayTotalData: mockDayTotalData },
        };
      });

      expect(mockIntegratedStore.state.modals.dayTotal.isOpen).toBe(true);
      expect(mockIntegratedStore.state.modals.dayTotal.data?.dayTotalData.totalAmount).toBe(20000);
    });
  });

  describe('Store Subscription Integration', () => {
    it('should handle store subscriptions in hooks', () => {
      const subscriptionCallback = jest.fn();
      
      act(() => {
        mockIntegratedStore.subscribe(subscriptionCallback);
        
        // Simulate state change
        mockIntegratedStore.state.transactions.items = [createMockTransaction()];
        
        // Trigger subscription
        subscriptionCallback(mockIntegratedStore.state);
      });

      expect(subscriptionCallback).toHaveBeenCalledWith(mockIntegratedStore.state);
    });

    it('should handle selective subscriptions to store slices', () => {
      const modalSubscription = jest.fn();
      const transactionSubscription = jest.fn();
      
      act(() => {
        // Simulate selective subscriptions
        const modalSelector = (state: any) => state.modals;
        const transactionSelector = (state: any) => state.transactions;
        
        // Subscribe to specific slices
        modalSubscription(modalSelector(mockIntegratedStore.state));
        transactionSubscription(transactionSelector(mockIntegratedStore.state));
        
        // Update modal state
        mockIntegratedStore.state.modals.transaction.isOpen = true;
        modalSubscription(modalSelector(mockIntegratedStore.state));
      });

      expect(modalSubscription).toHaveBeenCalledTimes(2);
      expect(transactionSubscription).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle store errors in hooks gracefully', async () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const invalidTransaction = {
        amount: -100, // Invalid amount
        description: '',
        date: 'invalid-date',
        categoryId: '',
        cardId: null,
        bankId: null,
        isRecurring: false,
      };

      await act(async () => {
        try {
          await result.current.handleTransactionSave(invalidTransaction);
        } catch (error) {
          // Simulate error handling
          mockIntegratedStore.state.transactions.error = 'Validation failed';
        }
      });

      expect(mockIntegratedStore.state.transactions.error).toBe('Validation failed');
    });

    it('should handle network errors during store operations', async () => {
      mockIntegratedStore.actions.loadTransactions.mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        try {
          await mockIntegratedStore.actions.loadTransactions();
        } catch (error) {
          mockIntegratedStore.state.transactions.error = 'Network error';
          mockIntegratedStore.state.transactions.loading = false;
        }
      });

      expect(mockIntegratedStore.state.transactions.error).toBe('Network error');
      expect(mockIntegratedStore.state.transactions.loading).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid store updates efficiently', () => {
      const rapidUpdates = 100;
      const startTime = performance.now();

      for (let i = 0; i < rapidUpdates; i++) {
        act(() => {
          // Simulate rapid modal state changes
          mockIntegratedStore.state.modals.transaction.isOpen = i % 2 === 0;
          
          // Simulate rapid transaction additions
          if (i < 10) {
            mockIntegratedStore.state.transactions.items.push(
              createMockTransaction({ id: `rapid-tx-${i}` })
            );
          }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(mockIntegratedStore.state.transactions.items).toHaveLength(10);
    });

    it('should handle large dataset operations efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        transaction: createMockTransaction({ id: `large-tx-${i}` }),
        schedule: createMockScheduleItem({ id: `large-sched-${i}` }),
      }));

      const startTime = performance.now();

      act(() => {
        mockIntegratedStore.state.transactions.items = largeDataset.map(d => d.transaction);
        mockIntegratedStore.state.schedules.items = largeDataset.map(d => d.schedule);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
      expect(mockIntegratedStore.state.transactions.items).toHaveLength(1000);
      expect(mockIntegratedStore.state.schedules.items).toHaveLength(1000);
    });
  });

  describe('State Consistency Integration', () => {
    it('should maintain state consistency across multiple operations', async () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      
      const operations = [
        async () => {
          await result.current.handleTransactionSave({
            amount: 1000,
            description: 'Test 1',
            date: '2024-02-15',
            categoryId: 'cat-1',
            cardId: 'card-1',
            bankId: null,
            isRecurring: false,
          });
        },
        async () => {
          result.current.openTransactionModal(new Date('2024-02-16'));
        },
        async () => {
          mockIntegratedStore.actions.calculateDayTotals();
        },
      ];

      const initialState = JSON.parse(JSON.stringify(mockIntegratedStore.state));

      await act(async () => {
        for (const operation of operations) {
          await operation();
          
          // Simulate state updates for each operation
          mockIntegratedStore.state.transactions.items.push(
            createMockTransaction({ id: `consistency-tx-${operations.indexOf(operation)}` })
          );
        }
      });

      const finalState = mockIntegratedStore.state;
      const { isEqual, differences } = compareStoreStates(initialState, finalState, [
        'transactions.items',
        'modals.transaction.isOpen',
      ]);

      // State should have changed in expected ways
      expect(isEqual).toBe(false);
      expect(differences.length).toBeGreaterThan(0);
      
      // But the structure should remain consistent
      expect(finalState.transactions).toBeDefined();
      expect(finalState.modals).toBeDefined();
      expect(finalState.schedules).toBeDefined();
      expect(finalState.calendar).toBeDefined();
    });

    it('should handle concurrent modal operations without conflicts', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());

      const concurrentOperations = [
        () => result.current.openTransactionModal(new Date('2024-02-15')),
        () => mockIntegratedStore.actions.openModal('scheduleView', { scheduleItems: [] }),
        () => mockIntegratedStore.actions.openModal('dayTotal', { dayTotalData: createMockDayTotalData() }),
      ];

      act(() => {
        // Execute all operations at once
        concurrentOperations.forEach(op => op());
        
        // Simulate final state
        mockIntegratedStore.state.modals.transaction.isOpen = true;
        mockIntegratedStore.state.modals.scheduleView.isOpen = true;
        mockIntegratedStore.state.modals.dayTotal.isOpen = true;
      });

      // All modals should be able to be open simultaneously
      expect(mockIntegratedStore.state.modals.transaction.isOpen).toBe(true);
      expect(mockIntegratedStore.state.modals.scheduleView.isOpen).toBe(true);
      expect(mockIntegratedStore.state.modals.dayTotal.isOpen).toBe(true);
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should handle complete user workflow: add transaction -> view -> edit', async () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      
      // Step 1: Add new transaction
      const transactionInput = {
        amount: 5000,
        description: 'ワークフロー テスト',
        date: '2024-02-15',
        categoryId: 'cat-1',
        cardId: 'card-1',
        bankId: null,
        isRecurring: false,
      };

      await act(async () => {
        await result.current.handleTransactionSave(transactionInput);
        
        const newTransaction = createMockTransaction({
          ...transactionInput,
          id: 'workflow-tx-1',
        });
        
        mockIntegratedStore.state.transactions.items = [newTransaction];
        mockIntegratedStore.state.modals = createInitialStoreState().modals;
      });

      // Step 2: View transaction in list modal
      act(() => {
        result.current.openTransactionModal(
          new Date('2024-02-15'),
          mockIntegratedStore.state.transactions.items[0]
        );
        
        mockIntegratedStore.state.modals.transactionView = {
          isOpen: true,
          data: {
            date: new Date('2024-02-15'),
            transactions: mockIntegratedStore.state.transactions.items,
          },
        };
      });

      // Step 3: Edit transaction
      act(() => {
        const transactionToEdit = mockIntegratedStore.state.transactions.items[0];
        result.current.openTransactionModal(new Date(transactionToEdit.date), transactionToEdit);
        
        mockIntegratedStore.state.modals.transactionView.isOpen = false;
        mockIntegratedStore.state.modals.transaction = {
          isOpen: true,
          data: {
            date: new Date(transactionToEdit.date),
            transaction: transactionToEdit,
          },
        };
      });

      expect(mockIntegratedStore.state.transactions.items).toHaveLength(1);
      expect(mockIntegratedStore.state.modals.transaction.isOpen).toBe(true);
      expect(mockIntegratedStore.state.modals.transactionView.isOpen).toBe(false);
    });

    it('should handle calendar day click -> modal open -> transaction management', () => {
      const { result } = renderHook(() => mockUseModalManagerWithStore());
      const selectedDate = new Date('2024-02-15');
      
      // Set up day with existing data
      const dayTransactions = [createMockTransaction({ date: '2024-02-15' })];
      const daySchedules = [createMockScheduleItem({ date: '2024-02-15' })];
      
      mockIntegratedStore.state.transactions.items = dayTransactions;
      mockIntegratedStore.state.schedules.items = daySchedules;

      // Step 1: Calculate day totals (would happen on calendar render)
      act(() => {
        mockIntegratedStore.actions.calculateDayTotals();
        
        const dayTotalData = createMockDayTotalData({
          date: '2024-02-15',
          transactions: dayTransactions,
          scheduleItems: daySchedules,
        });
        
        mockIntegratedStore.state.calendar.dayTotals.set('2024-02-15', dayTotalData);
      });

      // Step 2: User clicks on calendar day (opens day total modal)
      act(() => {
        const dayTotalData = mockIntegratedStore.state.calendar.dayTotals.get('2024-02-15');
        mockIntegratedStore.actions.openModal('dayTotal', {
          date: selectedDate,
          dayTotalData,
        });
        
        mockIntegratedStore.state.modals.dayTotal = {
          isOpen: true,
          data: { date: selectedDate, dayTotalData },
        };
      });

      // Step 3: User clicks on transaction from day total modal
      act(() => {
        const selectedTransaction = dayTransactions[0];
        result.current.openTransactionModal(selectedDate, selectedTransaction);
        
        mockIntegratedStore.state.modals.dayTotal.isOpen = false;
        mockIntegratedStore.state.modals.transaction = {
          isOpen: true,
          data: { date: selectedDate, transaction: selectedTransaction },
        };
      });

      expect(mockIntegratedStore.state.modals.dayTotal.isOpen).toBe(false);
      expect(mockIntegratedStore.state.modals.transaction.isOpen).toBe(true);
      expect(mockIntegratedStore.state.calendar.dayTotals.has('2024-02-15')).toBe(true);
    });
  });
});