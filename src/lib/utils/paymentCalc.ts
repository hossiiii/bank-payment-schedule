import { Card } from '@/types/database';
import {
  getLastDayOfMonth,
  addMonths,
  adjustToNextBusinessDay,
  createJapanDate,
  isNonBusinessDay
} from './dateUtils';

/**
 * Payment calculation utilities for credit cards and bank payments
 * 
 * Handles complex payment schedule calculations including:
 * - Closing day determination (fixed date or month-end)
 * - Payment cycle calculation (current month, next month, or month after)
 * - Weekend and holiday adjustments
 * - Edge cases for month-end dates
 */

export interface PaymentCalculationResult {
  scheduledPayDate: Date;
  paymentCycle: {
    closingDate: Date;
    originalPaymentDate: Date;
    adjustedPaymentDate: Date;
    isAdjusted: boolean;
  };
}

/**
 * Calculates the scheduled payment date for a credit card transaction
 * 
 * @param transactionDate - The date when the transaction occurred
 * @param card - The credit card information including payment rules
 * @returns PaymentCalculationResult with detailed calculation info
 */
export function calculateCardPaymentDate(
  transactionDate: Date,
  card: Card
): PaymentCalculationResult {
  const txYear = transactionDate.getFullYear();
  const txMonth = transactionDate.getMonth() + 1; // Convert to 1-indexed
  const txDay = transactionDate.getDate();
  
  // Step 1: Determine the closing day for the transaction month
  const closingDay = parseClosingDay(card.closingDay, txYear, txMonth);
  const closingDate = createJapanDate(txYear, txMonth, closingDay);
  
  // Step 2: Determine which payment cycle this transaction belongs to
  let paymentYear = txYear;
  let paymentMonth = txMonth;
  
  // If transaction is after the closing date, it goes to the next cycle
  if (txDay > closingDay) {
    const nextMonth = addMonths(closingDate, 1);
    paymentYear = nextMonth.getFullYear();
    paymentMonth = nextMonth.getMonth() + 1;
  }
  
  // Step 3: Apply the payment month shift (0=current, 1=next month, 2=month after)
  const shiftedDate = addMonths(createJapanDate(paymentYear, paymentMonth, 1), card.paymentMonthShift);
  paymentYear = shiftedDate.getFullYear();
  paymentMonth = shiftedDate.getMonth() + 1;
  
  // Step 4: Calculate the payment day
  const paymentDay = parsePaymentDay(card.paymentDay, paymentYear, paymentMonth);
  const originalPaymentDate = createJapanDate(paymentYear, paymentMonth, paymentDay);
  
  // Step 5: Apply weekend/holiday adjustments if enabled
  let adjustedPaymentDate = originalPaymentDate;
  let isAdjusted = false;
  
  if (card.adjustWeekend && isNonBusinessDay(originalPaymentDate)) {
    adjustedPaymentDate = adjustToNextBusinessDay(originalPaymentDate);
    isAdjusted = true;
  }
  
  return {
    scheduledPayDate: adjustedPaymentDate,
    paymentCycle: {
      closingDate,
      originalPaymentDate,
      adjustedPaymentDate,
      isAdjusted
    }
  };
}

/**
 * Calculates the scheduled payment date for a direct bank payment
 * 
 * @param transactionDate - The date when the transaction occurred
 * @param adjustWeekend - Whether to adjust for weekends/holidays
 * @returns PaymentCalculationResult
 */
export function calculateBankPaymentDate(
  transactionDate: Date,
  adjustWeekend: boolean = true
): PaymentCalculationResult {
  const originalPaymentDate = new Date(transactionDate);
  
  let adjustedPaymentDate = originalPaymentDate;
  let isAdjusted = false;
  
  if (adjustWeekend && isNonBusinessDay(originalPaymentDate)) {
    adjustedPaymentDate = adjustToNextBusinessDay(originalPaymentDate);
    isAdjusted = true;
  }
  
  return {
    scheduledPayDate: adjustedPaymentDate,
    paymentCycle: {
      closingDate: originalPaymentDate, // Same as transaction date for bank payments
      originalPaymentDate,
      adjustedPaymentDate,
      isAdjusted
    }
  };
}

/**
 * Parses closing day string to numeric day of month
 * 
 * @param closingDay - "月末" or numeric string (e.g., "15")
 * @param year - Year for month-end calculation
 * @param month - Month (1-indexed) for month-end calculation
 * @returns Numeric day of month
 */
export function parseClosingDay(closingDay: string, year: number, month: number): number {
  if (closingDay === '月末') {
    return getLastDayOfMonth(year, month);
  }
  
  const day = parseInt(closingDay, 10);
  if (isNaN(day) || day < 1 || day > 31) {
    throw new Error(`Invalid closing day: ${closingDay}`);
  }
  
  // Handle cases where the specified day doesn't exist in the month
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(day, lastDay);
}

/**
 * Parses payment day string to numeric day of month
 * 
 * @param paymentDay - "月末" or numeric string (e.g., "27")
 * @param year - Year for month-end calculation
 * @param month - Month (1-indexed) for month-end calculation
 * @returns Numeric day of month
 */
export function parsePaymentDay(paymentDay: string, year: number, month: number): number {
  if (paymentDay === '月末') {
    return getLastDayOfMonth(year, month);
  }
  
  const day = parseInt(paymentDay, 10);
  if (isNaN(day) || day < 1 || day > 31) {
    throw new Error(`Invalid payment day: ${paymentDay}`);
  }
  
  // Handle cases where the specified day doesn't exist in the month
  const lastDay = getLastDayOfMonth(year, month);
  return Math.min(day, lastDay);
}

