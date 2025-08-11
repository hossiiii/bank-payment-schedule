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
        salt: actualSalt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // Not extractable for security
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
        iv: actualIV,
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
  const { key } = await deriveKeyFromPassword(password, salt);
  
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
    binary += String.fromCharCode(uint8Array[i]);
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
  private static instance: SessionKeyManager;
  private encryptionKey: CryptoKey | null = null;
  private keyDerivationSalt: Uint8Array | null = null;
  
  private constructor() {}
  
  static getInstance(): SessionKeyManager {
    if (!SessionKeyManager.instance) {
      SessionKeyManager.instance = new SessionKeyManager();
    }
    return SessionKeyManager.instance;
  }
  
  async initializeWithPassword(password: string, salt?: Uint8Array): Promise<void> {
    const { key, salt: derivedSalt } = await deriveKeyFromPassword(password, salt);
    this.encryptionKey = key;
    this.keyDerivationSalt = derivedSalt;
  }
  
  getEncryptionKey(): CryptoKey {
    if (!this.encryptionKey) {
      throw new EncryptionError('Encryption key not initialized');
    }
    return this.encryptionKey;
  }
  
  getKeySalt(): Uint8Array {
    if (!this.keyDerivationSalt) {
      throw new EncryptionError('Key salt not available');
    }
    return this.keyDerivationSalt;
  }
  
  isInitialized(): boolean {
    return this.encryptionKey !== null;
  }
  
  clear(): void {
    this.encryptionKey = null;
    if (this.keyDerivationSalt) {
      wipeSensitiveData(this.keyDerivationSalt);
      this.keyDerivationSalt = null;
    }
  }
}