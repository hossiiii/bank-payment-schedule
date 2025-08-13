import { EncryptionError } from '@/types/database';

// Constants for encryption
const PBKDF2_ITERATIONS = 100000; // High iteration count for security
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 16; // 128 bits for authentication tag

// Types for encrypted data
export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  salt: string; // Base64 encoded salt
  iv: string;   // Base64 encoded initialization vector
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

/**
 * Generates a cryptographically secure random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generates a cryptographically secure random initialization vector
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derives an encryption key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<EncryptionKey> {
  try {
    const actualSalt = salt || generateSalt();
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: actualSalt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // Allow extraction for hashing and dexie-encrypted compatibility
      ['encrypt', 'decrypt']
    );
    
    return { key, salt: actualSalt };
  } catch (error) {
    throw new EncryptionError(
      'Failed to derive encryption key from password',
      error
    );
  }
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(
  data: unknown,
  encryptionKey: CryptoKey,
  iv?: Uint8Array
): Promise<EncryptedData> {
  try {
    const actualIV = iv || generateIV();
    const jsonString = JSON.stringify(data);
    const dataBuffer = new TextEncoder().encode(jsonString);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: actualIV as BufferSource,
        tagLength: TAG_LENGTH * 8 // Convert to bits
      },
      encryptionKey,
      dataBuffer
    );
    
    // Extract encrypted data and authentication tag
    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    return {
      data: arrayBufferToBase64(encryptedArray),
      salt: '', // Salt is managed separately
      iv: arrayBufferToBase64(actualIV)
    };
  } catch (error) {
    throw new EncryptionError('Failed to encrypt data', error);
  }
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData<T = unknown>(
  encryptedData: EncryptedData,
  encryptionKey: CryptoKey
): Promise<T> {
  try {
    const dataBuffer = base64ToArrayBuffer(encryptedData.data);
    const ivBuffer = base64ToArrayBuffer(encryptedData.iv);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
        tagLength: TAG_LENGTH * 8 // Convert to bits
      },
      encryptionKey,
      dataBuffer
    );
    
    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    throw new EncryptionError('Failed to decrypt data', error);
  }
}

/**
 * Encrypts data with password (combines key derivation and encryption)
 */
export async function encryptWithPassword(
  data: unknown,
  password: string
): Promise<EncryptedData> {
  const { key, salt } = await deriveKeyFromPassword(password);
  const encryptedData = await encryptData(data, key);
  
  return {
    ...encryptedData,
    salt: arrayBufferToBase64(salt)
  };
}

/**
 * Decrypts data with password (combines key derivation and decryption)
 */
export async function decryptWithPassword<T = unknown>(
  encryptedData: EncryptedData,
  password: string
): Promise<T> {
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const { key } = await deriveKeyFromPassword(password, new Uint8Array(salt));
  
  return await decryptData<T>(encryptedData, key);
}

/**
 * Validates if a password can decrypt the given encrypted data
 */
export async function validatePassword(
  encryptedData: EncryptedData,
  password: string
): Promise<boolean> {
  try {
    await decryptWithPassword(encryptedData, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const uint8Array = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]!);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const uint8Array = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Securely wipes sensitive data from memory
 * Note: This is a best-effort approach as JavaScript doesn't provide guaranteed memory wiping
 */
export function wipeSensitiveData(data: string | Uint8Array | ArrayBuffer): void {
  if (typeof data === 'string') {
    // Can't directly wipe string in JavaScript, but we can replace references
    return;
  }
  
  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    const view = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    // Fill with random data to overwrite
    crypto.getRandomValues(view);
  }
}

/**
 * Generates a test encrypted payload for password validation
 */
export async function generatePasswordTestPayload(password: string): Promise<EncryptedData> {
  const testData = { test: 'password-validation', timestamp: Date.now() };
  return await encryptWithPassword(testData, password);
}

/**
 * Key management utilities for session storage
 */
export class SessionKeyManager {
  private sessionKey: CryptoKey | null = null;
  private sessionExpiresAt: number | null = null;
  private storedKeyHash: string | null = null;
  private storedSalt: string | null = null;
  
  constructor() {
    // Try to load stored key hash and salt from localStorage
    if (typeof window !== 'undefined') {
      this.storedKeyHash = localStorage.getItem('encryption_key_hash');
      this.storedSalt = localStorage.getItem('encryption_salt');
    }
  }
  
  /**
   * Store the hash of a derived key for later verification
   */
  async storeKeyHash(encryptionKey: EncryptionKey): Promise<void> {
    try {
      // Export the key to raw format for hashing
      const keyData = await crypto.subtle.exportKey('raw', encryptionKey.key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      const hashArray = new Uint8Array(hashBuffer);
      const hashBase64 = arrayBufferToBase64(hashArray);
      const saltBase64 = arrayBufferToBase64(encryptionKey.salt);
      
      this.storedKeyHash = hashBase64;
      this.storedSalt = saltBase64;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('encryption_key_hash', hashBase64);
        localStorage.setItem('encryption_salt', saltBase64);
      }
    } catch (error) {
      throw new EncryptionError('Failed to store key hash', error);
    }
  }
  
