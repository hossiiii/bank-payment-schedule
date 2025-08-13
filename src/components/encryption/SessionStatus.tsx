'use client';

import React, { useEffect, useState } from 'react';
import { useEncryption } from '@/lib/hooks/useEncryption';
import { useEncryptionContext } from '@/lib/contexts/EncryptionContext';
import { Lock, Unlock, Clock, Shield, AlertTriangle } from 'lucide-react';

export function SessionStatus() {
  const { 
    isUnlocked, 
    sessionExpiresAt, 
    lock, 
    extendSession,
    getSessionInfo 
  } = useEncryption();
  
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const sessionInfo = getSessionInfo();
  
  useEffect(() => {
    if (!sessionExpiresAt) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = sessionExpiresAt - now;
      
      if (remaining <= 0) {
        setTimeRemaining('期限切れ');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        setTimeRemaining(`${hours}時間${mins}分`);
      } else {
        setTimeRemaining(`${mins}分`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [sessionExpiresAt]);
  
  const handleExtendSession = async () => {
    try {
      await extendSession(1); // Extend by 1 hour
    } catch (err) {
      console.error('Failed to extend session:', err);
    }
  };
  
  const handleLock = async () => {
    try {
      await lock();
    } catch (err) {
      console.error('Failed to lock session:', err);
    }
  };
  
  if (!isUnlocked) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Lock className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">セッションロック中</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700">暗号化有効</span>
      </div>
      
      {sessionInfo && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          sessionInfo.isExpiringSoon ? 'bg-yellow-50' : 'bg-blue-50'
        }`}>
          <Clock className={`h-4 w-4 ${
            sessionInfo.isExpiringSoon ? 'text-yellow-600' : 'text-blue-600'
          }`} />
          <span className={`text-sm ${
            sessionInfo.isExpiringSoon ? 'text-yellow-700' : 'text-blue-700'
          }`}>
            残り {timeRemaining}
          </span>
          
          {sessionInfo.isExpiringSoon && (
            <button
              onClick={handleExtendSession}
              className="ml-2 text-xs text-yellow-700 hover:text-yellow-800 underline"
            >
              延長
            </button>
          )}
        </div>
      )}
      
      <button
        onClick={handleLock}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>ロック</span>
      </button>
    </div>
  );
}

interface SessionIndicatorProps {
  className?: string;
}

export function SessionIndicator({ className = '' }: SessionIndicatorProps) {
  const { isUnlocked, getSessionInfo } = useEncryptionContext();
  const sessionInfo = getSessionInfo();
  
  if (!isUnlocked) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <Lock className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">ロック</span>
      </div>
    );
  }
  
  if (sessionInfo?.isExpiringSoon) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-xs text-yellow-600">まもなく期限</span>
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Unlock className="h-3.5 w-3.5 text-green-500" />
      <span className="text-xs text-green-600">暗号化</span>
    </div>
  );
}