'use client';

import React from 'react';

interface AutoLockWarningProps {
  secondsRemaining: number;
  onExtend: () => void;
  onDismiss: () => void;
}

export function AutoLockWarning({ 
  secondsRemaining,
  onExtend,
  onDismiss 
}: AutoLockWarningProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            セッションがまもなくロックされます
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            {Math.floor(secondsRemaining / 60)}分{secondsRemaining % 60}秒後に自動的にロックされます
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onExtend}
              className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-1 px-3 rounded"
            >
              延長する
            </button>
            <button
              onClick={onDismiss}
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}