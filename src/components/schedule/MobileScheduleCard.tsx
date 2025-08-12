'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  PaymentSummary, 
  TransactionDetailModalData, 
  MobileScheduleCardProps 
} from '@/types/schedule';
import { formatAmount, getAmountForBank } from '@/lib/utils/scheduleUtils';

export function MobileScheduleCard({
  scheduleData,
  onTransactionClick,
  className
}: MobileScheduleCardProps) {
  
  // Handle click on bank payment
  const handleBankPaymentClick = (payment: PaymentSummary, bankId: string, bankName: string) => {
    const bankPayment = payment.bankPayments.find(bp => bp.bankId === bankId);
    if (!bankPayment || bankPayment.amount === 0) return;

    const modalData: TransactionDetailModalData = {
      paymentDate: payment.date,
      paymentName: payment.paymentName,
      bankName: bankName,
      transactions: payment.transactions
        .filter(tx => {
          if (tx.paymentType === 'card' && tx.cardId) {
            return true; // Simplified for now
          } else if (tx.paymentType === 'bank') {
            return tx.bankId === bankId;
          }
          return false;
        })
        .map(tx => ({
          id: tx.id,
          date: new Date(tx.date).toLocaleDateString('ja-JP'),
          ...(tx.storeName && { storeName: tx.storeName }),
          ...(tx.usage && { usage: tx.usage }),
          amount: tx.amount,
          paymentType: tx.paymentType,
          ...(tx.paymentType === 'card' && { cardName: payment.paymentName })
        })),
      totalAmount: bankPayment.amount
    };

    onTransactionClick(modalData);
  };

  // Handle click on total amount
  const handleTotalClick = (payment: PaymentSummary) => {
    const modalData: TransactionDetailModalData = {
      paymentDate: payment.date,
      paymentName: payment.paymentName,
      bankName: '全銀行',
      transactions: payment.transactions.map(tx => ({
        id: tx.id,
        date: new Date(tx.date).toLocaleDateString('ja-JP'),
        ...(tx.storeName && { storeName: tx.storeName }),
        ...(tx.usage && { usage: tx.usage }),
        amount: tx.amount,
        paymentType: tx.paymentType,
        ...(tx.paymentType === 'card' && { cardName: payment.paymentName })
      })),
      totalAmount: payment.totalAmount
    };

    onTransactionClick(modalData);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {scheduleData.month} 引落予定表
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xl font-bold text-blue-700">
                {scheduleData.uniqueBanks.length}
              </div>
              <div className="text-blue-600">銀行</div>
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-700">
                {scheduleData.payments.length}
              </div>
              <div className="text-indigo-600">引落日</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-700">
                {formatAmount(scheduleData.monthTotal)}
              </div>
              <div className="text-purple-600">合計</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Cards */}
      {scheduleData.payments.length > 0 ? (
        <div className="space-y-3">
          {scheduleData.payments.map((payment, index) => (
            <PaymentCard
              key={`${payment.date}-${index}`}
              payment={payment}
              banks={scheduleData.uniqueBanks}
              onBankPaymentClick={handleBankPaymentClick}
              onTotalClick={handleTotalClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            引落予定がありません
          </h3>
          <p className="text-sm text-gray-500">
            この月には支払い予定の取引がありません。
          </p>
        </div>
      )}

      {/* Bank Totals Summary */}
      {scheduleData.uniqueBanks.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">銀行別合計</h3>
          <div className="space-y-2">
            {scheduleData.uniqueBanks.map(bank => {
              const total = scheduleData.bankTotals.get(bank.id) || 0;
              return (
                <div key={bank.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{bank.name}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatAmount(total)}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">合計</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatAmount(scheduleData.monthTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PaymentCardProps {
  payment: PaymentSummary;
  banks: any[];
  onBankPaymentClick: (payment: PaymentSummary, bankId: string, bankName: string) => void;
  onTotalClick: (payment: PaymentSummary) => void;
}

function PaymentCard({ payment, banks, onBankPaymentClick, onTotalClick }: PaymentCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {payment.date.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, '$1/$2/$3')}
              </h3>
              <span className={cn(
                'inline-block w-6 h-6 rounded-full text-center text-xs font-medium leading-6',
                payment.dayOfWeek === '土' ? 'bg-blue-100 text-blue-700' :
                payment.dayOfWeek === '日' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              )}>
                {payment.dayOfWeek}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-gray-700">{payment.paymentName}</span>
              {payment.paymentName !== '銀行引落' && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  カード
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onTotalClick(payment)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {formatAmount(payment.totalAmount)}
          </button>
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
          {payment.closingDay && (
            <div>
              <span className="font-medium">締日:</span> {payment.closingDay}
            </div>
          )}
          <div>
            <span className="font-medium">引落日:</span> {payment.paymentDay}
          </div>
        </div>

        {/* Bank Payments */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">銀行別金額</h4>
          <div className="space-y-1">
            {banks.map(bank => {
              const amount = getAmountForBank(payment.bankPayments, bank.id);
              const hasAmount = amount > 0;
              
              return (
                <div
                  key={bank.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded',
                    hasAmount 
                      ? 'bg-gray-50 cursor-pointer hover:bg-blue-50 transition-colors' 
                      : 'bg-gray-25 opacity-50'
                  )}
                  onClick={hasAmount ? () => onBankPaymentClick(payment, bank.id, bank.name) : undefined}
                >
                  <span className="text-sm text-gray-700">{bank.name}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    hasAmount ? 'text-gray-900' : 'text-gray-400'
                  )}>
                    {hasAmount ? formatAmount(amount) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Preview */}
        {payment.transactions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium">取引数:</span> {payment.transactions.length}件
              {payment.transactions.length > 0 && (
                <span className="ml-2">
                  <span className="font-medium">店舗例:</span> {payment.transactions[0]?.storeName || '未設定'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileScheduleCard;