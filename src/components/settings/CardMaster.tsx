'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Modal, 
  ModalBody, 
  ModalFooter, 
  ConfirmModal 
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { Card, CardInput, Bank } from '@/types/database';
import { 
  validateCardName, 
  validateMemo, 
  validateDayOfMonth 
} from '@/lib/utils/validation';
import { 
  validatePaymentSchedule,
  analyzePaymentTiming,
  validateCardConfiguration 
} from '@/lib/utils/paymentCalc';

export interface CardMasterProps {
  cards: Card[];
  banks: Bank[];
  isLoading?: boolean;
  onCreateCard: (cardData: CardInput) => Promise<void>;
  onUpdateCard: (cardId: string, cardData: Partial<CardInput>) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  className?: string;
}

interface CardFormData {
  name: string;
  bankId: string;
  closingDay: string;
  paymentDay: string;
  paymentMonthShift: number;
  adjustWeekend: boolean;
  memo: string;
}

export function CardMaster({
  cards,
  banks,
  isLoading = false,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  className
}: CardMasterProps) {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Form state
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    bankId: '',
    closingDay: '',
    paymentDay: '',
    paymentMonthShift: 1,
    adjustWeekend: true,
    memo: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      bankId: '',
      closingDay: '',
      paymentDay: '',
      paymentMonthShift: 1,
      adjustWeekend: true,
      memo: ''
    });
    setErrors({});
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate card name
    const nameValidation = validateCardName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.errors[0] ?? 'Invalid card name';
    }

    // Check for duplicate card name within the same bank
    const isDuplicate = cards.some(card => 
      card.name.toLowerCase() === formData.name.toLowerCase() &&
      card.bankId === formData.bankId &&
      (selectedCard ? card.id !== selectedCard.id : true)
    );
    if (isDuplicate) {
      newErrors.name = 'この銀行には同じ名前のカードが既に登録されています';
    }

    // Validate bank selection
    if (!formData.bankId) {
      newErrors.bankId = '銀行を選択してください';
    }

    // Validate closing day
    const closingDayValidation = validateDayOfMonth(formData.closingDay, '締切日');
    if (!closingDayValidation.isValid) {
      newErrors.closingDay = closingDayValidation.errors[0] ?? 'Invalid closing day';
    }

    // Validate payment day
    const paymentDayValidation = validateDayOfMonth(formData.paymentDay, '支払日');
    if (!paymentDayValidation.isValid) {
      newErrors.paymentDay = paymentDayValidation.errors[0] ?? 'Invalid payment day';
    }

    // Validate payment schedule logic
    if (formData.closingDay && formData.paymentDay) {
      const scheduleValidation = validatePaymentSchedule(formData.closingDay, formData.paymentDay);
      if (!scheduleValidation.isValid) {
        newErrors.paymentDay = scheduleValidation.errors[0] ?? 'Invalid payment schedule';
      }
    }

    // Validate payment month shift
    if (formData.paymentMonthShift < 0 || formData.paymentMonthShift > 3) {
      newErrors.paymentMonthShift = '支払月シフトは0〜3ヶ月の範囲で設定してください';
    }

    // Validate memo
    const memoValidation = validateMemo(formData.memo);
    if (!memoValidation.isValid) {
      newErrors.memo = memoValidation.errors[0] ?? 'Invalid memo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get payment timing analysis
  const getPaymentAnalysis = () => {
    if (!formData.closingDay || !formData.paymentDay || !formData.bankId) {
      return null;
    }

    try {
      const mockCard: Card = {
        id: 'temp',
        name: formData.name || 'テストカード',
        bankId: formData.bankId,
        closingDay: formData.closingDay,
        paymentDay: formData.paymentDay,
        paymentMonthShift: formData.paymentMonthShift,
        adjustWeekend: formData.adjustWeekend,
        memo: formData.memo,
        createdAt: Date.now()
      };

      const analysis = analyzePaymentTiming(mockCard);
      const validation = validateCardConfiguration(mockCard);

      return { analysis, validation };
    } catch (error) {
      return null;
    }
  };

  // Handle create card
  const handleCreateCard = () => {
    resetForm();
    setSelectedCard(null);
    setIsCreateModalOpen(true);
  };

  // Handle edit card
  const handleEditCard = (card: Card) => {
    setFormData({
      name: card.name,
      bankId: card.bankId,
      closingDay: card.closingDay,
      paymentDay: card.paymentDay,
      paymentMonthShift: card.paymentMonthShift,
      adjustWeekend: card.adjustWeekend,
      memo: card.memo || ''
    });
    setSelectedCard(card);
    setIsEditModalOpen(true);
  };

  // Handle delete card
  const handleDeleteCard = (card: Card) => {
    setSelectedCard(card);
    setIsDeleteModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const cardData: CardInput = {
        name: formData.name.trim(),
        bankId: formData.bankId,
        closingDay: formData.closingDay.trim(),
        paymentDay: formData.paymentDay.trim(),
        paymentMonthShift: formData.paymentMonthShift,
        adjustWeekend: formData.adjustWeekend,
        memo: formData.memo.trim() || undefined
      };

      if (selectedCard) {
        await onUpdateCard(selectedCard.id, cardData);
        setIsEditModalOpen(false);
      } else {
        await onCreateCard(cardData);
        setIsCreateModalOpen(false);
      }

      resetForm();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '保存に失敗しました' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!selectedCard) return;

    setIsDeleting(true);
    try {
      await onDeleteCard(selectedCard.id);
      setIsDeleteModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '削除に失敗しました' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CardFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number'
      ? parseInt(e.target.value) || 0
      : e.target.value;

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

  const isFormDisabled = isSaving || isLoading;
  const paymentAnalysis = getPaymentAnalysis();

  // Get bank name by ID
  const getBankName = (bankId: string) => {
    return banks.find(bank => bank.id === bankId)?.name || '不明な銀行';
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            カード管理
          </h3>
          <Button
            variant="primary"
            onClick={handleCreateCard}
            disabled={isLoading || banks.length === 0}
          >
            カードを追加
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          クレジットカードの支払い設定を管理します
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      {/* No banks message */}
      {banks.length === 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              カードを追加するには、まず銀行を登録してください。
            </p>
          </div>
        </div>
      )}

      {/* Cards list */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              カードが登録されていません
            </h4>
            <p className="text-gray-500 mb-4">
              {banks.length === 0 
                ? '銀行を登録してからカードを追加してください'
                : '「カードを追加」ボタンから最初のカードを登録してください'
              }
            </p>
            {banks.length > 0 && (
              <Button
                variant="primary"
                onClick={handleCreateCard}
              >
                カードを追加
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map(card => {
              const analysis = analyzePaymentTiming(card);
              const validation = validateCardConfiguration(card);

              return (
                <div
                  key={card.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {card.name}
                        </h4>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {getBankName(card.bankId)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">締切日:</span>
                          <span className="ml-1 font-medium">{card.closingDay}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">支払日:</span>
                          <span className="ml-1 font-medium">{card.paymentDay}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">支払月:</span>
                          <span className="ml-1 font-medium">{analysis.paymentPattern}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">平均期間:</span>
                          <span className="ml-1 font-medium">{analysis.averageDelay}日</span>
                        </div>
                      </div>

                      {card.memo && (
                        <p className="text-sm text-gray-600 mb-2">
                          {card.memo}
                        </p>
                      )}

                      {/* Validation warnings */}
                      {!validation.isValid && validation.warnings.length > 0 && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mb-2">
                          {validation.warnings[0]}
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        作成日: {new Date(card.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCard(card)}
                        disabled={isLoading}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCard(card)}
                        disabled={isLoading}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Card Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (isCreateModalOpen) setIsCreateModalOpen(false);
            if (isEditModalOpen) setIsEditModalOpen(false);
            resetForm();
            setSelectedCard(null);
          }}
          title={selectedCard ? 'カードを編集' : 'カードを追加'}
          size="lg"
          closeOnBackdropClick={!isFormDisabled}
          closeOnEscape={!isFormDisabled}
        >
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="カード名 *"
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                disabled={isFormDisabled}
                {...(errors.name && { error: errors.name })}
                placeholder="楽天カード"
                helperText="カードの名前を入力してください"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  銀行 *
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="締切日 *"
                  type="text"
                  value={formData.closingDay}
                  onChange={handleInputChange('closingDay')}
                  disabled={isFormDisabled}
                  {...(errors.closingDay && { error: errors.closingDay })}
                  placeholder="15 または 月末"
                  helperText="1-31の数字か「月末」"
                />

                <Input
                  label="支払日 *"
                  type="text"
                  value={formData.paymentDay}
                  onChange={handleInputChange('paymentDay')}
                  disabled={isFormDisabled}
                  {...(errors.paymentDay && { error: errors.paymentDay })}
                  placeholder="27 または 月末"
                  helperText="1-31の数字か「月末」"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支払月シフト
                  </label>
                  <select
                    value={formData.paymentMonthShift}
                    onChange={handleInputChange('paymentMonthShift')}
                    disabled={isFormDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>当月払い</option>
                    <option value={1}>翌月払い</option>
                    <option value={2}>翌々月払い</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    一般的なカードは翌月払いです
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-6">
                  <input
                    type="checkbox"
                    checked={formData.adjustWeekend}
                    onChange={handleInputChange('adjustWeekend')}
                    disabled={isFormDisabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    土日祝日を翌営業日に調整
                  </label>
                </div>
              </div>

              {/* Payment analysis */}
              {paymentAnalysis && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    支払いタイミング分析
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                      <span className="font-medium">支払パターン:</span> {paymentAnalysis.analysis.paymentPattern}
                    </div>
                    <div>
                      <span className="font-medium">平均期間:</span> {paymentAnalysis.analysis.averageDelay}日
                    </div>
                    <div>
                      <span className="font-medium">最短期間:</span> {paymentAnalysis.analysis.minDelay}日
                    </div>
                    <div>
                      <span className="font-medium">最長期間:</span> {paymentAnalysis.analysis.maxDelay}日
                    </div>
                  </div>
                  {paymentAnalysis.validation.warnings.length > 0 && (
                    <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                      <strong>注意:</strong> {paymentAnalysis.validation.warnings[0]}
                    </div>
                  )}
                  {paymentAnalysis.validation.suggestions.length > 0 && (
                    <div className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                      <strong>提案:</strong> {paymentAnalysis.validation.suggestions[0]}
                    </div>
                  )}
                </div>
              )}

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
                    errors.memo && 'border-red-300',
                    isFormDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  placeholder="カードの種類や特記事項など、任意のメモを入力できます"
                />
                {errors.memo && (
                  <p className="mt-1 text-sm text-red-600">{errors.memo}</p>
                )}
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (isCreateModalOpen) setIsCreateModalOpen(false);
                if (isEditModalOpen) setIsEditModalOpen(false);
                resetForm();
                setSelectedCard(null);
              }}
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
              {selectedCard ? '更新' : '追加'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCard(null);
        }}
        onConfirm={handleConfirmDelete}
        title="カードを削除"
        message={`「${selectedCard?.name}」を削除しますか？このカードに関連する取引データも削除されます。この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}