  /**
   * Verify if a derived key matches the stored hash
   */
  async verifyKeyHash(encryptionKey: EncryptionKey): Promise<boolean> {
    if (!this.storedKeyHash) {
      return false;
    }
    
    try {
      // Export the key to raw format for hashing
      const keyData = await crypto.subtle.exportKey('raw', encryptionKey.key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      const hashArray = new Uint8Array(hashBuffer);
      const hashBase64 = arrayBufferToBase64(hashArray);
      
      return hashBase64 === this.storedKeyHash;
    } catch (error) {
      throw new EncryptionError('Failed to verify key hash', error);
    }
  }
  
  /**
   * Verify password against stored credentials and return derived key if valid
   */
  async verifyPassword(password: string): Promise<EncryptionKey | null> {
    console.log('SessionKeyManager.verifyPassword called with password length:', password.length);
    console.log('Stored key hash exists:', !!this.storedKeyHash);
    console.log('Stored salt exists:', !!this.storedSalt);
    
    if (!this.storedKeyHash || !this.storedSalt) {
      console.log('Missing stored credentials');
      return null;
    }
    
    try {
      // Use stored salt to derive key from password
      const storedSaltBytes = base64ToArrayBuffer(this.storedSalt);
      console.log('Stored salt bytes length:', storedSaltBytes.byteLength);
      
      const derivedKey = await deriveKeyFromPassword(password, new Uint8Array(storedSaltBytes));
      console.log('Key derived successfully');
      
      // Compare with stored hash
      const isValid = await this.verifyKeyHash(derivedKey);
      console.log('Key hash verification result:', isValid);
      
      return isValid ? derivedKey : null;
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      return null;
    }
  }
  
  /**
   * Check if there's a stored key hash
   */
  async hasStoredKey(): Promise<boolean> {
    return this.storedKeyHash !== null && this.storedSalt !== null;
  }
  
  /**
   * Create a new session with the given key
   */
  async createSession(encryptionKey: EncryptionKey, durationHours: number = 8): Promise<number> {
    this.sessionKey = encryptionKey.key;
    this.sessionExpiresAt = Date.now() + (durationHours * 60 * 60 * 1000);
    return this.sessionExpiresAt;
  }
  
  /**
   * Extend the current session
   */
  async extendSession(additionalMilliseconds: number): Promise<number> {
    if (!this.sessionKey || !this.sessionExpiresAt) {
      throw new EncryptionError('No active session to extend');
    }
    
    this.sessionExpiresAt = Math.max(this.sessionExpiresAt, Date.now()) + additionalMilliseconds;
    return this.sessionExpiresAt;
  }
  
  /**
   * Check if there's an active session
   */
  hasActiveSession(): boolean {
    if (!this.sessionKey || !this.sessionExpiresAt) {
      return false;
    }
    
    if (Date.now() >= this.sessionExpiresAt) {
      this.clearSession();
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the current session key
   */
  getSessionKey(): CryptoKey | null {
    if (!this.hasActiveSession()) {
      return null;
    }
    return this.sessionKey;
  }
  
  /**
   * Get session expiration timestamp
   */
  getSessionExpiration(): number | null {
    if (!this.hasActiveSession()) {
      return null;
    }
    return this.sessionExpiresAt;
  }
  
  /**
   * Clear the current session
   */
  clearSession(): void {
    this.sessionKey = null;
    this.sessionExpiresAt = null;
  }
  
  /**
   * Clear the stored key hash (destructive operation)
   */
  async clearStoredKey(): Promise<void> {
    this.storedKeyHash = null;
    this.storedSalt = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('encryption_key_hash');
      localStorage.removeItem('encryption_salt');
    }
  }
  
  /**
   * Export the current session key as raw bytes for dexie-encrypted compatibility
   * 
   * @returns Raw key as Uint8Array for use with dexie-encrypted middleware
   * @throws EncryptionError if no active session key is available
   */
  async exportRawSessionKey(): Promise<Uint8Array> {
    const sessionKey = this.getSessionKey();
    if (!sessionKey) {
      throw new EncryptionError('No active session key available for export');
    }
    
    try {
      // Export CryptoKey as raw bytes for dexie-encrypted
      const rawKeyBuffer = await crypto.subtle.exportKey('raw', sessionKey);
      return new Uint8Array(rawKeyBuffer);
    } catch (error) {
      throw new EncryptionError(
        'Failed to export session key as raw bytes',
        error
      );
    }
  }
}