'use client';

import React from 'react';
import { formatAmount } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { Transaction, Bank, Card } from '@/types/database';
import { BaseModal, BaseModalFooter } from './BaseModal';

export interface TransactionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionClick: (transaction: Transaction) => void;
  selectedDate: Date;
  transactions: Transaction[];
  banks: Bank[];
  cards: Card[];
  className?: string;
}

/**
 * 銀行別グループ化された取引データ
 */
interface TransactionBankGroup {
  bankId: string;
  bankName: string;
  totalAmount: number;
  transactionCount: number;
  items: {
    id: string;
    amount: number;
    paymentType: 'card' | 'bank';
    bankName: string;
    cardName: string;
    storeName?: string;
    transaction: Transaction;
  }[];
}

/**
 * 取引データの銀行別グループ化
 */
function groupTransactionsByBank(
  transactions: Transaction[],
  banks: Bank[],
  cards: Card[]
): TransactionBankGroup[] {
  const bankMap = new Map<string, Bank>();
  const cardMap = new Map<string, Card>();
  
  banks.forEach(bank => bankMap.set(bank.id, bank));
  cards.forEach(card => cardMap.set(card.id, card));
  
  const bankGroups = new Map<string, TransactionBankGroup>();
  
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
      displayName = card.name;
    } else if (transaction.paymentType === 'bank' && transaction.bankId) {
      bankId = transaction.bankId;
      const bank = bankMap.get(bankId);
      if (!bank) return;
      
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
        transactionCount: 0,
        items: []
      });
    }
    
    const group = bankGroups.get(bankId)!;
    group.totalAmount += transaction.amount;
    group.transactionCount++;
    
    group.items.push({
      id: transaction.id,
      amount: transaction.amount,
      paymentType: transaction.paymentType,
      bankName,
      cardName: displayName,
      ...(transaction.storeName && { storeName: transaction.storeName }),
      transaction
    });
  });
  
  return Array.from(bankGroups.values()).sort((a, b) => a.bankName.localeCompare(b.bankName));
}

/**
 * TransactionViewModal - 取引専用モーダル
 * 
 * 特徴:
 * - 緑色テーマ
 * - 編集可能（取引クリックで編集モーダル表示）
 * - 銀行別グループ化表示
 * - 店舗情報表示
 */
export function TransactionViewModal({
  isOpen,
  onClose,
  onTransactionClick,
  selectedDate,
  transactions,
  banks,
  cards,
  className
}: TransactionViewModalProps) {
  if (!isOpen || transactions.length === 0) return null;

  // 取引データを銀行別にグループ化
  const bankGroups = groupTransactionsByBank(transactions, banks, cards);
  
  // 総合計算
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalCount = transactions.length;

  const handleTransactionClick = (transaction: Transaction) => {
    onTransactionClick(transaction);
    // モーダルは開いたままにして、編集モーダルを上に表示
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`取引データ - ${formatJapaneseDate(selectedDate)}`}
      size="lg"
      className={className || undefined}
      headerClassName="bg-green-50 border-green-200"
      bodyClassName="max-h-[60vh]"
      footerChildren={
        <BaseModalFooter 
          onClose={onClose}
        />
      }
    >
      <div className="p-6 space-y-6">
        {/* 取引サマリー */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                取引データ
              </h3>
              <p className="text-sm text-green-700">
                実際に行った支払い取引
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-800">
                {formatAmount(totalAmount)}
              </div>
              <div className="text-sm text-green-600">
                {totalCount}件の取引
              </div>
            </div>
          </div>
        </div>

        {/* データがない場合 */}
        {bankGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">この日の取引データはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 銀行別グループ表示 */}
            {bankGroups.map(bankGroup => (
              <div
                key={bankGroup.bankId}
                className="bg-white border border-green-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 銀行セクションヘッダー */}
                <div className="px-4 py-3 bg-green-100 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-green-900">
                      {bankGroup.bankName}
                    </h4>
                    <div className="text-right">
                      <div className="font-bold text-green-900">
                        {formatAmount(bankGroup.totalAmount)}
                      </div>
                      <div className="text-sm text-green-700">
                        {bankGroup.transactionCount}件
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 取引項目一覧 */}
                <div className="divide-y divide-green-100">
                  {bankGroup.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleTransactionClick(item.transaction)}
                      className="px-4 py-3 flex items-center justify-between hover:bg-green-50 cursor-pointer transition-colors group"
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
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                取引
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
                          className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" 
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
                  <li>取引項目をクリックすると詳細編集ができます</li>
                  <li>店舗情報がある場合は項目に表示されます</li>
                  <li>編集モードでは取引の詳細を変更できます</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}