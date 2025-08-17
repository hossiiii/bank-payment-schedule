# データフロー アーキテクチャ

## 🔄 データフロー概要

銀行別引落予定表PWAにおけるデータフローは、ユーザーインタラクションから永続化まで、効率的で安全なデータ処理を実現しています。

### 基本原則

1. **単方向データフロー**: データは予測可能な方向にのみ流れる
2. **イミュータブル更新**: 状態の直接変更を避け、新しいオブジェクトを生成
3. **楽観的更新**: ユーザビリティを向上させる先行表示
4. **エラー境界**: 失敗時の適切なフォールバック
5. **キャッシュ戦略**: パフォーマンス向上のための効率的キャッシング

## 🌊 メインデータフロー

### 全体フロー図

```mermaid
graph TD
    A[User Interface] --> B[Event Handlers]
    B --> C[Hook Layer]
    C --> D[Zustand Store]
    D --> E[Database Layer]
    E --> F[Encryption Layer]
    F --> G[IndexedDB]
    
    H[Service Worker] --> I[Cache Layer]
    I --> J[Network Requests]
    
    D --> K[State Updates]
    K --> L[Component Re-render]
    L --> A
    
    G --> M[Data Retrieval]
    M --> F
    F --> E
    E --> D
```

### レイヤー詳細

| レイヤー | 責任 | 技術 |
|----------|------|------|
| UI Layer | ユーザーインタラクション | React Components |
| Hook Layer | ビジネスロジック | Custom Hooks |
| State Layer | 状態管理 | Zustand Store |
| Database Layer | データ操作 | Dexie.js |
| Encryption Layer | セキュリティ | Web Crypto API |
| Storage Layer | 永続化 | IndexedDB |

## 💾 データ永続化フロー

### 書き込みフロー（Create/Update）

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant Hook as Hook Layer
    participant Store as Zustand Store
    participant DB as Database Layer
    participant Enc as Encryption
    participant IDB as IndexedDB
    
    UI->>Hook: User Action (Add Transaction)
    Hook->>Store: Optimistic Update
    Store->>UI: Immediate UI Update
    
    Hook->>DB: Persist Data
    DB->>Enc: Encrypt Data
    Enc->>IDB: Store Encrypted Data
    
    alt Success
        IDB->>DB: Success Response
        DB->>Store: Update with Real Data
        Store->>UI: Final UI Update
    else Error
        IDB->>DB: Error Response
        DB->>Store: Rollback Optimistic Update
        Store->>UI: Show Error State
    end
```

### 読み込みフロー（Read）

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant Hook as Hook Layer
    participant Store as Zustand Store
    participant Cache as Cache Layer
    participant DB as Database Layer
    participant Enc as Encryption
    participant IDB as IndexedDB
    
    UI->>Hook: Request Data
    Hook->>Store: Check Store Cache
    
    alt Cache Hit
        Store->>Hook: Return Cached Data
        Hook->>UI: Display Data
    else Cache Miss
        Store->>Cache: Check Memory Cache
        
        alt Memory Cache Hit
            Cache->>Store: Return Cached Data
            Store->>Hook: Return Data
            Hook->>UI: Display Data
        else Memory Cache Miss
            Cache->>DB: Fetch from Database
            DB->>IDB: Read Encrypted Data
            IDB->>Enc: Return Encrypted Data
            Enc->>DB: Decrypt Data
            DB->>Cache: Return Decrypted Data
            Cache->>Store: Update Cache & Store
            Store->>Hook: Return Data
            Hook->>UI: Display Data
        end
    end
```

## 🎭 モーダル データフロー

### モーダル開閉フロー

```mermaid
graph TD
    A[User Click] --> B[Event Handler]
    B --> C[Modal Hook]
    C --> D[Store Action]
    D --> E[Modal State Update]
    E --> F[Selected Data Update]
    F --> G[Component Re-render]
    G --> H[Modal Display]
    
    I[Modal Submit] --> J[Validation]
    J --> K{Valid?}
    K -->|Yes| L[Database Operation]
    K -->|No| M[Show Validation Error]
    
    L --> N{Success?}
    N -->|Yes| O[Update Store]
    N -->|No| P[Show Error]
    
    O --> Q[Close Modal]
    Q --> R[Clear Selected Data]
    R --> S[Refresh UI]
```

