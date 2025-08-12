# IndexedDB スキーマ変更問題と対策

## 現状の問題点

現在、本アプリケーションはIndexedDBをデータストレージとして使用しており、Dexie.js（v3.2.4）を通じてアクセスしています。しかし、スキーマを変更した際に既存のブラウザにデータが保存されている場合、以下の問題が発生する可能性があります。

### 主な問題

1. **バージョン管理の不足**
   - 現在のバージョン（v11）は単一のアップグレード関数のみを持つ
   - 過去のバージョン（v1-10）の履歴が記録されていない
   - どのバージョンからの移行かを判別できない

2. **不完全なマイグレーション処理**
   - 新しいフィールドの追加には対応しているが、削除や型変更には未対応
   - エラー処理が不十分で、マイグレーション失敗時の復旧手段がない
   - データ整合性の検証が行われていない

3. **ユーザー体験への影響**
   - スキーマエラーが発生した場合、アプリが正常に動作しない
   - データの不整合により、予期しない動作が発生する可能性
   - エラーメッセージが技術的で、ユーザーには理解しづらい

## 原因分析

### 技術的原因

```typescript
// 現在の実装（src/lib/database/schema.ts）
const CURRENT_VERSION = 11;

this.version(CURRENT_VERSION)
  .stores({
    banks: 'id, name, createdAt',
    cards: 'id, name, bankId, createdAt',
    transactions: 'id, date, paymentType, cardId, bankId, scheduledPayDate, createdAt'
  })
  .upgrade(tx => {
    // 単一のアップグレード関数で全バージョンからの移行を処理
    // これでは複雑な移行シナリオに対応できない
  });
```

### 根本原因

1. **開発初期の設計不足**: マイグレーション戦略を考慮せずに開発を進めた
2. **バージョン履歴の欠如**: 各バージョンでの変更内容が記録されていない
3. **テスト不足**: マイグレーションパスのテストが実装されていない

## 対策プラン

### Phase 1: 即座に実施すべき対策（1-2日）

#### 1.1 エラーハンドリングの強化

```typescript
// src/lib/database/schema.ts に追加
class DatabaseMigrationError extends Error {
  constructor(
    message: string,
    public fromVersion: number,
    public toVersion: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseMigrationError';
  }
}

// マイグレーションエラー時の処理
async function handleMigrationError(error: DatabaseMigrationError) {
  console.error('Migration failed:', error);
  
  // ユーザーに選択肢を提供
  const userChoice = await showMigrationErrorDialog({
    message: 'データベースの更新に失敗しました',
    options: [
      'データをバックアップして再試行',
      'データをリセットして続行',
      'キャンセル'
    ]
  });
  
  switch(userChoice) {
    case 'backup':
      await exportDatabase();
      // 再試行ロジック
      break;
    case 'reset':
      await resetDatabase();
      break;
    case 'cancel':
      throw error;
  }
}
```

#### 1.2 バージョン検出とログ記録

```typescript
// src/lib/database/versionManager.ts（新規作成）
export class VersionManager {
  private static readonly VERSION_KEY = 'db_version_history';
  
  static async getCurrentVersion(): Promise<number | null> {
    try {
      const db = await Dexie.open('PaymentScheduleDB');
      return db.verno;
    } catch {
      return null;
    }
  }
  
  static async recordMigration(fromVersion: number, toVersion: number) {
    const history = JSON.parse(
      localStorage.getItem(this.VERSION_KEY) || '[]'
    );
    
    history.push({
      from: fromVersion,
      to: toVersion,
      timestamp: Date.now(),
      success: true
    });
    
    localStorage.setItem(this.VERSION_KEY, JSON.stringify(history));
  }
}
```

### Phase 2: 短期的な改善（1週間）

#### 2.1 段階的マイグレーション戦略の実装

