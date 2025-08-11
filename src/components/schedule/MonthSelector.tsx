'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCurrentJapanDate, getMonthNameJP } from '@/lib/utils/dateUtils';

export interface MonthSelectorProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export function MonthSelector({
  year,
  month,
  onMonthChange,
  minYear = 2020,
  maxYear = 2030,
  className
}: MonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  // Generate year options
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  
  // Month names
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthNameJP(i + 1)
  }));

  const currentDate = getCurrentJapanDate();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const handleApply = () => {
    onMonthChange(selectedYear, selectedMonth);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setIsOpen(false);
  };

  const handleToday = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    onMonthChange(currentYear, currentMonth);
    setIsOpen(false);
  };

  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main selector */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="前の月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Month/Year selector */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-lg font-semibold">
            {year}年 {getMonthNameJP(month)}
          </span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="次の月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick navigation buttons */}
      <div className="flex justify-center mt-2">
        <button
          onClick={handleToday}
          className={cn(
            'px-3 py-1 text-sm rounded-lg transition-colors',
            year === currentYear && month === currentMonth
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          今月
        </button>
      </div>

      {/* Dropdown overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={handleCancel}
          />
          
          {/* Dropdown content */}
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  月を選択
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Year selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {yearOptions.map(yearOption => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}年
                    </option>
                  ))}
                </select>
              </div>

              {/* Month grid */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {monthOptions.map(monthOption => (
                    <button
                      key={monthOption.value}
                      onClick={() => setSelectedMonth(monthOption.value)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg transition-colors',
                        selectedMonth === monthOption.value
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100',
                        // Highlight current month
                        selectedYear === currentYear && monthOption.value === currentMonth
                          ? 'ring-2 ring-blue-300'
                          : ''
                      )}
                    >
                      {monthOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between space-x-3">
                <button
                  onClick={handleToday}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  今月へ
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Compact month selector for smaller spaces
export interface CompactMonthSelectorProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  className?: string;
}

export function CompactMonthSelector({
  year,
  month,
  onMonthChange,
  className
}: CompactMonthSelectorProps) {
  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2',
      className
    )}>
      <button
        onClick={handlePrevious}
        className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="前の月"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-sm font-medium text-gray-900 px-2">
        {year}年{getMonthNameJP(month)}
      </span>

      <button
        onClick={handleNext}
        className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="次の月"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// Month range selector for selecting start and end months
export interface MonthRangeSelectorProps {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  onRangeChange: (startYear: number, startMonth: number, endYear: number, endMonth: number) => void;
  className?: string;
}

export function MonthRangeSelector({
  startYear,
  startMonth,
  endYear,
  endMonth,
  onRangeChange,
  className
}: MonthRangeSelectorProps) {
  const handleStartChange = (year: number, month: number) => {
    // Ensure start is not after end
    if (year > endYear || (year === endYear && month > endMonth)) {
      onRangeChange(year, month, year, month);
    } else {
      onRangeChange(year, month, endYear, endMonth);
    }
  };

  const handleEndChange = (year: number, month: number) => {
    // Ensure end is not before start
    if (year < startYear || (year === startYear && month < startMonth)) {
      onRangeChange(year, month, year, month);
    } else {
      onRangeChange(startYear, startMonth, year, month);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          開始月
        </label>
        <MonthSelector
          year={startYear}
          month={startMonth}
          onMonthChange={handleStartChange}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          終了月
        </label>
        <MonthSelector
          year={endYear}
          month={endMonth}
          onMonthChange={handleEndChange}
        />
      </div>
    </div>
  );
}