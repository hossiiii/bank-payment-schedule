/**
 * Database migration and error handling utilities
 */

/**
 * Custom error class for database migration failures
 */
export class DatabaseMigrationError extends Error {
  constructor(
    message: string,
    public fromVersion: number,
    public toVersion: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseMigrationError';
    
    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseMigrationError);
    }
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    return `データベースの更新中にエラーが発生しました（v${this.fromVersion} → v${this.toVersion}）`;
  }

  /**
   * Get detailed error information for logging
   */
  getDetailedInfo() {
    return {
      name: this.name,
      message: this.message,
      fromVersion: this.fromVersion,
      toVersion: this.toVersion,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

/**
 * Error class for database initialization failures
 */
export class DatabaseInitializationError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseInitializationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseInitializationError);
    }
  }

  getUserMessage(): string {
    return 'データベースの初期化に失敗しました。ブラウザの設定を確認してください。';
  }
}

/**
 * Error class for data validation failures
 */
export class DataValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'DataValidationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataValidationError);
    }
  }

  getUserMessage(): string {
    if (this.field) {
      return `データの検証に失敗しました（フィールド: ${this.field}）`;
    }
    return 'データの検証に失敗しました';
  }
}

/**
 * User action types for migration error handling
 */
export enum MigrationErrorAction {
  BACKUP_AND_RETRY = 'backup_and_retry',
  RESET_DATABASE = 'reset_database',
  CANCEL = 'cancel',
  EXPORT_DATA = 'export_data'
}

/**
 * Migration error recovery options
 */
export interface MigrationErrorRecoveryOptions {
  allowBackup: boolean;
  allowReset: boolean;
  allowExport: boolean;
  customMessage?: string;
}