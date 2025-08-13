'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useEncryption } from '@/lib/hooks/useEncryption';

type EncryptionContextType = ReturnType<typeof useEncryption>;

const EncryptionContext = createContext<EncryptionContextType | null>(null);

interface EncryptionContextProviderProps {
  children: ReactNode;
}

export function EncryptionContextProvider({ children }: EncryptionContextProviderProps) {
  const encryptionState = useEncryption();
  
  return (
    <EncryptionContext.Provider value={encryptionState}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryptionContext(): EncryptionContextType {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryptionContext must be used within EncryptionContextProvider');
  }
  return context;
}