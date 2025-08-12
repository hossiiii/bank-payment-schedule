import { renderHook, waitFor } from '@testing-library/react';
import { useScheduleData, useFilteredSchedule } from '@/lib/hooks/useScheduleData';
import { useFilteredSchedule as useFilteredScheduleHook } from '@/lib/hooks/useFilteredSchedule';
import { PaymentScheduleView, ScheduleFilters } from '@/types/schedule';

// Mock the database hooks
jest.mock('@/lib/hooks/useDatabase', () => ({
  useBanks: jest.fn(),
  useCards: jest.fn(),
  useTransactions: jest.fn()
}));

// Mock the schedule utils
jest.mock('@/lib/utils/scheduleUtils', () => ({
  transformToPaymentScheduleView: jest.fn(),
  validatePaymentScheduleView: jest.fn(() => ({ isValid: true, errors: [] }))
}));

import { useBanks, useCards, useTransactions } from '@/lib/hooks/useDatabase';
import { transformToPaymentScheduleView } from '@/lib/utils/scheduleUtils';

const mockUseBanks = useBanks as jest.MockedFunction<typeof useBanks>;
const mockUseCards = useCards as jest.MockedFunction<typeof useCards>;
const mockUseTransactions = useTransactions as jest.MockedFunction<typeof useTransactions>;
const mockTransformToPaymentScheduleView = transformToPaymentScheduleView as jest.MockedFunction<typeof transformToPaymentScheduleView>;

const mockBanks = [
  { id: 'bank1', name: 'SBIネット銀行' },
  { id: 'bank2', name: 'みずほ銀行' }
];

const mockCards = [
  {
    id: 'card1',
    name: 'イオンカード',
    bankId: 'bank1',
    closingDay: '10',
    paymentDay: '2',
    paymentMonthShift: 1,
    adjustWeekend: true
  }
];

const mockTransactions = [
  {
    id: 'tx1',
    date: new Date('2025-08-04').getTime(),
    storeName: 'Amazon',
    usage: '通販',
    amount: 2500,
    paymentType: 'card' as const,
    cardId: 'card1',
    scheduledPayDate: new Date('2025-09-02').getTime(),
    createdAt: Date.now()
  }
];

const mockScheduleData: PaymentScheduleView = {
  month: '2025年9月',
  payments: [
    {
      date: '2025-09-02',
      dayOfWeek: '火',
      paymentName: 'イオンカード',
      closingDay: '10日締',
      paymentDay: '翌月2日',
      bankPayments: [
        {
          bankId: 'bank1',
          bankName: 'SBIネット銀行',
          amount: 2500,
          transactionCount: 1
        }
      ],
      totalAmount: 2500,
      transactions: mockTransactions,
      sortKey: new Date('2025-09-02').getTime()
    }
  ],
  bankTotals: new Map([['bank1', 2500]]),
  monthTotal: 2500,
  uniqueBanks: mockBanks
};

describe('useScheduleData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseBanks.mockReturnValue({
      banks: mockBanks,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn()
    });

    mockUseCards.mockReturnValue({
      cards: mockCards,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn()
    });

    mockUseTransactions.mockReturnValue({
      transactions: mockTransactions,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn()
    });

    mockTransformToPaymentScheduleView.mockReturnValue(mockScheduleData);
  });

  it('should return schedule data when all dependencies are loaded', async () => {
    const { result } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scheduleData).toEqual(mockScheduleData);
    expect(result.current.error).toBeNull();
  });

  it('should show loading state when dependencies are loading', () => {
    mockUseBanks.mockReturnValue({
      banks: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn()
    });

    const { result } = renderHook(() => useScheduleData(2025, 9));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.scheduleData).toBeNull();
  });

  it('should handle errors from dependencies', () => {
    const testError = new Error('Database connection failed');
    
    mockUseBanks.mockReturnValue({
      banks: [],
      isLoading: false,
      error: testError,
      refetch: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn()
    });

    const { result } = renderHook(() => useScheduleData(2025, 9));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(testError);
  });

  it('should handle empty banks gracefully', async () => {
    mockUseBanks.mockReturnValue({
      banks: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createBank: jest.fn(),
      updateBank: jest.fn(),
      deleteBank: jest.fn()
    });

    const { result } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('No banks configured');
  });

  it('should handle empty transactions gracefully', async () => {
    mockUseTransactions.mockReturnValue({
      transactions: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn()
    });

    const emptyScheduleData: PaymentScheduleView = {
      month: '2025年9月',
      payments: [],
      bankTotals: new Map(),
      monthTotal: 0,
      uniqueBanks: []
    };

    mockTransformToPaymentScheduleView.mockReturnValue(emptyScheduleData);

    const { result } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scheduleData).toEqual(emptyScheduleData);
    expect(result.current.error).toBeNull();
  });

  it('should refetch data when called', async () => {
    const mockRefetch = jest.fn();
    
    const { result } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call refetch
    result.current.refetch();

    // Should trigger data recalculation
    expect(mockTransformToPaymentScheduleView).toHaveBeenCalled();
  });

  it('should update when year or month changes', async () => {
    const { result, rerender } = renderHook(
      ({ year, month }) => useScheduleData(year, month),
      { initialProps: { year: 2025, month: 9 } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockTransformToPaymentScheduleView).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2025, month: 9 })
    );

    // Change the month
    rerender({ year: 2025, month: 10 });

    await waitFor(() => {
      expect(mockTransformToPaymentScheduleView).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2025, month: 10 })
      );
    });
  });
});

