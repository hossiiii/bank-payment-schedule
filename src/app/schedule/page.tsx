'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BankScheduleTable, ScheduleSummary, MonthSelector } from '@/components/schedule';
import { TopNavigation, Navigation, NavigationIcons } from '@/components/ui';
import { TransactionDetailModal } from '@/components/schedule/TransactionDetailModal';
import { MobileScheduleCard } from '@/components/schedule/MobileScheduleCard';
import ScheduleFiltersComponent from '@/components/schedule/ScheduleFilters';
import { useBanks, useMonthlySchedule } from '@/lib/hooks/useDatabase';
import { useFilteredSchedule } from '@/lib/hooks/useFilteredSchedule';
import { getCurrentJapanDate } from '@/lib/utils/dateUtils';
import { TransactionDetailModalData } from '@/types/schedule';
import { ScheduleItem, Bank, Transaction } from '@/types/database';

export default function SchedulePage() {
  // Current month state
  const [currentDate, setCurrentDate] = useState(() => {
    const today = getCurrentJapanDate();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1
    };
  });

  // Modal state
  const [modalData, setModalData] = useState<TransactionDetailModalData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Database hooks
  const { banks, isLoading: banksLoading, error: banksError } = useBanks();
  const { 
    schedule: scheduleData, 
    isLoading: scheduleLoading, 
    error: scheduleError 
  } = useMonthlySchedule(currentDate.year, currentDate.month);

  // Convert MonthlySchedule to PaymentScheduleView format
  const convertedScheduleData = useMemo(() => {
    if (!scheduleData) return null;
    
    // Group schedule items by date and bank
    const paymentsByDate = new Map<string, Map<string, ScheduleItem[]>>();
    
    scheduleData.items.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      
      if (!paymentsByDate.has(dateKey)) {
        paymentsByDate.set(dateKey, new Map());
      }
      
      const dateMap = paymentsByDate.get(dateKey)!;
      const bankKey = item.bankId || 'unknown';
      
      if (!dateMap.has(bankKey)) {
        dateMap.set(bankKey, []);
      }
      
      dateMap.get(bankKey)!.push(item);
    });
    
    // Create payments array
    const payments = Array.from(paymentsByDate.entries()).map(([dateKey, bankMap]) => {
      const allTransactions = Array.from(bankMap.values()).flat();
      
      // Create bank payments for each bank
      const bankPayments = Array.from(bankMap.entries()).map(([bankId, items]) => {
        const bankTotal = items.reduce((sum, item) => sum + item.amount, 0);
        const bank = banks.find(b => b.id === bankId);
        
        return {
          bankId,
          bankName: bank?.name || 'その他',
          amount: bankTotal
        };
      });
      
      // Convert schedule items to transaction format
      const transactions = allTransactions.map(item => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        paymentType: item.cardId ? 'card' as const : 'bank' as const,
        scheduledPayDate: item.date,
        createdAt: Date.now(),
        storeName: item.description || '',
        usage: item.memo || '',
        cardId: item.cardId,
        bankId: item.bankId,
        isScheduleEditable: item.isScheduleEditable ?? false
      }));
      
      const date = new Date(dateKey);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      const bankName = bankPayments.length > 0 ? bankPayments[0].bankName : 'その他';
      
      return {
        date: dateKey,
        dayOfWeek,
        paymentName: bankName,
        paymentDay: date.getDate().toString() + '日',
        bankPayments,
        totalAmount: bankPayments.reduce((sum, bp) => sum + bp.amount, 0),
        transactions,
        sortKey: date.getTime()
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      month: `${scheduleData.year}年${scheduleData.month}月`,
      payments,
      bankTotals: new Map(scheduleData.bankTotals.map(bt => [bt.bankId, bt.totalAmount])),
      monthTotal: scheduleData.monthTotal,
      uniqueBanks: scheduleData.bankTotals.map(bt => {
        const bank = banks.find(b => b.id === bt.bankId);
        return {
          id: bt.bankId,
          name: bt.bankName,
          memo: bank?.memo,
          createdAt: bank?.createdAt || Date.now()
        };
      })
    };
  }, [scheduleData, banks]);

  // Filtering
  const {
    filteredData,
    appliedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useFilteredSchedule(convertedScheduleData);

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

  // Handle back navigation
  const handleBack = () => {
    window.history.back();
  };

  // Handle transaction modal
  const handleAmountClick = (data: TransactionDetailModalData) => {
    setModalData(data);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  // Handle responsive design
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Loading state
  const isLoading = banksLoading || scheduleLoading;
  
  // Error state
  const error = banksError || scheduleError;

  // Use filtered data or converted data
  const displayData = filteredData || convertedScheduleData;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top navigation */}
      <TopNavigation
        title="引落予定表"
        showBackButton={true}
        onBack={handleBack}
      />

      {/* Month selector */}
      <div className="p-4">
        <MonthSelector
          year={currentDate.year}
          month={currentDate.month}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Main content */}
      <div className="px-4 pb-4 space-y-4">
        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
              <p className="text-gray-600">引落予定を計算中...</p>
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
                  引落予定表を表示するには、銀行とカードの設定が必要です。
                </p>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  設定画面へ
                </button>
              </div>
            ) : !displayData || displayData.payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters ? 'フィルター条件に一致する引落予定がありません' : 'この月には引落予定がありません'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters ? (
                    <>フィルター条件を変更するか、クリアしてください。</>
                  ) : (
                    <>
                      {currentDate.year}年{currentDate.month}月の支払い予定はありません。<br />
                      カレンダーから取引を追加してください。
                    </>
                  )}
                </p>
                <div className="space-x-3">
                  {hasActiveFilters ? (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      フィルターをクリア
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        カレンダーへ
                      </button>
                      <button
                        onClick={() => {
                          const today = getCurrentJapanDate();
                          handleMonthChange(today.getFullYear(), today.getMonth() + 1);
                        }}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        今月を表示
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Schedule Filters */}
                <ScheduleFiltersComponent
                  filters={appliedFilters}
                  onFiltersChange={updateFilters}
                  availableBanks={banks}
                />

                {/* Schedule summary */}
                <ScheduleSummary scheduleData={displayData} />

                {/* Responsive schedule display */}
                {isMobile ? (
                  <MobileScheduleCard
                    scheduleData={displayData}
                    onTransactionClick={handleAmountClick}
                  />
                ) : (
                  <BankScheduleTable
                    scheduleData={displayData}
                    onAmountClick={handleAmountClick}
                  />
                )}

                {/* Export options */}
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    エクスポート
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        // Implement CSV export
                        const csvData = displayData.payments.flatMap(payment =>
                          payment.transactions.map(tx => 
                            `${payment.date},${payment.paymentName},${tx.storeName || ''},${tx.usage || ''},${tx.amount}`
                          )
                        ).join('\n');
                        const csv = '引落日,引落名,店舗名,用途,金額\n' + csvData;
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `引落予定表_${currentDate.year}年${currentDate.month}月.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CSV出力</span>
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>印刷</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    引落予定表をCSVファイルで保存したり、印刷することができます。
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        data={modalData}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />

      {/* Bottom navigation */}
      <Navigation items={navigationItems} />
    </div>
  );
}