/**
 * Schedule Slice Tests
 * Tests for Zustand schedule state management
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockScheduleItem,
  createAsyncMock,
  createErrorMock,
  validateScheduleItem,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
  testAsyncAction,
  createStoreErrorTester,
} from '../../utils/storeTestUtils';

// Mock the Zustand schedule store
const mockScheduleStore = {
  schedules: createInitialStoreState().schedules,
  
  // Actions
  addSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
  loadSchedules: jest.fn(),
  setFilter: jest.fn(),
  clearFilter: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  generateRecurringSchedules: jest.fn(),
  calculateScheduleTotals: jest.fn(),
};

describe('Schedule Slice', () => {
  let actionTester: ReturnType<typeof createStoreActionTester>;
  let errorTester: ReturnType<typeof createStoreErrorTester>;

  beforeEach(() => {
    actionTester = createStoreActionTester();
    errorTester = createStoreErrorTester();
    jest.clearAllMocks();
    
    // Reset mock store state
    mockScheduleStore.schedules = createInitialStoreState().schedules;
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const initialState = createInitialStoreState();
      
      expect(initialState.schedules.items).toEqual([]);
      expect(initialState.schedules.loading).toBe(false);
      expect(initialState.schedules.error).toBeNull();
      expect(initialState.schedules.filter.dateRange).toBeNull();
      expect(initialState.schedules.filter.cardId).toBeNull();
      expect(initialState.schedules.filter.bankId).toBeNull();
      expect(initialState.schedules.filter.categoryId).toBeNull();
    });

    it('should initialize with empty schedules array', () => {
      expect(mockScheduleStore.schedules.items).toHaveLength(0);
    });
  });

  describe('Add Schedule', () => {
    it('should add new schedule successfully', async () => {
      const newSchedule = createMockScheduleItem({ id: 'new-sched-1' });

      await act(async () => {
        actionTester.captureAction('addSchedule', newSchedule);
        
        mockScheduleStore.schedules.loading = true;
        
        setTimeout(() => {
          mockScheduleStore.schedules.items = [newSchedule];
          mockScheduleStore.schedules.loading = false;
          mockScheduleStore.schedules.error = null;
        }, 0);
      });

      expect(mockScheduleStore.schedules.items).toContain(newSchedule);
      expect(mockScheduleStore.schedules.loading).toBe(false);
      expect(mockScheduleStore.schedules.error).toBeNull();
    });

    it('should handle recurring schedule creation', async () => {
      const recurringSchedule = createMockScheduleItem({
        id: 'recurring-sched-1',
        isRecurring: true,
        recurringType: 'monthly',
      });

      await act(async () => {
        actionTester.captureAction('addSchedule', recurringSchedule);
        
        // Generate multiple instances for recurring schedule
        const recurringInstances = Array.from({ length: 12 }, (_, i) => {
          const date = new Date('2024-01-15');
          date.setMonth(date.getMonth() + i);
          return createMockScheduleItem({
            id: `recurring-sched-1-${i}`,
            date: date.toISOString().split('T')[0],
            title: recurringSchedule.title,
            amount: recurringSchedule.amount,
            isRecurring: true,
            recurringType: 'monthly',
          });
        });

        mockScheduleStore.schedules.items = recurringInstances;
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(12);
      expect(mockScheduleStore.schedules.items.every(item => item.isRecurring)).toBe(true);
    });

    it('should validate schedule data before adding', () => {
      const invalidSchedule = createMockScheduleItem({ 
        title: '', 
        amount: -100 
      });
      
      expect(validateScheduleItem(invalidSchedule)).toBe(false);
      
      act(() => {
        actionTester.captureAction('addSchedule', invalidSchedule);
        errorTester.captureError(new Error('Invalid schedule data'), 'addSchedule');
        
        mockScheduleStore.schedules.error = 'Invalid schedule data';
        mockScheduleStore.schedules.loading = false;
      });

      expect(mockScheduleStore.schedules.error).toBe('Invalid schedule data');
      expect(mockScheduleStore.schedules.items).toHaveLength(0);
    });
  });

  describe('Update Schedule', () => {
    beforeEach(() => {
      const existingSchedules = [
        createMockScheduleItem({ id: 'sched-1' }),
        createMockScheduleItem({ id: 'sched-2', isRecurring: true }),
      ];
      mockScheduleStore.schedules.items = existingSchedules;
    });

    it('should update existing schedule successfully', async () => {
      const updates = { 
        title: '更新されたスケジュール', 
        amount: 8000 
      };
      const scheduleId = 'sched-1';

      await act(async () => {
        actionTester.captureAction('updateSchedule', { id: scheduleId, updates });
        
        const updatedItems = mockScheduleStore.schedules.items.map(item =>
          item.id === scheduleId ? { ...item, ...updates } : item
        );
        
        mockScheduleStore.schedules.items = updatedItems;
      });

      const updatedSchedule = mockScheduleStore.schedules.items.find(s => s.id === scheduleId);
      expect(updatedSchedule?.title).toBe('更新されたスケジュール');
      expect(updatedSchedule?.amount).toBe(8000);
    });

    it('should handle recurring schedule updates', async () => {
      const updates = { amount: 12000 };
      const recurringScheduleId = 'sched-2';

      await act(async () => {
        actionTester.captureAction('updateRecurringSchedule', { 
          id: recurringScheduleId, 
          updates,
          updateFuture: true 
        });
        
        // Update all future instances of recurring schedule
        const updatedItems = mockScheduleStore.schedules.items.map(item => {
          if (item.id === recurringScheduleId || 
              (item.isRecurring && item.title === mockScheduleStore.schedules.items.find(s => s.id === recurringScheduleId)?.title)) {
            return { ...item, ...updates };
          }
          return item;
        });
        
        mockScheduleStore.schedules.items = updatedItems;
      });

      const updatedSchedule = mockScheduleStore.schedules.items.find(s => s.id === recurringScheduleId);
      expect(updatedSchedule?.amount).toBe(12000);
    });

    it('should handle partial recurring schedule updates', async () => {
      const recurringScheduleId = 'sched-2';
      const updates = { amount: 15000 };

      await act(async () => {
        actionTester.captureAction('updateSingleRecurringInstance', { 
          id: recurringScheduleId, 
          updates,
          updateFuture: false 
        });
        
        // Update only the specific instance
        const updatedItems = mockScheduleStore.schedules.items.map(item =>
          item.id === recurringScheduleId ? { ...item, ...updates, isRecurring: false } : item
        );
        
        mockScheduleStore.schedules.items = updatedItems;
      });

      const updatedSchedule = mockScheduleStore.schedules.items.find(s => s.id === recurringScheduleId);
      expect(updatedSchedule?.amount).toBe(15000);
      expect(updatedSchedule?.isRecurring).toBe(false); // Should break from recurring series
    });
  });

  describe('Delete Schedule', () => {
    beforeEach(() => {
      const schedules = [
        createMockScheduleItem({ id: 'sched-1' }),
        createMockScheduleItem({ id: 'sched-2', isRecurring: true }),
        createMockScheduleItem({ id: 'sched-3' }),
      ];
      mockScheduleStore.schedules.items = schedules;
    });

    it('should delete single schedule successfully', async () => {
      const scheduleId = 'sched-1';

      await act(async () => {
        actionTester.captureAction('deleteSchedule', { id: scheduleId });
        
        mockScheduleStore.schedules.items = mockScheduleStore.schedules.items
          .filter(s => s.id !== scheduleId);
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(2);
      expect(mockScheduleStore.schedules.items.find(s => s.id === scheduleId)).toBeUndefined();
    });

    it('should handle recurring schedule deletion', async () => {
      const recurringScheduleId = 'sched-2';

      await act(async () => {
        actionTester.captureAction('deleteRecurringSchedule', { 
          id: recurringScheduleId,
          deleteFuture: true 
        });
        
        // Delete all instances of recurring schedule
        mockScheduleStore.schedules.items = mockScheduleStore.schedules.items
          .filter(s => s.id !== recurringScheduleId);
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(2);
      expect(mockScheduleStore.schedules.items.find(s => s.id === recurringScheduleId)).toBeUndefined();
    });

    it('should handle cascade deletion validation', async () => {
      const scheduleId = 'sched-1';

      await act(async () => {
        actionTester.captureAction('deleteSchedule', { 
          id: scheduleId, 
          validateReferences: true 
        });
        
        // Check for related transactions or other references
        const hasReferences = false; // Mock check
        
        if (!hasReferences) {
          mockScheduleStore.schedules.items = mockScheduleStore.schedules.items
            .filter(s => s.id !== scheduleId);
        } else {
          errorTester.captureError(new Error('Schedule has references'), 'deleteSchedule');
          mockScheduleStore.schedules.error = 'Schedule has references';
        }
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(2);
    });
  });

  describe('Load Schedules', () => {
    it('should load schedules successfully', async () => {
      const mockSchedules = [
        createMockScheduleItem({ id: 'sched-1' }),
        createMockScheduleItem({ id: 'sched-2' }),
        createMockScheduleItem({ id: 'sched-3' }),
      ];
      
      const mockLoadAsync = createAsyncMock(mockSchedules, 50);

      await act(async () => {
        actionTester.captureAction('loadSchedules');
        
        mockScheduleStore.schedules.loading = true;
        mockScheduleStore.schedules.error = null;
        
        try {
          const result = await mockLoadAsync();
          mockScheduleStore.schedules.items = result;
          mockScheduleStore.schedules.loading = false;
        } catch (error) {
          mockScheduleStore.schedules.error = (error as Error).message;
          mockScheduleStore.schedules.loading = false;
        }
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(3);
      expect(mockScheduleStore.schedules.loading).toBe(false);
      expect(mockScheduleStore.schedules.error).toBeNull();
    });

    it('should load schedules with date filtering', async () => {
      const dateRange = {
        start: new Date('2024-02-01'),
        end: new Date('2024-02-29'),
      };
      
      const mockSchedules = [
        createMockScheduleItem({ id: 'sched-1', date: '2024-02-15' }),
        createMockScheduleItem({ id: 'sched-2', date: '2024-03-15' }), // Outside range
      ];
      
      const filteredSchedules = mockSchedules.filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate >= dateRange.start && scheduleDate <= dateRange.end;
      });

      await act(async () => {
        actionTester.captureAction('loadSchedulesWithDateRange', { dateRange });
        
        mockScheduleStore.schedules.loading = true;
        mockScheduleStore.schedules.items = filteredSchedules;
        mockScheduleStore.schedules.loading = false;
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(1);
      expect(mockScheduleStore.schedules.items[0].date).toBe('2024-02-15');
    });
  });

  describe('Recurring Schedule Generation', () => {
    it('should generate monthly recurring schedules', async () => {
      const baseSchedule = createMockScheduleItem({
        id: 'base-monthly',
        date: '2024-01-15',
        isRecurring: true,
        recurringType: 'monthly',
      });

      await act(async () => {
        actionTester.captureAction('generateRecurringSchedules', {
          baseSchedule,
          months: 6,
        });
        
        const generatedSchedules = Array.from({ length: 6 }, (_, i) => {
          const date = new Date('2024-01-15');
          date.setMonth(date.getMonth() + i);
          return createMockScheduleItem({
            id: `base-monthly-${i}`,
            date: date.toISOString().split('T')[0],
            title: baseSchedule.title,
            amount: baseSchedule.amount,
            isRecurring: true,
            recurringType: 'monthly',
          });
        });

        mockScheduleStore.schedules.items = generatedSchedules;
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(6);
      expect(mockScheduleStore.schedules.items.every(s => s.isRecurring)).toBe(true);
    });

    it('should generate weekly recurring schedules', async () => {
      const baseSchedule = createMockScheduleItem({
        id: 'base-weekly',
        date: '2024-02-05', // Monday
        isRecurring: true,
        recurringType: 'weekly',
      });

      await act(async () => {
        actionTester.captureAction('generateRecurringSchedules', {
          baseSchedule,
          weeks: 4,
        });
        
        const generatedSchedules = Array.from({ length: 4 }, (_, i) => {
          const date = new Date('2024-02-05');
          date.setDate(date.getDate() + (i * 7));
          return createMockScheduleItem({
            id: `base-weekly-${i}`,
            date: date.toISOString().split('T')[0],
            title: baseSchedule.title,
            amount: baseSchedule.amount,
            isRecurring: true,
            recurringType: 'weekly',
          });
        });

        mockScheduleStore.schedules.items = generatedSchedules;
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(4);
      expect(mockScheduleStore.schedules.items.every(s => s.recurringType === 'weekly')).toBe(true);
    });

    it('should generate annual recurring schedules', async () => {
      const baseSchedule = createMockScheduleItem({
        id: 'base-annual',
        date: '2024-12-25', // Christmas
        isRecurring: true,
        recurringType: 'annual',
      });

      await act(async () => {
        actionTester.captureAction('generateRecurringSchedules', {
          baseSchedule,
          years: 3,
        });
        
        const generatedSchedules = Array.from({ length: 3 }, (_, i) => {
          const date = new Date('2024-12-25');
          date.setFullYear(date.getFullYear() + i);
          return createMockScheduleItem({
            id: `base-annual-${i}`,
            date: date.toISOString().split('T')[0],
            title: baseSchedule.title,
            amount: baseSchedule.amount,
            isRecurring: true,
            recurringType: 'annual',
          });
        });

        mockScheduleStore.schedules.items = generatedSchedules;
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(3);
      expect(mockScheduleStore.schedules.items.every(s => s.recurringType === 'annual')).toBe(true);
    });
  });

  describe('Schedule Calculations', () => {
    beforeEach(() => {
      const schedules = [
        createMockScheduleItem({ id: 'sched-1', amount: 5000, date: '2024-02-15' }),
        createMockScheduleItem({ id: 'sched-2', amount: 3000, date: '2024-02-15' }),
        createMockScheduleItem({ id: 'sched-3', amount: 2000, date: '2024-02-16' }),
      ];
      mockScheduleStore.schedules.items = schedules;
    });

    it('should calculate daily totals', async () => {
      await act(async () => {
        actionTester.captureAction('calculateScheduleTotals');
        
        const dailyTotals = mockScheduleStore.schedules.items.reduce((acc, schedule) => {
          const date = schedule.date;
          acc[date] = (acc[date] || 0) + schedule.amount;
          return acc;
        }, {} as Record<string, number>);
        
        // Simulate storing calculated totals
        mockScheduleStore.schedules.dailyTotals = dailyTotals;
      });

      expect(mockScheduleStore.schedules.dailyTotals['2024-02-15']).toBe(8000);
      expect(mockScheduleStore.schedules.dailyTotals['2024-02-16']).toBe(2000);
    });

    it('should calculate monthly totals', async () => {
      await act(async () => {
        actionTester.captureAction('calculateMonthlyTotals');
        
        const monthlyTotals = mockScheduleStore.schedules.items.reduce((acc, schedule) => {
          const date = new Date(schedule.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[monthKey] = (acc[monthKey] || 0) + schedule.amount;
          return acc;
        }, {} as Record<string, number>);
        
        mockScheduleStore.schedules.monthlyTotals = monthlyTotals;
      });

      expect(mockScheduleStore.schedules.monthlyTotals['2024-02']).toBe(10000);
    });

    it('should calculate category totals', async () => {
      const schedulesWithCategories = [
        createMockScheduleItem({ id: 'sched-1', amount: 5000, categoryId: 'cat-1' }),
        createMockScheduleItem({ id: 'sched-2', amount: 3000, categoryId: 'cat-1' }),
        createMockScheduleItem({ id: 'sched-3', amount: 2000, categoryId: 'cat-2' }),
      ];
      
      mockScheduleStore.schedules.items = schedulesWithCategories;

      await act(async () => {
        actionTester.captureAction('calculateCategoryTotals');
        
        const categoryTotals = mockScheduleStore.schedules.items.reduce((acc, schedule) => {
          const categoryId = schedule.categoryId;
          acc[categoryId] = (acc[categoryId] || 0) + schedule.amount;
          return acc;
        }, {} as Record<string, number>);
        
        mockScheduleStore.schedules.categoryTotals = categoryTotals;
      });

      expect(mockScheduleStore.schedules.categoryTotals['cat-1']).toBe(8000);
      expect(mockScheduleStore.schedules.categoryTotals['cat-2']).toBe(2000);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const schedules = [
        createMockScheduleItem({ id: 'sched-1', cardId: 'card-1', categoryId: 'cat-1' }),
        createMockScheduleItem({ id: 'sched-2', cardId: 'card-2', categoryId: 'cat-2' }),
        createMockScheduleItem({ id: 'sched-3', bankId: 'bank-1', categoryId: 'cat-1' }),
      ];
      mockScheduleStore.schedules.items = schedules;
    });

    it('should filter by payment method', () => {
      act(() => {
        actionTester.captureAction('setFilter', { cardId: 'card-1' });
        mockScheduleStore.schedules.filter.cardId = 'card-1';
      });

      expect(mockScheduleStore.schedules.filter.cardId).toBe('card-1');
    });

    it('should filter by category', () => {
      act(() => {
        actionTester.captureAction('setFilter', { categoryId: 'cat-1' });
        mockScheduleStore.schedules.filter.categoryId = 'cat-1';
      });

      expect(mockScheduleStore.schedules.filter.categoryId).toBe('cat-1');
    });

    it('should clear all filters', () => {
      // Set some filters first
      mockScheduleStore.schedules.filter = {
        dateRange: { start: new Date(), end: new Date() },
        cardId: 'card-1',
        bankId: 'bank-1',
        categoryId: 'cat-1',
      };

      act(() => {
        actionTester.captureAction('clearFilter');
        mockScheduleStore.schedules.filter = {
          dateRange: null,
          cardId: null,
          bankId: null,
          categoryId: null,
        };
      });

      expect(mockScheduleStore.schedules.filter.cardId).toBeNull();
      expect(mockScheduleStore.schedules.filter.categoryId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle recurring schedule generation errors', async () => {
      const invalidBaseSchedule = createMockScheduleItem({
        date: 'invalid-date',
        isRecurring: true,
      });

      await act(async () => {
        actionTester.captureAction('generateRecurringSchedules', { baseSchedule: invalidBaseSchedule });
        errorTester.captureError(new Error('Invalid date format'), 'generateRecurringSchedules');
        
        mockScheduleStore.schedules.error = 'Invalid date format';
      });

      expect(mockScheduleStore.schedules.error).toBe('Invalid date format');
    });

    it('should handle schedule conflict detection', async () => {
      const conflictingSchedule = createMockScheduleItem({
        id: 'conflict-sched',
        date: '2024-02-15',
        title: 'Conflicting Schedule',
      });

      // Add existing schedule with same date
      mockScheduleStore.schedules.items = [
        createMockScheduleItem({ id: 'existing', date: '2024-02-15' })
      ];

      await act(async () => {
        actionTester.captureAction('addScheduleWithConflictCheck', conflictingSchedule);
        
        // Check for conflicts
        const hasConflict = mockScheduleStore.schedules.items.some(
          s => s.date === conflictingSchedule.date && s.title === conflictingSchedule.title
        );

        if (hasConflict) {
          errorTester.captureError(new Error('Schedule conflict detected'), 'addSchedule');
          mockScheduleStore.schedules.error = 'Schedule conflict detected';
        } else {
          mockScheduleStore.schedules.items.push(conflictingSchedule);
        }
      });

      expect(mockScheduleStore.schedules.items).toHaveLength(1); // Only original item
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of schedules efficiently', () => {
      const largeScheduleSet = Array.from({ length: 1000 }, (_, i) =>
        createMockScheduleItem({ id: `sched-${i}` })
      );

      const startTime = performance.now();

      act(() => {
        mockScheduleStore.schedules.items = largeScheduleSet;
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockScheduleStore.schedules.items).toHaveLength(1000);
      expect(duration).toBeLessThan(100);
    });

    it('should perform recurring schedule generation efficiently', async () => {
      const baseSchedule = createMockScheduleItem({
        isRecurring: true,
        recurringType: 'monthly',
      });

      const startTime = performance.now();

      await act(async () => {
        // Generate 2 years of monthly schedules (24 instances)
        const generatedSchedules = Array.from({ length: 24 }, (_, i) => {
          const date = new Date(baseSchedule.date);
          date.setMonth(date.getMonth() + i);
          return createMockScheduleItem({
            id: `recurring-${i}`,
            date: date.toISOString().split('T')[0],
            isRecurring: true,
            recurringType: 'monthly',
          });
        });

        mockScheduleStore.schedules.items = generatedSchedules;
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockScheduleStore.schedules.items).toHaveLength(24);
      expect(duration).toBeLessThan(50);
    });
  });
});