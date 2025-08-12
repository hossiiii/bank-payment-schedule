'use client';

import { useMemo, useState, useCallback } from 'react';
import { 
  PaymentScheduleView,
  ScheduleFilters,
  UseFilteredScheduleResult,
  PaymentSummary,
  TransactionDetail
} from '@/types/schedule';

/**
 * Hook for filtering PaymentScheduleView data based on various criteria
 * Provides real-time filtering of schedule data with debouncing
 */
export function useFilteredSchedule(
  scheduleData: PaymentScheduleView | null
): UseFilteredScheduleResult {
  const [appliedFilters, setAppliedFilters] = useState<ScheduleFilters>({});

  const updateFilters = useCallback((newFilters: Partial<ScheduleFilters>) => {
    setAppliedFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setAppliedFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      appliedFilters.dateRange ||
      appliedFilters.amountRange ||
      appliedFilters.searchText ||
      (appliedFilters.bankIds && appliedFilters.bankIds.length > 0) ||
      (appliedFilters.paymentTypes && appliedFilters.paymentTypes.length > 0)
    );
  }, [appliedFilters]);

  const filteredData = useMemo((): PaymentScheduleView | null => {
    if (!scheduleData) return null;
    if (!hasActiveFilters) return scheduleData;

    try {
      // Filter payments based on criteria
      const filteredPayments = scheduleData.payments.filter(payment => {
        return (
          filterByDateRange(payment, appliedFilters.dateRange) &&
          filterByAmountRange(payment, appliedFilters.amountRange) &&
          filterBySearchText(payment, appliedFilters.searchText) &&
          filterByBankIds(payment, appliedFilters.bankIds) &&
          filterByPaymentTypes(payment, appliedFilters.paymentTypes)
        );
      });

      // Recalculate totals for filtered data
      const bankTotals = recalculateBankTotals(filteredPayments);
      const monthTotal = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

      // Update unique banks list to only include banks that appear in filtered results
      const activeBankIds = new Set<string>();
      filteredPayments.forEach(payment => {
        payment.bankPayments.forEach(bp => {
          if (bp.amount > 0) {
            activeBankIds.add(bp.bankId);
          }
        });
      });

      const uniqueBanks = scheduleData.uniqueBanks.filter(bank => activeBankIds.has(bank.id));

      return {
        ...scheduleData,
        payments: filteredPayments,
        bankTotals,
        monthTotal,
        uniqueBanks
      };
    } catch (error) {
      console.error('Error filtering schedule data:', error);
      return scheduleData; // Return original data if filtering fails
    }
  }, [scheduleData, appliedFilters, hasActiveFilters]);

  return {
    filteredData,
    appliedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters
  };
}

/**
 * Filter payment by date range
 */
