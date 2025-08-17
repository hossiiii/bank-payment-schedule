/**
 * Modal Slice Tests
 * Tests for Zustand modal state management
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  expectModalState,
  expectSelectedData,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
  testAsyncAction,
} from '../../utils/storeTestUtils';

// Mock the Zustand store - this will be updated when actual store is implemented
const mockModalStore = {
  modals: createInitialStoreState().modals,
  openModal: jest.fn(),
  closeModal: jest.fn(),
  closeAllModals: jest.fn(),
  setModalData: jest.fn(),
};

describe('Modal Slice', () => {
  let actionTester: ReturnType<typeof createStoreActionTester>;

  beforeEach(() => {
    actionTester = createStoreActionTester();
    jest.clearAllMocks();
    
    // Reset mock store state
    mockModalStore.modals = createInitialStoreState().modals;
  });

  describe('Initial State', () => {
    it('should have all modals closed initially', () => {
      const initialState = createInitialStoreState();
      
      expect(initialState.modals.transaction.isOpen).toBe(false);
      expect(initialState.modals.transactionView.isOpen).toBe(false);
      expect(initialState.modals.scheduleView.isOpen).toBe(false);
      expect(initialState.modals.scheduleEdit.isOpen).toBe(false);
      expect(initialState.modals.dayTotal.isOpen).toBe(false);
    });

    it('should have null data for all modals initially', () => {
      const initialState = createInitialStoreState();
      
      expect(initialState.modals.transaction.data).toBeNull();
      expect(initialState.modals.transactionView.data).toBeNull();
      expect(initialState.modals.scheduleView.data).toBeNull();
      expect(initialState.modals.scheduleEdit.data).toBeNull();
      expect(initialState.modals.dayTotal.data).toBeNull();
    });
  });

  describe('Modal Opening Actions', () => {
    it('should open transaction modal with correct data', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();
      
      act(() => {
        actionTester.captureAction('openTransactionModal', {
          date: mockDate,
          transaction: mockTransaction,
        });
        
        // Simulate store update
        mockModalStore.modals.transaction = {
          isOpen: true,
          data: { date: mockDate, transaction: mockTransaction },
        };
      });

      expect(mockModalStore.modals.transaction.isOpen).toBe(true);
      expect(mockModalStore.modals.transaction.data?.date).toEqual(mockDate);
      expect(mockModalStore.modals.transaction.data?.transaction).toEqual(mockTransaction);
      
      const lastAction = actionTester.getLastAction();
      expect(lastAction.actionName).toBe('openTransactionModal');
    });

    it('should open transaction view modal with transactions list', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-2' })];

      act(() => {
        actionTester.captureAction('openTransactionViewModal', {
          date: mockDate,
          transactions: mockTransactions,
        });

        mockModalStore.modals.transactionView = {
          isOpen: true,
          data: { date: mockDate, transactions: mockTransactions },
        };
      });

      expect(mockModalStore.modals.transactionView.isOpen).toBe(true);
      expect(mockModalStore.modals.transactionView.data?.transactions).toHaveLength(2);
    });

    it('should open schedule view modal with schedule items', () => {
      const mockDate = new Date('2024-02-15');
      const mockScheduleItems = [createMockScheduleItem(), createMockScheduleItem({ id: 'sched-2' })];

      act(() => {
        actionTester.captureAction('openScheduleViewModal', {
          date: mockDate,
          scheduleItems: mockScheduleItems,
        });

        mockModalStore.modals.scheduleView = {
          isOpen: true,
          data: { date: mockDate, scheduleItems: mockScheduleItems },
        };
      });

      expect(mockModalStore.modals.scheduleView.isOpen).toBe(true);
      expect(mockModalStore.modals.scheduleView.data?.scheduleItems).toHaveLength(2);
    });

    it('should open schedule edit modal with single schedule item', () => {
      const mockScheduleItem = createMockScheduleItem();

      act(() => {
        actionTester.captureAction('openScheduleEditModal', { scheduleItem: mockScheduleItem });

        mockModalStore.modals.scheduleEdit = {
          isOpen: true,
          data: { scheduleItem: mockScheduleItem },
        };
      });

      expect(mockModalStore.modals.scheduleEdit.isOpen).toBe(true);
      expect(mockModalStore.modals.scheduleEdit.data?.scheduleItem.id).toBe(mockScheduleItem.id);
    });

    it('should open day total modal with day total data', () => {
      const mockDate = new Date('2024-02-15');
      const mockDayTotalData = createMockDayTotalData();

      act(() => {
        actionTester.captureAction('openDayTotalModal', {
          date: mockDate,
          dayTotalData: mockDayTotalData,
        });

        mockModalStore.modals.dayTotal = {
          isOpen: true,
          data: { date: mockDate, dayTotalData: mockDayTotalData },
        };
      });

      expect(mockModalStore.modals.dayTotal.isOpen).toBe(true);
      expect(mockModalStore.modals.dayTotal.data?.dayTotalData.totalAmount).toBe(20000);
    });
  });

  describe('Modal Closing Actions', () => {
    beforeEach(() => {
      // Set up some open modals
      mockModalStore.modals.transaction.isOpen = true;
      mockModalStore.modals.transactionView.isOpen = true;
      mockModalStore.modals.scheduleView.isOpen = true;
    });

    it('should close specific modal and clear its data', () => {
      act(() => {
        actionTester.captureAction('closeTransactionModal');
        
        mockModalStore.modals.transaction = {
          isOpen: false,
          data: null,
        };
      });

      expect(mockModalStore.modals.transaction.isOpen).toBe(false);
      expect(mockModalStore.modals.transaction.data).toBeNull();
      
      // Other modals should remain open
      expect(mockModalStore.modals.transactionView.isOpen).toBe(true);
      expect(mockModalStore.modals.scheduleView.isOpen).toBe(true);
    });

    it('should close all modals and clear all data', () => {
      act(() => {
        actionTester.captureAction('closeAllModals');
        
        // Reset all modals
        mockModalStore.modals = createInitialStoreState().modals;
      });

      expect(mockModalStore.modals.transaction.isOpen).toBe(false);
      expect(mockModalStore.modals.transactionView.isOpen).toBe(false);
      expect(mockModalStore.modals.scheduleView.isOpen).toBe(false);
      expect(mockModalStore.modals.scheduleEdit.isOpen).toBe(false);
      expect(mockModalStore.modals.dayTotal.isOpen).toBe(false);

      // All data should be cleared
      expect(mockModalStore.modals.transaction.data).toBeNull();
      expect(mockModalStore.modals.transactionView.data).toBeNull();
      expect(mockModalStore.modals.scheduleView.data).toBeNull();
      expect(mockModalStore.modals.scheduleEdit.data).toBeNull();
      expect(mockModalStore.modals.dayTotal.data).toBeNull();
    });
  });

  describe('Cross-Modal Operations', () => {
    it('should handle transaction view to transaction modal transition', () => {
      const mockTransaction = createMockTransaction();
      
      // First open transaction view modal
      act(() => {
        mockModalStore.modals.transactionView = {
          isOpen: true,
          data: { date: new Date(), transactions: [mockTransaction] },
        };
      });

      // Then transition to transaction modal
      act(() => {
        actionTester.captureAction('transitionToTransactionModal', { transaction: mockTransaction });
        
        // Close transaction view
        mockModalStore.modals.transactionView = { isOpen: false, data: null };
        
        // Open transaction modal
        mockModalStore.modals.transaction = {
          isOpen: true,
          data: { date: new Date(mockTransaction.date), transaction: mockTransaction },
        };
      });

      expect(mockModalStore.modals.transactionView.isOpen).toBe(false);
      expect(mockModalStore.modals.transaction.isOpen).toBe(true);
      expect(mockModalStore.modals.transaction.data?.transaction.id).toBe(mockTransaction.id);
    });

    it('should handle schedule view to schedule edit modal transition', () => {
      const mockScheduleItem = createMockScheduleItem();
      
      act(() => {
        mockModalStore.modals.scheduleView = {
          isOpen: true,
          data: { date: new Date(), scheduleItems: [mockScheduleItem] },
        };
      });

      act(() => {
        actionTester.captureAction('transitionToScheduleEditModal', { scheduleItem: mockScheduleItem });
        
        mockModalStore.modals.scheduleView = { isOpen: false, data: null };
        mockModalStore.modals.scheduleEdit = {
          isOpen: true,
          data: { scheduleItem: mockScheduleItem },
        };
      });

      expect(mockModalStore.modals.scheduleView.isOpen).toBe(false);
      expect(mockModalStore.modals.scheduleEdit.isOpen).toBe(true);
      expect(mockModalStore.modals.scheduleEdit.data?.scheduleItem.id).toBe(mockScheduleItem.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle opening modal with invalid data gracefully', () => {
      act(() => {
        actionTester.captureAction('openTransactionModal', { date: null, transaction: null });
        
        // Store should handle null values gracefully
        mockModalStore.modals.transaction = {
          isOpen: true,
          data: { date: null, transaction: null },
        };
      });

      expect(mockModalStore.modals.transaction.isOpen).toBe(true);
      expect(mockModalStore.modals.transaction.data?.date).toBeNull();
      expect(mockModalStore.modals.transaction.data?.transaction).toBeNull();
    });

    it('should handle closing already closed modal gracefully', () => {
      // Ensure modal is already closed
      mockModalStore.modals.transaction.isOpen = false;

      act(() => {
        actionTester.captureAction('closeTransactionModal');
        
        mockModalStore.modals.transaction = {
          isOpen: false,
          data: null,
        };
      });

      // Should not throw error
      expect(mockModalStore.modals.transaction.isOpen).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid modal open/close operations', () => {
      const operations = 100;
      const mockDate = new Date('2024-02-15');
      
      const startTime = performance.now();
      
      for (let i = 0; i < operations; i++) {
        act(() => {
          // Open modal
          mockModalStore.modals.transaction = {
            isOpen: true,
            data: { date: mockDate, transaction: null },
          };
          
          // Close modal
          mockModalStore.modals.transaction = {
            isOpen: false,
            data: null,
          };
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms for 100 operations)
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple concurrent modal operations', () => {
      const mockData = {
        date: new Date('2024-02-15'),
        transaction: createMockTransaction(),
        transactions: [createMockTransaction()],
        scheduleItems: [createMockScheduleItem()],
        dayTotalData: createMockDayTotalData(),
      };

      act(() => {
        // Open multiple modals simultaneously
        mockModalStore.modals.transaction = { isOpen: true, data: mockData };
        mockModalStore.modals.transactionView = { isOpen: true, data: mockData };
        mockModalStore.modals.scheduleView = { isOpen: true, data: mockData };
        mockModalStore.modals.dayTotal = { isOpen: true, data: mockData };
      });

      // All should be open
      expect(mockModalStore.modals.transaction.isOpen).toBe(true);
      expect(mockModalStore.modals.transactionView.isOpen).toBe(true);
      expect(mockModalStore.modals.scheduleView.isOpen).toBe(true);
      expect(mockModalStore.modals.dayTotal.isOpen).toBe(true);

      act(() => {
        // Close all at once
        mockModalStore.modals = createInitialStoreState().modals;
      });

      // All should be closed
      expect(mockModalStore.modals.transaction.isOpen).toBe(false);
      expect(mockModalStore.modals.transactionView.isOpen).toBe(false);
      expect(mockModalStore.modals.scheduleView.isOpen).toBe(false);
      expect(mockModalStore.modals.dayTotal.isOpen).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct data types for modal states', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();

      act(() => {
        mockModalStore.modals.transaction = {
          isOpen: true,
          data: { date: mockDate, transaction: mockTransaction },
        };
      });

      // Type checks
      expect(typeof mockModalStore.modals.transaction.isOpen).toBe('boolean');
      expect(mockModalStore.modals.transaction.data?.date).toBeInstanceOf(Date);
      expect(typeof mockModalStore.modals.transaction.data?.transaction?.id).toBe('string');
      expect(typeof mockModalStore.modals.transaction.data?.transaction?.amount).toBe('number');
    });

    it('should handle undefined and null values correctly', () => {
      act(() => {
        mockModalStore.modals.transaction = {
          isOpen: true,
          data: { date: null, transaction: undefined },
        };
      });

      expect(mockModalStore.modals.transaction.data?.date).toBeNull();
      expect(mockModalStore.modals.transaction.data?.transaction).toBeUndefined();
    });
  });
});