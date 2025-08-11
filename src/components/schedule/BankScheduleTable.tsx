'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MonthlySchedule, Bank } from '@/types/database';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate, getWeekdayNameJP } from '@/lib/utils/dateUtils';

export interface BankScheduleTableProps {
  schedule: MonthlySchedule & { totalAmount?: number; totalTransactions?: number };
  banks: Bank[];
  onTransactionClick?: (transaction: any) => void;
  className?: string;
}

export function BankScheduleTable({
  schedule,
  banks,
  onTransactionClick,
  className
}: BankScheduleTableProps) {
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Toggle bank expansion
  const toggleBankExpansion = (bankId: string) => {
    setExpandedBanks(prev => {
      const next = new Set(prev);
      if (next.has(bankId)) {
        next.delete(bankId);
      } else {
        next.add(bankId);
      }
      return next;
    });
  };

  // Calculate bank totals and sort
  const sortedBankData = useMemo(() => {
    // Group schedule items by bank
    const bankDataMap = new Map();
    
    schedule.items.forEach(item => {
      const bankName = item.bankName || 'Unknown Bank';
      const bankKey = bankName; // Use bankName as the key
      if (!bankDataMap.has(bankKey)) {
        bankDataMap.set(bankKey, {
          bankId: bankKey, // Use bankName as bankId for the key
          bankName,
          totalAmount: 0,
          transactionCount: 0,
          allTransactions: []
        });
      }
      
      const bankData = bankDataMap.get(bankKey);
      bankData.totalAmount += item.amount || 0;
      bankData.transactionCount += 1;
      bankData.allTransactions.push(item);
    });
    
    // Sort transactions within each bank and convert to array
    const bankDataArray = Array.from(bankDataMap.values()).map(bankData => {
      const sortedTransactions = [...bankData.allTransactions].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return sortOrder === 'asc' 
              ? a.date.getTime() - b.date.getTime()
              : b.date.getTime() - a.date.getTime();
          case 'amount':
            return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
          case 'name':
            const nameA = a.storeName || '';
            const nameB = b.storeName || '';
            return sortOrder === 'asc' 
              ? nameA.localeCompare(nameB, 'ja') 
              : nameB.localeCompare(nameA, 'ja');
          default:
            return 0;
        }
      });
      
      return {
        ...bankData,
        allTransactions: sortedTransactions
      };
    });
    
    // Sort banks by total amount (descending by default)
    return bankDataArray.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [schedule.items, sortBy, sortOrder]);

  // Handle sort change
  const handleSortChange = (newSortBy: 'date' | 'amount' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'date' | 'amount' | 'name' }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    );
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      {/* Header with totals */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            銀行別引落予定表
          </h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatAmount(schedule.totalAmount || sortedBankData.reduce((sum, bank) => sum + bank.totalAmount, 0))}
            </div>
            <div className="text-sm text-gray-600">
              合計 {schedule.totalTransactions || schedule.items.length} 件
            </div>
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">並び替え:</span>
          <button
            onClick={() => handleSortChange('date')}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors',
              sortBy === 'date' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>支払日</span>
            <SortIcon field="date" />
          </button>
          <button
            onClick={() => handleSortChange('amount')}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors',
              sortBy === 'amount' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>金額</span>
            <SortIcon field="amount" />
          </button>
          <button
            onClick={() => handleSortChange('name')}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors',
              sortBy === 'name' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>店舗名</span>
            <SortIcon field="name" />
          </button>
        </div>
      </div>

      {/* Bank list */}
      <div className="divide-y divide-gray-200">
        {sortedBankData.map((bankData) => {
          const isExpanded = expandedBanks.has(bankData.bankId);
          
          return (
            <div key={bankData.bankId}>
              {/* Bank header */}
              <button
                onClick={() => toggleBankExpansion(bankData.bankId)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bankData.bankName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {bankData.transactionCount} 件の引落予定
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatAmount(bankData.totalAmount)}
                    </div>
                  </div>
                </div>
              </button>

              {/* Bank transactions (expanded) */}
              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-200">
                  {bankData.allTransactions.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {bankData.allTransactions.map((transaction, index) => (
                        <div
                          key={`${bankData.bankId}-${index}-${transaction.transactionId || transaction.date}`}
                          className={cn(
                            'p-4 hover:bg-white transition-colors cursor-pointer',
                            onTransactionClick && 'hover:shadow-sm'
                          )}
                          onClick={() => onTransactionClick?.(transaction)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {transaction.cardName}
                                </span>
                                {transaction.paymentDate && (
                                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                    {formatJapaneseDate(new Date(transaction.paymentDate), { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                    ({getWeekdayNameJP(new Date(transaction.paymentDate))})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {transaction.storeName && (
                                  <span className="text-sm text-gray-700">
                                    {transaction.storeName}
                                  </span>
                                )}
                                {transaction.usage && (
                                  <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded-full">
                                    {transaction.usage}
                                  </span>
                                )}
                              </div>
                              {transaction.transactionDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  取引日: {formatJapaneseDate(new Date(transaction.transactionDate), {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatAmount(transaction.amount)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      この銀行には引落予定がありません
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      {sortedBankData.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            引落予定がありません
          </h3>
          <p className="text-sm text-gray-500">
            この月には支払い予定の取引がありません。
          </p>
        </div>
      )}
    </div>
  );
}

// Summary card component
export interface ScheduleSummaryProps {
  schedule: MonthlySchedule;
  className?: string;
}

export function ScheduleSummary({ schedule, className }: ScheduleSummaryProps) {
  const bankCount = schedule.bankTotals.length;
  const transactionCount = schedule.items.length;

  return (
    <div className={cn(
      'grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200',
      className
    )}>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-700">
          {bankCount}
        </div>
        <div className="text-sm text-blue-600">
          銀行
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-indigo-700">
          {transactionCount}
        </div>
        <div className="text-sm text-indigo-600">
          取引
        </div>
      </div>
    </div>
  );
}