describe('useFilteredSchedule', () => {
  const { result: scheduleResult } = renderHook(() => ({
    scheduleData: mockScheduleData
  }));

  it('should return original data when no filters are applied', () => {
    const { result } = renderHook(() => 
      useFilteredScheduleHook(scheduleResult.current.scheduleData)
    );

    expect(result.current.filteredData).toEqual(mockScheduleData);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should filter data when filters are applied', () => {
    const { result } = renderHook(() => 
      useFilteredScheduleHook(mockScheduleData)
    );

    // Apply amount filter
    const amountFilter: ScheduleFilters = {
      amountRange: { min: 5000 }
    };

    result.current.updateFilters(amountFilter);

    expect(result.current.appliedFilters).toEqual(amountFilter);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should clear filters correctly', () => {
    const { result } = renderHook(() => 
      useFilteredScheduleHook(mockScheduleData)
    );

    // Apply filters
    result.current.updateFilters({
      amountRange: { min: 1000 }
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear filters
    result.current.clearFilters();

    expect(result.current.appliedFilters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should handle null schedule data', () => {
    const { result } = renderHook(() => 
      useFilteredScheduleHook(null)
    );

    expect(result.current.filteredData).toBeNull();
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('should update filters incrementally', () => {
    const { result } = renderHook(() => 
      useFilteredScheduleHook(mockScheduleData)
    );

    // Apply first filter
    result.current.updateFilters({
      amountRange: { min: 1000 }
    });

    expect(result.current.appliedFilters).toEqual({
      amountRange: { min: 1000 }
    });

    // Apply second filter (should merge)
    result.current.updateFilters({
      searchText: 'Amazon'
    });

    expect(result.current.appliedFilters).toEqual({
      amountRange: { min: 1000 },
      searchText: 'Amazon'
    });
  });
});

describe('schedule data cache behavior', () => {
  it('should cache results for repeated calls with same parameters', async () => {
    const { result, rerender } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstCallCount = mockTransformToPaymentScheduleView.mock.calls.length;

    // Rerender with same parameters
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not call transform function again due to caching
    expect(mockTransformToPaymentScheduleView.mock.calls.length).toBe(firstCallCount);
  });

  it('should invalidate cache when dependencies change', async () => {
    const { result } = renderHook(() => useScheduleData(2025, 9));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstCallCount = mockTransformToPaymentScheduleView.mock.calls.length;

    // Simulate dependency change by changing transaction data
    mockUseTransactions.mockReturnValue({
      transactions: [...mockTransactions, {
        id: 'tx2',
        date: new Date('2025-08-05').getTime(),
        storeName: 'NewStore',
        usage: 'テスト',
        amount: 1000,
        paymentType: 'card' as const,
        cardId: 'card1',
        scheduledPayDate: new Date('2025-09-02').getTime(),
        createdAt: Date.now()
      }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn()
    });

    // This should trigger cache invalidation and re-computation
    result.current.refetch();

    await waitFor(() => {
      expect(mockTransformToPaymentScheduleView.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });
});