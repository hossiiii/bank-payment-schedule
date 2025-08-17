'use client';

import React from 'react';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { ScheduleItem, Bank, Card } from '@/types/database';
import { BaseModal, BaseModalFooter } from './BaseModal';
import { logDebug, logWarn } from '@/lib/utils/logger';

export interface ScheduleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick: (transactionId: string) => void;
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
    
    // デバッグ情報を出力（開発環境のみ）
    logDebug('Processing scheduleItem', {
      transactionId: scheduleItem.transactionId,
      paymentType: scheduleItem.paymentType,
      cardId: scheduleItem.cardId,
      cardName: scheduleItem.cardName,
      bankName: scheduleItem.bankName
    }, 'ScheduleViewModal');
    
    if (scheduleItem.paymentType === 'card' && scheduleItem.cardId) {
      // カードID でカードを検索
      const card = cardMap.get(scheduleItem.cardId);
      logDebug('Card search result', {
        cardId: scheduleItem.cardId,
        cardFound: !!card,
        availableCardIds: Array.from(cardMap.keys()),
        cardMapSize: cardMap.size
      }, 'ScheduleViewModal');
      
      if (!card) {
        // カードが見つからない場合、カード名での検索を試行
        const cardByName = cards.find(c => c.name === scheduleItem.cardName);
        logDebug('Fallback card search by name', {
          cardName: scheduleItem.cardName,
          cardFoundByName: !!cardByName,
          availableCardNames: cards.map(c => c.name)
        }, 'ScheduleViewModal');
        
        if (!cardByName) {
          logWarn('Card not found by ID or name for scheduleItem', scheduleItem.transactionId, 'ScheduleViewModal');
          return;
        }
        
        // カード名で見つかった場合はそれを使用
        bankId = cardByName.bankId;
        const bank = bankMap.get(bankId);
        if (!bank) {
          logWarn('Bank not found for card', cardByName.name, 'ScheduleViewModal');
          return;
        }
        
        bankName = bank.name;
        displayName = scheduleItem.cardName || cardByName.name;
      } else {
        bankId = card.bankId;
        const bank = bankMap.get(bankId);
        if (!bank) {
          logWarn('Bank not found for card', card.name, 'ScheduleViewModal');
          return;
        }
        
        bankName = bank.name;
        displayName = scheduleItem.cardName || card.name;
      }
    } else if (scheduleItem.paymentType === 'bank') {
      // 銀行名から銀行を特定（完全一致と部分一致両方を試行）
      let bank = banks.find(b => b.name === scheduleItem.bankName);
      
      if (!bank) {
        // 部分一致での検索を試行
        bank = banks.find(b => 
          b.name.includes(scheduleItem.bankName) || 
          scheduleItem.bankName.includes(b.name)
        );
      }
      
      logDebug('Bank search result', {
        bankName: scheduleItem.bankName,
        bankFound: !!bank,
        availableBankNames: banks.map(b => b.name)
      }, 'ScheduleViewModal');
      
      if (!bank) {
        logWarn('Bank not found for scheduleItem', scheduleItem.transactionId, 'ScheduleViewModal');
        return;
      }
      
      bankId = bank.id;
      bankName = bank.name;
      displayName = '自動銀行振替';
    } else {
      logWarn('Unknown payment type for scheduleItem', scheduleItem.transactionId, 'ScheduleViewModal');
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
 * ScheduleViewModal - 引落予定専用モーダル
 * 
 * 特徴:
 * - 青色テーマ
 * - 編集可能（引落予定クリックで編集モーダル表示）
 * - 銀行別グループ化表示
 * - 店舗情報、用途、メモ表示
 */
export function ScheduleViewModal({
  isOpen,
  onClose,
  onTransactionClick,
  selectedDate,
  scheduleItems,
  banks,
  cards,
  className
}: ScheduleViewModalProps) {
  if (!isOpen) return null;

  // 引落予定データを銀行別にグループ化
  const bankGroups = groupSchedulesByBank(scheduleItems, banks, cards);
  
  // 詳細デバッグログ（開発環境のみ）
  logDebug('ScheduleViewModal Debug', {
    scheduleItemsCount: scheduleItems.length,
    bankGroupsCount: bankGroups.length,
    scheduleItems: scheduleItems.map(item => ({
      id: item.transactionId,
      paymentType: item.paymentType,
      cardId: item.cardId,
      cardIdType: typeof item.cardId,
      cardName: item.cardName,
      bankName: item.bankName,
      amount: item.amount
    })),
    banks: banks.map(bank => ({ id: bank.id, idType: typeof bank.id, name: bank.name })),
    cards: cards.map(card => ({ id: card.id, idType: typeof card.id, name: card.name, bankId: card.bankId })),
    banksCount: banks.length,
    cardsCount: cards.length
  }, 'ScheduleViewModal');
  
  // 総合計算
  const totalAmount = scheduleItems.reduce((sum, scheduleItem) => sum + scheduleItem.amount, 0);
  const totalCount = scheduleItems.length;

  const handleScheduleClick = (scheduleItem: ScheduleItem) => {
    // 引落予定の編集アイコンをクリックした時は、元の取引データを編集する
    onTransactionClick(scheduleItem.transactionId);
    // モーダルは開いたままにして、TransactionModalを上に表示
  };

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
        {scheduleItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">この日の引落予定はありません</p>
          </div>
        ) : bankGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">引落予定データに不整合があります</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">データの詳細:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {scheduleItems.map((item, index) => (
                  <li key={index}>
                    {item.paymentType === 'card' ? `カード: ${item.cardName || item.cardId}` : `銀行: ${item.bankName}`} - {item.amount.toLocaleString()}円
                  </li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mt-2">
                ※ カードまたは銀行の設定データに問題がある可能性があります
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 銀行別グループ表示 */}
            {bankGroups.map(bankGroup => (
              <div
                key={bankGroup.bankId}
                className="bg-white border border-blue-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                      onClick={() => handleScheduleClick(item.scheduleItem)}
                      className="px-4 py-3 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
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
        {bankGroups.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">操作ガイド:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>引落予定項目をクリックすると元の取引データが編集できます</li>
                  <li>店舗情報、用途がある場合は項目に表示されます</li>
                  <li>編集により引落予定の金額や詳細を変更できます</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}