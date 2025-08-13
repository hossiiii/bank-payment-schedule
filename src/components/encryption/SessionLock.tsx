'use client';

import React, { useState } from 'react';
import { useEncryptionContext } from '@/lib/contexts/EncryptionContext';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

interface SessionLockProps {
  onUnlock?: () => void;
}

export function SessionLock({ onUnlock }: SessionLockProps) {
  const { unlock, isLoading, error } = useEncryptionContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    
    try {
      await unlock(password);
      setPassword('');
      onUnlock?.();
    } catch (err) {
      setUnlockError('パスワードが間違っています');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            セッションがロックされています
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            続けるにはパスワードを入力してください
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="unlock-password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <div className="mt-1 relative">
              <input
                id="unlock-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワードを入力"
                autoFocus
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
          </div>
          
          {(unlockError || error) && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    {unlockError || error?.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading || !password}
              className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading || !password
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <Unlock className="h-4 w-4" />
              {isLoading ? 'ロック解除中...' : 'ロック解除'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}