### クロスモーダル ナビゲーション

```typescript
// TransactionViewModal から TransactionModal への遷移
const handleEditTransaction = (transaction: Transaction) => {
  // 現在のモーダルを閉じる
  actions.closeModal('transactionView');
  
  // 編集モーダルを開く（データを引き継ぎ）
  actions.openModal('transaction', {
    transaction,
    date: new Date(transaction.date),
  });
};

// ScheduleModal から関連するTransactionModal への遷移
const handleScheduleTransactionClick = async (transactionId: string) => {
  try {
    // トランザクションをデータベースから取得
    const transaction = await database.getTransactionById(transactionId);
    
    if (transaction) {
      actions.closeModal('scheduleView');
      actions.openModal('transactionView', {
        transaction,
        date: new Date(transaction.date),
      });
    }
  } catch (error) {
    actions.setError('transactions', error as DatabaseError);
  }
};
```

## 📅 カレンダー データフロー

### 月次データ計算フロー

```mermaid
graph TD
    A[Month Navigation] --> B[Date Change]
    B --> C[Calendar Hook]
    C --> D[Store Query]
    D --> E{Cache Available?}
    
    E -->|Yes| F[Use Cached Data]
    E -->|No| G[Fetch Transactions]
    
    G --> H[Database Query]
    H --> I[Filter by Date Range]
    I --> J[Calculate Day Totals]
    J --> K[Update Store Cache]
    K --> L[Update UI]
    
    F --> M[Validate Cache]
    M --> N{Cache Valid?}
    N -->|Yes| L
    N -->|No| G
    
    L --> O[Render Calendar Grid]
    O --> P[Display Day Data]
```

### 日別データ計算

```typescript
// カレンダー日別データの計算ロジック
export function useCalendarCalculations({
  transactions,
  schedule
}: UseCalendarCalculationsProps): UseCalendarCalculationsReturn {
  
  const dayTotals = useMemo(() => {
    const totals = new Map<string, DayTotalData>();
    
    // トランザクションデータの処理
    transactions.forEach(transaction => {
      const dateKey = formatDateISO(new Date(transaction.date));
      
      if (!totals.has(dateKey)) {
        totals.set(dateKey, createEmptyDayTotal(dateKey));
      }
      
      const dayTotal = totals.get(dateKey)!;
      
      // 金額の累積
      dayTotal.transactionTotal += transaction.amount;
      dayTotal.totalAmount += transaction.amount;
      dayTotal.transactionCount++;
      dayTotal.transactions.push(transaction);
      
      // 支払い方法別の分類
      if (transaction.paymentType === 'card') {
        dayTotal.cardTotal += transaction.amount;
      } else {
        dayTotal.directTotal += transaction.amount;
      }
      
      dayTotal.hasData = true;
      dayTotal.hasTransactions = true;
    });
    
    // スケジュールデータの処理
    if (schedule?.items) {
      schedule.items.forEach(item => {
        const dateKey = formatDateISO(new Date(item.scheduledDate));
        
        if (!totals.has(dateKey)) {
          totals.set(dateKey, createEmptyDayTotal(dateKey));
        }
        
        const dayTotal = totals.get(dateKey)!;
        dayTotal.scheduleTotal += item.amount;
        dayTotal.totalAmount += item.amount;
        dayTotal.scheduleItems.push(item);
        dayTotal.hasData = true;
        dayTotal.hasSchedule = true;
      });
    }
    
    return totals;
  }, [transactions, schedule]);
  
  return {
    dayTotals,
    getDayTotal: (date: Date) => dayTotals.get(formatDateISO(date)),
    hasDayData: (date: Date) => dayTotals.has(formatDateISO(date)),
    getMonthTotal: () => Array.from(dayTotals.values())
      .reduce((sum, day) => sum + day.totalAmount, 0),
  };
}
```

## 🏦 銀行別集計 データフロー

### 月次集計計算フロー

