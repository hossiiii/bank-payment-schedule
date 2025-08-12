'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  TransactionDetailModalData, 
  PaymentRowProps 
} from '@/types/schedule';
import { formatAmount, getAmountForBank } from '@/lib/utils/scheduleUtils';

export function PaymentRow({
  payment,
  banks,
  onAmountClick,
  className
}: PaymentRowProps) {
  
  // Handle click on amount cell
  const handleAmountClick = (bankId: string, bankName: string) => {
    const bankPayment = payment.bankPayments.find(bp => bp.bankId === bankId);
    if (!bankPayment || bankPayment.amount === 0) return;

    // Create modal data for the clicked bank/date combination
    const modalData: TransactionDetailModalData = {
      paymentDate: payment.date,
      paymentName: payment.paymentName,
      bankName: bankName,
      transactions: payment.transactions
        .filter(tx => {
          // Filter transactions for this specific bank
          if (tx.paymentType === 'card' && tx.cardId) {
            // For card transactions, find the associated bank through the card
            // This would need to be enhanced with actual card lookup
            return true; // Simplified for now
          } else if (tx.paymentType === 'bank') {
            return tx.bankId === bankId;
          }
          return false;
        })
        .map(tx => ({
          id: tx.id,
          date: new Date(tx.date).toLocaleDateString('ja-JP'),
          storeName: tx.storeName || '',
          usage: tx.usage || '',
          amount: tx.amount,
          paymentType: tx.paymentType,
          cardName: tx.paymentType === 'card' ? (payment.paymentName || '') : ''
        })),
      totalAmount: bankPayment.amount
    };

    onAmountClick(modalData);
  };

  // Handle click on total amount
  const handleTotalAmountClick = () => {
    const modalData: TransactionDetailModalData = {
      paymentDate: payment.date,
      paymentName: payment.paymentName,
      bankName: '全銀行',
      transactions: payment.transactions.map(tx => ({
        id: tx.id,
        date: new Date(tx.date).toLocaleDateString('ja-JP'),
        storeName: tx.storeName || '',
        usage: tx.usage || '',
        amount: tx.amount,
        paymentType: tx.paymentType,
        cardName: tx.paymentType === 'card' ? (payment.paymentName || '') : ''
      })),
      totalAmount: payment.totalAmount
    };

    onAmountClick(modalData);
  };

  return (
    <tr className={cn('hover:bg-gray-50 transition-colors', className)}>
      {/* 引落予定日 */}
      <td className="border border-gray-200 p-3 text-sm text-gray-900">
        <div className="font-medium">
          {payment.date.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, '$1/$2/$3')}
        </div>
      </td>

      {/* 曜日 */}
      <td className="border border-gray-200 p-3 text-sm text-gray-700">
        <span className={cn(
          'inline-block w-6 h-6 rounded-full text-center text-xs font-medium leading-6',
          payment.dayOfWeek === '土' ? 'bg-blue-100 text-blue-700' :
          payment.dayOfWeek === '日' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        )}>
          {payment.dayOfWeek}
        </span>
      </td>

      {/* 引落名 */}
      <td className="border border-gray-200 p-3 text-sm text-gray-900">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{payment.paymentName}</span>
          {payment.paymentName !== '銀行引落' && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              カード
            </span>
          )}
        </div>
      </td>

      {/* 締日 */}
      <td className="border border-gray-200 p-3 text-sm text-gray-700">
        {payment.closingDay || '-'}
      </td>

      {/* 引落日 */}
      <td className="border border-gray-200 p-3 text-sm text-gray-700">
        {payment.paymentDay}
      </td>

      {/* 銀行別金額カラム（動的生成） */}
      {banks.map(bank => {
        const amount = getAmountForBank(payment.bankPayments, bank.id);
        const hasAmount = amount > 0;
        
        return (
          <td 
            key={bank.id}
            className={cn(
              'border border-gray-200 p-3 text-center text-sm',
              hasAmount ? 'cursor-pointer hover:bg-blue-50' : ''
            )}
            onClick={hasAmount ? () => handleAmountClick(bank.id, bank.name) : undefined}
            title={hasAmount ? `${bank.name}の取引明細を表示` : undefined}
          >
            {hasAmount ? (
              <span className={cn(
                'inline-block px-2 py-1 rounded font-medium transition-colors',
                'text-gray-900 hover:bg-blue-100 hover:text-blue-800'
              )}>
                {formatAmount(amount)}
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
        );
      })}

      {/* 引落合計 */}
      <td 
        className="border border-gray-200 p-3 text-center text-sm font-semibold cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={handleTotalAmountClick}
        title="全取引明細を表示"
      >
        <span className="inline-block px-2 py-1 rounded text-gray-900 hover:bg-blue-100 hover:text-blue-800 transition-colors">
          {formatAmount(payment.totalAmount)}
        </span>
      </td>
    </tr>
  );
}

export default PaymentRow;