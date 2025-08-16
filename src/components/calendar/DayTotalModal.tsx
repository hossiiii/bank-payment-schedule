'use client';

import React from 'react';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { Transaction, ScheduleItem, Bank, Card } from '@/types/database';
import { DayTotalData, BankGroup, DayTransactionItem } from '@/types/calendar';
import { BaseModal, BaseModalFooter } from './BaseModal';

export interface DayTotalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick: (transaction: Transaction) => void;
  onScheduleClick: (scheduleItem: ScheduleItem) => void;
  onViewTransactions: (transactions: Transaction[]) => void;
  onViewSchedules: (scheduleItems: ScheduleItem[]) => void;
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
  onScheduleClick,
  onViewTransactions,
  onViewSchedules,
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
    } else if (item.scheduleItem) {
      onScheduleClick(item.scheduleItem);
    }
  };
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={formatJapaneseDate(selectedDate)}
      size="lg"
      className={className || undefined}
      headerClassName="bg-gray-50 border-gray-200"
      bodyClassName="max-h-[70vh]"
      footerChildren={
        <BaseModalFooter 
          onClose={onClose}
        />
      }
    >
      <div className="p-6 space-y-6">
        {/* 日付サマリー */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                日別データサマリー
              </h3>
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
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatAmount(dayTotalData.transactionTotal + dayTotalData.scheduleTotal)}
              </div>
              <div className="text-sm text-gray-600">
                {dayTotalData.transactionCount + dayTotalData.scheduleCount}件
              </div>
            </div>
          </div>
        </div>
        {(!dayTotalData.hasTransactions && !dayTotalData.hasSchedule) ? (
          <div className="text-center py-8">
            <p className="text-gray-500">この日にはデータがありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 取引データセクション */}
            {dayTotalData.hasTransactions && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-green-700 mb-1">
                      取引データ ({dayTotalData.transactionCount}件)
                    </h3>
                    <p className="text-sm text-gray-600">
                      実際に行った支払い取引: <span className="font-bold text-green-600">{formatAmount(dayTotalData.transactionTotal)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onViewTransactions(dayTotalData.transactions)}
                    className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    詳細表示
                  </button>
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
                <div className="flex items-center justify-between">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-1">
                      引落予定 ({dayTotalData.scheduleCount}件)
                    </h3>
                    <p className="text-sm text-gray-600">
                      予定されている引落し: <span className="font-bold text-blue-600">{formatAmount(dayTotalData.scheduleTotal)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onViewSchedules(dayTotalData.scheduleItems)}
                    className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    詳細表示
                  </button>
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
                            onClick={() => handleItemClick(item)}
                            className="px-4 py-3 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors group"
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
                                  店舗: {item.storeName}
                                </p>
                              )}
                              {item.scheduleItem?.usage && (
                                <p className="text-sm text-gray-600 truncate">
                                  用途: {item.scheduleItem.usage}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">
                                {formatAmount(item.amount)}
                              </span>
                              <svg 
                                className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}

            {/* 操作ガイド */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">操作ガイド:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>「詳細表示」ボタンで各カテゴリの詳細画面を開けます</li>
                    <li>個別項目をクリックすると編集ができます</li>
                    <li>取引データは緑色、引落予定は青色で区分されています</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}