'use client';

import React, { useState } from 'react';
import { CalendarView, MonthNavigation, TransactionModal, TransactionViewModal, ScheduleViewModal, ScheduleEditModal, DayTotalModal } from '@/components/calendar';
import { Navigation, NavigationIcons } from '@/components/ui';
import { useBanks, useCards, useTransactions, useMonthlySchedule } from '@/lib/hooks/useDatabase';
import { Transaction, TransactionInput, ScheduleItem } from '@/types/database';
import { getCurrentJapanDate } from '@/lib/utils/dateUtils';
import { useModalManager } from '../hooks/modal/useModalManager';

export default function CalendarPage() {
  // Current month state
  const [currentDate, setCurrentDate] = useState(() => {
    const today = getCurrentJapanDate();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    };
  });

  // Database hooks
  const { banks, isLoading: banksLoading, error: banksError } = useBanks();
  const { cards, isLoading: cardsLoading, error: cardsError } = useCards();
  const { 
    transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions
  } = useTransactions({
    dateRange: {
      start: new Date(currentDate.year, currentDate.month - 1, 1).getTime(),
      end: new Date(currentDate.year, currentDate.month, 0, 23, 59, 59).getTime()
    }
  });
  const { 
    schedule, 
    isLoading: scheduleLoading, 
    error: scheduleError,
    refetch: refetchSchedule
  } = useMonthlySchedule(currentDate.year, currentDate.month);

  // Modal manager for unified modal state management
  const modalManager = useModalManager({
    // Data operation handlers
    onTransactionSave: async (transactionInput: TransactionInput) => {
      try {
        if (modalManager.selectedData.transaction) {
          // Update existing transaction
          await updateTransaction(modalManager.selectedData.transaction.id, transactionInput);
        } else {
          // Create new transaction
          await createTransaction(transactionInput);
        }
        
        // Refetch both transaction and schedule data to reflect changes immediately
        await Promise.all([
          refetchTransactions(),
          refetchSchedule()
        ]);
      } catch (error) {
        console.error('Failed to save transaction:', error);
        throw error;
      }
    },
    onTransactionDelete: async (transactionId: string) => {
      try {
        await deleteTransaction(transactionId);
        
        // Refetch both transaction and schedule data to reflect changes immediately
        await Promise.all([
          refetchTransactions(),
          refetchSchedule()
        ]);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        throw error;
      }
    },
    onScheduleSave: async (scheduleId: string, updates: Partial<ScheduleItem>) => {
      try {
        // TODO: Implement schedule update functionality
        console.log('Schedule update:', { scheduleId, updates });
        // await updateScheduleItem(scheduleId, updates);
      } catch (error) {
        console.error('Failed to save schedule:', error);
        throw error;
      }
    },
    onScheduleDelete: async (scheduleId: string) => {
      try {
        // TODO: Implement schedule delete functionality
        console.log('Schedule delete:', scheduleId);
        // await deleteScheduleItem(scheduleId);
      } catch (error) {
        console.error('Failed to delete schedule:', error);
        throw error;
      }
    },
    onScheduleTransactionClick: async (transactionId: string) => {
      try {
        // まず現在のtransactionsから検索
        let transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
          // 現在の月のtransactionsにない場合、データベースから直接取得
          const { transactionOperations } = await import('@/lib/database');
          transaction = await transactionOperations.getById(transactionId);
        }
        
        if (transaction) {
          // ScheduleViewModalを一時的に閉じて空のダイアログ表示を防ぐ
          modalManager.closeScheduleViewModal();
          
          // TransactionModalを開く
          modalManager.openTransactionModal(new Date(transaction.date), transaction);
        } else {
          console.error('Transaction not found:', transactionId);
        }
      } catch (error) {
        console.error('Failed to get transaction:', error);
      }
    },
    banks,
    cards,
    isLoading: banksLoading || cardsLoading || transactionsLoading || scheduleLoading
  });

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

  // Simplified event handlers using modalManager
  const handleDateClick = (date: Date) => {
    modalManager.openTransactionModal(date);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    modalManager.openTransactionModal(new Date(transaction.date), transaction);
  };

  // Handle transaction view click (for DayTotalModal)
  const handleTransactionViewClick = (transactions: Transaction[]) => {
    if (modalManager.selectedData.date) {
      modalManager.openTransactionViewModal(modalManager.selectedData.date, transactions);
    }
  };

  // Handle schedule view click (for DayTotalModal)
  const handleScheduleViewClick = (scheduleItems: ScheduleItem[]) => {
    if (modalManager.selectedData.date) {
      modalManager.openScheduleViewModal(modalManager.selectedData.date, scheduleItems);
    }
  };
  
  // Handle transaction view click with date (for CalendarView)
  const handleTransactionViewClickWithDate = (date: Date, transactions: Transaction[]) => {
    modalManager.openTransactionViewModal(date, transactions);
  };

  // Handle schedule view click with date (for CalendarView)
  const handleScheduleViewClickWithDate = (date: Date, scheduleItems: ScheduleItem[]) => {
    modalManager.openScheduleViewModal(date, scheduleItems);
  };
  
  // Handle schedule click from modals (legacy - for ScheduleEditModal)
  const handleScheduleClick = (scheduleItem: ScheduleItem) => {
    modalManager.openScheduleEditModal(scheduleItem);
  };
  
  // Handle transaction click from schedule modals - now handled by modalManager
  const handleScheduleTransactionClick = modalManager.handleScheduleTransactionClick;
  
  // Handle schedule save and delete - now handled by modalManager
  const handleScheduleSave = modalManager.handleScheduleSave;
  const handleScheduleDelete = modalManager.handleScheduleDelete;
  
  // Handle transaction view modal transaction click - now handled by modalManager
  const handleTransactionViewTransactionClick = modalManager.handleTransactionViewTransactionClick;

  // Handle transaction save and delete - now handled by modalManager
  const handleTransactionSave = modalManager.handleTransactionSave;
  const handleTransactionDelete = modalManager.handleTransactionDelete;

  // Simplified modal close handlers using modalManager
  const handleModalClose = modalManager.closeTransactionModal;
  const handleTransactionViewModalClose = modalManager.closeTransactionViewModal;
  const handleScheduleViewModalClose = modalManager.closeScheduleViewModal;
  const handleScheduleEditModalClose = modalManager.closeScheduleEditModal;
  const handleDayTotalModalClose = modalManager.closeDayTotalModal;

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
      {modalManager.modalStates.transaction && modalManager.selectedData.date && (
        <TransactionModal
          isOpen={modalManager.modalStates.transaction}
          onClose={handleModalClose}
          onSave={handleTransactionSave}
          {...(modalManager.selectedData.transaction && { onDelete: handleTransactionDelete, transaction: modalManager.selectedData.transaction })}
          selectedDate={modalManager.selectedData.date}
          banks={banks}
          cards={cards}
          isLoading={isLoading}
        />
      )}

      {/* Transaction view modal */}
      {modalManager.modalStates.transactionView && modalManager.selectedData.date && modalManager.selectedData.transactions.length > 0 && (
        <TransactionViewModal
          isOpen={modalManager.modalStates.transactionView}
          onClose={handleTransactionViewModalClose}
          onTransactionClick={handleTransactionViewTransactionClick}
          selectedDate={modalManager.selectedData.date}
          transactions={modalManager.selectedData.transactions}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Schedule view modal */}
      {modalManager.modalStates.scheduleView && modalManager.selectedData.date && modalManager.selectedData.scheduleItems.length > 0 && (
        <ScheduleViewModal
          isOpen={modalManager.modalStates.scheduleView}
          onClose={handleScheduleViewModalClose}
          onTransactionClick={handleScheduleTransactionClick}
          selectedDate={modalManager.selectedData.date}
          scheduleItems={modalManager.selectedData.scheduleItems}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Schedule edit modal */}
      {modalManager.modalStates.scheduleEdit && modalManager.selectedData.scheduleItem && (
        <ScheduleEditModal
          isOpen={modalManager.modalStates.scheduleEdit}
          onClose={handleScheduleEditModalClose}
          onSave={handleScheduleSave}
          onDelete={handleScheduleDelete}
          scheduleItem={modalManager.selectedData.scheduleItem}
          banks={banks}
          cards={cards}
          isLoading={isLoading}
        />
      )}

      {/* Day total modal */}
      {modalManager.modalStates.dayTotal && modalManager.selectedData.date && modalManager.selectedData.dayTotalData && (
        <DayTotalModal
          isOpen={modalManager.modalStates.dayTotal}
          onClose={handleDayTotalModalClose}
          onTransactionClick={handleTransactionClick}
          onScheduleClick={handleScheduleClick}
          onScheduleTransactionClick={handleScheduleTransactionClick}
          onViewTransactions={handleTransactionViewClick}
          onViewSchedules={handleScheduleViewClick}
          selectedDate={modalManager.selectedData.date}
          dayTotalData={modalManager.selectedData.dayTotalData}
          banks={banks}
          cards={cards}
        />
      )}

      {/* Bottom navigation */}
      <Navigation items={navigationItems} />
    </div>
  );
}