'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input 
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { 
  Transaction, 
  TransactionInput, 
  Bank, 
  Card 
} from '@/types/database';
import {
  validateAmount,
  validateStoreName,
  validateUsage
} from '@/lib/utils/validation';
import { formatJapaneseDate, formatDateISO } from '@/lib/utils/dateUtils';
import { calculateCardPaymentDate } from '@/lib/utils/paymentCalc';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: TransactionInput) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
  selectedDate: Date;
  transaction?: Transaction;
  banks: Bank[];
  cards: Card[];
  isLoading?: boolean;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  transaction,
  banks,
  cards,
  isLoading = false
}: TransactionModalProps) {
  // Form state
  const [formData, setFormData] = useState<{
    storeName: string;
    usage: string;
    amount: string;
    paymentType: 'card' | 'bank';
    cardId: string;
    bankId: string;
    scheduledPayDate: string;
    isScheduleEditable: boolean;
    memo: string;
  }>({
    storeName: '',
    usage: '',
    amount: '',
    paymentType: 'card',
    cardId: '',
    bankId: '',
    scheduledPayDate: '',
    isScheduleEditable: false,
    memo: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize form data when modal opens or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Editing existing transaction
        setFormData({
          storeName: transaction.storeName || '',
          usage: transaction.usage || '',
          amount: transaction.amount.toString(),
          paymentType: transaction.paymentType || 'card',
          cardId: transaction.cardId || '',
          bankId: transaction.bankId || '',
          scheduledPayDate: formatDateISO(new Date(transaction.scheduledPayDate)),
          isScheduleEditable: transaction.isScheduleEditable || false,
          memo: transaction.memo || ''
        });
      } else {
        // Creating new transaction
        const defaultPaymentType = cards.length > 0 ? 'card' : 'bank';
        setFormData({
          storeName: '',
          usage: '',
          amount: '',
          paymentType: defaultPaymentType,
          cardId: cards.length === 1 ? cards[0]?.id ?? '' : '',
          bankId: banks.length === 1 ? banks[0]?.id ?? '' : '',
          scheduledPayDate: formatDateISO(selectedDate),
          isScheduleEditable: defaultPaymentType === 'bank',
          memo: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction, cards, banks, selectedDate]);

  // Get filtered cards based on selected bank (if any)
  const availableCards = cards.filter(card => 
    banks.some(bank => bank.id === card.bankId)
  );

  // Get selected card details
  const selectedCard = availableCards.find(card => card.id === formData.cardId);
  const selectedBank = formData.paymentType === 'bank' 
    ? banks.find(bank => bank.id === formData.bankId)
    : selectedCard ? banks.find(bank => bank.id === selectedCard.bankId) : null;

  // Calculate scheduled payment date based on payment type
  useEffect(() => {
    if (!isOpen || formData.isScheduleEditable) return;

    if (formData.paymentType === 'card' && formData.cardId) {
      const card = cards.find(c => c.id === formData.cardId);
      if (card) {
        const result = calculateCardPaymentDate(selectedDate, card);
        setFormData(prev => ({
          ...prev,
          scheduledPayDate: formatDateISO(result.scheduledPayDate)
        }));
      }
    } else if (formData.paymentType === 'bank') {
      // For bank payments, use the selected date directly (no automatic adjustment)
      setFormData(prev => ({
        ...prev,
        scheduledPayDate: formatDateISO(selectedDate)
      }));
    }
  }, [formData.paymentType, formData.cardId, selectedDate, cards, isOpen, formData.isScheduleEditable]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.errors[0] ?? 'Invalid amount';
    }

    // Validate store name
    const storeValidation = validateStoreName(formData.storeName);
    if (!storeValidation.isValid) {
      newErrors.storeName = storeValidation.errors[0] ?? 'Invalid store name';
    }

    // Validate usage
    const usageValidation = validateUsage(formData.usage);
    if (!usageValidation.isValid) {
      newErrors.usage = usageValidation.errors[0] ?? 'Invalid usage';
    }

    // Validate payment method selection
    if (formData.paymentType === 'card' && !formData.cardId) {
      newErrors.cardId = 'カードを選択してください';
    }
    if (formData.paymentType === 'bank' && !formData.bankId) {
      newErrors.bankId = '銀行を選択してください';
    }

    // Validate scheduled payment date
    if (!formData.scheduledPayDate) {
      newErrors.scheduledPayDate = '支払い予定日を選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const amountValidation = validateAmount(formData.amount);
      if (!amountValidation.isValid || !amountValidation.parsedAmount) {
        throw new Error('Invalid amount');
      }

      const transactionInput: TransactionInput = {
        date: selectedDate.getTime(),
        storeName: formData.storeName.trim() || undefined,
        usage: formData.usage.trim() || undefined,
        amount: amountValidation.parsedAmount,
        paymentType: formData.paymentType,
        cardId: formData.paymentType === 'card' ? formData.cardId : undefined,
        bankId: formData.paymentType === 'bank' ? formData.bankId : undefined,
        scheduledPayDate: new Date(formData.scheduledPayDate).getTime(),
        isScheduleEditable: formData.isScheduleEditable,
        memo: formData.memo.trim() || undefined
      };

      await onSave(transactionInput);
      onClose();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '保存に失敗しました' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!transaction || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onClose();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '削除に失敗しました' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormDisabled = isSaving || isDeleting || isLoading;
  const modalTitle = transaction ? '取引を編集' : '取引を追加';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      closeOnBackdropClick={!isFormDisabled}
      closeOnEscape={!isFormDisabled}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Transaction date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              取引日
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              {formatJapaneseDate(selectedDate)}
            </div>
          </div>

          {/* Payment type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払い方法 *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="card"
                  checked={formData.paymentType === 'card'}
                  onChange={() => setFormData(prev => ({ ...prev, paymentType: 'card', isScheduleEditable: false }))}
                  disabled={isFormDisabled}
                  className="mr-2"
                />
                <span className="text-sm">カード払い</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bank"
                  checked={formData.paymentType === 'bank'}
                  onChange={() => setFormData(prev => ({ ...prev, paymentType: 'bank', isScheduleEditable: true }))}
                  disabled={isFormDisabled}
                  className="mr-2"
                />
                <span className="text-sm">銀行引落</span>
              </label>
            </div>
          </div>

          {/* Card selection (only for card payment) */}
          {formData.paymentType === 'card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カード *
              </label>
              <select
                value={formData.cardId}
                onChange={handleInputChange('cardId')}
                disabled={isFormDisabled}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.cardId ? 'border-red-300' : 'border-gray-300',
                  isFormDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">カードを選択...</option>
                {availableCards.map(card => {
                  const bank = banks.find(b => b.id === card.bankId);
                  return (
                    <option key={card.id} value={card.id}>
                      {bank?.name} - {card.name}
                    </option>
                  );
                })}
              </select>
              {errors.cardId && (
                <p className="mt-1 text-sm text-red-600">{errors.cardId}</p>
              )}
            </div>
          )}

          {/* Bank selection (only for bank payment) */}
          {formData.paymentType === 'bank' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                引落銀行 *
              </label>
              <select
                value={formData.bankId}
                onChange={handleInputChange('bankId')}
                disabled={isFormDisabled}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.bankId ? 'border-red-300' : 'border-gray-300',
                  isFormDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <option value="">銀行を選択...</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
              {errors.bankId && (
                <p className="mt-1 text-sm text-red-600">{errors.bankId}</p>
              )}
            </div>
          )}

          {/* Scheduled payment date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払い予定日 *
            </label>
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={formData.scheduledPayDate}
                  onChange={handleInputChange('scheduledPayDate')}
                  disabled={isFormDisabled || !formData.isScheduleEditable}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.scheduledPayDate ? 'border-red-300' : 'border-gray-300',
                    (isFormDisabled || !formData.isScheduleEditable) && 'opacity-50 cursor-not-allowed'
                  )}
                />
                {errors.scheduledPayDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledPayDate}</p>
                )}
              </div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.isScheduleEditable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isScheduleEditable: e.target.checked }))}
                  disabled={isFormDisabled}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">手動で編集</span>
              </label>
            </div>
            {!formData.isScheduleEditable && (
              <p className="mt-1 text-xs text-gray-500">
                {formData.paymentType === 'card' 
                  ? 'カードの設定に基づいて自動計算されます'
                  : '銀行引落は手動で日付を入力してください'}
              </p>
            )}
          </div>

          {/* Payment preview */}
          {selectedBank && formData.paymentType === 'card' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{selectedBank.name}</strong>
                {selectedCard && ` - ${selectedCard.name}`}
              </p>
              {selectedCard && (
                <p className="text-xs text-blue-600 mt-1">
                  締切日: {selectedCard.closingDay} / 支払日: {selectedCard.paymentDay}
                  {selectedCard.paymentMonthShift > 0 && 
                    ` (${selectedCard.paymentMonthShift}ヶ月後)`
                  }
                </p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                支払い予定: {formatJapaneseDate(new Date(formData.scheduledPayDate))}
              </p>
            </div>
          )}

          {/* Amount */}
          <Input
            label="金額 *"
            type="text"
            value={formData.amount}
            onChange={handleInputChange('amount')}
            disabled={isFormDisabled}
            {...(errors.amount && { error: errors.amount })}
            placeholder="1000"
            rightIcon={
              <span className="text-gray-500 text-sm">円</span>
            }
          />

          {/* Store name */}
          <Input
            label="店舗名"
            type="text"
            value={formData.storeName}
            onChange={handleInputChange('storeName')}
            disabled={isFormDisabled}
            {...(errors.storeName && { error: errors.storeName })}
            placeholder="コンビニA"
            helperText="支払いを行った店舗名（省略可）"
          />

          {/* Usage */}
          <Input
            label="用途"
            type="text"
            value={formData.usage}
            onChange={handleInputChange('usage')}
            disabled={isFormDisabled}
            {...(errors.usage && { error: errors.usage })}
            placeholder="食費"
            helperText="何に使ったかの説明（省略可）"
          />

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ
            </label>
            <textarea
              value={formData.memo}
              onChange={handleInputChange('memo')}
              disabled={isFormDisabled}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border border-gray-300 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'resize-none',
                isFormDisabled && 'opacity-50 cursor-not-allowed'
              )}
              placeholder="追加のメモ（省略可）"
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          {/* Delete button (only for existing transactions) */}
          <div>
            {transaction && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isFormDisabled}
                isLoading={isDeleting}
              >
                削除
              </Button>
            )}
          </div>

          {/* Cancel and Save buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isFormDisabled}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isFormDisabled}
              isLoading={isSaving}
            >
              {transaction ? '更新' : '保存'}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}