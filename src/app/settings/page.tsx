'use client';

import React from 'react';
import { BankMaster, CardMaster } from '@/components/settings';
import { TopNavigation, Navigation, NavigationIcons } from '@/components/ui';
import { useBanks, useCards, useDatabaseStats } from '@/lib/hooks/useDatabase';

export default function SettingsPage() {
  // Database hooks
  const { 
    banks, 
    isLoading: banksLoading, 
    error: banksError,
    createBank,
    updateBank,
    deleteBank
  } = useBanks();

  const { 
    cards, 
    isLoading: cardsLoading, 
    error: cardsError,
    createCard,
    updateCard,
    deleteCard
  } = useCards();

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    clearAllData
  } = useDatabaseStats();

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

  // Handle back navigation
  const handleBack = () => {
    window.history.back();
  };

  // Loading state
  const isLoading = banksLoading || cardsLoading || statsLoading;
  
  // Error state
  const error = banksError || cardsError || statsError;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top navigation */}
      <TopNavigation
        title="設定"
        showBackButton={true}
        onBack={handleBack}
      />

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              エラーが発生しました
            </h3>
            <p className="text-sm text-red-700">
              {error.message}
            </p>
          </div>
        )}

        {/* Database stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            データベース統計
          </h3>
          
          {statsLoading ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {stats.banks}
                </div>
                <div className="text-sm text-blue-600">
                  銀行
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {stats.cards}
                </div>
                <div className="text-sm text-green-600">
                  カード
                </div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.transactions}
                </div>
                <div className="text-sm text-yellow-600">
                  取引
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-semibold text-purple-700">
                  {Math.round(stats.totalSize / 1024)} KB
                </div>
                <div className="text-sm text-purple-600">
                  データサイズ
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bank Master */}
        <BankMaster
          banks={banks}
          isLoading={banksLoading}
          onCreateBank={async (bankData) => { await createBank(bankData); }}
          onUpdateBank={async (id, bankData) => { await updateBank(id, bankData); }}
          onDeleteBank={async (id) => { await deleteBank(id); }}
        />

        {/* Card Master */}
        <CardMaster
          cards={cards}
          banks={banks}
          isLoading={cardsLoading}
          onCreateCard={async (cardData) => { await createCard(cardData); }}
          onUpdateCard={async (id, cardData) => { await updateCard(id, cardData); }}
          onDeleteCard={async (id) => { await deleteCard(id); }}
        />

        {/* Data Management Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            データ管理
          </h3>
          
          <div className="space-y-4">
            {/* Export Data */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                データのエクスポート
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                すべての銀行、カード、取引データをJSONファイルとしてエクスポートできます。
              </p>
              <button
                onClick={() => {
                  // Implement export functionality
                  console.log('Export data');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>データをエクスポート</span>
              </button>
            </div>

            {/* Import Data */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                データのインポート
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                以前にエクスポートしたJSONファイルからデータを復元できます。
              </p>
              <button
                onClick={() => {
                  // Implement import functionality
                  console.log('Import data');
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>データをインポート</span>
              </button>
            </div>

            {/* Clear Data */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-900 mb-2">
                全データの削除
              </h4>
              <p className="text-sm text-red-700 mb-3">
                すべての銀行、カード、取引データを削除します。この操作は取り消せません。
              </p>
              <button
                onClick={async () => {
                  const confirmed = window.confirm(
                    'すべてのデータを削除しますか？この操作は取り消せません。'
                  );
                  if (confirmed) {
                    try {
                      await clearAllData();
                      alert('すべてのデータが削除されました。');
                    } catch (error) {
                      alert('データの削除に失敗しました。エラー: ' + error);
                    }
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>全データを削除</span>
              </button>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            アプリ情報
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>バージョン:</span>
              <span className="font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>PWA対応:</span>
              <span className="font-medium text-green-600">✓ 対応</span>
            </div>
            <div className="flex justify-between">
              <span>オフライン対応:</span>
              <span className="font-medium text-green-600">✓ 対応</span>
            </div>
            <div className="flex justify-between">
              <span>データ暗号化:</span>
              <span className="font-medium text-green-600">✓ 有効</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              このアプリは、クレジットカードの利用データを安全に管理し、
              銀行別の引落予定表を自動生成するPWAアプリケーションです。
              すべてのデータはブラウザ内に暗号化されて保存され、
              外部サーバーには送信されません。
            </p>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <Navigation items={navigationItems} />
    </div>
  );
}