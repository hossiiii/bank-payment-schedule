import {
  calculateCardPaymentDate,
  calculateBankPaymentDate,
  parseClosingDay,
  parsePaymentDay,
  validatePaymentSchedule,
  calculateMultiplePaymentDates,
  getNextPaymentDate,
  getTodayTransactionPaymentDate,
  recalculatePaymentDates,
  analyzePaymentTiming,
  validateCardConfiguration
} from '@/lib/utils/paymentCalc';
import { Card } from '@/types/database';
import { createJapanDate } from '@/lib/utils/dateUtils';

describe('paymentCalc', () => {
  // Mock card for testing
  const mockCard: Card = {
    id: 'test-card',
    name: 'テストカード',
    bankId: 'test-bank',
    closingDay: '15',
    paymentDay: '27',
    paymentMonthShift: 1,
    adjustWeekend: true,
    memo: 'テスト用カード',
    createdAt: Date.now()
  };

  describe('parseClosingDay', () => {
    it('should parse numeric closing day correctly', () => {
      expect(parseClosingDay('15', 2024, 1)).toBe(15);
      expect(parseClosingDay('31', 2024, 1)).toBe(31);
    });

    it('should handle month-end closing day', () => {
      expect(parseClosingDay('月末', 2024, 1)).toBe(31); // January
      expect(parseClosingDay('月末', 2024, 2)).toBe(29); // February (leap year)
      expect(parseClosingDay('月末', 2023, 2)).toBe(28); // February (non-leap year)
      expect(parseClosingDay('月末', 2024, 4)).toBe(30); // April
    });

    it('should adjust day if it exceeds month length', () => {
      expect(parseClosingDay('31', 2024, 2)).toBe(29); // Feb only has 29 days in 2024
      expect(parseClosingDay('31', 2024, 4)).toBe(30); // April only has 30 days
    });

    it('should throw error for invalid input', () => {
      expect(() => parseClosingDay('invalid', 2024, 1)).toThrow();
      expect(() => parseClosingDay('0', 2024, 1)).toThrow();
      expect(() => parseClosingDay('32', 2024, 1)).toThrow();
    });
  });

  describe('parsePaymentDay', () => {
    it('should parse numeric payment day correctly', () => {
      expect(parsePaymentDay('27', 2024, 2)).toBe(27);
      expect(parsePaymentDay('31', 2024, 3)).toBe(31);
    });

    it('should handle month-end payment day', () => {
      expect(parsePaymentDay('月末', 2024, 3)).toBe(31); // March
      expect(parsePaymentDay('月末', 2024, 4)).toBe(30); // April
    });

    it('should adjust day if it exceeds month length', () => {
      expect(parsePaymentDay('31', 2024, 2)).toBe(29); // Feb only has 29 days in 2024
    });

    it('should throw error for invalid input', () => {
      expect(() => parsePaymentDay('invalid', 2024, 1)).toThrow();
      expect(() => parsePaymentDay('-1', 2024, 1)).toThrow();
    });
  });

  describe('validatePaymentSchedule', () => {
    it('should validate correct schedule', () => {
      const result = validatePaymentSchedule('15', '27');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate month-end schedule', () => {
      const result = validatePaymentSchedule('月末', '月末');
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid closing day', () => {
      const result = validatePaymentSchedule('invalid', '27');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid closing day');
    });

    it('should detect invalid payment day', () => {
      const result = validatePaymentSchedule('15', '50');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid payment day');
    });
  });

  describe('calculateCardPaymentDate', () => {
    it('should calculate payment date for transaction before closing', () => {
      const transactionDate = createJapanDate(2024, 1, 10); // Before 15th
      const result = calculateCardPaymentDate(transactionDate, mockCard);
      
      expect(result.scheduledPayDate.getMonth()).toBe(1); // February (1-month shift)
      expect(result.scheduledPayDate.getDate()).toBe(27);
      expect(result.paymentCycle.isAdjusted).toBe(false);
    });

    it('should calculate payment date for transaction after closing', () => {
      const transactionDate = createJapanDate(2024, 1, 20); // After 15th
      const result = calculateCardPaymentDate(transactionDate, mockCard);
      
      expect(result.scheduledPayDate.getMonth()).toBe(2); // March (next cycle)
      expect(result.scheduledPayDate.getDate()).toBe(27);
    });

    it('should handle month-end closing and payment', () => {
      const monthEndCard: Card = {
        ...mockCard,
        closingDay: '月末',
        paymentDay: '月末'
      };
      
      const transactionDate = createJapanDate(2024, 1, 15);
      const result = calculateCardPaymentDate(transactionDate, monthEndCard);
      
      expect(result.scheduledPayDate.getDate()).toBe(29); // February end (2024 is leap year)
    });

    it('should apply weekend adjustment when enabled', () => {
      const weekendCard: Card = {
        ...mockCard,
        paymentDay: '6', // This might fall on weekend
        adjustWeekend: true
      };
      
      const transactionDate = createJapanDate(2024, 1, 10);
      const result = calculateCardPaymentDate(transactionDate, weekendCard);
      
      // Result should either be on the 6th or adjusted to next business day
      expect(result.scheduledPayDate.getDate()).toBeGreaterThanOrEqual(6);
    });

    it('should not adjust weekend when disabled', () => {
      const noAdjustCard: Card = {
        ...mockCard,
        adjustWeekend: false
      };
      
      const transactionDate = createJapanDate(2024, 1, 10);
      const result = calculateCardPaymentDate(transactionDate, noAdjustCard);
      
      expect(result.paymentCycle.isAdjusted).toBe(false);
    });
  });

  describe('calculateBankPaymentDate', () => {
    it('should return same date for regular payment', () => {
      const transactionDate = createJapanDate(2024, 1, 15); // Tuesday
      const result = calculateBankPaymentDate(transactionDate, true);
      
      expect(result.scheduledPayDate.getTime()).toBe(transactionDate.getTime());
      expect(result.paymentCycle.isAdjusted).toBe(false);
    });

    it('should adjust weekend when enabled', () => {
      const saturday = createJapanDate(2024, 1, 6); // Saturday
      const result = calculateBankPaymentDate(saturday, true);
      
      expect(result.scheduledPayDate.getDay()).not.toBe(6); // Should not be Saturday
      expect(result.paymentCycle.isAdjusted).toBe(true);
    });

    it('should not adjust weekend when disabled', () => {
      const saturday = createJapanDate(2024, 1, 6); // Saturday
      const result = calculateBankPaymentDate(saturday, false);
      
      expect(result.scheduledPayDate.getTime()).toBe(saturday.getTime());
      expect(result.paymentCycle.isAdjusted).toBe(false);
    });
  });

  describe('calculateMultiplePaymentDates', () => {
    it('should calculate multiple payment dates', () => {
      const testDates = [
        createJapanDate(2024, 1, 5),
        createJapanDate(2024, 1, 15),
        createJapanDate(2024, 1, 25)
      ];
      
      const results = calculateMultiplePaymentDates(mockCard, testDates);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.scheduledPayDate).toBeInstanceOf(Date);
        expect(result.paymentCycle).toBeDefined();
      });
    });
  });

  describe('getNextPaymentDate', () => {
    it('should calculate next payment date from today', () => {
      const result = getNextPaymentDate(mockCard);
      
      expect(result.scheduledPayDate).toBeInstanceOf(Date);
      expect(result.scheduledPayDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate payment date from specific date', () => {
      const fromDate = createJapanDate(2024, 6, 1);
      const result = getNextPaymentDate(mockCard, fromDate);
      
      expect(result.scheduledPayDate).toBeInstanceOf(Date);
    });
  });

  describe('getTodayTransactionPaymentDate', () => {
    it('should calculate payment date for today\'s transaction', () => {
      const result = getTodayTransactionPaymentDate(mockCard);
      
      expect(result.scheduledPayDate).toBeInstanceOf(Date);
      expect(result.paymentCycle).toBeDefined();
    });
  });

  describe('recalculatePaymentDates', () => {
    it('should recalculate payment dates for existing transactions', () => {
      const transactions = [
        { id: '1', date: createJapanDate(2024, 1, 10).getTime() },
        { id: '2', date: createJapanDate(2024, 1, 20).getTime() }
      ];
      
      const oldCard = mockCard;
      const newCard: Card = {
        ...mockCard,
        paymentDay: '25' // Changed payment day
      };
      
      const updates = recalculatePaymentDates(transactions, oldCard, newCard);
      
      expect(updates.size).toBe(2);
      expect(updates.get('1')).toBeInstanceOf(Date);
      expect(updates.get('2')).toBeInstanceOf(Date);
    });
  });

  describe('analyzePaymentTiming', () => {
    it('should analyze payment timing patterns', () => {
      const analysis = analyzePaymentTiming(mockCard);
      
      expect(analysis.averageDelay).toBeGreaterThan(0);
      expect(analysis.minDelay).toBeGreaterThanOrEqual(0);
      expect(analysis.maxDelay).toBeGreaterThanOrEqual(analysis.minDelay);
      expect(analysis.paymentPattern).toBe('翌月払い');
    });

    it('should identify current month payment pattern', () => {
      const currentMonthCard: Card = {
        ...mockCard,
        paymentMonthShift: 0
      };
      
      const analysis = analyzePaymentTiming(currentMonthCard);
      expect(analysis.paymentPattern).toBe('当月払い');
    });

    it('should identify next-next month payment pattern', () => {
      const nextNextMonthCard: Card = {
        ...mockCard,
        paymentMonthShift: 2
      };
      
      const analysis = analyzePaymentTiming(nextNextMonthCard);
      expect(analysis.paymentPattern).toBe('翌々月払い');
    });
  });

  describe('validateCardConfiguration', () => {
    it('should validate normal card configuration', () => {
      const validation = validateCardConfiguration(mockCard);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn about unusual configurations', () => {
      const unusualCard: Card = {
        ...mockCard,
        paymentMonthShift: 3
      };
      
      const validation = validateCardConfiguration(unusualCard);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('greater than 2 months');
    });

    it('should warn about same-month payment', () => {
      const sameMonthCard: Card = {
        ...mockCard,
        paymentMonthShift: 0
      };
      
      const validation = validateCardConfiguration(sameMonthCard);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('Same-month payment');
    });

    it('should suggest weekend adjustment', () => {
      const noWeekendCard: Card = {
        ...mockCard,
        adjustWeekend: false
      };
      
      const validation = validateCardConfiguration(noWeekendCard);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions[0]).toContain('weekend adjustment');
    });

    it('should validate payment schedule logic', () => {
      const invalidCard: Card = {
        ...mockCard,
        closingDay: 'invalid'
      };
      
      const validation = validateCardConfiguration(invalidCard);
      expect(validation.isValid).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle leap year February correctly', () => {
      const leapYearCard: Card = {
        ...mockCard,
        closingDay: '月末',
        paymentDay: '月末'
      };
      
      const transactionDate = createJapanDate(2024, 2, 15); // February 2024 (leap year)
      const result = calculateCardPaymentDate(transactionDate, leapYearCard);
      
      // Should handle February 29th correctly
      expect(result.paymentCycle.closingDate.getDate()).toBe(29);
    });

    it('should handle non-leap year February correctly', () => {
      const leapYearCard: Card = {
        ...mockCard,
        closingDay: '月末',
        paymentDay: '月末'
      };
      
      const transactionDate = createJapanDate(2023, 2, 15); // February 2023 (non-leap year)
      const result = calculateCardPaymentDate(transactionDate, leapYearCard);
      
      expect(result.paymentCycle.closingDate.getDate()).toBe(28);
    });

    it('should handle year boundary correctly', () => {
      const transactionDate = createJapanDate(2023, 12, 20); // December 2023
      const result = calculateCardPaymentDate(transactionDate, mockCard);
      
      expect(result.scheduledPayDate.getFullYear()).toBe(2024); // Should be January 2024
    });
  });
});