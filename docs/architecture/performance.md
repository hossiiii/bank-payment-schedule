# パフォーマンス最適化アーキテクチャ

## ⚡ パフォーマンス目標

本アプリケーションは以下のパフォーマンス目標を設定し、継続的な最適化を行っています。

### 目標値

| 項目 | 目標値 | 測定方法 | 重要度 |
|------|--------|----------|--------|
| 初期読み込み (LCP) | < 2.5秒 | Lighthouse | 高 |
| インタラクション (FID) | < 100ms | Real User Monitoring | 高 |
| 累積レイアウトシフト (CLS) | < 0.1 | Lighthouse | 中 |
| カレンダー描画 | < 50ms | Performance API | 高 |
| 取引追加操作 | < 100ms | Performance API | 高 |
| メモリ使用量 | < 50MB | Chrome DevTools | 中 |
| バンドルサイズ | < 500KB (gzipped) | Bundle Analyzer | 中 |

## 🏗️ パフォーマンス最適化戦略

### 1. React レンダリング最適化

#### メモ化戦略

```typescript
// 1. React.memo による浅い比較最適化
export const CalendarCell = React.memo(({
  date,
  dayTotal,
  isToday,
  isSelected,
  onClick
}: CalendarCellProps) => {
  // コンポーネント実装
}, (prevProps, nextProps) => {
  // カスタム比較関数（必要に応じて）
  return (
    prevProps.date.getTime() === nextProps.date.getTime() &&
    prevProps.dayTotal?.totalAmount === nextProps.dayTotal?.totalAmount &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.isSelected === nextProps.isSelected
  );
});

// 2. useMemo による重い計算のメモ化
export function useCalendarCalculations({
  transactions,
  schedule
}: UseCalendarCalculationsProps) {
  
  const dayTotals = useMemo(() => {
    const totals = new Map<string, DayTotalData>();
    
    // 重い計算処理
    transactions.forEach(transaction => {
      // 日別集計計算
    });
    
    return totals;
  }, [transactions, schedule]); // 依存配列を最小限に
  
  return { dayTotals };
}

// 3. useCallback による関数の安定化
export function CalendarView({ transactions, onDateClick }: CalendarViewProps) {
  const handleDateClick = useCallback((date: Date) => {
    // イベントハンドラのメモ化
    onDateClick(date);
  }, [onDateClick]);
  
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    // トランザクションクリックハンドラ
  }, []);
}
```

#### 仮想化による大量データ対応

```typescript
// 仮想スクロール実装
export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualizedListOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + overscan, items.length);
    
    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: end,
      visibleItems: items.slice(start - overscan, end),
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// 使用例
function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll
  } = useVirtualizedList({
    items: transactions,
    itemHeight: 60,
    containerHeight,
  });
  
  return (
    <div 
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((transaction, index) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Zustand ストア最適化

#### 選択的購読による再描画防止

```typescript
// ❌ 悪い例: 全体ストアを購読
function BadComponent() {
  const store = useAppStore(); // 全体が変更されると再描画
  return <div>{store.transactions.length}</div>;
}

// ✅ 良い例: 必要な部分のみ購読
function GoodComponent() {
  const transactionCount = useAppStore(
    state => state.transactions.length
  ); // transactionsが変更された時のみ再描画
  return <div>{transactionCount}</div>;
}

// ✅ さらに良い例: セレクタ関数のメモ化
const selectTransactionCount = (state: AppStore) => state.transactions.length;
function BestComponent() {
  const transactionCount = useAppStore(selectTransactionCount);
  return <div>{transactionCount}</div>;
}
```

#### バッチ更新による処理最適化

```typescript
// 複数の状態更新をバッチ化
export const useBatchedUpdates = () => {
  const updateBatch = useCallback((updates: BatchUpdate[]) => {
    // unstable_batchedUpdates を使用してバッチ化
    unstable_batchedUpdates(() => {
      updates.forEach(update => {
        update.action();
      });
    });
  }, []);
  
  return { updateBatch };
};

