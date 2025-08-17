'use client';

import React, { useEffect, useState } from 'react';
import { EncryptionContextProvider, useEncryptionContext } from '@/lib/contexts/EncryptionContext';
import { useAutoLock } from '@/lib/hooks/useAutoLock';
import { AutoLockWarning } from './AutoLockWarning';
import { needsMigration } from '@/lib/database/migrationUtils';
import { PasswordSetup } from './PasswordSetup';
import { SessionLock } from './SessionLock';
import { SessionIndicator } from './SessionStatus';
import { MigrationDialog } from './MigrationDialog';
import { logDebug } from '@/lib/utils/logger';

interface EncryptionProviderProps {
  children: React.ReactNode;
}

function EncryptionProviderInner({ children }: EncryptionProviderProps) {
  const { isUnlocked, hasStoredKey, isLoading } = useEncryptionContext();
  logDebug('EncryptionProviderInner render', { isUnlocked, hasStoredKey, isLoading }, 'EncryptionProvider');
  const [showMigration, setShowMigration] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningSeconds, setWarningSeconds] = useState(120);
  const [setupComplete, setSetupComplete] = useState(false);
  
  // Check for migration needs
  useEffect(() => {
    const checkMigration = async () => {
      const needs = await needsMigration();
      if (needs && hasStoredKey) {
        setShowMigration(true);
      }
    };
    
    if (!isLoading) {
      checkMigration();
    }
  }, [hasStoredKey, isLoading]);
  
  // Auto-lock setup
  useAutoLock({
    enabled: true,
    timeoutMinutes: 15,
    warnBeforeMinutes: 2,
    onWarn: () => {
      setShowWarning(true);
      setWarningSeconds(120);
      
      // Countdown timer
      const interval = setInterval(() => {
        setWarningSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onLock: () => {
      setShowWarning(false);
    }
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">暗号化設定を確認中...</p>
        </div>
      </div>
    );
  }
  
  // Migration dialog
  if (showMigration) {
    return (
      <MigrationDialog
        onComplete={() => {
          setShowMigration(false);
          // State will update automatically, no need to reload
        }}
        onSkip={() => setShowMigration(false)}
      />
    );
  }
  
  // Initial setup - no stored key
  if (!hasStoredKey && !setupComplete) {
    return (
      <PasswordSetup
        onComplete={() => {
          setSetupComplete(true);
          // State will update automatically, no need to reload
        }}
      />
    );
  }
  
  // Session locked
  if (!isUnlocked) {
    return (
      <SessionLock
        onUnlock={() => {
          // No need to reload, React state will update automatically
        }}
      />
    );
  }
  
  // Normal app with encryption active
  return (
    <>
      <div className="fixed bottom-20 right-4 z-40">
        <SessionIndicator className="bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-sm border border-gray-200" />
      </div>
      
      {showWarning && (
        <AutoLockWarning
          secondsRemaining={warningSeconds}
          onExtend={() => {
            setShowWarning(false);
            // Timers will reset automatically through useAutoLock hook
          }}
          onDismiss={() => setShowWarning(false)}
        />
      )}
      
      {children}
    </>
  );
}

export function EncryptionProvider({ children }: EncryptionProviderProps) {
  return (
    <EncryptionContextProvider>
      <EncryptionProviderInner>{children}</EncryptionProviderInner>
    </EncryptionContextProvider>
  );
}