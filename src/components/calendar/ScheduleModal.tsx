'use client';

import React from 'react';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { ScheduleItem, Bank, Card } from '@/types/database';
import { BaseModal, BaseModalFooter } from './BaseModal';

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  scheduleItems: ScheduleItem[];
  banks: Bank[];
  cards: Card[];
  className?: string;
}

/**
 * 銀行別グループ化された引落予定データ
 */
interface ScheduleBankGroup {
  bankId: string;
  bankName: string;
  totalAmount: number;
  scheduleCount: number;
  items: {
    id: string;
    amount: number;
    paymentType: 'card' | 'bank';
    bankName: string;
    cardName: string;
    storeName?: string;
    usage?: string;
    scheduleItem: ScheduleItem;
  }[];
}

/**
 * 引落予定データの銀行別グループ化
 */
function groupSchedulesByBank(
  scheduleItems: ScheduleItem[],
  banks: Bank[],
  cards: Card[]
): ScheduleBankGroup[] {
  const bankMap = new Map<string, Bank>();
  const cardMap = new Map<string, Card>();
  
  banks.forEach(bank => bankMap.set(bank.id, bank));
  cards.forEach(card => cardMap.set(card.id, card));
  
  const bankGroups = new Map<string, ScheduleBankGroup>();
  
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
      displayName = '自動引き落とし';
    } else {
      return;
    }
    
    if (!bankGroups.has(bankId)) {
      bankGroups.set(bankId, {
        bankId,
        bankName,
        totalAmount: 0,
        scheduleCount: 0,
        items: []
      });
    }
    
    const group = bankGroups.get(bankId)!;
    group.totalAmount += scheduleItem.amount;
    group.scheduleCount++;
    
    group.items.push({
      id: scheduleItem.transactionId,
      amount: scheduleItem.amount,
      paymentType: scheduleItem.paymentType,
      bankName,
      cardName: displayName,
      ...(scheduleItem.storeName && { storeName: scheduleItem.storeName }),
      ...(scheduleItem.usage && { usage: scheduleItem.usage }),
      scheduleItem
    });
  });
  
  return Array.from(bankGroups.values()).sort((a, b) => a.bankName.localeCompare(b.bankName));
}

/**
 * ScheduleModal - 引落予定専用モーダル
 * 
 * 特徴:
 * - 青色テーマ
 * - 表示のみ（編集不可）
 * - 銀行別グループ化表示
 * - 店舗情報表示
 */
export function ScheduleModal({
  isOpen,
  onClose,
  selectedDate,
  scheduleItems,
  banks,
  cards,
  className
}: ScheduleModalProps) {
  if (!isOpen || scheduleItems.length === 0) return null;

  // 引落予定データを銀行別にグループ化
  const bankGroups = groupSchedulesByBank(scheduleItems, banks, cards);
  
  // 総合計算
  const totalAmount = scheduleItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = scheduleItems.length;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`引落予定 - ${formatJapaneseDate(selectedDate)}`}
      size="lg"
      className={className || undefined}
      headerClassName="bg-blue-50 border-blue-200"
      bodyClassName="max-h-[60vh]"
      footerChildren={
        <BaseModalFooter 
          onClose={onClose}
        />
      }
    >
      <div className="p-6 space-y-6">
        {/* 引落予定サマリー */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-1">
                引落予定
              </h3>
              <p className="text-sm text-blue-700">
                予定されている引落し
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-800">
                {formatAmount(totalAmount)}
              </div>
              <div className="text-sm text-blue-600">
                {totalCount}件の予定
              </div>
            </div>
          </div>
        </div>

        {/* データがない場合 */}
        {bankGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">この日の引落予定はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 銀行別グループ表示 */}
            {bankGroups.map(bankGroup => (
              <div
                key={bankGroup.bankId}
                className="bg-white border border-blue-200 rounded-lg overflow-hidden shadow-sm"
              >
                {/* 銀行セクションヘッダー */}
                <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-900">
                      {bankGroup.bankName}
                    </h4>
                    <div className="text-right">
                      <div className="font-bold text-blue-900">
                        {formatAmount(bankGroup.totalAmount)}
                      </div>
                      <div className="text-sm text-blue-700">
                        {bankGroup.scheduleCount}件
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 引落予定項目一覧 */}
                <div className="divide-y divide-blue-100">
                  {bankGroup.items.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between bg-white hover:bg-blue-25 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {item.cardName}
                              </span>
                              {item.storeName && (
                                <span className="text-gray-600 text-sm">
                                  • {item.storeName}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                予定
                              </span>
                            </div>
                            
                            {/* 店舗情報と用途を表示 */}
                            <div className="space-y-1">
                              {item.storeName && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">店舗:</span> {item.storeName}
                                </p>
                              )}
                              {item.usage && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">用途:</span> {item.usage}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-900">
                          {formatAmount(item.amount)}
                        </span>
                        {/* 表示のみなので編集アイコンは不要 */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 情報ガイド */}
        {bankGroups.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">引落予定について:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>これらは取引に基づいて自動計算された引落予定です</li>
                  <li>実際の引落日は銀行の営業日により前後する場合があります</li>
                  <li>店舗情報と用途が登録されている場合に表示されます</li>
                  <li>引落予定は表示のみで、直接編集はできません</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}