// 使用例
const { updateBatch } = useBatchedUpdates();

const handleMultipleUpdates = () => {
  updateBatch([
    { action: () => addTransaction(transaction1) },
    { action: () => addTransaction(transaction2) },
    { action: () => updateSchedule(schedule) },
  ]);
};
```

### 3. データベース最適化

#### インデックス戦略

```typescript
// データベーススキーマの最適化
export class PaymentDatabase extends Dexie {
  constructor() {
    super('PaymentScheduleDB');
    
    this.version(12).stores({
      // 主要なクエリパターンに基づくインデックス設定
      transactions: `
        id,
        date,                    // 日付範囲検索
        paymentType,             // 支払い方法での絞り込み
        cardId,                  // カード別検索
        bankId,                  // 銀行別検索
        scheduledPayDate,        // 予定日での検索
        [date+paymentType],      // 複合インデックス
        [bankId+date],           // 銀行×日付の複合検索
        createdAt
      `,
      cards: 'id, name, bankId, createdAt',
      banks: 'id, name, createdAt'
    });
  }
}

// 効率的なクエリ実装
export class DatabaseOperations {
  // インデックスを活用した高速検索
  async getTransactionsByDateRange(
    startDate: number, 
    endDate: number,
    paymentType?: string
  ): Promise<Transaction[]> {
    let query = this.db.transactions
      .where('date')
      .between(startDate, endDate, true, true);
    
    // 複合インデックスを活用
    if (paymentType) {
      query = this.db.transactions
        .where('[date+paymentType]')
        .between([startDate, paymentType], [endDate, paymentType]);
    }
    
    return await query.toArray();
  }
  
  // バルク操作の最適化
  async addMultipleTransactions(transactions: TransactionInput[]): Promise<void> {
    return await this.db.transaction('rw', this.db.transactions, async () => {
      const promises = transactions.map(transaction => 
        this.db.transactions.add({
          ...transaction,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      await Promise.all(promises);
    });
  }
}
```

#### キャッシュ戦略の最適化

```typescript
// 多層キャッシュシステム
class PerformantCacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private lruCache = new LRUCache<string, any>(100); // LRUキャッシュ
  
  // キャッシュヒット率の監視
  private stats = {
    hits: 0,
    misses: 0,
    gets: 0,
  };
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5分
  ): Promise<T> {
    this.stats.gets++;
    
    // 1. メモリキャッシュチェック
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      this.stats.hits++;
      return memoryEntry.data as T;
    }
    
    // 2. LRUキャッシュチェック
    const lruEntry = this.lruCache.get(key);
    if (lruEntry) {
      this.stats.hits++;
      // メモリキャッシュにプロモート
      this.memoryCache.set(key, {
        data: lruEntry,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl,
      });
      return lruEntry as T;
    }
    
    // 3. データフェッチ
    this.stats.misses++;
    const data = await fetcher();
    
    // 4. 両方のキャッシュに保存
    this.memoryCache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
    this.lruCache.set(key, data);
    
    return data;
  }
  
  // キャッシュヒット率の取得
  getHitRate(): number {
    return this.stats.gets > 0 ? this.stats.hits / this.stats.gets : 0;
  }
  
  // キャッシュ統計のリセット
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, gets: 0 };
  }
}
```

### 4. バンドルサイズ最適化

#### Code Splitting戦略

```typescript
// 1. ページレベルでのコード分割
import { lazy, Suspense } from 'react';

const SchedulePage = lazy(() => import('../schedule/SchedulePage'));
const SettingsPage = lazy(() => import('../settings/SettingsPage'));

// 2. 機能レベルでのコード分割
const TransactionModal = lazy(() => 
  import('./TransactionModal').then(module => ({
    default: module.TransactionModal
  }))
);

// 3. ライブラリの動的インポート
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js/auto');
  return Chart;
};

