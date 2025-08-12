/**
 * Database version management utilities
 */

import Dexie from 'dexie';

export interface MigrationRecord {
  from: number;
  to: number;
  timestamp: number;
  success: boolean;
  error?: string | undefined;
}

export interface DatabaseInfo {
  name: string;
  version: number | null;
  tables: string[];
  recordCount: Record<string, number>;
  lastModified: number;
}

/**
 * Manages database versioning and migration history
 */
export class VersionManager {
  private static readonly VERSION_KEY = 'db_version_history';
  private static readonly DB_INFO_KEY = 'db_info';
  private static readonly LAST_BACKUP_KEY = 'db_last_backup';
  
  /**
   * Get the current version of the database
   */
  static async getCurrentVersion(dbName: string = 'PaymentScheduleDB'): Promise<number | null> {
    try {
      // Try to open the database without upgrading
      const db = new Dexie(dbName);
      await db.open();
      const version = db.verno;
      db.close();
      return version;
    } catch (error) {
      console.error('Failed to get database version:', error);
      return null;
    }
  }
  
  /**
   * Get detailed database information
   */
  static async getDatabaseInfo(dbName: string = 'PaymentScheduleDB'): Promise<DatabaseInfo | null> {
    try {
      const db = new Dexie(dbName);
      await db.open();
      const version = db.verno;
      const tables = db.tables.map((t: Dexie.Table) => t.name);
      
      const recordCount: Record<string, number> = {};
      for (const table of db.tables) {
        try {
          recordCount[table.name] = await table.count();
        } catch {
          recordCount[table.name] = -1; // Error getting count
        }
      }
      
      db.close();
      
      const info: DatabaseInfo = {
        name: dbName,
        version,
        tables,
        recordCount,
        lastModified: Date.now()
      };
      
      // Cache the info
      localStorage.setItem(this.DB_INFO_KEY, JSON.stringify(info));
      
      return info;
    } catch (error) {
      console.error('Failed to get database info:', error);
      
      // Try to return cached info if available
      const cached = localStorage.getItem(this.DB_INFO_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
      
      return null;
    }
  }
  
  /**
   * Record a migration attempt
   */
  static recordMigration(
    fromVersion: number,
    toVersion: number,
    success: boolean,
    error?: string
  ): void {
    const history = this.getMigrationHistory();
    
    const record: MigrationRecord = {
      from: fromVersion,
      to: toVersion,
      timestamp: Date.now(),
      success,
      error
    };
    
    history.push(record);
    
    // Keep only last 50 migration records
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(history));
  }
  
  /**
   * Get migration history
   */
  static getMigrationHistory(): MigrationRecord[] {
    try {
      const history = localStorage.getItem(this.VERSION_KEY);
      if (!history) return [];
      return JSON.parse(history);
    } catch (error) {
      console.error('Failed to parse migration history:', error);
      return [];
    }
  }
  
  /**
   * Get the last successful migration
   */
  static getLastSuccessfulMigration(): MigrationRecord | null {
    const history = this.getMigrationHistory();
    const successful = history.filter(r => r.success);
    if (successful.length > 0) {
      return successful[successful.length - 1] || null;
    }
    return null;
  }
  
  /**
   * Get failed migrations
   */
  static getFailedMigrations(): MigrationRecord[] {
    return this.getMigrationHistory().filter(r => !r.success);
  }
  
  /**
   * Clear migration history
   */
  static clearHistory(): void {
    localStorage.removeItem(this.VERSION_KEY);
  }
  
  /**
   * Check if a migration is needed
   */
  static async isMigrationNeeded(
    currentVersion: number,
    dbName: string = 'PaymentScheduleDB'
  ): Promise<boolean> {
    const existingVersion = await this.getCurrentVersion(dbName);
    if (existingVersion === null) {
      // Database doesn't exist yet
      return false;
    }
    return existingVersion < currentVersion;
  }
  
  /**
   * Record the last backup time
   */
  static recordBackup(): void {
    localStorage.setItem(this.LAST_BACKUP_KEY, Date.now().toString());
  }
  
  /**
   * Get the last backup time
   */
  static getLastBackupTime(): number | null {
    const time = localStorage.getItem(this.LAST_BACKUP_KEY);
    return time ? parseInt(time, 10) : null;
  }
  
  /**
   * Check if a backup is recommended (older than 7 days)
   */
  static isBackupRecommended(): boolean {
    const lastBackup = this.getLastBackupTime();
    if (!lastBackup) return true;
    
    const daysSinceBackup = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
    return daysSinceBackup > 7;
  }
  
  /**
   * Get a summary of database health
   */
  static async getDatabaseHealth(dbName: string = 'PaymentScheduleDB'): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    
    // Check version
    const version = await this.getCurrentVersion(dbName);
    if (version === null) {
      issues.push('データベースにアクセスできません');
      status = 'error';
    }
    
    // Check migration history
    const failedMigrations = this.getFailedMigrations();
    if (failedMigrations.length > 0) {
      issues.push(`過去に${failedMigrations.length}回のマイグレーションが失敗しています`);
      status = status === 'error' ? 'error' : 'warning';
    }
    
    // Check backup status
    if (this.isBackupRecommended()) {
      recommendations.push('データのバックアップを作成することをお勧めします');
      status = status === 'error' ? 'error' : 'warning';
    }
    
    // Check database info
    const info = await this.getDatabaseInfo(dbName);
    if (info) {
      // Check for large tables
      for (const [table, count] of Object.entries(info.recordCount)) {
        if (count > 10000) {
          recommendations.push(`${table}テーブルに多くのレコード（${count}件）があります。パフォーマンスに影響する可能性があります`);
          status = status === 'error' ? 'error' : 'warning';
        }
      }
    }
    
    return {
      status,
      issues,
      recommendations
    };
  }
}