```mermaid
graph TD
    A[Schedule Page Load] --> B[Month Selection]
    B --> C[Schedule Hook]
    C --> D[Fetch Transactions]
    D --> E[Fetch Schedule Items]
    E --> F[Calculate Bank Totals]
    
    F --> G[Group by Bank]
    G --> H[Sum Amounts]
    H --> I[Apply Filters]
    I --> J[Sort Results]
    J --> K[Update Store]
    K --> L[Render Table]
    
    M[Filter Change] --> N[Re-calculate]
    N --> I
    
    O[Date Range Change] --> P[Invalidate Cache]
    P --> D
```

### 銀行別集計ロジック

```typescript
// 銀行別集計の計算
export const calculateBankTotals = (
  transactions: Transaction[],
  scheduleItems: ScheduleItem[],
  banks: Bank[]
): BankTotal[] => {
  const bankTotalsMap = new Map<string, BankTotal>();
  
  // 銀行マスターから初期化
  banks.forEach(bank => {
    bankTotalsMap.set(bank.id, {
      bankId: bank.id,
      bankName: bank.name,
      transactionTotal: 0,
      scheduleTotal: 0,
      totalAmount: 0,
      transactionCount: 0,
      scheduleCount: 0,
      lastPaymentDate: null,
    });
  });
  
  // トランザクションデータの集計
  transactions.forEach(transaction => {
    const bankId = transaction.bankId;
    if (bankId && bankTotalsMap.has(bankId)) {
      const bankTotal = bankTotalsMap.get(bankId)!;
      bankTotal.transactionTotal += transaction.amount;
      bankTotal.totalAmount += transaction.amount;
      bankTotal.transactionCount++;
      
      // 最後の支払い日を更新
      const paymentDate = new Date(transaction.scheduledPayDate || transaction.date);
      if (!bankTotal.lastPaymentDate || paymentDate > bankTotal.lastPaymentDate) {
        bankTotal.lastPaymentDate = paymentDate;
      }
    }
  });
  
  // スケジュールデータの集計
  scheduleItems.forEach(item => {
    const bankId = item.bankId;
    if (bankId && bankTotalsMap.has(bankId)) {
      const bankTotal = bankTotalsMap.get(bankId)!;
      bankTotal.scheduleTotal += item.amount;
      bankTotal.totalAmount += item.amount;
      bankTotal.scheduleCount++;
    }
  });
  
  return Array.from(bankTotalsMap.values())
    .filter(total => total.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);
};
```

## 🔄 キャッシュ戦略

### 多層キャッシュアーキテクチャ

```mermaid
graph TD
    A[Request] --> B{Store Cache?}
    B -->|Hit| C[Return Store Data]
    B -->|Miss| D{Memory Cache?}
    
    D -->|Hit| E[Update Store & Return]
    D -->|Miss| F{Disk Cache?}
    
    F -->|Hit| G[Update Memory & Store]
    F -->|Miss| H[Database Query]
    
    H --> I[Update All Caches]
    I --> J[Return Data]
    
    K[Background Refresh] --> L[Invalidate Stale Cache]
    L --> M[Pre-load Popular Data]
```

### キャッシュ実装

```typescript
// キャッシュマネージャー
class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private readonly CACHE_SIZES = {
    MEMORY: 100, // 100エントリまで
    DISK: 1000,  // 1000エントリまで
  };
  
  // メモリキャッシュの取得
  getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // 有効期限チェック
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    
    // アクセス時間更新（LRU用）
    entry.lastAccessed = Date.now();
    return entry.data as T;
  }
  
  // メモリキャッシュへの保存
  setInMemory<T>(key: string, data: T, ttl: number): void {
    // サイズ制限チェック
    if (this.memoryCache.size >= this.CACHE_SIZES.MEMORY) {
      this.evictLRU();
    }
    
    this.memoryCache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
    });
  }
  
  // LRU エビクション
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }
  
  // バックグラウンド更新
  async backgroundRefresh(key: string, refreshFn: () => Promise<any>): Promise<void> {
    try {
      const freshData = await refreshFn();
      this.setInMemory(key, freshData, CACHE_DURATIONS.TRANSACTIONS);
    } catch (error) {
      console.warn(`Background refresh failed for ${key}:`, error);
    }
  }
}
```

