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
import { Bank, BankInput } from '@/types/database';
import { validateBankName, validateMemo } from '@/lib/utils/validation';

export interface BankMasterProps {
  banks: Bank[];
  isLoading?: boolean;
  onCreateBank: (bankData: BankInput) => Promise<void>;
  onUpdateBank: (bankId: string, bankData: Partial<BankInput>) => Promise<void>;
  onDeleteBank: (bankId: string) => Promise<void>;
  className?: string;
}

interface BankFormData {
  name: string;
  memo: string;
}

export function BankMaster({
  banks,
  isLoading = false,
  onCreateBank,
  onUpdateBank,
  onDeleteBank,
  className
}: BankMasterProps) {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  // Form state
  const [formData, setFormData] = useState<BankFormData>({
    name: '',
    memo: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', memo: '' });
    setErrors({});
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate bank name
    const nameValidation = validateBankName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.errors[0] || 'Invalid bank name';
    }

    // Check for duplicate bank name (when creating or editing)
    const isDuplicate = banks.some(bank => 
      bank.name.toLowerCase() === formData.name.toLowerCase() &&
      (selectedBank ? bank.id !== selectedBank.id : true)
    );
    if (isDuplicate) {
      newErrors.name = 'この銀行名は既に登録されています';
    }

    // Validate memo
    const memoValidation = validateMemo(formData.memo);
    if (!memoValidation.isValid) {
      newErrors.memo = memoValidation.errors[0] || 'Invalid memo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create bank
  const handleCreateBank = () => {
    resetForm();
    setSelectedBank(null);
    setIsCreateModalOpen(true);
  };

  // Handle edit bank
  const handleEditBank = (bank: Bank) => {
    setFormData({
      name: bank.name,
      memo: bank.memo || ''
    });
    setSelectedBank(bank);
    setIsEditModalOpen(true);
  };

  // Handle delete bank
  const handleDeleteBank = (bank: Bank) => {
    setSelectedBank(bank);
    setIsDeleteModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const bankData: BankInput = {
        name: formData.name.trim(),
        memo: formData.memo.trim() || undefined
      };

      if (selectedBank) {
        await onUpdateBank(selectedBank.id, bankData);
        setIsEditModalOpen(false);
      } else {
        await onCreateBank(bankData);
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
    if (!selectedBank) return;

    setIsDeleting(true);
    try {
      await onDeleteBank(selectedBank.id);
      setIsDeleteModalOpen(false);
      setSelectedBank(null);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : '削除に失敗しました' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof BankFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const isFormDisabled = isSaving || isLoading;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            銀行管理
          </h3>
          <Button
            variant="primary"
            onClick={handleCreateBank}
            disabled={isLoading}
          >
            銀行を追加
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          引落口座として使用する銀行を管理します
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

      {/* Banks list */}
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
        ) : banks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              銀行が登録されていません
            </h4>
            <p className="text-gray-500 mb-4">
              「銀行を追加」ボタンから最初の銀行を登録してください
            </p>
            <Button
              variant="primary"
              onClick={handleCreateBank}
            >
              銀行を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {banks.map(bank => (
              <div
                key={bank.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {bank.name}
                    </h4>
                    {bank.memo && (
                      <p className="text-sm text-gray-600 mt-1">
                        {bank.memo}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      作成日: {new Date(bank.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBank(bank)}
                      disabled={isLoading}
                    >
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBank(bank)}
                      disabled={isLoading}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Bank Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="銀行を追加"
        closeOnBackdropClick={!isFormDisabled}
        closeOnEscape={!isFormDisabled}
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="銀行名 *"
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isFormDisabled}
              {...(errors.name && { error: errors.name })}
              placeholder="みずほ銀行"
              helperText="正確な銀行名を入力してください"
              fullWidth
            />
            
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
                placeholder="支店名や口座番号など、任意のメモを入力できます"
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
              setIsCreateModalOpen(false);
              resetForm();
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
            追加
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Bank Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
          setSelectedBank(null);
        }}
        title="銀行を編集"
        closeOnBackdropClick={!isFormDisabled}
        closeOnEscape={!isFormDisabled}
      >
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="銀行名 *"
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={isFormDisabled}
              {...(errors.name && { error: errors.name })}
              placeholder="みずほ銀行"
              helperText="正確な銀行名を入力してください"
              fullWidth
            />
            
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
                placeholder="支店名や口座番号など、任意のメモを入力できます"
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
              setIsEditModalOpen(false);
              resetForm();
              setSelectedBank(null);
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
            更新
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBank(null);
        }}
        onConfirm={handleConfirmDelete}
        title="銀行を削除"
        message={`「${selectedBank?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}