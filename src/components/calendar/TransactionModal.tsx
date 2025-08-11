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
  validateUsage,
  formatAmount,
  parseAmount
} from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';

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
    cardId: string;
    memo: string;
  }>({
    storeName: '',
    usage: '',
    amount: '',
    cardId: '',
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
          cardId: transaction.cardId,
          memo: transaction.memo || ''
        });
      } else {
        // Creating new transaction
        setFormData({
          storeName: '',
          usage: '',
          amount: '',
          cardId: cards.length === 1 ? cards[0].id : '',
          memo: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction, cards]);

  // Get filtered cards based on selected bank (if any)
  const availableCards = cards.filter(card => 
    banks.some(bank => bank.id === card.bankId)
  );

  // Get selected card details
  const selectedCard = availableCards.find(card => card.id === formData.cardId);
  const selectedBank = selectedCard ? banks.find(bank => bank.id === selectedCard.bankId) : null;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.errors[0];
    }

    // Validate store name
    const storeValidation = validateStoreName(formData.storeName);
    if (!storeValidation.isValid) {
      newErrors.storeName = storeValidation.errors[0];
    }

    // Validate usage
    const usageValidation = validateUsage(formData.usage);
    if (!usageValidation.isValid) {
      newErrors.usage = usageValidation.errors[0];
    }

    // Validate card selection
    if (!formData.cardId) {
      newErrors.cardId = 'カードを選択してください';
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
        cardId: formData.cardId,
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

          {/* Card selection */}
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

          {/* Payment preview */}
          {selectedCard && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{selectedBank?.name} - {selectedCard.name}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                締切日: {selectedCard.closingDay} / 支払日: {selectedCard.paymentDay}
                {selectedCard.paymentMonthShift > 0 && 
                  ` (${selectedCard.paymentMonthShift}ヶ月後)`
                }
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
            error={errors.amount}
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
            error={errors.storeName}
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
            error={errors.usage}
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