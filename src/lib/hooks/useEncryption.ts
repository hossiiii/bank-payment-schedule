'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SessionKeyManager, 
  deriveKeyFromPassword, 
  encryptData, 
  decryptData,
  type EncryptedData 
} from '@/lib/database/encryption';
import { DatabaseOperationError } from '@/types/database';

/**
 * Encryption hook state interfaces
 */
interface EncryptionState {
  isUnlocked: boolean;
  hasStoredKey: boolean;
  sessionExpiresAt: number | null;
  isLoading: boolean;
  error: Error | null;
}

interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

/**
 * Custom hook for managing encryption keys and session state
 * 
 * Provides utilities for:
 * - Password-based key derivation
 * - Session key management  
 * - Encryption/decryption operations
 * - Automatic session expiration
 */
export function useEncryption() {
  const [state, setState] = useState<EncryptionState>({
    isUnlocked: false,
    hasStoredKey: false,
    sessionExpiresAt: null,
    isLoading: false,
    error: null
  });
  
  const sessionManagerRef = useRef<SessionKeyManager | null>(null);
  const expirationTimerRef = useRef<NodeJS.Timeout>();
  
  // Initialize session manager and check for existing keys
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        sessionManagerRef.current = new SessionKeyManager();
        
        // Check if there's a stored key hash (user has set up encryption)
        const hasStoredKey = await sessionManagerRef.current.hasStoredKey();
        
        // Check if session is already active
        const isUnlocked = sessionManagerRef.current.hasActiveSession();
        const sessionExpiresAt = sessionManagerRef.current.getSessionExpiration();
        
        setState({
          isUnlocked,
          hasStoredKey,
          sessionExpiresAt,
          isLoading: false,
          error: null
        });
        
        // Set up expiration timer if session is active
        if (isUnlocked && sessionExpiresAt) {
          setupExpirationTimer(sessionExpiresAt);
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize encryption')
        }));
      }
    };
    
    initializeSession();
    
    // Cleanup timer on unmount
    return () => {
      if (expirationTimerRef.current) {
        clearTimeout(expirationTimerRef.current);
      }
    };
  }, []);
  
  // Setup automatic session expiration
  const setupExpirationTimer = useCallback((expiresAt: number) => {
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
    }
    
    const timeUntilExpiration = expiresAt - Date.now();
    if (timeUntilExpiration > 0) {
      expirationTimerRef.current = setTimeout(() => {
        handleSessionExpiration();
      }, timeUntilExpiration);
    }
  }, []);
  
  // Handle session expiration
  const handleSessionExpiration = useCallback(() => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.clearSession();
    }
    
    setState(prev => ({
      ...prev,
      isUnlocked: false,
      sessionExpiresAt: null
    }));
    
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
    }
  }, []);
  
  // Setup initial password and key
  const setupEncryption = useCallback(async (password: string): Promise<void> => {
    if (!sessionManagerRef.current) {
      throw new Error('Session manager not initialized');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Validate password strength
      const validation = validatePassword(password);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Derive key and setup session
      const derivedKey = await deriveKeyFromPassword(password);
      await sessionManagerRef.current.storeKeyHash(derivedKey);
      const expiresAt = await sessionManagerRef.current.createSession(derivedKey);
      
      setState({
        isUnlocked: true,
        hasStoredKey: true,
        sessionExpiresAt: expiresAt,
        isLoading: false,
        error: null
      });
      
      setupExpirationTimer(expiresAt);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to setup encryption')
      }));
      throw error;
    }
  }, [setupExpirationTimer]);
  
  // Unlock existing encryption with password
  const unlock = useCallback(async (password: string): Promise<void> => {
    if (!sessionManagerRef.current) {
      throw new Error('Session manager not initialized');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Derive key and verify against stored hash
      const derivedKey = await deriveKeyFromPassword(password);
      const isValid = await sessionManagerRef.current.verifyKeyHash(derivedKey);
      
      if (!isValid) {
        throw new Error('Invalid password');
      }
      
      // Create new session
      const expiresAt = await sessionManagerRef.current.createSession(derivedKey);
      
      setState({
        isUnlocked: true,
        hasStoredKey: true,
        sessionExpiresAt: expiresAt,
        isLoading: false,
        error: null
      });
      
      setupExpirationTimer(expiresAt);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to unlock encryption')
      }));
      throw error;
    }
  }, [setupExpirationTimer]);
  
  // Lock the session manually
  const lock = useCallback(async (): Promise<void> => {
    if (!sessionManagerRef.current) {
      return;
    }
    
    try {
      sessionManagerRef.current.clearSession();
      
      setState(prev => ({
        ...prev,
        isUnlocked: false,
        sessionExpiresAt: null
      }));
      
      if (expirationTimerRef.current) {
        clearTimeout(expirationTimerRef.current);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to lock session')
      }));
    }
  }, []);
  
  // Change encryption password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!sessionManagerRef.current) {
      throw new Error('Session manager not initialized');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Validate new password
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Verify current password
      const currentKey = await deriveKeyFromPassword(currentPassword);
      const isCurrentValid = await sessionManagerRef.current.verifyKeyHash(currentKey);
      
      if (!isCurrentValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Generate new key and update stored hash
      const newKey = await deriveKeyFromPassword(newPassword);
      await sessionManagerRef.current.storeKeyHash(newKey);
      
      // Create new session with new key
      const expiresAt = await sessionManagerRef.current.createSession(newKey);
      
      setState(prev => ({
        ...prev,
        sessionExpiresAt: expiresAt,
        isLoading: false,
        error: null
      }));
      
      setupExpirationTimer(expiresAt);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to change password')
      }));
      throw error;
    }
  }, [setupExpirationTimer]);
  
  // Extend current session
  const extendSession = useCallback(async (additionalHours: number = 1): Promise<void> => {
    if (!sessionManagerRef.current || !state.isUnlocked) {
      throw new Error('No active session to extend');
    }
    
    try {
      const newExpiresAt = await sessionManagerRef.current.extendSession(additionalHours * 60 * 60 * 1000);
      
      setState(prev => ({
        ...prev,
        sessionExpiresAt: newExpiresAt
      }));
      
      setupExpirationTimer(newExpiresAt);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to extend session')
      }));
      throw error;
    }
  }, [state.isUnlocked, setupExpirationTimer]);
  
  // Encrypt data utility
  const encrypt = useCallback(async (data: unknown): Promise<EncryptedData> => {
    if (!sessionManagerRef.current || !state.isUnlocked) {
      throw new Error('Encryption session not available');
    }
    
    try {
      const sessionKey = sessionManagerRef.current.getSessionKey();
      if (!sessionKey) {
        throw new Error('No session key available');
      }
      
      return await encryptData(data, sessionKey);
    } catch (error) {
      throw new DatabaseOperationError('Failed to encrypt data', error);
    }
  }, [state.isUnlocked]);
  
  // Decrypt data utility
  const decrypt = useCallback(async <T>(encryptedData: EncryptedData): Promise<T> => {
    if (!sessionManagerRef.current || !state.isUnlocked) {
      throw new Error('Encryption session not available');
    }
    
    try {
      const sessionKey = sessionManagerRef.current.getSessionKey();
      if (!sessionKey) {
        throw new Error('No session key available');
      }
      
      return await decryptData<T>(encryptedData, sessionKey);
    } catch (error) {
      throw new DatabaseOperationError('Failed to decrypt data', error);
    }
  }, [state.isUnlocked]);
  
  // Get session info
  const getSessionInfo = useCallback(() => {
    if (!sessionManagerRef.current || !state.sessionExpiresAt) {
      return null;
    }
    
    const now = Date.now();
    const timeRemaining = state.sessionExpiresAt - now;
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));
    
    return {
      expiresAt: new Date(state.sessionExpiresAt),
      timeRemaining,
      minutesRemaining,
      isExpiringSoon: minutesRemaining <= 5
    };
  }, [state.sessionExpiresAt]);
  
  // Reset all encryption data (destructive operation)
  const resetEncryption = useCallback(async (): Promise<void> => {
    if (!sessionManagerRef.current) {
      throw new Error('Session manager not initialized');
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Clear all stored keys and session
      sessionManagerRef.current.clearSession();
      await sessionManagerRef.current.clearStoredKey();
      
      setState({
        isUnlocked: false,
        hasStoredKey: false,
        sessionExpiresAt: null,
        isLoading: false,
        error: null
      });
      
      if (expirationTimerRef.current) {
        clearTimeout(expirationTimerRef.current);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to reset encryption')
      }));
      throw error;
    }
  }, []);
  
  return {
    // State
    isUnlocked: state.isUnlocked,
    hasStoredKey: state.hasStoredKey,
    sessionExpiresAt: state.sessionExpiresAt,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    setupEncryption,
    unlock,
    lock,
    changePassword,
    extendSession,
    resetEncryption,
    
    // Utilities
    encrypt,
    decrypt,
    getSessionInfo
  };
}