/**
 * Validates closing day and payment day combination
 * 
 * @param closingDay - Closing day string
 * @param paymentDay - Payment day string
 * @returns Validation result with errors if any
 */
export function validatePaymentSchedule(
  closingDay: string,
  paymentDay: string
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate closing day format
  if (closingDay !== '月末') {
    const closingDayNum = parseInt(closingDay, 10);
    if (isNaN(closingDayNum) || closingDayNum < 1 || closingDayNum > 31) {
      errors.push(`Invalid closing day: ${closingDay}. Must be 1-31 or "月末"`);
    }
  }
  
  // Validate payment day format
  if (paymentDay !== '月末') {
    const paymentDayNum = parseInt(paymentDay, 10);
    if (isNaN(paymentDayNum) || paymentDayNum < 1 || paymentDayNum > 31) {
      errors.push(`Invalid payment day: ${paymentDay}. Must be 1-31 or "月末"`);
    }
  }
  
  // Validate logical consistency (payment day should not be before closing day in same cycle)
  // This is a simplified check - real validation would need specific month context
  if (closingDay !== '月末' && paymentDay !== '月末') {
    const closingDayNum = parseInt(closingDay, 10);
    const paymentDayNum = parseInt(paymentDay, 10);
    
    if (paymentDayNum <= closingDayNum) {
      // This might be intentional with month shift, so just warn
      // Don't add to errors, but could be enhanced for better UX
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates multiple payment dates for testing/preview purposes
 * 
 * @param card - Card information
 * @param testDates - Array of transaction dates to test
 * @returns Array of calculation results
 */
export function calculateMultiplePaymentDates(
  card: Card,
  testDates: Date[]
): PaymentCalculationResult[] {
  return testDates.map(date => calculateCardPaymentDate(date, card));
}

/**
 * Gets the next scheduled payment date for a card (useful for UI display)
 * 
 * @param card - Card information
 * @param fromDate - Date to calculate from (defaults to current date)
 * @returns Next payment calculation result
 */
export function getNextPaymentDate(
  card: Card,
  fromDate: Date = new Date()
): PaymentCalculationResult {
  return calculateCardPaymentDate(fromDate, card);
}

/**
 * Calculates when a transaction made today would be charged
 * 
 * @param card - Card information
 * @returns Payment calculation for transaction made today
 */
export function getTodayTransactionPaymentDate(card: Card): PaymentCalculationResult {
  return calculateCardPaymentDate(new Date(), card);
}

/**
 * Bulk recalculates payment dates for existing transactions when card rules change
 * 
 * @param transactions - Array of transaction dates (as timestamps)
 * @param oldCard - Previous card configuration
 * @param newCard - New card configuration
 * @returns Map of transaction timestamp to new payment date
 */
export function recalculatePaymentDates(
  transactions: { id: string; date: number }[],
  oldCard: Card,
  newCard: Card
): Map<string, Date> {
  const updates = new Map<string, Date>();
  
  transactions.forEach(tx => {
    const transactionDate = new Date(tx.date);
    const result = calculateCardPaymentDate(transactionDate, newCard);
    updates.set(tx.id, result.scheduledPayDate);
  });
  
  return updates;
}

/**
 * Analyzes payment timing for a card configuration
 * 
 * @param card - Card information
 * @returns Analysis of payment timing patterns
 */
export function analyzePaymentTiming(card: Card): {
  averageDelay: number; // Average days between transaction and payment
  minDelay: number;
  maxDelay: number;
  paymentPattern: string;
} {
  // Test with various transaction dates across a month
  const testDates: Date[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  
  // Create test dates for each day of the current month
  for (let day = 1; day <= getLastDayOfMonth(year, month); day++) {
    testDates.push(createJapanDate(year, month, day));
  }
  
  const results = calculateMultiplePaymentDates(card, testDates);
  const delays = results.map(result => {
    const txDate = testDates[results.indexOf(result)];
    const payDate = result.scheduledPayDate;
    const diffTime = payDate.getTime() - txDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  });
  
  const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
  const minDelay = Math.min(...delays);
  const maxDelay = Math.max(...delays);
  
  let paymentPattern = '';
  if (card.paymentMonthShift === 0) {
    paymentPattern = '当月払い';
  } else if (card.paymentMonthShift === 1) {
    paymentPattern = '翌月払い';
  } else {
    paymentPattern = '翌々月払い';
  }
  
  return {
    averageDelay: Math.round(avgDelay),
    minDelay,
    maxDelay,
    paymentPattern
  };
}

/**
 * Utility to check if a card configuration is reasonable
 */
export function validateCardConfiguration(card: Card): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check for unusual configurations
  if (card.paymentMonthShift > 2) {
    warnings.push('Payment shift greater than 2 months is unusual');
  }
  
  if (card.paymentMonthShift === 0) {
    warnings.push('Same-month payment is unusual for credit cards');
  }
  
  // Validate day combinations
  const validation = validatePaymentSchedule(card.closingDay, card.paymentDay);
  if (!validation.isValid) {
    warnings.push(...validation.errors);
  }
  
  // Check for optimization opportunities
  if (!card.adjustWeekend) {
    suggestions.push('Consider enabling weekend adjustment for more accurate payment dates');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    suggestions
  };
}