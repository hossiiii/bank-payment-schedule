'use client';

import React, { useState, useEffect } from 'react';
import { validateAmount, validateStoreName, validateUsage } from '@/lib/utils/validation';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';
import { ScheduleItem, Bank, Card } from '@/types/database';
import { BaseModal, BaseModalFooter } from './BaseModal';
import { cn } from '@/lib/utils';

export interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  onDelete?: (scheduleId: string) => Promise<void>;
  scheduleItem: ScheduleItem | null;
  banks: Bank[];
  cards: Card[];
  isLoading?: boolean;
}

/**
 * 引落予定編集用のフォームデータ型
 */
interface ScheduleEditFormData {
  amount: string;
  storeName: string;
  usage: string;
}

/**
 * ScheduleEditModal - 引落予定編集専用モーダル
 * 
 * 特徴:
 * - 青色テーマ
 * - 引落予定の詳細情報編集
 * - 店舗情報、用途、メモの編集対応
 * - バリデーション機能
 * - エラーハンドリング
 */
export function ScheduleEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  scheduleItem,
  banks,
  cards,
  isLoading = false
}: ScheduleEditModalProps) {
  // フォーム状態
  const [formData, setFormData] = useState<ScheduleEditFormData>({
    amount: '',
    storeName: '',
    usage: ''
  });

  // バリデーションエラー
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 読み込み状態
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // フォームデータ初期化
  useEffect(() => {
    if (isOpen && scheduleItem) {
      setFormData({
        amount: scheduleItem.amount.toString(),
        storeName: scheduleItem.storeName || '',
        usage: scheduleItem.usage || ''
      });
      setErrors({});
    }
  }, [isOpen, scheduleItem]);

  // 選択されたカード/銀行の詳細情報取得
  const selectedCard = scheduleItem?.cardId 
    ? cards.find(card => card.id === scheduleItem.cardId)
    : null;
  const selectedBank = scheduleItem?.paymentType === 'bank'
    ? banks.find(bank => bank.name === scheduleItem.bankName)
    : selectedCard 
      ? banks.find(bank => bank.id === selectedCard.bankId)
      : null;

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 金額バリデーション
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.errors[0] ?? '無効な金額です';
    }

    // 店舗名バリデーション
    if (formData.storeName.trim()) {
      const storeValidation = validateStoreName(formData.storeName);
      if (!storeValidation.isValid) {
        newErrors.storeName = storeValidation.errors[0] ?? '無効な店舗名です';
      }
    }

    // 用途バリデーション
    if (formData.usage.trim()) {
      const usageValidation = validateUsage(formData.usage);
      if (!usageValidation.isValid) {
        newErrors.usage = usageValidation.errors[0] ?? '無効な用途です';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSave = async () => {
    if (!scheduleItem || !validateForm()) return;

    setIsSaving(true);
    try {
      const amountValidation = validateAmount(formData.amount);
      if (!amountValidation.isValid || !amountValidation.parsedAmount) {
        throw new Error('無効な金額です');
      }

      const updates: Partial<ScheduleItem> = {
        amount: amountValidation.parsedAmount,
        ...(formData.storeName.trim() && { storeName: formData.storeName.trim() }),
        ...(formData.usage.trim() && { usage: formData.usage.trim() })
      };

      await onSave(scheduleItem.transactionId, updates);
      onClose();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '保存に失敗しました' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!scheduleItem || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(scheduleItem.transactionId);
      onClose();
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '削除に失敗しました' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 入力変更ハンドラ
  const handleInputChange = (field: keyof ScheduleEditFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // エラークリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isFormDisabled = isSaving || isDeleting || isLoading;

  if (!isOpen || !scheduleItem) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="引落予定を編集"
      size="md"
      className={undefined}
      headerClassName="bg-blue-50 border-blue-200"
      bodyClassName="max-h-[70vh]"
      footerChildren={
        <BaseModalFooter 
          onClose={onClose}
          primaryAction={{
            label: '更新',
            onClick: handleSave,
            variant: 'primary',
            disabled: isFormDisabled
          }}
          {...(onDelete && {
            secondaryAction: {
              label: '削除',
              onClick: handleDelete,
              variant: 'secondary',
              disabled: isFormDisabled
            }
          })}
        />
      }
    >
      <div className="p-6 space-y-6">
        {/* 一般エラー */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        {/* 引落予定情報サマリー */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800">
                引落予定詳細
              </h3>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                予定
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700 font-medium">引落日</p>
                <p className="text-blue-900">{formatJapaneseDate(scheduleItem.date)}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">支払い方法</p>
                <p className="text-blue-900">
                  {scheduleItem.paymentType === 'card' ? 'カード払い' : '銀行引落'}
                </p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">銀行</p>
                <p className="text-blue-900">{scheduleItem.bankName}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">カード/口座</p>
                <p className="text-blue-900">
                  {scheduleItem.cardName || '自動銀行振替'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* カード詳細（カード払いの場合のみ） */}
        {selectedCard && selectedBank && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">カード情報</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">カード名:</span> {selectedCard.name}
              </p>
              <p>
                <span className="font-medium">引落銀行:</span> {selectedBank.name}
              </p>
              <p>
                <span className="font-medium">締切日:</span> {selectedCard.closingDay} / 
                <span className="font-medium"> 支払日:</span> {selectedCard.paymentDay}
                {selectedCard.paymentMonthShift > 0 && 
                  ` (${selectedCard.paymentMonthShift}ヶ月後)`
                }
              </p>
            </div>
          </div>
        )}

        {/* 編集フォーム */}
        <div className="space-y-4">
          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金額 *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                disabled={isFormDisabled}
                className={cn(
                  'w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.amount ? 'border-red-300' : 'border-gray-300',
                  isFormDisabled && 'opacity-50 cursor-not-allowed'
                )}
                placeholder="1000"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-500 text-sm">円</span>
              </div>
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* 店舗名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店舗名
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={handleInputChange('storeName')}
              disabled={isFormDisabled}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.storeName ? 'border-red-300' : 'border-gray-300',
                isFormDisabled && 'opacity-50 cursor-not-allowed'
              )}
              placeholder="店舗名を入力"
            />
            {errors.storeName && (
              <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              支払いを行った店舗名（省略可）
            </p>
          </div>

          {/* 用途 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用途
            </label>
            <input
              type="text"
              value={formData.usage}
              onChange={handleInputChange('usage')}
              disabled={isFormDisabled}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.usage ? 'border-red-300' : 'border-gray-300',
                isFormDisabled && 'opacity-50 cursor-not-allowed'
              )}
              placeholder="用途を入力"
            />
            {errors.usage && (
              <p className="mt-1 text-sm text-red-600">{errors.usage}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              何に使ったかの説明（省略可）
            </p>
          </div>

        </div>

        {/* 操作ガイド */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">編集について:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>金額以外の項目は任意です</li>
                <li>引落日、支払い方法、銀行/カード情報は変更できません</li>
                <li>削除すると引落予定から完全に削除されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}