'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { Transaction, ScheduleItem, Bank, Card } from '@/types/database';
import { DayTotalData, BankGroup, DayTransactionItem } from '@/types/calendar';

export interface DayTotalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick: (transaction: Transaction) => void;
  selectedDate: Date;
  dayTotalData: DayTotalData;
  banks: Bank[];
  cards: Card[];
  className?: string;
}

/**
 * 銀行別グループ化ロジック
 */
function groupByBank(
  transactions: Transaction[],
  scheduleItems: ScheduleItem[],
  banks: Bank[],
  cards: Card[]
): BankGroup[] {
  const bankMap = new Map<string, Bank>();
  const cardMap = new Map<string, Card>();
  
  // マップ作成
  banks.forEach(bank => bankMap.set(bank.id, bank));
  cards.forEach(card => cardMap.set(card.id, card));
  
  const bankGroups = new Map<string, BankGroup>();
  
  // トランザクションを処理
  transactions.forEach(transaction => {
    let bankId: string;
    let bankName: string;
    let displayName: string;
    
    if (transaction.paymentType === 'card' && transaction.cardId) {
      const card = cardMap.get(transaction.cardId);
      if (!card) return;
      
      bankId = card.bankId;
      const bank = bankMap.get(bankId);
      if (!bank) return;
      
      bankName = bank.name;
      displayName = card.name; // カード名を表示
    } else if (transaction.paymentType === 'bank' && transaction.bankId) {
      bankId = transaction.bankId;
      const bank = bankMap.get(bankId);
      if (!bank) return;
      
      bankName = bank.name;
      displayName = '自動銀行振替'; // 銀行引落の場合
    } else {
      return;
    }
    
    if (!bankGroups.has(bankId)) {
      bankGroups.set(bankId, {
        bankId,
        bankName,
        totalAmount: 0,
        transactionCount: 0,
        items: []
      });
    }
    
    const group = bankGroups.get(bankId)!;
    group.totalAmount += transaction.amount;
    group.transactionCount++;
    
    const item: DayTransactionItem = {
      id: transaction.id,
      type: 'transaction',
      amount: transaction.amount,
      paymentType: transaction.paymentType,
      bankName,
      cardName: displayName,
      transaction,
      ...(transaction.storeName && { storeName: transaction.storeName })
    };
    
    group.items.push(item);
  });
  
  // スケジュールアイテムを処理
  scheduleItems.forEach(scheduleItem => {
    let bankId: string;
    let bankName: string;
    let displayName: string;
    
    if (scheduleItem.paymentType === 'card' && scheduleItem.cardId) {
      const card = cardMap.get(scheduleItem.cardId);
      if (!card) return;
      
      bankId = card.bankId;
      const bank = bankMap.get(bankId);
      if (!bank) return;
      
      bankName = bank.name;
      displayName = scheduleItem.cardName || card.name;
    } else if (scheduleItem.paymentType === 'bank') {
      // スケジュールアイテムの場合、bankNameから銀行を特定
      const bank = banks.find(b => b.name === scheduleItem.bankName);
      if (!bank) return;
      
      bankId = bank.id;
      bankName = bank.name;
      displayName = '自動銀行振替';
    } else {
      return;
    }
    
    if (!bankGroups.has(bankId)) {
      bankGroups.set(bankId, {
        bankId,
        bankName,
        totalAmount: 0,
        transactionCount: 0,
        items: []
      });
    }
    
    const group = bankGroups.get(bankId)!;
    group.totalAmount += scheduleItem.amount;
    group.transactionCount++;
    
    const item: DayTransactionItem = {
      id: scheduleItem.transactionId,
      type: 'schedule',
      amount: scheduleItem.amount,
      paymentType: scheduleItem.paymentType,
      bankName,
      cardName: displayName,
      scheduleItem,
      ...(scheduleItem.storeName && { storeName: scheduleItem.storeName })
    };
    
    group.items.push(item);
  });
  
  return Array.from(bankGroups.values()).sort((a, b) => a.bankName.localeCompare(b.bankName));
}