```typescript
// src/lib/database/migrations/index.ts（新規作成）
interface Migration {
  version: number;
  description: string;
  upgrade: (tx: Dexie.Transaction) => Promise<void>;
  validate?: () => Promise<boolean>;
}

export const migrations: Migration[] = [
  {
    version: 12,
    description: 'Add payment status field to transactions',
    upgrade: async (tx) => {
      await tx.table('transactions').toCollection().modify(transaction => {
        if (!transaction.paymentStatus) {
          transaction.paymentStatus = 'pending';
        }
      });
    },
    validate: async () => {
      // 全てのトランザクションにpaymentStatusが存在することを確認
      const db = new PaymentScheduleDB();
      const invalidRecords = await db.transactions
        .filter(t => !t.paymentStatus)
        .count();
      return invalidRecords === 0;
    }
  },
  // 将来のマイグレーションをここに追加
];

// マイグレーション実行ロジック
export async function runMigrations(db: PaymentScheduleDB) {
  const currentVersion = await VersionManager.getCurrentVersion();
  
  for (const migration of migrations) {
    if (!currentVersion || migration.version > currentVersion) {
      try {
        console.log(`Running migration v${migration.version}: ${migration.description}`);
        
        await db.version(migration.version)
          .upgrade(migration.upgrade);
        
        if (migration.validate) {
          const isValid = await migration.validate();
          if (!isValid) {
            throw new Error(`Validation failed for migration v${migration.version}`);
          }
        }
        
        await VersionManager.recordMigration(
          currentVersion || 0,
          migration.version
        );
        
      } catch (error) {
        throw new DatabaseMigrationError(
          `Migration to v${migration.version} failed`,
          currentVersion || 0,
          migration.version,
          error as Error
        );
      }
    }
  }
}
```

#### 2.2 データバックアップ機能の強化

```typescript
// src/lib/database/backup.ts（拡張）
export class DatabaseBackup {
  private static readonly BACKUP_KEY = 'db_backups';
  private static readonly MAX_BACKUPS = 5;
  
  static async createAutomaticBackup(reason: string = 'migration') {
    const data = await exportDatabase();
    const backups = this.getBackups();
    
    backups.unshift({
      timestamp: Date.now(),
      reason,
      data,
      version: CURRENT_VERSION
    });
    
    // 古いバックアップを削除
    if (backups.length > this.MAX_BACKUPS) {
      backups.pop();
    }
    
    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
  }
  
  static async restoreFromBackup(timestamp: number) {
    const backups = this.getBackups();
    const backup = backups.find(b => b.timestamp === timestamp);
    
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    await importDatabase(backup.data);
  }
  
  private static getBackups() {
    return JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
  }
}
```

### Phase 3: 長期的な改善（1ヶ月）

#### 3.1 スキーマバージョニングシステムの構築

```typescript
// src/lib/database/schema/versioning.ts
export class SchemaVersioning {
  private static schemas = new Map<number, SchemaDefinition>();
  
  static registerSchema(version: number, schema: SchemaDefinition) {
    this.schemas.set(version, schema);
  }
  
  static getSchema(version: number): SchemaDefinition | undefined {
    return this.schemas.get(version);
  }
  
  static getDifference(fromVersion: number, toVersion: number): SchemaDiff {
    const fromSchema = this.getSchema(fromVersion);
    const toSchema = this.getSchema(toVersion);
    
    if (!fromSchema || !toSchema) {
      throw new Error('Schema version not found');
    }
    
    return {
      addedTables: this.getAddedTables(fromSchema, toSchema),
      removedTables: this.getRemovedTables(fromSchema, toSchema),
      modifiedTables: this.getModifiedTables(fromSchema, toSchema)
    };
  }
  
  private static getAddedTables(from: SchemaDefinition, to: SchemaDefinition) {
    // 実装省略
  }
  
  private static getRemovedTables(from: SchemaDefinition, to: SchemaDefinition) {
    // 実装省略
  }
  
  private static getModifiedTables(from: SchemaDefinition, to: SchemaDefinition) {
    // 実装省略
  }
}
```

#### 3.2 マイグレーションテストの自動化

