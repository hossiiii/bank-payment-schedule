// Don't load dexie-encrypted at module level - will be loaded dynamically when needed

/**
 * Encryption configuration for database tables
 * 
 * Defines which fields are encrypted vs. kept plaintext for indexing.
 * Fields that need to be indexed for queries MUST remain unencrypted.
 */

// Configuration for encrypted/unencrypted fields per table
export const ENCRYPTION_CONFIG = {
  // Banks table
  banks: {
    // Encrypted fields (sensitive data)
    encrypted: ['name', 'memo'],
    // Plaintext fields (needed for indexing and queries)
    plaintext: ['id', 'createdAt']
  },
  
  // Cards table  
  cards: {
    // Encrypted fields (sensitive data)
    encrypted: ['name', 'memo'],
    // Plaintext fields (needed for indexing and queries)
    plaintext: ['id', 'bankId', 'closingDay', 'paymentDay', 'paymentMonthShift', 'adjustWeekend', 'createdAt']
  },
  
  // Transactions table
  transactions: {
    // Encrypted fields (sensitive financial data)
    encrypted: ['storeName', 'usage', 'amount', 'memo'],
    // Plaintext fields (needed for indexing and queries)
    plaintext: ['id', 'date', 'paymentType', 'cardId', 'bankId', 'scheduledPayDate', 'isScheduleEditable', 'createdAt']
  }
} as const;

/**
 * Generate dexie-encrypted configuration for a specific table
 * 
 * @param tableName - Name of the table ('banks', 'cards', 'transactions')
 * @param encrypt - The encrypt object from dexie-encrypted
 * @returns Configuration object for dexie-encrypted middleware
 */
export function getTableEncryptionConfig(tableName: keyof typeof ENCRYPTION_CONFIG, encrypt: any) {
  const config = ENCRYPTION_CONFIG[tableName];
  
  // Return null when encrypt is not available
  if (!encrypt) {
    return null;
  }
  
  // Use UNENCRYPTED_LIST to specify which fields should NOT be encrypted
  // In dexie-encrypted 2.0.0, this should be a configuration object
  return {
    type: encrypt.UNENCRYPTED_LIST,
    fields: config.plaintext
  };
}

/**
 * Generate complete encryption configuration for all tables
 * Used by dexie-encrypted middleware
 * 
 * @param encrypt - The encrypt object from dexie-encrypted
 * @returns Configuration object for all tables
 */
export function generateDexieEncryptionConfig(encrypt: any) {
  if (!encrypt) {
    return {};
  }
  
  return {
    banks: getTableEncryptionConfig('banks', encrypt),
    cards: getTableEncryptionConfig('cards', encrypt), 
    transactions: getTableEncryptionConfig('transactions', encrypt)
  };
}

/**
 * Check if a field is encrypted for a given table
 * 
 * @param tableName - Table name
 * @param fieldName - Field name
 * @returns true if field is encrypted, false if plaintext
 */
export function isFieldEncrypted(
  tableName: keyof typeof ENCRYPTION_CONFIG, 
  fieldName: string
): boolean {
  const config = ENCRYPTION_CONFIG[tableName];
  return config.encrypted.includes(fieldName as any);
}

/**
 * Get all encrypted fields for a table
 * 
 * @param tableName - Table name
 * @returns Array of field names that are encrypted
 */
export function getEncryptedFields(tableName: keyof typeof ENCRYPTION_CONFIG): readonly string[] {
  return ENCRYPTION_CONFIG[tableName].encrypted;
}

/**
 * Get all plaintext fields for a table
 * 
 * @param tableName - Table name  
 * @returns Array of field names that remain unencrypted
 */
export function getPlaintextFields(tableName: keyof typeof ENCRYPTION_CONFIG): readonly string[] {
  return ENCRYPTION_CONFIG[tableName].plaintext;
}

/**
 * Validation: Ensure no field is in both encrypted and plaintext lists
 */
export function validateEncryptionConfig(): void {
  Object.entries(ENCRYPTION_CONFIG).forEach(([tableName, config]) => {
    const duplicates = config.encrypted.filter(field => 
      config.plaintext.includes(field)
    );
    
    if (duplicates.length > 0) {
      throw new Error(
        `Encryption config error for table ${tableName}: ` +
        `Fields cannot be both encrypted and plaintext: ${duplicates.join(', ')}`
      );
    }
  });
}

// Validate configuration on module load
validateEncryptionConfig();