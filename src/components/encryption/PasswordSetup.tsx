'use client';

import React, { useState } from 'react';
import { useEncryptionContext } from '@/lib/contexts/EncryptionContext';
import { usePasswordStrength } from '@/lib/hooks/useEncryption';
import { AlertCircle, Lock, Check, X } from 'lucide-react';

interface PasswordSetupProps {
  onComplete?: () => void;
}

export function PasswordSetup({ onComplete }: PasswordSetupProps) {
  const { setupEncryption, isLoading, error } = useEncryptionContext();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { strength, errors: strengthErrors, suggestions } = usePasswordStrength(password);
  
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = passwordsMatch && strength !== 'weak' && !isLoading;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    try {
      await setupEncryption(password);
      onComplete?.();
    } catch (err) {
      console.error('Failed to setup encryption:', err);
    }
  };
  
  const getStrengthColor = () => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            データ暗号化の設定
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            あなたのデータを保護するためのパスワードを設定してください
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8文字以上で入力してください"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-400 hover:text-gray-500 text-sm">
                    {showPassword ? '隠す' : '表示'}
                  </span>
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
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
                    <ul className="mt-2 text-xs text-gray-600 space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="もう一度入力してください"
                />
              </div>
              
              {confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">パスワードが一致しています</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">パスワードが一致しません</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error.message}</p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? '設定中...' : '暗号化を有効にする'}
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>このパスワードは暗号化キーの生成に使用されます。</p>
            <p>忘れた場合、データの復元はできません。</p>
          </div>
        </form>
      </div>
    </div>
  );
}