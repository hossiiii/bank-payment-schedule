'use client';

import React, { useState } from 'react';
import { CalendarView, MonthNavigation, TransactionModal, TransactionViewModal, ScheduleViewModal, ScheduleEditModal, DayTotalModal } from '@/components/calendar';
import { Navigation, NavigationIcons } from '@/components/ui';
import { useBanks, useCards, useTransactions, useMonthlySchedule } from '@/lib/hooks/useDatabase';
import { Transaction, TransactionInput, ScheduleItem } from '@/types/database';
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
  
  // Transaction view modal state
  const [isTransactionViewModalOpen, setIsTransactionViewModalOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  
  // Schedule modal state
  const [isScheduleViewModalOpen, setIsScheduleViewModalOpen] = useState(false);
  const [selectedScheduleItems, setSelectedScheduleItems] = useState<ScheduleItem[]>([]);
  
  // Schedule edit modal state
  const [isScheduleEditModalOpen, setIsScheduleEditModalOpen] = useState(false);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleItem | null>(null);
  
  // Day total modal state
  const [isDayTotalModalOpen, setIsDayTotalModalOpen] = useState(false);
  const [selectedDayTotalData, setSelectedDayTotalData] = useState<any>(null);

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

  // Handle transaction view click (for DayTotalModal)
  const handleTransactionViewClick = (transactions: Transaction[]) => {
    setSelectedTransactions(transactions);
    setIsTransactionViewModalOpen(true);
  };

  // Handle schedule view click (for DayTotalModal)
  const handleScheduleViewClick = (scheduleItems: ScheduleItem[]) => {
    setSelectedScheduleItems(scheduleItems);
    setIsScheduleViewModalOpen(true);
  };
  
  // Handle transaction view click with date (for CalendarView)
  const handleTransactionViewClickWithDate = (date: Date, transactions: Transaction[]) => {
    setSelectedDate(date);
    setSelectedTransactions(transactions);
    setIsTransactionViewModalOpen(true);
  };

  // Handle schedule view click with date (for CalendarView)
  const handleScheduleViewClickWithDate = (date: Date, scheduleItems: ScheduleItem[]) => {
    setSelectedDate(date);
    setSelectedScheduleItems(scheduleItems);
    setIsScheduleViewModalOpen(true);
  };
  
  // Handle schedule click from modals (legacy - for ScheduleEditModal)
  const handleScheduleClick = (scheduleItem: ScheduleItem) => {
    setSelectedScheduleItem(scheduleItem);
    setIsScheduleEditModalOpen(true);
  };
  
  // Handle transaction click from schedule modals
  const handleScheduleTransactionClick = async (transactionId: string) => {
    try {
      // まず現在のtransactionsから検索
      let transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        // 現在の月のtransactionsにない場合、データベースから直接取得
        const { transactionOperations } = await import('@/lib/database');
        transaction = await transactionOperations.getById(transactionId);
      }
      
      if (transaction) {
        // ScheduleViewModalを閉じてTransactionModalを開く
        setIsScheduleViewModalOpen(false);
        setSelectedTransaction(transaction);
        setSelectedDate(new Date(transaction.date));
        setIsModalOpen(true);
      } else {
        console.error('Transaction not found:', transactionId);
      }
    } catch (error) {
      console.error('Failed to get transaction:', error);
    }
  };
  
  // Handle schedule save
  const handleScheduleSave = async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    try {
      // TODO: Implement schedule update functionality
      console.log('Schedule update:', { scheduleId, updates });
      // await updateScheduleItem(scheduleId, updates);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      throw error;
    }
  };
  
  // Handle schedule delete
  const handleScheduleDelete = async (scheduleId: string) => {
    try {
      // TODO: Implement schedule delete functionality
      console.log('Schedule delete:', scheduleId);
      // await deleteScheduleItem(scheduleId);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  };
  
  // Handle day total click

  // Handle transaction view modal transaction click
  const handleTransactionViewTransactionClick = (transaction: Transaction) => {
    // TransactionViewModalを閉じてTransactionModalを開く
    setIsTransactionViewModalOpen(false);
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

  // Handle transaction view modal close
  const handleTransactionViewModalClose = () => {
    setIsTransactionViewModalOpen(false);
    setSelectedTransactions([]);
  };

  // Handle schedule view modal close
  const handleScheduleViewModalClose = () => {
    setIsScheduleViewModalOpen(false);
    setSelectedScheduleItems([]);
  };
  
  // Handle schedule edit modal close
  const handleScheduleEditModalClose = () => {
    setIsScheduleEditModalOpen(false);
    setSelectedScheduleItem(null);
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
                onTransactionViewClick={handleTransactionViewClickWithDate}
                onScheduleViewClick={handleScheduleViewClickWithDate}
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

      {/* Transaction view modal */}
      {isTransactionViewModalOpen && selectedDate && selectedTransactions.length > 0 && (
        <TransactionViewModal
          isOpen={isTransactionViewModalOpen}
          onClose={handleTransactionViewModalClose}
          onTransactionClick={handleTransactionViewTransactionClick}
          selectedDate={selectedDate}
          transactions={selectedTransactions}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Schedule view modal */}
      {isScheduleViewModalOpen && selectedDate && selectedScheduleItems.length > 0 && (
        <ScheduleViewModal
          isOpen={isScheduleViewModalOpen}
          onClose={handleScheduleViewModalClose}
          onTransactionClick={handleScheduleTransactionClick}
          selectedDate={selectedDate}
          scheduleItems={selectedScheduleItems}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Schedule edit modal */}
      {isScheduleEditModalOpen && selectedScheduleItem && (
        <ScheduleEditModal
          isOpen={isScheduleEditModalOpen}
          onClose={handleScheduleEditModalClose}
          onSave={handleScheduleSave}
          onDelete={handleScheduleDelete}
          scheduleItem={selectedScheduleItem}
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
          onTransactionClick={handleTransactionClick}
          onScheduleClick={handleScheduleClick}
          onScheduleTransactionClick={handleScheduleTransactionClick}
          onViewTransactions={handleTransactionViewClick}
          onViewSchedules={handleScheduleViewClick}
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