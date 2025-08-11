import { isHoliday } from '@holiday-jp/holiday_jp';

/**
 * Japanese calendar and date utilities
 * 
 * All functions handle Japanese timezone (Asia/Tokyo) and business day calculations
 * including national holidays and weekend adjustments.
 */

// Japanese timezone constant
export const JAPAN_TIMEZONE = 'Asia/Tokyo';

// Weekday names in Japanese
export const WEEKDAY_NAMES_JP = ['日', '月', '火', '水', '木', '金', '土'] as const;
export const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Month names in Japanese
export const MONTH_NAMES_JP = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
] as const;

/**
 * Creates a new Date object in Japanese timezone
 */
export function createJapanDate(year: number, month: number, day: number = 1): Date {
  // month is 0-indexed in Date constructor
  return new Date(year, month - 1, day);
}

/**
 * Gets the current date in Japanese timezone
 */
export function getCurrentJapanDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: JAPAN_TIMEZONE }));
}

/**
 * Formats a date for Japanese locale
 */
export function formatJapaneseDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JAPAN_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('ja-JP', { ...defaultOptions, ...options }).format(date);
}

/**
 * Formats a date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO date string to Date object
 */
export function parseISODate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return createJapanDate(year, month, day);
}

/**
 * Gets the last day of a month
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // month is 1-indexed input, 0-indexed for Date constructor
  return new Date(year, month, 0).getDate();
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return getLastDayOfMonth(year, month);
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Checks if a date is a Japanese national holiday
 */
export function isJapaneseHoliday(date: Date): boolean {
  return isHoliday(date);
}

/**
 * Checks if a date is a non-business day (weekend or holiday)
 */
export function isNonBusinessDay(date: Date): boolean {
  return isWeekend(date) || isJapaneseHoliday(date);
}

/**
 * Adjusts a date to the next business day if it falls on weekend or holiday
 */
export function adjustToNextBusinessDay(date: Date): Date {
  const adjustedDate = new Date(date);
  
  while (isNonBusinessDay(adjustedDate)) {
    adjustedDate.setDate(adjustedDate.getDate() + 1);
  }
  
  return adjustedDate;
}

/**
 * Adjusts a date to the previous business day if it falls on weekend or holiday
 */
export function adjustToPreviousBusinessDay(date: Date): Date {
  const adjustedDate = new Date(date);
  
  while (isNonBusinessDay(adjustedDate)) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  return adjustedDate;
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const newMonth = result.getMonth() + months;
  const newYear = result.getFullYear() + Math.floor(newMonth / 12);
  const adjustedMonth = ((newMonth % 12) + 12) % 12;
  
  result.setFullYear(newYear, adjustedMonth);
  
  // Handle month-end edge cases
  const targetDay = date.getDate();
  const daysInNewMonth = getDaysInMonth(newYear, adjustedMonth + 1);
  if (targetDay > daysInNewMonth) {
    result.setDate(daysInNewMonth);
  }
  
  return result;
}

/**
 * Gets the first day of the month
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return createJapanDate(year, month, 1);
}

/**
 * Gets the last day of the month as a Date object
 */
export function getLastDayOfMonthDate(year: number, month: number): Date {
  const lastDay = getLastDayOfMonth(year, month);
  return createJapanDate(year, month, lastDay);
}

/**
 * Gets the start and end dates of a month
 */
export function getMonthRange(year: number, month: number): {
  start: Date;
  end: Date;
} {
  return {
    start: getFirstDayOfMonth(year, month),
    end: getLastDayOfMonthDate(year, month)
  };
}

/**
 * Navigates to the next month
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Navigates to the previous month
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Gets the month name in Japanese
 */
export function getMonthNameJP(month: number): string {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }
  return MONTH_NAMES_JP[month - 1];
}

/**
 * Gets the weekday name in Japanese
 */
export function getWeekdayNameJP(date: Date): string {
  return WEEKDAY_NAMES_JP[date.getDay()];
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if two dates are in the same month
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

/**
 * Gets the week number of a date within its month
 */
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekDay = firstDay.getDay();
  const dayOfMonth = date.getDate();
  
  return Math.ceil((dayOfMonth + firstWeekDay) / 7);
}

/**
 * Gets all business days in a month
 */
export function getBusinessDaysInMonth(year: number, month: number): Date[] {
  const businessDays: Date[] = [];
  const daysInMonth = getDaysInMonth(year, month);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = createJapanDate(year, month, day);
    if (!isNonBusinessDay(date)) {
      businessDays.push(date);
    }
  }
  
  return businessDays;
}

/**
 * Calculates the number of business days between two dates (inclusive)
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  if (startDate > endDate) {
    return 0;
  }
  
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (!isNonBusinessDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
}

/**
 * Creates a calendar grid for a month (includes padding days from previous/next month)
 */
export interface CalendarDay {
  date: Date | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
}

export function createCalendarGrid(year: number, month: number): CalendarDay[] {
  const grid: CalendarDay[] = [];
  const today = getCurrentJapanDate();
  
  // Get first day of month and its weekday
  const firstDay = getFirstDayOfMonth(year, month);
  const firstWeekDay = firstDay.getDay(); // 0 = Sunday
  
  // Add padding days from previous month
  const prevMonth = getPreviousMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(prevMonth.year, prevMonth.month);
  
  for (let i = firstWeekDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = createJapanDate(prevMonth.year, prevMonth.month, day);
    
    grid.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isWeekend: isWeekend(date),
      isHoliday: isJapaneseHoliday(date)
    });
  }
  
  // Add current month days
  const daysInCurrentMonth = getDaysInMonth(year, month);
  
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = createJapanDate(year, month, day);
    
    grid.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isWeekend: isWeekend(date),
      isHoliday: isJapaneseHoliday(date)
    });
  }
  
  // Add padding days from next month to complete the grid (42 days total for 6 weeks)
  const nextMonth = getNextMonth(year, month);
  const remainingDays = 42 - grid.length;
  
  for (let day = 1; day <= remainingDays; day++) {
    const date = createJapanDate(nextMonth.year, nextMonth.month, day);
    
    grid.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isWeekend: isWeekend(date),
      isHoliday: isJapaneseHoliday(date)
    });
  }
  
  return grid;
}