```typescript
// __tests__/database/migrations.test.ts
describe('Database Migrations', () => {
  let testDb: PaymentScheduleDB;
  
  beforeEach(async () => {
    // テスト用の新しいデータベースを作成
    testDb = new PaymentScheduleDB('TestDB');
  });
  
  afterEach(async () => {
    await testDb.delete();
  });
  
  test('Migration from v11 to v12', async () => {
    // v11のデータを準備
    await setupV11Data(testDb);
    
    // マイグレーション実行
    await runMigration(testDb, 11, 12);
    
    // データの検証
    const transactions = await testDb.transactions.toArray();
    transactions.forEach(tx => {
      expect(tx).toHaveProperty('paymentStatus');
      expect(tx.paymentStatus).toBe('pending');
    });
  });
  
  test('Migration rollback on error', async () => {
    // エラーを発生させるマイグレーション
    const errorMigration = {
      version: 99,
      upgrade: async () => {
        throw new Error('Test error');
      }
    };
    
    await expect(runMigration(testDb, 11, 99)).rejects.toThrow();
    
    // データベースが元の状態に戻っていることを確認
    const version = await testDb.verno;
    expect(version).toBe(11);
  });
});
```

#### 3.3 ユーザー向けマイグレーションUI

```typescript
// src/components/database/MigrationDialog.tsx
export function MigrationDialog({ 
  isOpen, 
  onClose,
  fromVersion,
  toVersion,
  onProceed
}: MigrationDialogProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupComplete, setBackupComplete] = useState(false);
  
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await DatabaseBackup.createAutomaticBackup('pre-migration');
      setBackupComplete(true);
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsBackingUp(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>データベースの更新が必要です</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p>
            アプリケーションの新機能を利用するため、
            保存されているデータの形式を更新する必要があります。
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm">
              現在のバージョン: v{fromVersion}
            </p>
            <p className="text-sm">
              新しいバージョン: v{toVersion}
            </p>
          </div>
          
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <p className="text-sm font-semibold">推奨事項</p>
            <p className="text-sm mt-1">
              更新前にデータのバックアップを作成することをお勧めします。
            </p>
          </div>
          
          {!backupComplete && (
            <Button
              onClick={handleBackup}
              isLoading={isBackingUp}
              variant="secondary"
            >
              バックアップを作成
            </Button>
          )}
          
          {backupComplete && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ バックアップが完了しました
              </p>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button 
          variant="primary" 
          onClick={onProceed}
          disabled={!backupComplete}
        >
          更新を実行
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

## 実装スケジュール

| フェーズ | 期間 | 優先度 | 主な作業内容 |
|---------|------|--------|------------|
| Phase 1 | 1-2日 | 高 | エラーハンドリング、バージョン検出 |
| Phase 2 | 1週間 | 中 | 段階的マイグレーション、バックアップ強化 |
| Phase 3 | 1ヶ月 | 低 | 完全なバージョニングシステム、自動テスト |

## 予防策

### 開発時の注意事項

1. **スキーマ変更時のチェックリスト**
   - [ ] マイグレーション関数を作成
   - [ ] バリデーション関数を作成
   - [ ] テストケースを追加
   - [ ] ロールバック手順を文書化
   - [ ] CHANGELOG.mdを更新

2. **コードレビュー時の確認項目**
   - スキーマ変更がある場合、マイグレーションが実装されているか
   - 既存データとの互換性が保たれているか
   - エラーハンドリングが適切か

3. **リリース前のテスト**
   - 様々なバージョンからのアップグレードパスをテスト
   - 大量データでのマイグレーション性能をテスト
   - エラー発生時のロールバックをテスト

### ユーザー向けの対策

1. **定期的な自動バックアップ**
   - 週1回、自動的にデータをバックアップ
   - 最新5件のバックアップを保持

2. **エクスポート機能の促進**
   - 設定画面にエクスポートボタンを配置
   - 重要な変更前にエクスポートを推奨

3. **クリアな通知**
   - マイグレーション前に必ず確認ダイアログを表示
   - 進捗状況を表示
   - 完了/失敗を明確に通知

## まとめ

現在のスキーマ変更に関する問題は、適切なマイグレーション戦略の欠如が主な原因です。段階的に上記の対策を実装することで、ユーザーデータを保護しながら、スムーズなアップデートを実現できます。特に、Phase 1の即座に実施すべき対策は、最小限の実装でユーザー体験を大幅に改善できるため、優先的に取り組むことを推奨します。