// 4. 条件付きインポート
const loadDevTools = async () => {
  if (process.env.NODE_ENV === 'development') {
    const { default: DevTools } = await import('./DevTools');
    return DevTools;
  }
  return null;
};
```

#### Tree Shaking最適化

```typescript
// ❌ 悪い例: ライブラリ全体をインポート
import * as _ from 'lodash';

// ✅ 良い例: 必要な関数のみインポート
import { debounce } from 'lodash-es/debounce';

// ❌ 悪い例: デフォルトエクスポートでの一括インポート
import { 
  format, 
  parseISO, 
  addDays, 
  startOfMonth 
} from 'date-fns';

// ✅ 良い例: 個別インポート
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import addDays from 'date-fns/addDays';
import startOfMonth from 'date-fns/startOfMonth';
```

### 5. 画像・アセット最適化

```typescript
// 画像の遅延読み込み
export function LazyImage({ 
  src, 
  alt, 
  className,
  placeholder 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
      {!isLoaded && placeholder && (
        <div className="placeholder">
          {placeholder}
        </div>
      )}
    </div>
  );
}
```

## 📊 パフォーマンス監視

### Core Web Vitals の測定

```typescript
// パフォーマンスメトリクス収集
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  constructor() {
    this.initializeObservers();
  }
  
  private initializeObservers(): void {
    // LCP (Largest Contentful Paint) の測定
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('LCP', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID (First Input Delay) の測定
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        }
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS (Cumulative Layout Shift) の測定
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.recordMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  private recordMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
    });
    
    // 閾値チェック
    this.checkThresholds(name, value);
  }
  
  private checkThresholds(metric: string, value: number): void {
    const thresholds = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
    };
    
    if (value > thresholds[metric as keyof typeof thresholds]) {
      console.warn(`⚠️ Performance warning: ${metric} = ${value}`);
    }
  }
  
  // メトリクスレポートの生成
  generateReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }
}
```

### カスタムメトリクス

```typescript
// アプリケーション固有のパフォーマンス測定
export const usePerformanceTracking = () => {
  const trackOperation = useCallback(<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      performance.mark(`${operationName}-start`);
      
      try {
        const result = await operation();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        performance.mark(`${operationName}-end`);
        performance.measure(operationName, `${operationName}-start`, `${operationName}-end`);
        
        // カスタムメトリクス記録
        if (window.gtag) {
          window.gtag('event', 'timing_complete', {
            name: operationName,
            value: Math.round(duration),
          });
        }
        
        // コンソール出力（開発環境）
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${operationName}: ${duration.toFixed(2)}ms`);
        }
        
        resolve(result);
      } catch (error) {
        const errorTime = performance.now();
        performance.mark(`${operationName}-error`);
        
        // エラーメトリクス
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: `${operationName} failed`,
            fatal: false,
          });
        }
        
        reject(error);
      }
    });
  }, []);
  
  return { trackOperation };
};

// 使用例
const { trackOperation } = usePerformanceTracking();

const handleAddTransaction = async (transaction: TransactionInput) => {
  await trackOperation('add-transaction', async () => {
    return await database.addTransaction(transaction);
  });
};
```

## 🔧 パフォーマンステスト

### 自動化されたパフォーマンステスト

```typescript
// Jest パフォーマンステスト
describe('Performance Tests', () => {
  describe('Calendar Calculations', () => {
    it('should calculate 1000 transactions under 100ms', async () => {
      const transactions = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ id: `perf-${i}` })
      );
      
      const startTime = performance.now();
      
      const { result } = renderHook(() => 
        useCalendarCalculations({ transactions })
      );
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(result.current.dayTotals.size).toBeGreaterThan(0);
    });
  });
  
  describe('Store Operations', () => {
    it('should handle bulk transaction addition efficiently', async () => {
      const store = createAppStore();
      const transactions = Array.from({ length: 500 }, (_, i) =>
        createMockTransaction({ id: `bulk-${i}` })
      );
      
      const startTime = performance.now();
      
      await act(async () => {
        for (const transaction of transactions) {
          store.getState().actions.addTransaction(transaction);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(store.getState().transactions).toHaveLength(500);
    });
  });
  
  describe('Memory Usage', () => {
    it('should not create memory leaks', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 大量の操作を実行
      for (let i = 0; i < 100; i++) {
        const store = createAppStore();
        await act(async () => {
          store.getState().actions.addTransaction(createMockTransaction());
        });
      }
      
      // ガベージコレクションを促す
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // メモリ増加量が初期メモリの50%以下であることを確認
      expect(memoryGrowth).toBeLessThan(initialMemory * 0.5);
    });
  });
});
```

### Lighthouse CI統合

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
      
      - name: Wait for application
        run: sleep 10
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.8}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## 🎯 継続的最適化

### パフォーマンス改善プロセス

1. **測定**: 現在のパフォーマンスをベースライン化
2. **分析**: ボトルネックの特定
3. **最適化**: 具体的な改善実装
4. **検証**: 改善効果の確認
5. **監視**: 継続的なパフォーマンス追跡

### 最適化チェックリスト

#### React レンダリング
- [ ] 不要な再描画をReact DevToolsで確認
- [ ] 適切なメモ化（memo, useMemo, useCallback）の適用
- [ ] 大量データの仮想化実装
- [ ] コンポーネントの適切な分割

#### 状態管理
- [ ] Zustand の選択的購読実装
- [ ] 不要な状態更新の削減
- [ ] バッチ更新の適用
- [ ] セレクタ関数の最適化

#### データ層
- [ ] データベースインデックスの最適化
- [ ] クエリパフォーマンスの確認
- [ ] キャッシュ戦略の効果測定
- [ ] バルク操作の活用

#### バンドル最適化
- [ ] Code Splitting の適用
- [ ] Tree Shaking の確認
- [ ] 不要な依存関係の削除
- [ ] バンドルサイズ分析

#### ネットワーク
- [ ] Service Worker キャッシュ最適化
- [ ] リソース圧縮の確認
- [ ] CDN 配信の設定
- [ ] プリロード・プリフェッチの活用

## 📱 モバイル最適化

### モバイル固有の最適化

```typescript
// タッチデバイス対応の最適化
export const useTouchOptimization = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    // タッチデバイスの検出
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    
    return () => {
      window.removeEventListener('resize', checkTouchDevice);
    };
  }, []);
  
  // タッチデバイス用の最適化設定
  return {
    isTouchDevice,
    // タッチデバイスではホバー効果を無効化
    hoverEnabled: !isTouchDevice,
    // タッチデバイスではより大きなタッチターゲット
    touchTargetSize: isTouchDevice ? 44 : 32,
  };
};

// スクロールパフォーマンスの最適化
export const useScrollOptimization = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    // スクロール終了の検出
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  return {
    isScrolling,
    handleScroll,
    // スクロール中は重いアニメーションを無効化
    shouldReduceMotion: isScrolling,
  };
};
```

## 🔬 パフォーマンス分析ツール

### 開発時の分析

```typescript
// パフォーマンス分析フック
export const usePerformanceAnalyzer = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const renderStartTime = useRef<number>(0);
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });
  
  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - renderStartTime.current;
    setRenderTime(duration);
    
    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`⚠️ Slow render: ${duration.toFixed(2)}ms`);
    }
  });
  
  return {
    renderCount,
    renderTime: renderTime.toFixed(2),
  };
};

// 使用例
function PerformanceDebugger() {
  const { renderCount, renderTime } = usePerformanceAnalyzer();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="performance-debug">
      <div>Renders: {renderCount}</div>
      <div>Last render: {renderTime}ms</div>
    </div>
  );
}
```

---

**関連ドキュメント**:
- [システム概要](./overview.md)
- [状態管理](./state-management.md)
- [データフロー](./data-flow.md)
- [テストガイド](../guides/testing.md)
