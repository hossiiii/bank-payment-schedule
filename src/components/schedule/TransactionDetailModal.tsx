'use client';

import React from 'react';
import { 
  TransactionDetailModalData, 
  TransactionDetailModalProps 
} from '@/types/schedule';
import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { formatAmount } from '@/lib/utils/scheduleUtils';
import { cn } from '@/lib/utils';

export function TransactionDetailModal({
  data,
  isOpen,
  onClose
}: TransactionDetailModalProps) {
  if (!data) return null;

  const { paymentDate, paymentName, bankName, transactions, totalAmount } = data;

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`取引明細 - ${paymentName}`}
      className="max-w-4xl"
    >
      {/* Header Information */}
      <ModalHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 font-medium">引落予定日</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDisplayDate(paymentDate)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">引落先</div>
            <div className="text-lg font-semibold text-gray-900">{bankName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 font-medium">合計金額</div>
            <div className="text-xl font-bold text-blue-600">
              {formatAmount(totalAmount)}
            </div>
          </div>
        </div>
      </ModalHeader>

      {/* Transaction List */}
      <ModalBody className="p-0">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">
                    取引日
                  </th>
                  <th className="border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">
                    店舗名
                  </th>
                  <th className="border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">
                    用途
                  </th>
                  <th className="border-b border-gray-200 p-4 text-left text-sm font-semibold text-gray-700">
                    支払方法
                  </th>
                  <th className="border-b border-gray-200 p-4 text-right text-sm font-semibold text-gray-700">
                    金額
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr 
                    key={transaction.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    <td className="p-4 text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="p-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <span>{transaction.storeName || '-'}</span>
                        {transaction.storeName && (
                          <svg 
                            className="ml-2 w-4 h-4 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                            />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {transaction.usage ? (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {transaction.usage}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'inline-block px-2 py-1 text-xs font-medium rounded-full',
                          transaction.paymentType === 'card' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        )}>
                          {transaction.paymentType === 'card' ? 'カード' : '銀行引落'}
                        </span>
                        {transaction.cardName && (
                          <span className="text-xs text-gray-500">
                            {transaction.cardName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-right font-semibold text-gray-900">
                      {formatAmount(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td 
                    colSpan={4} 
                    className="p-4 text-right text-sm font-semibold text-gray-900"
                  >
                    合計
                  </td>
                  <td className="p-4 text-right text-lg font-bold text-blue-600">
                    {formatAmount(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              取引データがありません
            </h3>
            <p className="text-sm text-gray-500">
              この日付・銀行の組み合わせには取引がありません。
            </p>
          </div>
        )}
      </ModalBody>

      {/* Footer with summary and actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            取引件数: <span className="font-semibold">{transactions.length}</span>件
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                // Export functionality could be added here
                const csvData = transactions.map(tx => 
                  `${tx.date},${tx.storeName || ''},${tx.usage || ''},${tx.paymentType},${tx.amount}`
                ).join('\n');
                const csv = '取引日,店舗名,用途,支払方法,金額\n' + csvData;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `取引明細_${paymentDate}_${bankName}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV出力
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default TransactionDetailModal;