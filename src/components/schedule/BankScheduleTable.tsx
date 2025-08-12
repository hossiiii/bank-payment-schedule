'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PaymentScheduleView, TransactionDetailModalData } from '@/types/schedule';
import { formatAmount } from '@/lib/utils/scheduleUtils';
import { PaymentRow } from './PaymentRow';

export interface BankScheduleTableProps {
  scheduleData: PaymentScheduleView;
  onAmountClick: (modalData: TransactionDetailModalData) => void;
  className?: string;
}

export function BankScheduleTable({
  scheduleData,
  onAmountClick,
  className
}: BankScheduleTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'paymentName' | 'totalAmount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort payments
  const sortedPayments = useMemo(() => {
    const sorted = [...scheduleData.payments].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return sortOrder === 'asc' 
            ? a.sortKey - b.sortKey
            : b.sortKey - a.sortKey;
        case 'paymentName':
          return sortOrder === 'asc'
            ? a.paymentName.localeCompare(b.paymentName, 'ja')
            : b.paymentName.localeCompare(a.paymentName, 'ja');
        case 'totalAmount':
          return sortOrder === 'asc'
            ? a.totalAmount - b.totalAmount
            : b.totalAmount - a.totalAmount;
        default:
          return 0;
      }
    });
    return sorted;
  }, [scheduleData.payments, sortBy, sortOrder]);

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
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
    <div className={cn('bg-white rounded-lg shadow-sm overflow-hidden', className)}>
      {/* Header with totals */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {scheduleData.month} 銀行別引落予定表
          </h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatAmount(scheduleData.monthTotal)}
            </div>
            <div className="text-sm text-gray-600">
              合計 {scheduleData.payments.length} 件
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
            <span>引落日</span>
            <SortIcon field="date" />
          </button>
          <button
            onClick={() => handleSortChange('paymentName')}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors',
              sortBy === 'paymentName' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>引落名</span>
            <SortIcon field="paymentName" />
          </button>
          <button
            onClick={() => handleSortChange('totalAmount')}
            className={cn(
              'flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors',
              sortBy === 'totalAmount' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>金額</span>
            <SortIcon field="totalAmount" />
          </button>
        </div>
      </div>

      {/* Cross-table */}
      {scheduleData.payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                  引落予定日
                </th>
                <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                  曜日
                </th>
                <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                  引落名
                </th>
                <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                  締日
                </th>
                <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">
                  引落日
                </th>
                {scheduleData.uniqueBanks.map(bank => (
                  <th 
                    key={bank.id}
                    className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]"
                  >
                    {bank.name}
                  </th>
                ))}
                <th className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]">
                  引落合計
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((payment, index) => (
                <PaymentRow
                  key={`${payment.date}-${index}`}
                  payment={payment}
                  banks={scheduleData.uniqueBanks}
                  onAmountClick={onAmountClick}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 font-semibold">
                <td 
                  colSpan={5} 
                  className="border border-gray-200 p-3 text-right text-sm text-gray-900"
                >
                  合計
                </td>
                {scheduleData.uniqueBanks.map(bank => (
                  <td 
                    key={bank.id}
                    className="border border-gray-200 p-3 text-center text-sm text-gray-900"
                  >
                    {formatAmount(scheduleData.bankTotals.get(bank.id) || 0)}
                  </td>
                ))}
                <td className="border border-gray-200 p-3 text-center text-sm text-gray-900 font-bold">
                  {formatAmount(scheduleData.monthTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
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

// Summary card component for new PaymentScheduleView
export interface ScheduleSummaryProps {
  scheduleData: PaymentScheduleView;
  className?: string;
}

export function ScheduleSummary({ scheduleData, className }: ScheduleSummaryProps) {
  const bankCount = scheduleData.uniqueBanks.length;
  const paymentCount = scheduleData.payments.length;
  const totalTransactions = scheduleData.payments.reduce((sum, payment) => sum + payment.transactions.length, 0);

  return (
    <div className={cn(
      'grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200',
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
          {paymentCount}
        </div>
        <div className="text-sm text-indigo-600">
          引落日
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-700">
          {totalTransactions}
        </div>
        <div className="text-sm text-purple-600">
          取引
        </div>
      </div>
    </div>
  );
}