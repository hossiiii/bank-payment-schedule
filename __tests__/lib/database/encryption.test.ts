import {
  generateSalt,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  SessionKeyManager
} from '@/lib/database/encryption';

describe('encryption', () => {
  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toHaveLength(32); // 16 bytes * 2 (hex)
    });

    it('should generate different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });

    it('should generate hex strings', () => {
      const salt = generateSalt();
      expect(salt).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe('deriveKeyFromPassword', () => {
    it('should derive a key from password', async () => {
      const key = await deriveKeyFromPassword('testPassword123');
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should derive the same key for the same password and salt', async () => {
      const salt = generateSalt();
      const key1 = await deriveKeyFromPassword('password', salt);
      const key2 = await deriveKeyFromPassword('password', salt);
      
      // Export both keys to compare
      const rawKey1 = await crypto.subtle.exportKey('raw', key1);
      const rawKey2 = await crypto.subtle.exportKey('raw', key2);
      
      expect(new Uint8Array(rawKey1)).toEqual(new Uint8Array(rawKey2));
    });

    it('should derive different keys for different passwords', async () => {
      const salt = generateSalt();
      const key1 = await deriveKeyFromPassword('password1', salt);
      const key2 = await deriveKeyFromPassword('password2', salt);
      
      const rawKey1 = await crypto.subtle.exportKey('raw', key1);
      const rawKey2 = await crypto.subtle.exportKey('raw', key2);
      
      expect(new Uint8Array(rawKey1)).not.toEqual(new Uint8Array(rawKey2));
    });

    it('should derive different keys for different salts', async () => {
      const key1 = await deriveKeyFromPassword('password', generateSalt());
      const key2 = await deriveKeyFromPassword('password', generateSalt());
      
      const rawKey1 = await crypto.subtle.exportKey('raw', key1);
      const rawKey2 = await crypto.subtle.exportKey('raw', key2);
      
      expect(new Uint8Array(rawKey1)).not.toEqual(new Uint8Array(rawKey2));
    });
  });

  describe('encryptData and decryptData', () => {
    let testKey: CryptoKey;

    beforeEach(async () => {
      testKey = await deriveKeyFromPassword('testPassword123');
    });

    it('should encrypt and decrypt simple data', async () => {
      const originalData = { message: 'Hello World', number: 42 };
      
      const encrypted = await encryptData(originalData, testKey);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.iv).toHaveLength(24); // 12 bytes * 2 (hex)
      
      const decrypted = await decryptData<typeof originalData>(encrypted, testKey);
      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt complex data structures', async () => {
      const originalData = {
        banks: [
          { id: '1', name: '銀行A', memo: 'メモA' },
          { id: '2', name: '銀行B', memo: null }
        ],
        cards: {
          card1: { name: 'カード1', amount: 1000 },
          card2: { name: 'カード2', amount: 2500.50 }
        },
        metadata: {
          created: new Date().toISOString(),
          version: 1
        }
      };
      
      const encrypted = await encryptData(originalData, testKey);
      const decrypted = await decryptData<typeof originalData>(encrypted, testKey);
      
      expect(decrypted).toEqual(originalData);
    });

    it('should handle null and undefined values', async () => {
      const originalData = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroNumber: 0,
        emptyArray: [],
        emptyObject: {}
      };
      
      const encrypted = await encryptData(originalData, testKey);
      const decrypted = await decryptData<typeof originalData>(encrypted, testKey);
      
      expect(decrypted).toEqual({
        nullValue: null,
        undefinedValue: null, // undefined becomes null in JSON
        emptyString: '',
        zeroNumber: 0,
        emptyArray: [],
        emptyObject: {}
      });
    });

    it('should generate different encrypted data for same input', async () => {
      const originalData = { test: 'data' };
      
      const encrypted1 = await encryptData(originalData, testKey);
      const encrypted2 = await encryptData(originalData, testKey);
      
      // Different IVs should result in different encrypted data
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.data).not.toBe(encrypted2.data);
      
      // But both should decrypt to the same original data
      const decrypted1 = await decryptData<typeof originalData>(encrypted1, testKey);
      const decrypted2 = await decryptData<typeof originalData>(encrypted2, testKey);
      
      expect(decrypted1).toEqual(originalData);
      expect(decrypted2).toEqual(originalData);
    });

    it('should fail to decrypt with wrong key', async () => {
      const originalData = { secret: 'data' };
      const wrongKey = await deriveKeyFromPassword('wrongPassword');
      
      const encrypted = await encryptData(originalData, testKey);
      
      await expect(decryptData(encrypted, wrongKey)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered data', async () => {
      const originalData = { secret: 'data' };
      
      const encrypted = await encryptData(originalData, testKey);
      
      // Tamper with the encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        data: encrypted.data.slice(0, -2) + '00' // Change last 2 chars
      };
      
      await expect(decryptData(tamperedEncrypted, testKey)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered IV', async () => {
      const originalData = { secret: 'data' };
      
      const encrypted = await encryptData(originalData, testKey);
      
      // Tamper with the IV
      const tamperedEncrypted = {
        ...encrypted,
        iv: encrypted.iv.slice(0, -2) + '00'
      };
      
      await expect(decryptData(tamperedEncrypted, testKey)).rejects.toThrow();
    });
  });

  describe('SessionKeyManager', () => {
    let sessionManager: SessionKeyManager;
    let testKey: CryptoKey;

    beforeEach(async () => {
      sessionManager = new SessionKeyManager();
      testKey = await deriveKeyFromPassword('testPassword123');
      
      // Clear localStorage
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    describe('key hash storage', () => {
      it('should store and verify key hash', async () => {
        await sessionManager.storeKeyHash(testKey);
        const isValid = await sessionManager.verifyKeyHash(testKey);
        expect(isValid).toBe(true);
      });

      it('should verify stored key exists', async () => {
        expect(await sessionManager.hasStoredKey()).toBe(false);
        
        await sessionManager.storeKeyHash(testKey);
        expect(await sessionManager.hasStoredKey()).toBe(true);
      });

      it('should reject wrong key', async () => {
        const wrongKey = await deriveKeyFromPassword('wrongPassword');
        
        await sessionManager.storeKeyHash(testKey);
        const isValid = await sessionManager.verifyKeyHash(wrongKey);
        expect(isValid).toBe(false);
      });

      it('should clear stored key', async () => {
        await sessionManager.storeKeyHash(testKey);
        expect(await sessionManager.hasStoredKey()).toBe(true);
        
        await sessionManager.clearStoredKey();
        expect(await sessionManager.hasStoredKey()).toBe(false);
      });
    });

    describe('session management', () => {
      it('should create and manage session', async () => {
        expect(sessionManager.hasActiveSession()).toBe(false);
        
        const expiresAt = await sessionManager.createSession(testKey);
        
        expect(sessionManager.hasActiveSession()).toBe(true);
        expect(sessionManager.getSessionKey()).toBe(testKey);
        expect(sessionManager.getSessionExpiration()).toBe(expiresAt);
        expect(expiresAt).toBeGreaterThan(Date.now());
      });

      it('should clear session', async () => {
        await sessionManager.createSession(testKey);
        expect(sessionManager.hasActiveSession()).toBe(true);
        
        sessionManager.clearSession();
        expect(sessionManager.hasActiveSession()).toBe(false);
        expect(sessionManager.getSessionKey()).toBeNull();
        expect(sessionManager.getSessionExpiration()).toBeNull();
      });

      it('should extend session', async () => {
        const originalExpiration = await sessionManager.createSession(testKey);
        
        // Wait a bit to ensure time difference
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const extensionTime = 60 * 60 * 1000; // 1 hour
        const newExpiration = await sessionManager.extendSession(extensionTime);
        
        expect(newExpiration).toBeGreaterThan(originalExpiration);
        expect(newExpiration - originalExpiration).toBeGreaterThanOrEqual(extensionTime - 100); // Allow small margin
      });

      it('should handle session expiration', async () => {
        // Create session with short expiration
        const shortExpiration = Date.now() + 100; // 100ms
        await sessionManager.createSession(testKey, shortExpiration);
        
        expect(sessionManager.hasActiveSession()).toBe(true);
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 150));
        
        expect(sessionManager.hasActiveSession()).toBe(false);
        expect(sessionManager.getSessionKey()).toBeNull();
      });

      it('should throw error when extending non-existent session', async () => {
        expect(() => sessionManager.extendSession(3600000)).toThrow();
      });

      it('should throw error when getting session key without active session', async () => {
        expect(() => sessionManager.getSessionKey()).toThrow();
      });
    });

    describe('error handling', () => {
      it('should handle corrupted key hash in localStorage', async () => {
        // Manually corrupt the stored hash
        localStorage.setItem('paymentSchedule_keyHash', 'corrupted-hash');
        
        expect(await sessionManager.hasStoredKey()).toBe(true);
        
        // Verification should fail gracefully
        const isValid = await sessionManager.verifyKeyHash(testKey);
        expect(isValid).toBe(false);
      });

      it('should handle missing localStorage', async () => {
        // Mock localStorage to be unavailable
        const originalLocalStorage = global.localStorage;
        delete (global as any).localStorage;
        
        const manager = new SessionKeyManager();
        
        // Should not crash
        expect(await manager.hasStoredKey()).toBe(false);
        await expect(manager.storeKeyHash(testKey)).rejects.toThrow();
        
        // Restore localStorage
        global.localStorage = originalLocalStorage;
      });
    });
  });
});