import { StateCreator } from 'zustand';
import { 
  ScheduleSlice, 
  ScheduleCache, 
  CACHE_DURATIONS,
  AppStore 
} from '../types';
import { 
  MonthlySchedule, 
  ScheduleItem,
  DatabaseError 
} from '@/types/database';
import { transactionOperations } from '@/lib/database';

// Cache utilities
const createScheduleCacheKey = (year: number, month: number): string => {
  return `schedule-${year}-${month}`;
};

const createScheduleMapKey = (year: number, month: number): string => {
  return `${year}-${month}`;
};

const isCacheValid = (cache: ScheduleCache, key: string): boolean => {
  const item = cache[key];
  return item && Date.now() < item.expiresAt;
};

const setCacheItem = (
  cache: ScheduleCache, 
  key: string, 
  data: MonthlySchedule
): void => {
  const now = Date.now();
  cache[key] = {
    data,
    timestamp: now,
    expiresAt: now + CACHE_DURATIONS.SCHEDULES,
  };
};

export const createScheduleSlice: StateCreator<
  AppStore,
  [],
  [],
  ScheduleSlice
> = (set, get) => ({
  schedules: {},
  scheduleCache: {},
  
  actions: {
    // Fetch monthly schedule with caching
    fetchMonthlySchedule: async (year: number, month: number) => {
      const { actions: uiActions } = get();
      
      return await uiActions.withAsyncOperation('schedules', async () => {
        const state = get();
        const cacheKey = createScheduleCacheKey(year, month);
        const mapKey = createScheduleMapKey(year, month);
        
        // Check cache first
        if (isCacheValid(state.scheduleCache, cacheKey)) {
          const cachedData = state.scheduleCache[cacheKey].data;
          
          // Update schedules map
          set((state) => ({
            schedules: {
              ...state.schedules,
              [mapKey]: cachedData,
            },
          }));
          
          return cachedData;
        }
        
        // Fetch from database
        const schedule = await transactionOperations.getMonthlySchedule(year, month);
        
        // Update state and cache
        set((state) => {
          const newCache = { ...state.scheduleCache };
          setCacheItem(newCache, cacheKey, schedule);
          
          return {
            schedules: {
              ...state.schedules,
              [mapKey]: schedule,
            },
            scheduleCache: newCache,
          };
        });
        
        return schedule;
      });
    },

    // Update a schedule item
    updateScheduleItem: async (scheduleId: string, updates: Partial<ScheduleItem>) => {
      const { actions: uiActions, actions: transactionActions } = get();
      
      await uiActions.withAsyncOperation('saving', async () => {
        // For schedule items, we need to update the underlying transaction
        // since schedule items are derived from transactions
        const transaction = await transactionOperations.getById(scheduleId);
        
        if (!transaction) {
          throw new Error(`Transaction with ID ${scheduleId} not found`);
        }
        
        // Convert schedule item updates to transaction updates
        const transactionUpdates: any = {};
        
        if (updates.amount !== undefined) {
          transactionUpdates.amount = updates.amount;
        }
        if (updates.paymentDate !== undefined) {
          transactionUpdates.scheduledPayDate = updates.paymentDate;
        }
        if (updates.storeName !== undefined) {
          transactionUpdates.storeName = updates.storeName;
        }
        if (updates.usage !== undefined) {
          transactionUpdates.usage = updates.usage;
        }
        
        // Update the transaction
        await transactionOperations.update(scheduleId, transactionUpdates);
        
        // Invalidate schedule cache since it's derived from transactions
        get().actions.invalidateScheduleCache();
        
        // Also invalidate transaction cache
        transactionActions.invalidateTransactionCache();
      });
    },

    // Delete a schedule item (which deletes the underlying transaction)
    deleteScheduleItem: async (scheduleId: string) => {
      const { actions: uiActions, actions: transactionActions } = get();
      
      await uiActions.withAsyncOperation('deleting', async () => {
        // Delete the underlying transaction
        await transactionOperations.delete(scheduleId);
        
        // Invalidate caches
        get().actions.invalidateScheduleCache();
        transactionActions.invalidateTransactionCache();
      });
    },

    // Cache management
    invalidateScheduleCache: (key?: string) => {
      set((state) => {
        if (key) {
          const newCache = { ...state.scheduleCache };
          delete newCache[key];
          
          // Also remove from schedules map if it matches the pattern
          const newSchedules = { ...state.schedules };
          const keyParts = key.replace('schedule-', '').split('-');
          if (keyParts.length === 2) {
            const mapKey = `${keyParts[0]}-${keyParts[1]}`;
            delete newSchedules[mapKey];
          }
          
          return { 
            scheduleCache: newCache,
            schedules: newSchedules,
          };
        } else {
          return { 
            scheduleCache: {},
            schedules: {},
          };
        }
      });
    },

    clearScheduleCache: () => {
      set({ 
        scheduleCache: {},
        schedules: {},
      });
    },
  },
});

// Additional helper functions for schedule operations
export const createScheduleHelpers = (get: () => AppStore) => ({
  // Get schedule for a specific month
  getMonthlySchedule: (year: number, month: number): MonthlySchedule | null => {
    const mapKey = createScheduleMapKey(year, month);
    return get().schedules[mapKey] || null;
  },

  // Get schedule items for a specific date
  getScheduleItemsForDate: (year: number, month: number, date: Date): ScheduleItem[] => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    if (!schedule) return [];
    
    const targetDate = date.toDateString();
    return schedule.items.filter(item => 
      item.date.toDateString() === targetDate
    );
  },

  // Get all schedule items for a specific bank
  getScheduleItemsByBank: (year: number, month: number, bankName: string): ScheduleItem[] => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    if (!schedule) return [];
    
    return schedule.items.filter(item => item.bankName === bankName);
  },

  // Calculate total scheduled amount for a month
  getMonthlyScheduleTotal: (year: number, month: number): number => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    return schedule?.totalAmount || 0;
  },

  // Get bank totals for a month
  getBankTotalsForMonth: (year: number, month: number) => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    return schedule?.bankTotals || [];
  },

  // Check if schedule data exists for a month
  hasScheduleData: (year: number, month: number): boolean => {
    const mapKey = createScheduleMapKey(year, month);
    return mapKey in get().schedules;
  },

  // Get schedule items that are editable
  getEditableScheduleItems: (year: number, month: number): ScheduleItem[] => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    if (!schedule) return [];
    
    return schedule.items.filter(item => item.isScheduleEditable);
  },

  // Group schedule items by date
  groupScheduleItemsByDate: (year: number, month: number): Map<string, ScheduleItem[]> => {
    const schedule = get().schedules[createScheduleMapKey(year, month)];
    if (!schedule) return new Map();
    
    const grouped = new Map<string, ScheduleItem[]>();
    
    schedule.items.forEach(item => {
      const dateKey = item.date.toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(item);
    });
    
    return grouped;
  },

  // Get upcoming schedule items (next 7 days)
  getUpcomingScheduleItems: (): ScheduleItem[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const allItems: ScheduleItem[] = [];
    
    // Collect items from all loaded schedules
    Object.values(get().schedules).forEach(schedule => {
      schedule.items.forEach(item => {
        if (item.date >= today && item.date <= nextWeek) {
          allItems.push(item);
        }
      });
    });
    
    // Sort by date
    return allItems.sort((a, b) => a.date.getTime() - b.date.getTime());
  },
});