export function DayTotalModal({
  isOpen,
  onClose,
  onTransactionClick,
  selectedDate,
  dayTotalData,
  banks,
  cards,
  className
}: DayTotalModalProps) {
  if (!isOpen) return null;
  
  // 銀行別グループ化
  const bankGroups = groupByBank(
    dayTotalData.transactions,
    dayTotalData.scheduleItems,
    banks,
    cards
  );
  
  const handleItemClick = (item: DayTransactionItem) => {
    if (item.transaction) {
      onTransactionClick(item.transaction);
    }
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden',
        className
      )}>
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {formatJapaneseDate(selectedDate)}
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                {dayTotalData.hasTransactions && (
                  <p>
                    取引合計: <span className="font-bold text-green-600">{formatAmount(dayTotalData.transactionTotal)}</span>
                  </p>
                )}
                {dayTotalData.hasSchedule && (
                  <p>
                    引落予定合計: <span className="font-bold text-blue-600">{formatAmount(dayTotalData.scheduleTotal)}</span>
                  </p>
                )}
                {dayTotalData.hasTransactions && dayTotalData.hasSchedule && (
                  <p>
                    総合計: <span className="font-bold text-gray-900">{formatAmount(dayTotalData.totalAmount)}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* コンテンツ */}
        <div className="overflow-y-auto max-h-[60vh]">
          {(!dayTotalData.hasTransactions && !dayTotalData.hasSchedule) ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">この日にはデータがありません</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* 取引データセクション */}
              {dayTotalData.hasTransactions && (
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      取引データ ({dayTotalData.transactionCount}件)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      実際に行った支払い取引: <span className="font-bold text-green-600">{formatAmount(dayTotalData.transactionTotal)}</span>
                    </p>
                  </div>
                  {bankGroups.filter(group => group.items.some(item => item.type === 'transaction')).map(bankGroup => (
                    <div
                      key={`transaction-${bankGroup.bankId}`}
                      className="bg-white border border-green-200 rounded-lg overflow-hidden"
                    >
                      {/* 銀行セクションヘッダー */}
                      <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {bankGroup.bankName}
                          </h4>
                          <span className="font-bold text-gray-900">
                            {formatAmount(bankGroup.items.filter(item => item.type === 'transaction').reduce((sum, item) => sum + item.amount, 0))}
                          </span>
                        </div>
                      </div>
                      
                      {/* 取引項目一覧 */}
                      <div className="divide-y divide-gray-100">
                        {bankGroup.items.filter(item => item.type === 'transaction').map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {item.cardName}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  取引
                                </span>
                              </div>
                              {item.storeName && (
                                <p className="text-sm text-gray-600 truncate">
                                  {item.storeName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">
                                {formatAmount(item.amount)}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 引落予定データセクション */}
              {dayTotalData.hasSchedule && (
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-2">
                      引落予定 ({dayTotalData.scheduleCount}件)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      予定されている引落し: <span className="font-bold text-blue-600">{formatAmount(dayTotalData.scheduleTotal)}</span>
                    </p>
                  </div>
                  {bankGroups.filter(group => group.items.some(item => item.type === 'schedule')).map(bankGroup => (
                    <div
                      key={`schedule-${bankGroup.bankId}`}
                      className="bg-white border border-blue-200 rounded-lg overflow-hidden"
                    >
                      {/* 銀行セクションヘッダー */}
                      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {bankGroup.bankName}
                          </h4>
                          <span className="font-bold text-gray-900">
                            {formatAmount(bankGroup.items.filter(item => item.type === 'schedule').reduce((sum, item) => sum + item.amount, 0))}
                          </span>
                        </div>
                      </div>
                      
                      {/* 引落予定項目一覧 */}
                      <div className="divide-y divide-gray-100">
                        {bankGroup.items.filter(item => item.type === 'schedule').map(item => (
                          <div
                            key={item.id}
                            className="px-4 py-3 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {item.cardName}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  予定
                                </span>
                              </div>
                              {item.storeName && (
                                <p className="text-sm text-gray-600 truncate">
                                  {item.storeName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">
                                {formatAmount(item.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}