## ⚡ パフォーマンス最適化

### 仮想化とページネーション

```typescript
// 大量データの効率的表示
export function useVirtualizedTransactions(
  transactions: Transaction[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, transactions.length);
    
    return {
      startIndex: Math.max(0, startIndex - 1),
      endIndex,
      visibleItems: transactions.slice(startIndex, endIndex),
    };
  }, [transactions, scrollTop, containerHeight, itemHeight]);
  
  return {
    ...visibleRange,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    },
    totalHeight: transactions.length * itemHeight,
  };
}
```

### 楽観的更新パターン

```typescript
// 楽観的更新の実装
export const useOptimisticUpdate = <T extends { id: string }>(
  items: T[],
  addItem: (item: Omit<T, 'id'>) => Promise<T>,
  updateItem: (id: string, updates: Partial<T>) => Promise<T>,
  deleteItem: (id: string) => Promise<void>
) => {
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [pendingOperations, setPendingOperations] = useState(new Set<string>());
  
  const optimisticAdd = async (item: Omit<T, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId } as T;
    
    // 即座にUIを更新
    setOptimisticItems(prev => [...prev, optimisticItem]);
    setPendingOperations(prev => new Set(prev).add(tempId));
    
    try {
      // バックエンドで実際の保存
      const savedItem = await addItem(item);
      
      // 成功時: 一時IDを実際のIDに置換
      setOptimisticItems(prev => 
        prev.map(i => i.id === tempId ? savedItem : i)
      );
    } catch (error) {
      // 失敗時: 楽観的更新をロールバック
      setOptimisticItems(prev => 
        prev.filter(i => i.id !== tempId)
      );
      throw error;
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  };
  
  return {
    items: optimisticItems,
    isPending: (id: string) => pendingOperations.has(id),
    optimisticAdd,
    // optimisticUpdate, optimisticDelete も同様に実装
  };
};
```

## 🚨 エラーハンドリング フロー

### エラー境界とフォールバック

```mermaid
graph TD
    A[Operation Start] --> B{Try Operation}
    B -->|Success| C[Update State]
    B -->|Error| D{Error Type}
    
    D -->|Network Error| E[Retry Logic]
    D -->|Validation Error| F[Show Validation Message]
    D -->|Permission Error| G[Redirect to Auth]
    D -->|Unknown Error| H[Log & Show Generic Error]
    
    E --> I{Max Retries?}
    I -->|No| J[Wait & Retry]
    I -->|Yes| K[Show Offline Mode]
    
    J --> B
    K --> L[Enable Offline Features]
    
    C --> M[Success Feedback]
    F --> N[Error Recovery UI]
    G --> O[Authentication Flow]
    H --> P[Error Reporting]
```

### エラー復旧戦略

```typescript
// エラー復旧フック
export const useErrorRecovery = () => {
  const { setError, clearError } = useAppStore(state => state.actions);
  
  const handleError = useCallback(async (
    error: Error,
    context: string,
    recoveryAction?: () => Promise<void>
  ) => {
    console.error(`Error in ${context}:`, error);
    
    // エラーの種類に応じた処理
    if (error instanceof NetworkError) {
      // ネットワークエラー: 再試行可能
      setError('network', {
        message: 'ネットワークエラーが発生しました。再試行してください。',
        recoverable: true,
        action: recoveryAction,
      });
    } else if (error instanceof ValidationError) {
      // バリデーションエラー: ユーザー修正が必要
      setError('validation', {
        message: error.message,
        recoverable: false,
        details: error.details,
      });
    } else {
      // 予期しないエラー: ログ送信
      setError('unknown', {
        message: '予期しないエラーが発生しました。',
        recoverable: false,
      });
      
      // エラーレポート送信（将来実装）
      // await sendErrorReport(error, context);
    }
  }, [setError]);
  
  const retry = useCallback(async (errorKey: string) => {
    const errorState = useAppStore.getState().errors[errorKey];
    
    if (errorState?.action) {
      try {
        await errorState.action();
        clearError(errorKey);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
  }, [clearError]);
  
  return { handleError, retry };
};
```

## 📊 データ同期戦略

### オフライン対応フロー

