import { 
  PaymentScheduleView, 
  PaymentSummary, 
  BankPayment, 
  GroupedTransaction,
  ScheduleCalculationParams,
  ScheduleProcessingError
} from '@/types/schedule';
import { Transaction, ScheduleItem, Card, Bank } from '@/types/database';
import { 
  formatDateISO, 
  getWeekdayNameJP, 
  createJapanDate
} from './dateUtils';
import { calculateCardPaymentDate, calculateBankPaymentDate } from './paymentCalc';

/**
 * Core utility functions for transforming data from MonthlySchedule to PaymentScheduleView
 * Handles the critical transformation from accordion-style to cross-table format
 */

/**
 * Transforms MonthlySchedule data to PaymentScheduleView for cross-table display
 * This is the main function that converts from the old accordion format to the new matrix format
 */
export function transformToPaymentScheduleView(
  params: ScheduleCalculationParams
): PaymentScheduleView {
  const { transactions, banks, cards, year, month } = params;

  try {
    // Step 1: Filter transactions for the target month
    const monthlyTransactions = filterTransactionsForMonth(transactions, year, month);
    
    // Step 2: Calculate scheduled payment dates and group by date
    const groupedByDate = groupTransactionsByScheduledDate(monthlyTransactions, cards);
    
    // Step 3: Convert groups to PaymentSummary format
    const payments = createPaymentSummaries(groupedByDate, banks, cards);
    
    // Step 4: Calculate bank totals for the cross-table columns
    const bankTotals = calculateBankTotals(payments);
    
    // Step 5: Calculate month total
    const monthTotal = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    
    // Step 6: Get unique banks for dynamic column generation
    const uniqueBanks = extractUniqueBanks(payments, banks);

    return {
      month: `${year}年${month}月`,
      payments: payments.sort((a, b) => a.sortKey - b.sortKey),
      bankTotals,
      monthTotal,
      uniqueBanks
    };
  } catch (error) {
    throw new ScheduleProcessingError(
      `Failed to transform schedule data for ${year}年${month}月`,
      'CALCULATION_ERROR',
      { originalError: error instanceof Error ? error : new Error(String(error)) }
    );
  }
}

/**
 * Filters transactions for a specific month based on scheduled payment dates
 */
export function filterTransactionsForMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const startDate = createJapanDate(year, month, 1);
  const endDate = createJapanDate(year, month + 1, 0); // Last day of month
  
  return transactions.filter(tx => {
    const scheduledDate = new Date(tx.scheduledPayDate);
    return scheduledDate >= startDate && scheduledDate <= endDate;
  });
}

/**
 * Groups transactions by their scheduled payment date
 */