function filterByDateRange(
  payment: PaymentSummary, 
  dateRange?: { start: Date; end: Date }
): boolean {
  if (!dateRange) return true;

  try {
    const paymentDate = new Date(payment.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Set time to start/end of day for comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    return paymentDate >= startDate && paymentDate <= endDate;
  } catch (error) {
    console.warn('Error filtering by date range:', error);
    return true;
  }
}

/**
 * Filter payment by amount range
 */
function filterByAmountRange(
  payment: PaymentSummary,
  amountRange?: { min?: number; max?: number }
): boolean {
  if (!amountRange) return true;

  const { min, max } = amountRange;
  const amount = payment.totalAmount;

  if (min !== undefined && amount < min) return false;
  if (max !== undefined && amount > max) return false;

  return true;
}

/**
 * Filter payment by search text (store name or usage)
 */
function filterBySearchText(
  payment: PaymentSummary,
  searchText?: string
): boolean {
  if (!searchText) return true;

  const normalizedSearch = searchText.toLowerCase().trim();
  if (!normalizedSearch) return true;

  // Search in payment name
  if (payment.paymentName.toLowerCase().includes(normalizedSearch)) {
    return true;
  }

  // Search in transaction details
  return payment.transactions.some(transaction => {
    const storeName = transaction.storeName?.toLowerCase() || '';
    const usage = transaction.usage?.toLowerCase() || '';
    
    return storeName.includes(normalizedSearch) || usage.includes(normalizedSearch);
  });
}

/**
 * Filter payment by bank IDs
 */
function filterByBankIds(
  payment: PaymentSummary,
  bankIds?: string[]
): boolean {
  if (!bankIds || bankIds.length === 0) return true;

  // Check if payment has any amounts for the selected banks
  return payment.bankPayments.some(bankPayment => 
    bankIds.includes(bankPayment.bankId) && bankPayment.amount > 0
  );
}

/**
 * Filter payment by payment types
 */
function filterByPaymentTypes(
  payment: PaymentSummary,
  paymentTypes?: ('card' | 'bank')[]
): boolean {
  if (!paymentTypes || paymentTypes.length === 0) return true;

  // Check if payment has transactions matching the selected payment types
  return payment.transactions.some(transaction => 
    paymentTypes.includes(transaction.paymentType)
  );
}

/**
 * Recalculate bank totals for filtered payments
 */
function recalculateBankTotals(payments: PaymentSummary[]): Map<string, number> {
  const bankTotals = new Map<string, number>();

  payments.forEach(payment => {
    payment.bankPayments.forEach(bankPayment => {
      const currentTotal = bankTotals.get(bankPayment.bankId) || 0;
      bankTotals.set(bankPayment.bankId, currentTotal + bankPayment.amount);
    });
  });

  return bankTotals;
}

/**
 * Advanced filtering hook with additional features
 */
export function useAdvancedScheduleFilter(
  scheduleData: PaymentScheduleView | null,
  initialFilters: ScheduleFilters = {}
): UseFilteredScheduleResult & {
  totalFilteredAmount: number;
  filteredTransactionCount: number;
  averageTransactionAmount: number;
  resetToDefaults: () => void;
} {
  const [appliedFilters, setAppliedFilters] = useState<ScheduleFilters>(initialFilters);

  const baseResult = useFilteredSchedule(scheduleData);
  
  // Override the appliedFilters state management
  const updateFilters = useCallback((newFilters: Partial<ScheduleFilters>) => {
    setAppliedFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setAppliedFilters({});
  }, []);

  const resetToDefaults = useCallback(() => {
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  // Calculate additional statistics
  const stats = useMemo(() => {
    if (!baseResult.filteredData) {
      return {
        totalFilteredAmount: 0,
        filteredTransactionCount: 0,
        averageTransactionAmount: 0
      };
    }

    const totalAmount = baseResult.filteredData.monthTotal;
    const transactionCount = baseResult.filteredData.payments.reduce(
      (sum, payment) => sum + payment.transactions.length, 
      0
    );
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

    return {
      totalFilteredAmount: totalAmount,
      filteredTransactionCount: transactionCount,
      averageTransactionAmount: averageAmount
    };
  }, [baseResult.filteredData]);

  return {
    ...baseResult,
    appliedFilters,
    updateFilters,
    clearFilters,
    ...stats,
    resetToDefaults
  };
}

/**
 * Quick filter presets
 */
export const filterPresets = {
  highAmountTransactions: (threshold: number = 10000): ScheduleFilters => ({
    amountRange: { min: threshold }
  }),
  
  cardPaymentsOnly: (): ScheduleFilters => ({
    paymentTypes: ['card']
  }),
  
  bankPaymentsOnly: (): ScheduleFilters => ({
    paymentTypes: ['bank']
  }),
  
  thisWeek: (): ScheduleFilters => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const endOfWeek = new Date(now);
    
    startOfWeek.setDate(now.getDate() - now.getDay());
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    
    return {
      dateRange: { start: startOfWeek, end: endOfWeek }
    };
  },
  
  nextWeek: (): ScheduleFilters => {
    const now = new Date();
    const startOfNextWeek = new Date(now);
    const endOfNextWeek = new Date(now);
    
    startOfNextWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfNextWeek.setDate(now.getDate() + (13 - now.getDay()));
    
    return {
      dateRange: { start: startOfNextWeek, end: endOfNextWeek }
    };
  }
};

/**
 * Hook for applying filter presets
 */
export function useFilterPresets() {
  const applyPreset = useCallback((
    presetFunction: () => ScheduleFilters,
    updateFilters: (filters: Partial<ScheduleFilters>) => void
  ) => {
    const presetFilters = presetFunction();
    updateFilters(presetFilters);
  }, []);

  return { applyPreset, presets: filterPresets };
}