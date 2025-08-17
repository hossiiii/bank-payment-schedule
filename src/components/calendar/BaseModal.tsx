'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string | undefined;
  headerClassName?: string;
  bodyClassName?: string;
  footerChildren?: React.ReactNode;
}

/**
 * BaseModal - 共通モーダル基盤コンポーネント
 * 
 * 設計原則:
 * - 再利用可能な基盤構造
 * - TypeScript完全対応
 * - アクセシビリティ準拠
 * - エラーハンドリング対応
 */
export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  headerClassName,
  bodyClassName,
  footerChildren,
}: BaseModalProps) {
  // Escキー押下でモーダルを閉じる
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // モーダル表示時はボディのスクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // モーダルが開いていない場合は何も表示しない
  if (!isOpen) return null;

  // バックドロップクリックでモーダルを閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // サイズによるクラス設定
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={cn(
        'bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-hidden',
        'transform transition-all duration-200 ease-in-out',
        sizeClasses[size],
        className
      )}>
        {/* ヘッダー */}
        <div className={cn(
          'px-6 py-4 border-b border-gray-200',
          headerClassName
        )}>
          <div className="flex items-center justify-between">
            <h2 
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ボディ */}
        <div className={cn(
          'overflow-y-auto',
          bodyClassName
        )}>
          {children}
        </div>

        {/* フッター（オプション） */}
        {footerChildren && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footerChildren}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 共通フッターコンポーネント
 */
export interface BaseModalFooterProps {
  onClose: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive' | 'danger';
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'secondary' | 'ghost';
    disabled?: boolean;
  };
}

export function BaseModalFooter({
  onClose,
  primaryAction,
  secondaryAction
}: BaseModalFooterProps) {
  const getButtonClasses = (variant: string = 'secondary', disabled: boolean = false) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (disabled) {
      return cn(baseClasses, 'bg-gray-300 text-gray-500 cursor-not-allowed');
    }
    
    switch (variant) {
      case 'primary':
        return cn(baseClasses, 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500');
      case 'destructive':
        return cn(baseClasses, 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500');
      case 'danger':
        return cn(baseClasses, 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500');
      case 'ghost':
        return cn(baseClasses, 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500');
      default: // secondary
        return cn(baseClasses, 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500');
    }
  };

  return (
    <div className="flex items-center justify-end space-x-3">
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          className={getButtonClasses(secondaryAction.variant, secondaryAction.disabled)}
        >
          {secondaryAction.label}
        </button>
      )}
      
      {primaryAction ? (
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={getButtonClasses(primaryAction.variant, primaryAction.disabled)}
        >
          {primaryAction.label}
        </button>
      ) : (
        <button
          onClick={onClose}
          className={getButtonClasses('secondary')}
        >
          閉じる
        </button>
      )}
    </div>
  );
}