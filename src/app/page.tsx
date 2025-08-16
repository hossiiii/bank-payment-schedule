'use client';

import React, { useState } from 'react';
import { CalendarView, MonthNavigation, TransactionModal, DayTotalModal } from '@/components/calendar';
import { Navigation, NavigationIcons } from '@/components/ui';
import { useBanks, useCards, useTransactions, useMonthlySchedule } from '@/lib/hooks/useDatabase';
import { Transaction, TransactionInput } from '@/types/database';
import { DayTotalData } from '@/types/calendar';
import { getCurrentJapanDate } from '@/lib/utils/dateUtils';

export default function CalendarPage() {
  // Current month state
  const [currentDate, setCurrentDate] = useState(() => {
    const today = getCurrentJapanDate();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    };
  });

  // Modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Day total modal state
  const [isDayTotalModalOpen, setIsDayTotalModalOpen] = useState(false);
  const [selectedDayTotalData, setSelectedDayTotalData] = useState<DayTotalData | null>(null);

  // Database hooks
  const { banks, isLoading: banksLoading, error: banksError } = useBanks();
  const { cards, isLoading: cardsLoading, error: cardsError } = useCards();
  const { 
    transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    createTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions({
    dateRange: {
      start: new Date(currentDate.year, currentDate.month - 1, 1).getTime(),
      end: new Date(currentDate.year, currentDate.month, 0, 23, 59, 59).getTime()
    }
  });
  const { 
    schedule, 
    isLoading: scheduleLoading, 
    error: scheduleError 
  } = useMonthlySchedule(currentDate.year, currentDate.month);

  // Navigation items
  const navigationItems = [
    {
      label: 'カレンダー',
      href: '/',
      icon: <NavigationIcons.Calendar />
    },
    {
      label: '引落予定',
      href: '/schedule',
      icon: <NavigationIcons.Schedule />
    },
    {
      label: '設定',
      href: '/settings',
      icon: <NavigationIcons.Settings />
    }
  ];

  // Handle month navigation
  const handleMonthChange = (year: number, month: number) => {
    setCurrentDate({ year, month });
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  // Handle transaction click
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSelectedDate(new Date(transaction.date));
    setIsModalOpen(true);
  };

  // Handle day total click
  const handleDayTotalClick = (date: Date, dayTotalData: DayTotalData) => {
    setSelectedDate(date);
    setSelectedDayTotalData(dayTotalData);
    setIsDayTotalModalOpen(true);
  };

  // Handle day total modal transaction click
  const handleDayTotalTransactionClick = (transaction: Transaction) => {
    // DayTotalModalを閉じてTransactionModalを開く
    setIsDayTotalModalOpen(false);
    setSelectedTransaction(transaction);
    setSelectedDate(new Date(transaction.date));
    setIsModalOpen(true);
  };

  // Handle transaction save
  const handleTransactionSave = async (transactionInput: TransactionInput) => {
    try {
      if (selectedTransaction) {
        // Update existing transaction
        await updateTransaction(selectedTransaction.id, transactionInput);
      } else {
        // Create new transaction
        await createTransaction(transactionInput);
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      throw error;
    }
  };

  // Handle transaction delete
  const handleTransactionDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedTransaction(null);
  };

  // Handle day total modal close
  const handleDayTotalModalClose = () => {
    setIsDayTotalModalOpen(false);
    setSelectedDayTotalData(null);
  };

  // Loading state
  const isLoading = banksLoading || cardsLoading || transactionsLoading || scheduleLoading;
  
  // Error state
  const error = banksError || cardsError || transactionsError || scheduleError;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Month navigation */}
      <MonthNavigation
        year={currentDate.year}
        month={currentDate.month}
        onMonthChange={handleMonthChange}
        className="sticky top-0 z-20 shadow-sm"
      />

      {/* Main content */}
      <div className="p-4">
        {/* Error state */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              データの読み込みに失敗しました
            </h3>
            <p className="text-sm text-red-700">
              {error.message}
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600">データを読み込み中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* No data message */}
            {banks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  まずは銀行とカードを登録してください
                </h3>
                <p className="text-gray-600 mb-4">
                  取引を記録するには、銀行とカードの設定が必要です。
                </p>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  設定画面へ
                </button>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  カードを登録してください
                </h3>
                <p className="text-gray-600 mb-4">
                  取引を記録するには、カードの設定が必要です。
                </p>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  設定画面へ
                </button>
              </div>
            ) : (
              /* Calendar view */
              <CalendarView
                year={currentDate.year}
                month={currentDate.month}
                transactions={transactions}
                {...(schedule && { schedule })}
                banks={banks}
                cards={cards}
                onDateClick={handleDateClick}
                onTransactionClick={handleTransactionClick}
                onDayTotalClick={handleDayTotalClick}
                onMonthChange={handleMonthChange}
              />
            )}
          </>
        )}
      </div>

      {/* Transaction modal */}
      {isModalOpen && selectedDate && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleTransactionSave}
          {...(selectedTransaction && { onDelete: handleTransactionDelete, transaction: selectedTransaction })}
          selectedDate={selectedDate}
          banks={banks}
          cards={cards}
          isLoading={isLoading}
        />
      )}

      {/* Day total modal */}
      {isDayTotalModalOpen && selectedDate && selectedDayTotalData && (
        <DayTotalModal
          isOpen={isDayTotalModalOpen}
          onClose={handleDayTotalModalClose}
          onTransactionClick={handleDayTotalTransactionClick}
          selectedDate={selectedDate}
          dayTotalData={selectedDayTotalData}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Bottom navigation */}
      <Navigation items={navigationItems} />
    </div>
  );
}