/**
 * Password validation utility
 */
function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (!password || password.length === 0) {
    errors.push('パスワードは必須です');
    return { isValid: false, strength, errors };
  }
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上で入力してください');
  }
  
  if (password.length > 128) {
    errors.push('パスワードは128文字以下で入力してください');
  }
  
  // Check for character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
  
  const varietyCount = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
  
  if (varietyCount >= 3 && password.length >= 12) {
    strength = 'strong';
  } else if (varietyCount >= 2 && password.length >= 8) {
    strength = 'medium';
  }
  
  if (errors.length === 0 && strength === 'weak') {
    errors.push('パスワードが弱すぎます。大文字、小文字、数字、記号を組み合わせてください');
  }
  
  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}

/**
 * Hook for checking password strength without validation
 */
export function usePasswordStrength(password: string) {
  const validation = validatePassword(password);
  
  return {
    strength: validation.strength,
    isValid: validation.isValid,
    errors: validation.errors,
    suggestions: generatePasswordSuggestions(password, validation.strength)
  };
}

/**
 * Generate helpful password suggestions
 */
function generatePasswordSuggestions(password: string, strength: 'weak' | 'medium' | 'strong'): string[] {
  const suggestions: string[] = [];
  
  if (strength === 'strong') {
    return ['パスワードは強固です'];
  }
  
  if (password.length < 12) {
    suggestions.push('12文字以上にするとより安全です');
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('小文字を含めてください');
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('大文字を含めてください');
  }
  
  if (!/\d/.test(password)) {
    suggestions.push('数字を含めてください');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    suggestions.push('記号を含めてください');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('同じ文字の連続は避けてください');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    suggestions.push('連続する文字や数字は避けてください');
  }
  
  return suggestions;
}