export function groupTransactionsByScheduledDate(
  transactions: Transaction[],
  cards: Card[]
): Map<string, GroupedTransaction> {
  const grouped = new Map<string, GroupedTransaction>();

  transactions.forEach(transaction => {
    try {
      // Recalculate scheduled payment date to ensure consistency
      const scheduledDate = recalculateScheduledPaymentDate(transaction, cards);
      const dateKey = formatDateISO(scheduledDate);
      const dayOfWeek = getWeekdayNameJP(scheduledDate);

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          dayOfWeek,
          transactions: []
        });
      }

      const group = grouped.get(dateKey)!;
      group.transactions.push(transaction);

      // Set card info if this is a card transaction
      if (transaction.paymentType === 'card' && transaction.cardId) {
        const card = cards.find(c => c.id === transaction.cardId);
        if (card && !group.cardInfo) {
          group.cardInfo = {
            name: card.name,
            closingDay: card.closingDay === '月末' ? '月末締' : `${card.closingDay}日締`,
            paymentDay: formatPaymentDay(card)
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to group transaction ${transaction.id}:`, error);
    }
  });

  return grouped;
}

/**
 * Creates PaymentSummary objects from grouped transactions
 */
export function createPaymentSummaries(
  grouped: Map<string, GroupedTransaction>,
  banks: Bank[],
  cards: Card[]
): PaymentSummary[] {
  const summaries: PaymentSummary[] = [];

  grouped.forEach((group, dateKey) => {
    try {
      // Calculate bank payments for this date
      const bankPayments = calculateBankPaymentsForDate(group.transactions, banks, cards);
      
      // Determine payment name (card name or "銀行引落")
      const paymentName = determinePaymentName(group.transactions, cards);
      
      // Calculate total amount for the row
      const totalAmount = group.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Create sort key from date
      const sortKey = new Date(dateKey).getTime();

      const summary: PaymentSummary = {
        date: dateKey,
        dayOfWeek: group.dayOfWeek,
        paymentName,
        paymentDay: group.cardInfo?.paymentDay || formatBankPaymentDay(),
        bankPayments,
        totalAmount,
        transactions: group.transactions,
        sortKey,
        ...(group.cardInfo?.closingDay && { closingDay: group.cardInfo.closingDay })
      };

      summaries.push(summary);
    } catch (error) {
      console.warn(`Failed to create payment summary for ${dateKey}:`, error);
    }
  });

  return summaries;
}

/**
 * Calculates bank payments for a specific date
 */
export function calculateBankPaymentsForDate(
  transactions: Transaction[],
  banks: Bank[],
  cards: Card[]
): BankPayment[] {
  const bankAmounts = new Map<string, { amount: number; count: number }>();

  transactions.forEach(transaction => {
    let bankId: string | undefined;

    if (transaction.paymentType === 'card' && transaction.cardId) {
      const card = cards.find(c => c.id === transaction.cardId);
      bankId = card?.bankId;
    } else if (transaction.paymentType === 'bank') {
      bankId = transaction.bankId;
    }

    if (bankId) {
      const current = bankAmounts.get(bankId) || { amount: 0, count: 0 };
      bankAmounts.set(bankId, {
        amount: current.amount + transaction.amount,
        count: current.count + 1
      });
    }
  });

  const bankPayments: BankPayment[] = [];
  
  bankAmounts.forEach((data, bankId) => {
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      bankPayments.push({
        bankId,
        bankName: bank.name,
        amount: data.amount,
        transactionCount: data.count
      });
    }
  });

  return bankPayments.sort((a, b) => a.bankName.localeCompare(b.bankName, 'ja'));
}

/**
 * Calculates total amounts per bank across all payment dates
 */
export function calculateBankTotals(payments: PaymentSummary[]): Map<string, number> {
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
 * Extracts unique banks that appear in the payment data for dynamic column generation
 */
export function extractUniqueBanks(payments: PaymentSummary[], allBanks: Bank[]): Bank[] {
  const bankIds = new Set<string>();
  
  payments.forEach(payment => {
    payment.bankPayments.forEach(bankPayment => {
      bankIds.add(bankPayment.bankId);
    });
  });

  const uniqueBanks = allBanks.filter(bank => bankIds.has(bank.id));
  return uniqueBanks.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/**
 * Recalculates scheduled payment date for a transaction to ensure consistency
 */
export function recalculateScheduledPaymentDate(
  transaction: Transaction,
  cards: Card[]
): Date {
  if (transaction.paymentType === 'card' && transaction.cardId) {
    const card = cards.find(c => c.id === transaction.cardId);
    if (!card) {
      throw new ScheduleProcessingError(
        `Card not found for transaction ${transaction.id}`,
        'MISSING_CARD',
        { transactionId: transaction.id, cardId: transaction.cardId }
      );
    }
    
    const result = calculateCardPaymentDate(new Date(transaction.date), card);
    return result.scheduledPayDate;
  } else {
    const result = calculateBankPaymentDate(new Date(transaction.date), true);
    return result.scheduledPayDate;
  }
}

/**
 * Determines the appropriate payment name for a group of transactions
 */
export function determinePaymentName(transactions: Transaction[], cards: Card[]): string {
  if (transactions.length === 0) return 'Unknown';

  const firstTransaction = transactions[0];
  
  if (firstTransaction && firstTransaction.paymentType === 'card' && firstTransaction.cardId) {
    const card = cards.find(c => c.id === firstTransaction.cardId);
    return card?.name || 'カード';
  }
  
  return '銀行引落';
}

/**
 * Formats payment day information for cards
 */
export function formatPaymentDay(card: Card): string {
  const monthShiftText = card.paymentMonthShift === 0 ? '当月' : 
                       card.paymentMonthShift === 1 ? '翌月' : '翌々月';
  const dayText = card.paymentDay === '月末' ? '月末' : `${card.paymentDay}日`;
  return `${monthShiftText}${dayText}`;
}

/**
 * Formats bank payment day (typically same day or next business day)
 */
export function formatBankPaymentDay(): string {
  return '当日（営業日調整）';
}

/**
 * Utility function to get amount for a specific bank from BankPayment array
 */
export function getAmountForBank(bankPayments: BankPayment[], bankId: string): number {
  const bankPayment = bankPayments.find(bp => bp.bankId === bankId);
  return bankPayment?.amount || 0;
}

/**
 * Formats currency amount in Japanese yen
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Helper function to validate PaymentScheduleView data
 */
export function validatePaymentScheduleView(data: PaymentScheduleView): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.month) {
    errors.push('Month is required');
  }

  if (!Array.isArray(data.payments)) {
    errors.push('Payments must be an array');
  }

  if (!(data.bankTotals instanceof Map)) {
    errors.push('Bank totals must be a Map');
  }

  if (typeof data.monthTotal !== 'number' || data.monthTotal < 0) {
    errors.push('Month total must be a non-negative number');
  }

  if (!Array.isArray(data.uniqueBanks)) {
    errors.push('Unique banks must be an array');
  }

  // Validate individual payments
  data.payments?.forEach((payment, index) => {
    if (!payment.date) {
      errors.push(`Payment ${index}: date is required`);
    }
    if (typeof payment.totalAmount !== 'number' || payment.totalAmount < 0) {
      errors.push(`Payment ${index}: total amount must be a non-negative number`);
    }
    if (!Array.isArray(payment.bankPayments)) {
      errors.push(`Payment ${index}: bank payments must be an array`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Transforms ScheduleItem[] (from existing MonthlySchedule) to PaymentScheduleView
 * This provides backward compatibility with existing data structures
 */
export function transformScheduleItemsToPaymentView(
  scheduleItems: ScheduleItem[],
  banks: Bank[],
  year: number,
  month: number
): PaymentScheduleView {
  // Convert ScheduleItem to Transaction-like structure for processing
  const transactions: Transaction[] = scheduleItems.map(item => {
    const bankId = getBankIdFromName(item.bankName, banks);
    return {
      id: item.transactionId,
      date: item.transactionDate || Date.now(),
      amount: item.amount,
      paymentType: item.paymentType,
      scheduledPayDate: item.paymentDate || Date.now(),
      createdAt: Date.now(),
      ...(item.storeName && { storeName: item.storeName }),
      ...(item.usage && { usage: item.usage }),
      ...(item.cardId && { cardId: item.cardId }),
      ...(bankId && { bankId }),
      ...(item.isScheduleEditable && { isScheduleEditable: item.isScheduleEditable })
    };
  });

  return transformToPaymentScheduleView({
    transactions,
    banks,
    cards: [], // Cards info may not be available in ScheduleItem format
    year,
    month
  });
}

/**
 * Helper to find bank ID from bank name (for backward compatibility)
 */
function getBankIdFromName(bankName: string, banks: Bank[]): string | undefined {
  const bank = banks.find(b => b.name === bankName);
  return bank?.id;
}

