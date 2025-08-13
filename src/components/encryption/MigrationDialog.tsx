'use client';

import React, { useState } from 'react';
import { migrateToEncrypted, createBackup } from '@/lib/database/migrationUtils';
import { Database, Download, AlertTriangle, Check } from 'lucide-react';

interface MigrationDialogProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function MigrationDialog({ onComplete, onSkip }: MigrationDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'intro' | 'backup' | 'password' | 'migrating' | 'complete'>('intro');
  
  const handleBackup = async () => {
    try {
      const backup = await createBackup();
      const url = URL.createObjectURL(backup);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStep('password');
    } catch (err) {
      setError('バックアップの作成に失敗しました');
    }
  };
  
  const handleMigrate = async () => {
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    
    setIsMigrating(true);
    setError(null);
    setStep('migrating');
    
    try {
      await migrateToEncrypted(password);
      setStep('complete');
      setTimeout(onComplete, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '移行に失敗しました');
      setStep('password');
      setIsMigrating(false);
    }
  };
  
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              暗号化の設定が完了しました
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              データは安全に暗号化されました
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (step === 'migrating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              データを暗号化しています
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              しばらくお待ちください...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {step === 'intro' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  データ暗号化への移行
                </h2>
                <p className="text-sm text-gray-600">
                  既存のデータを暗号化します
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                アプリケーションのセキュリティを強化するため、保存されているデータを暗号化します。
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      移行前に必ずバックアップを作成してください
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('backup')}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  続ける
                </button>
                <button
                  onClick={onSkip}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  後で
                </button>
              </div>
            </div>
          </>
        )}
        
        {step === 'backup' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Download className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                バックアップの作成
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                万が一に備えて、現在のデータをバックアップします。
              </p>
              
              <button
                onClick={handleBackup}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                バックアップをダウンロード
              </button>
              
              <button
                onClick={() => setStep('password')}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                スキップ
              </button>
            </div>
          </>
        )}
        
        {step === 'password' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              暗号化パスワードの設定
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="8文字以上"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="もう一度入力"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleMigrate}
                disabled={isMigrating || !password || !confirmPassword}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:bg-gray-400"
              >
                暗号化を開始
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}