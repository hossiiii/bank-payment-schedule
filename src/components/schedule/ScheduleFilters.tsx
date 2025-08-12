'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScheduleFilters, ScheduleFiltersProps } from '@/types/schedule';
import { Input } from '@/components/ui/Input';
import { formatDateISO } from '@/lib/utils/dateUtils';

export function ScheduleFiltersComponent({
  filters,
  onFiltersChange,
  availableBanks,
  className
}: ScheduleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<ScheduleFilters>(filters);

  // Apply filters with debouncing
  const applyFilters = useCallback((newFilters: ScheduleFilters) => {
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  // Handle date range change
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    if (!value) {
      // Clear date range if empty
      const newFilters = { ...localFilters };
      delete newFilters.dateRange;
      applyFilters(newFilters);
      return;
    }

    const date = new Date(value);
    const newRange = localFilters.dateRange || { start: new Date(), end: new Date() };
    
    if (field === 'start') {
      newRange.start = date;
    } else {
      newRange.end = date;
    }

    applyFilters({
      ...localFilters,
      dateRange: newRange
    });
  };

  // Handle amount range change
  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    
    if (!numValue && numValue !== 0) {
      // Clear amount range if empty
      const newFilters = { ...localFilters };
      if (field === 'min' && newFilters.amountRange) {
        if (newFilters.amountRange.max === undefined) {
          const { amountRange, ...rest } = newFilters;
          applyFilters(rest);
          return;
        } else {
          const { min, ...rangeRest } = newFilters.amountRange;
          newFilters.amountRange = rangeRest as { min: number; max: number; };
        }
      } else if (field === 'max' && newFilters.amountRange) {
        if (newFilters.amountRange.min === undefined) {
          const { amountRange, ...rest } = newFilters;
          applyFilters(rest);
          return;
        } else {
          const { max, ...rangeRest } = newFilters.amountRange;
          newFilters.amountRange = rangeRest as { min: number; max: number; };
        }
      }
      applyFilters(newFilters);
      return;
    }

    const newRange = localFilters.amountRange || {} as { min?: number; max?: number; };
    
    if (field === 'min') {
      newRange.min = numValue;
    } else {
      newRange.max = numValue;
    }

    // Only include amountRange if both min and max are defined
    if (newRange.min !== undefined && newRange.max !== undefined) {
      applyFilters({
        ...localFilters,
        amountRange: { min: newRange.min, max: newRange.max }
      });
    } else {
      const { amountRange, ...filtersWithoutRange } = localFilters;
      applyFilters(filtersWithoutRange);
    }
  };

  // Handle search text change
  const handleSearchTextChange = (value: string) => {
    const newFilters = { ...localFilters };
    if (value.trim()) {
      newFilters.searchText = value.trim();
    } else {
      delete newFilters.searchText;
    }
    applyFilters(newFilters);
  };

  // Handle bank selection
  const handleBankSelection = (bankId: string, selected: boolean) => {
    const currentBankIds = localFilters.bankIds || [];
    let newBankIds: string[];

    if (selected) {
      newBankIds = [...currentBankIds, bankId];
    } else {
      newBankIds = currentBankIds.filter(id => id !== bankId);
    }

    const newFilters = { ...localFilters };
    if (newBankIds.length > 0) {
      newFilters.bankIds = newBankIds;
    } else {
      delete newFilters.bankIds;
    }

    applyFilters(newFilters);
  };

  // Handle payment type selection
  const handlePaymentTypeSelection = (paymentType: 'card' | 'bank', selected: boolean) => {
    const currentTypes = localFilters.paymentTypes || [];
    let newTypes: ('card' | 'bank')[];

    if (selected) {
      newTypes = [...currentTypes, paymentType];
    } else {
      newTypes = currentTypes.filter(type => type !== paymentType);
    }

    const newFilters = { ...localFilters };
    if (newTypes.length > 0) {
      newFilters.paymentTypes = newTypes;
    } else {
      delete newFilters.paymentTypes;
    }

    applyFilters(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters: ScheduleFilters = {};
    setLocalFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    localFilters.dateRange ||
    localFilters.amountRange ||
    localFilters.searchText ||
    (localFilters.bankIds && localFilters.bankIds.length > 0) ||
    (localFilters.paymentTypes && localFilters.paymentTypes.length > 0)
  );

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Filter toggle header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg 
                className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-90')}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>フィルター</span>
            </button>
            
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                適用中
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors"
              >
                クリア
              </button>
            )}
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date range filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">引落日期間</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="date"
                label="開始日"
                value={localFilters.dateRange?.start ? formatDateISO(localFilters.dateRange.start) : ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                size="sm"
                fullWidth
              />
              <Input
                type="date"
                label="終了日"
                value={localFilters.dateRange?.end ? formatDateISO(localFilters.dateRange.end) : ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                size="sm"
                fullWidth
              />
            </div>
          </div>

          {/* Amount range filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">金額範囲</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="number"
                label="最小金額"
                placeholder="0"
                value={localFilters.amountRange?.min?.toString() || ''}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                size="sm"
                fullWidth
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
              />
              <Input
                type="number"
                label="最大金額"
                placeholder="999999"
                value={localFilters.amountRange?.max?.toString() || ''}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                size="sm"
                fullWidth
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Search text filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">検索</h4>
            <Input
              type="text"
              placeholder="店舗名または用途で検索..."
              value={localFilters.searchText || ''}
              onChange={(e) => handleSearchTextChange(e.target.value)}
              size="sm"
              fullWidth
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Bank selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">銀行</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableBanks.map(bank => (
                <label key={bank.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.bankIds?.includes(bank.id) || false}
                    onChange={(e) => handleBankSelection(bank.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{bank.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment type selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">支払方法</h4>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.paymentTypes?.includes('card') || false}
                  onChange={(e) => handlePaymentTypeSelection('card', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center space-x-1">
                  <span>カード決済</span>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.paymentTypes?.includes('bank') || false}
                  onChange={(e) => handlePaymentTypeSelection('bank', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 flex items-center space-x-1">
                  <span>銀行引落</span>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                </span>
              </label>
            </div>
          </div>

          {/* Filter summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">適用中のフィルター</h4>
              <div className="flex flex-wrap gap-2">
                {localFilters.dateRange && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    期間: {formatDateISO(localFilters.dateRange.start)} ～ {formatDateISO(localFilters.dateRange.end)}
                  </span>
                )}
                {localFilters.amountRange && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    金額: ¥{localFilters.amountRange.min || 0}～¥{localFilters.amountRange.max || '∞'}
                  </span>
                )}
                {localFilters.searchText && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    検索: {localFilters.searchText}
                  </span>
                )}
                {localFilters.bankIds && localFilters.bankIds.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                    銀行: {localFilters.bankIds.length}件選択
                  </span>
                )}
                {localFilters.paymentTypes && localFilters.paymentTypes.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                    支払方法: {localFilters.paymentTypes.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScheduleFiltersComponent;