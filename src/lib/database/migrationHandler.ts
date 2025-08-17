/**
 * Database migration error handling utilities
 */

import { 
  DatabaseMigrationError, 
  MigrationErrorAction,
  type MigrationErrorRecoveryOptions 
} from './errors';
import { VersionManager } from './versionManager';
import { logError, logWarn, logInfo } from '@/lib/utils/logger';
import { exportDatabase } from './operations';
import type { PaymentDatabase } from './schema';

/**
 * Handle migration errors with user interaction
 */
export async function handleMigrationError(
  error: DatabaseMigrationError,
  db: PaymentDatabase,
  recoveryOptions?: MigrationErrorRecoveryOptions
): Promise<boolean> {
  logError('Migration error', error.getDetailedInfo(), 'MigrationHandler');
  
  // Record the failed migration
  VersionManager.recordMigration(
    error.fromVersion,
    error.toVersion,
    false,
    error.message
  );
  
  // Show error dialog and get user action
  const action = await showMigrationErrorDialog(error, recoveryOptions);
  
  switch (action) {
    case MigrationErrorAction.BACKUP_AND_RETRY:
      return await backupAndRetry(db, error);
      
    case MigrationErrorAction.RESET_DATABASE:
      return await resetDatabase(db);
      
    case MigrationErrorAction.EXPORT_DATA:
      await exportUserData();
      return false;
      
    case MigrationErrorAction.CANCEL:
    default:
      return false;
  }
}

/**
 * Show migration error dialog (to be integrated with UI)
 */
async function showMigrationErrorDialog(
  error: DatabaseMigrationError,
  _options?: MigrationErrorRecoveryOptions
): Promise<MigrationErrorAction> {
  // This will be replaced with actual dialog implementation
  // For now, we'll use browser confirm/alert
  
  const message = `
${error.getUserMessage()}

選択肢:
1. データをバックアップして再試行
2. データベースをリセット（すべてのデータが削除されます）
3. キャンセル

どの操作を行いますか？（1, 2, または 3）
  `.trim();
  
  const choice = prompt(message);
  
  switch (choice) {
    case '1':
      return MigrationErrorAction.BACKUP_AND_RETRY;
    case '2':
      if (confirm('本当にすべてのデータを削除してもよろしいですか？')) {
        return MigrationErrorAction.RESET_DATABASE;
      }
      return MigrationErrorAction.CANCEL;
    default:
      return MigrationErrorAction.CANCEL;
  }
}

/**
 * Backup data and retry migration
 */
async function backupAndRetry(
  db: PaymentDatabase,
  error: DatabaseMigrationError
): Promise<boolean> {
  try {
    // Create backup
    logInfo('Creating backup before retry...', undefined, 'MigrationHandler');
    const backupData = await exportDatabase();
    
    // Store backup in localStorage
    const backupKey = `db_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    // Record backup
    VersionManager.recordBackup();
    
    // Retry migration
    logInfo('Retrying migration...', undefined, 'MigrationHandler');
    
    // Close and reopen database to retry
    db.close();
    await db.open();
    
    // If successful, record it
    VersionManager.recordMigration(
      error.fromVersion,
      error.toVersion,
      true
    );
    
    // Clean up old backup after successful migration
    localStorage.removeItem(backupKey);
    
    return true;
  } catch (retryError) {
    logError('Retry failed', retryError, 'MigrationHandler');
    
    // Record the retry failure
    VersionManager.recordMigration(
      error.fromVersion,
      error.toVersion,
      false,
      'Retry failed: ' + (retryError as Error).message
    );
    
    alert('再試行に失敗しました。データベースをリセットするか、サポートにお問い合わせください。');
    return false;
  }
}

/**
 * Reset database (delete all data)
 */
async function resetDatabase(db: PaymentDatabase): Promise<boolean> {
  try {
    logInfo('Resetting database...', undefined, 'MigrationHandler');
    
    // Close the database
    db.close();
    
    // Delete the database
    await db.delete();
    
    // Clear all related localStorage items
    VersionManager.clearHistory();
    
    // Clear any cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('db_') || key.includes('PaymentSchedule'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reopen database (will be created fresh)
    await db.open();
    
    alert('データベースがリセットされました。アプリケーションを再読み込みしてください。');
    
    // Reload the page to ensure clean state
    window.location.reload();
    
    return true;
  } catch (resetError) {
    logError('Reset failed', resetError, 'MigrationHandler');
    alert('データベースのリセットに失敗しました。ブラウザのデータをクリアしてください。');
    return false;
  }
}

/**
 * Export user data for manual backup
 */
async function exportUserData(): Promise<void> {
  try {
    const data = await exportDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-schedule-emergency-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    VersionManager.recordBackup();
    
    alert('データがエクスポートされました。このファイルを安全な場所に保管してください。');
  } catch (exportError) {
    logError('Export failed', exportError, 'MigrationHandler');
    alert('データのエクスポートに失敗しました。');
  }
}

/**
 * Check database health and show warnings if needed
 */
export async function checkDatabaseHealth(dbName: string = 'PaymentScheduleDB'): Promise<void> {
  const health = await VersionManager.getDatabaseHealth(dbName);
  
  if (health.status === 'error') {
    logError('Database health check failed', health.issues, 'MigrationHandler');
    
    if (health.issues.length > 0) {
      const message = `
データベースに問題が検出されました:

${health.issues.join('\n')}

${health.recommendations.length > 0 ? '\n推奨事項:\n' + health.recommendations.join('\n') : ''}
      `.trim();
      
      logWarn(message, undefined, 'MigrationHandler');
    }
  } else if (health.status === 'warning') {
    logWarn('Database health warnings', health.recommendations, 'MigrationHandler');
    
    // Show backup recommendation if needed
    if (VersionManager.isBackupRecommended()) {
      logInfo('データのバックアップを作成することをお勧めします（設定 > データ管理）', undefined, 'MigrationHandler');
    }
  }
}

/**
 * Initialize migration error handling
 */
export function initializeMigrationErrorHandling(db: PaymentDatabase): void {
  // Set up global error handler for database errors
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.name === 'DatabaseMigrationError') {
        event.preventDefault();
        handleMigrationError(event.reason, db);
      }
    });
  }
  
  // Check database health on startup
  checkDatabaseHealth().catch((error) => logError('Database health check failed', error, 'MigrationHandler'));
  
  // Set up periodic health checks
  if (typeof window !== 'undefined') {
    setInterval(() => {
      checkDatabaseHealth().catch((error) => logError('Database health check failed', error, 'MigrationHandler'));
    }, 60000); // Check every minute
  }
}