```mermaid
graph TD
    A[User Action] --> B{Online?}
    B -->|Yes| C[Normal Flow]
    B -->|No| D[Queue for Sync]
    
    C --> E[Immediate Execution]
    D --> F[Store in Sync Queue]
    F --> G[Update Local State]
    
    H[Connection Restored] --> I[Process Sync Queue]
    I --> J{Conflicts?}
    J -->|No| K[Apply Changes]
    J -->|Yes| L[Conflict Resolution]
    
    L --> M[User Choice/Auto Merge]
    M --> K
    K --> N[Mark as Synced]
```

### 同期キュー実装

```typescript
// オフライン同期マネージャー
class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline = navigator.onLine;
  
  constructor() {
    // オンライン状態の監視
    window.addEventListener('online', this.processSyncQueue.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }
  
  // 操作をキューに追加
  queueOperation(operation: SyncOperation): void {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      attempts: 0,
    });
    
    // オンラインの場合は即座に実行を試行
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }
  
  // 同期キューの処理
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    const operations = [...this.syncQueue];
    this.syncQueue = [];
    
    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        operation.attempts++;
        
        // 最大試行回数に達していない場合は再キュー
        if (operation.attempts < MAX_RETRY_ATTEMPTS) {
          this.syncQueue.push(operation);
        } else {
          console.error('Sync operation failed permanently:', operation, error);
        }
      }
    }
  }
  
  // 個別操作の実行
  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'CREATE_TRANSACTION':
        await database.addTransaction(operation.data);
        break;
      case 'UPDATE_TRANSACTION':
        await database.updateTransaction(operation.id, operation.data);
        break;
      case 'DELETE_TRANSACTION':
        await database.deleteTransaction(operation.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}
```

## 📈 監視とメトリクス

### パフォーマンス監視

```typescript
// パフォーマンス監視フック
export const usePerformanceMonitoring = () => {
  const measureOperation = useCallback((
    name: string,
    operation: () => Promise<any>
  ) => {
    return async () => {
      const startTime = performance.now();
      performance.mark(`${name}-start`);
      
      try {
        const result = await operation();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        // パフォーマンスログ
        if (duration > PERFORMANCE_THRESHOLDS[name]) {
          console.warn(`⚠️ Slow operation: ${name} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        performance.mark(`${name}-error`);
        throw error;
      }
    };
  }, []);
  
  return { measureOperation };
};

// 使用例
const { measureOperation } = usePerformanceMonitoring();

const addTransactionWithMonitoring = measureOperation(
  'add-transaction',
  () => database.addTransaction(transactionData)
);
```

## 🔍 デバッグとトレーシング

### データフロー トレーシング

```typescript
// データフロー追跡デバッガー
class DataFlowTracer {
  private traces: TraceEvent[] = [];
  
  trace(event: string, data?: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const traceEvent: TraceEvent = {
        timestamp: Date.now(),
        event,
        data: this.sanitizeData(data),
        context,
        stackTrace: new Error().stack,
      };
      
      this.traces.push(traceEvent);
      console.log(`🔍 [${context}] ${event}`, data);
      
      // 古いトレースを削除（メモリリーク防止）
      if (this.traces.length > 1000) {
        this.traces = this.traces.slice(-500);
      }
    }
  }
  
  getTraces(filter?: string): TraceEvent[] {
    if (!filter) return this.traces;
    return this.traces.filter(trace => 
      trace.event.includes(filter) || trace.context?.includes(filter)
    );
  }
  
  private sanitizeData(data: any): any {
    // 機密情報の除去
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      delete sanitized.password;
      delete sanitized.sessionKey;
      return sanitized;
    }
    return data;
  }
}

// グローバルトレーサー
export const dataFlowTracer = new DataFlowTracer();

// 使用例
dataFlowTracer.trace('TRANSACTION_ADDED', { id: transaction.id }, 'TransactionStore');
dataFlowTracer.trace('MODAL_OPENED', { type: 'transaction' }, 'ModalManager');
```

---

**関連ドキュメント**:
- [システム概要](./overview.md)
- [状態管理](./state-management.md)
- [パフォーマンス](./performance.md)
- [データベース API](../api/database.md)
