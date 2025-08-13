'use client';

import React, { useState } from 'react';
import { useEncryption, usePasswordStrength } from '@/lib/hooks/useEncryption';
import { Key, AlertCircle, Check } from 'lucide-react';

interface PasswordChangeProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function PasswordChange({ onComplete, onCancel }: PasswordChangeProps) {
  const { changePassword, isLoading, error } = useEncryption();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { strength, suggestions } = usePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const canSubmit = currentPassword && passwordsMatch && strength !== 'weak' && !isLoading;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setChangeError(null);
    
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : 'パスワードの変更に失敗しました');
    }
  };
  
  const getStrengthColor = () => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };
  
  if (success) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            パスワードを変更しました
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            新しいパスワードで暗号化キーが更新されました
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
          <Key className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">パスワードの変更</h3>
          <p className="text-sm text-gray-500">暗号化パスワードを更新します</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
            現在のパスワード
          </label>
          <div className="mt-1 relative">
            <input
              id="current-password"
              type={showPasswords ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="現在のパスワード"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            新しいパスワード
          </label>
          <div className="mt-1 relative">
            <input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="8文字以上で入力してください"
            />
          </div>
          
          {newPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getStrengthColor()}`}
                    style={{
                      width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%'
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {strength === 'strong' ? '強' : strength === 'medium' ? '中' : '弱'}
                </span>
              </div>
              
              {suggestions.length > 0 && (
                <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                  {suggestions.slice(0, 2).map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            新しいパスワード（確認）
          </label>
          <div className="mt-1">
            <input
              id="confirm-password"
              type={showPasswords ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="もう一度入力してください"
            />
          </div>
          
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-600">パスワードが一致しません</p>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            id="show-passwords"
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="show-passwords" className="ml-2 block text-sm text-gray-700">
            パスワードを表示
          </label>
        </div>
        
        {(changeError || error) && (
          <div className="rounded-md bg-red-50 p-3">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div className="ml-2">
                <p className="text-sm text-red-800">
                  {changeError || error?.message}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? '変更中...' : 'パスワードを変更'}
          </button>
        </div>
      </form>
    </div>
  );
}