import {
  createJapanDate,
  getCurrentJapanDate,
  formatDateISO,
  parseISODate,
  getLastDayOfMonth,
  getDaysInMonth,
  isWeekend,
  isJapaneseHoliday,
  isNonBusinessDay,
  adjustToNextBusinessDay,
  adjustToPreviousBusinessDay,
  addDays,
  addMonths,
  getFirstDayOfMonth,
  getLastDayOfMonthDate,
  getMonthRange,
  getNextMonth,
  getPreviousMonth,
  getMonthNameJP,
  getWeekdayNameJP,
  isSameDay,
  isSameMonth,
  getWeekOfMonth,
  getBusinessDaysInMonth,
  getBusinessDaysBetween,
  createCalendarGrid,
  WEEKDAY_NAMES_JP,
  MONTH_NAMES_JP
} from '@/lib/utils/dateUtils';

describe('dateUtils', () => {
  describe('createJapanDate', () => {
    it('should create a date in Japanese timezone', () => {
      const date = createJapanDate(2024, 1, 15);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // 0-indexed
      expect(date.getDate()).toBe(15);
    });

    it('should handle month-end dates correctly', () => {
      const date = createJapanDate(2024, 2, 29); // Leap year
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });
  });

  describe('formatDateISO and parseISODate', () => {
    it('should format date to ISO string correctly', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const iso = formatDateISO(date);
      expect(iso).toBe('2024-01-15');
    });

    it('should parse ISO string back to date', () => {
      const date = parseISODate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should round-trip correctly', () => {
      const originalDate = new Date(2024, 5, 20);
      const iso = formatDateISO(originalDate);
      const parsedDate = parseISODate(iso);
      expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
      expect(parsedDate.getDate()).toBe(originalDate.getDate());
    });
  });

  describe('getLastDayOfMonth and getDaysInMonth', () => {
    it('should return correct last day for regular months', () => {
      expect(getLastDayOfMonth(2024, 1)).toBe(31); // January
      expect(getLastDayOfMonth(2024, 4)).toBe(30); // April
      expect(getDaysInMonth(2024, 1)).toBe(31);
      expect(getDaysInMonth(2024, 4)).toBe(30);
    });

    it('should handle February correctly', () => {
      expect(getLastDayOfMonth(2024, 2)).toBe(29); // Leap year
      expect(getLastDayOfMonth(2023, 2)).toBe(28); // Non-leap year
      expect(getDaysInMonth(2024, 2)).toBe(29);
      expect(getDaysInMonth(2023, 2)).toBe(28);
    });
  });

  describe('isWeekend', () => {
    it('should identify weekends correctly', () => {
      const saturday = new Date(2024, 0, 6); // Saturday
      const sunday = new Date(2024, 0, 7); // Sunday
      const monday = new Date(2024, 0, 8); // Monday

      expect(isWeekend(saturday)).toBe(true);
      expect(isWeekend(sunday)).toBe(true);
      expect(isWeekend(monday)).toBe(false);
    });
  });

  describe('isJapaneseHoliday', () => {
    it('should identify New Year as holiday', () => {
      const newYear = new Date(2024, 0, 1);
      expect(isJapaneseHoliday(newYear)).toBe(true);
    });

    it('should identify regular days as non-holidays', () => {
      const regularDay = new Date(2024, 0, 10);
      expect(isJapaneseHoliday(regularDay)).toBe(false);
    });
  });

  describe('isNonBusinessDay', () => {
    it('should identify weekends as non-business days', () => {
      const saturday = new Date(2024, 0, 6);
      expect(isNonBusinessDay(saturday)).toBe(true);
    });

    it('should identify holidays as non-business days', () => {
      const newYear = new Date(2024, 0, 1);
      expect(isNonBusinessDay(newYear)).toBe(true);
    });

    it('should identify weekdays as business days', () => {
      const tuesday = new Date(2024, 0, 9);
      expect(isNonBusinessDay(tuesday)).toBe(false);
    });
  });

  describe('adjustToNextBusinessDay', () => {
    it('should return same date if already a business day', () => {
      const tuesday = new Date(2024, 0, 9);
      const adjusted = adjustToNextBusinessDay(tuesday);
      expect(isSameDay(adjusted, tuesday)).toBe(true);
    });

    it('should adjust weekend to next Monday', () => {
      const saturday = new Date(2024, 0, 6);
      const adjusted = adjustToNextBusinessDay(saturday);
      const monday = new Date(2024, 0, 8);
      expect(isSameDay(adjusted, monday)).toBe(true);
    });
  });

  describe('adjustToPreviousBusinessDay', () => {
    it('should return same date if already a business day', () => {
      const tuesday = new Date(2024, 0, 9);
      const adjusted = adjustToPreviousBusinessDay(tuesday);
      expect(isSameDay(adjusted, tuesday)).toBe(true);
    });

    it('should adjust weekend to previous Friday', () => {
      const sunday = new Date(2024, 0, 7);
      const adjusted = adjustToPreviousBusinessDay(sunday);
      const friday = new Date(2024, 0, 5);
      expect(isSameDay(adjusted, friday)).toBe(true);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(0);
    });

    it('should handle month overflow', () => {
      const date = new Date(2024, 0, 25);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
    });
  });

  describe('addMonths', () => {
    it('should add months correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = addMonths(date, 3);
      expect(result.getMonth()).toBe(3);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getDate()).toBe(15);
    });

    it('should handle year overflow', () => {
      const date = new Date(2024, 10, 15);
      const result = addMonths(date, 3);
      expect(result.getMonth()).toBe(1);
      expect(result.getFullYear()).toBe(2025);
    });

    it('should handle month-end edge cases', () => {
      const date = new Date(2024, 0, 31); // January 31
      const result = addMonths(date, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // Adjusted to Feb 29 (leap year)
    });
  });

  describe('month navigation', () => {
    it('should get next month correctly', () => {
      const next = getNextMonth(2024, 11);
      expect(next).toEqual({ year: 2024, month: 12 });
    });

    it('should handle year rollover', () => {
      const next = getNextMonth(2024, 12);
      expect(next).toEqual({ year: 2025, month: 1 });
    });

    it('should get previous month correctly', () => {
      const prev = getPreviousMonth(2024, 2);
      expect(prev).toEqual({ year: 2024, month: 1 });
    });

    it('should handle year rollback', () => {
      const prev = getPreviousMonth(2024, 1);
      expect(prev).toEqual({ year: 2023, month: 12 });
    });
  });

  describe('getMonthNameJP', () => {
    it('should return correct Japanese month names', () => {
      expect(getMonthNameJP(1)).toBe('1月');
      expect(getMonthNameJP(12)).toBe('12月');
    });

    it('should throw error for invalid months', () => {
      expect(() => getMonthNameJP(0)).toThrow();
      expect(() => getMonthNameJP(13)).toThrow();
    });
  });

  describe('getWeekdayNameJP', () => {
    it('should return correct Japanese weekday names', () => {
      const sunday = new Date(2024, 0, 7);
      const monday = new Date(2024, 0, 8);
      expect(getWeekdayNameJP(sunday)).toBe('日');
      expect(getWeekdayNameJP(monday)).toBe('月');
    });
  });

  describe('isSameDay and isSameMonth', () => {
    it('should identify same day correctly', () => {
      const date1 = new Date(2024, 0, 15, 10, 0, 0);
      const date2 = new Date(2024, 0, 15, 15, 30, 0);
      const date3 = new Date(2024, 0, 16, 10, 0, 0);

      expect(isSameDay(date1, date2)).toBe(true);
      expect(isSameDay(date1, date3)).toBe(false);
    });

    it('should identify same month correctly', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 25);
      const date3 = new Date(2024, 1, 15);

      expect(isSameMonth(date1, date2)).toBe(true);
      expect(isSameMonth(date1, date3)).toBe(false);
    });
  });

  describe('getWeekOfMonth', () => {
    it('should calculate week of month correctly', () => {
      const firstWeek = new Date(2024, 0, 1);
      const secondWeek = new Date(2024, 0, 8);
      
      expect(getWeekOfMonth(firstWeek)).toBe(1);
      expect(getWeekOfMonth(secondWeek)).toBe(2);
    });
  });

  describe('getBusinessDaysInMonth', () => {
    it('should count business days correctly', () => {
      const businessDays = getBusinessDaysInMonth(2024, 1);
      expect(businessDays.length).toBeGreaterThan(0);
      expect(businessDays.length).toBeLessThan(32);
      
      // All returned days should be business days
      businessDays.forEach(day => {
        expect(isNonBusinessDay(day)).toBe(false);
      });
    });
  });

  describe('getBusinessDaysBetween', () => {
    it('should count business days between dates', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 7);
      const count = getBusinessDaysBetween(start, end);
      
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(7);
    });

    it('should return 0 if start is after end', () => {
      const start = new Date(2024, 0, 7);
      const end = new Date(2024, 0, 1);
      const count = getBusinessDaysBetween(start, end);
      
      expect(count).toBe(0);
    });
  });

  describe('createCalendarGrid', () => {
    it('should create a valid calendar grid', () => {
      const grid = createCalendarGrid(2024, 1);
      
      expect(grid).toHaveLength(42); // 6 weeks * 7 days
      
      // Should contain January dates
      const januaryDates = grid.filter(day => 
        day.date && day.isCurrentMonth
      );
      expect(januaryDates.length).toBe(31);
    });

    it('should mark today correctly', () => {
      const today = new Date();
      const grid = createCalendarGrid(today.getFullYear(), today.getMonth() + 1);
      
      const todayInGrid = grid.find(day => day.isToday);
      expect(todayInGrid).toBeDefined();
      if (todayInGrid?.date) {
        expect(isSameDay(todayInGrid.date, today)).toBe(true);
      }
    });

    it('should mark weekends correctly', () => {
      const grid = createCalendarGrid(2024, 1);
      
      grid.forEach(day => {
        if (day.date) {
          const expectedWeekend = isWeekend(day.date);
          expect(day.isWeekend).toBe(expectedWeekend);
        }
      });
    });
  });

  describe('constants', () => {
    it('should have correct weekday names', () => {
      expect(WEEKDAY_NAMES_JP).toHaveLength(7);
      expect(WEEKDAY_NAMES_JP[0]).toBe('日');
      expect(WEEKDAY_NAMES_JP[6]).toBe('土');
    });

    it('should have correct month names', () => {
      expect(MONTH_NAMES_JP).toHaveLength(12);
      expect(MONTH_NAMES_JP[0]).toBe('1月');
      expect(MONTH_NAMES_JP[11]).toBe('12月');
    });
  });
});