# データベースフック

## 🗄️ 概要

データベースフックは、Dexie.js（IndexedDB）との連携を効率化し、データの取得・保存・更新・削除をReactフックとして提供します。暗号化、キャッシュ、エラーハンドリングを統合した高度なデータ管理を実現します。

## 📦 フック一覧

| フック | 説明 | 主な用途 |
|--------|------|----------|
| `useDatabase` | 基本データベース操作 | CRUD操作、トランザクション |
| `useScheduleData` | スケジュールデータ管理 | 引落予定の取得と操作 |
| `useFilteredSchedule` | フィルタ機能付きスケジュール | 条件絞り込み、検索 |
| `useOptimizedDatabase` | 最適化データベース操作 | 大量データ処理、パフォーマンス向上 |

## 🔧 useDatabase

### インターフェース

```typescript
interface UseDatabaseReturn {
  // Transaction operations
  addTransaction: (transaction: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Promise<Transaction | null>;
  getTransactions: (filters?: TransactionFilters) => Promise<Transaction[]>;
  
  // Bank operations
  addBank: (bank: BankInput) => Promise<Bank>;
  updateBank: (id: string, updates: Partial<BankInput>) => Promise<Bank>;
  deleteBank: (id: string) => Promise<void>;
  getBanks: () => Promise<Bank[]>;
  
  // Card operations
  addCard: (card: CardInput) => Promise<Card>;
  updateCard: (id: string, updates: Partial<CardInput>) => Promise<Card>;
  deleteCard: (id: string) => Promise<void>;
  getCards: () => Promise<Card[]>;
  
  // Utility operations
  isLoading: boolean;
  error: DatabaseError | null;
  clearError: () => void;
  getDatabaseInfo: () => Promise<DatabaseInfo>;
  backup: () => Promise<BackupData>;
  restore: (data: BackupData) => Promise<void>;
}

interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  bankIds?: string[];
  cardIds?: string[];
  amountFrom?: number;
  amountTo?: number;
  searchText?: string;
  paymentTypes?: ('card' | 'bank')[];
}
```

### 使用例

```typescript
import { useDatabase } from '@/hooks';

function TransactionManager() {
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    addBank,
    getBanks,
    isLoading,
    error,
    clearError
  } = useDatabase();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  // データの初期読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        const [transactionData, bankData] = await Promise.all([
          getTransactions(),
          getBanks()
        ]);
        setTransactions(transactionData);
        setBanks(bankData);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      }
    };

    loadData();
  }, [getTransactions, getBanks]);

  // 新規取引追加
  const handleAddTransaction = async (transactionData: TransactionInput) => {
    try {
      const newTransaction = await addTransaction(transactionData);
      setTransactions(prev => [...prev, newTransaction]);
    } catch (error) {
      console.error('取引追加エラー:', error);
    }
  };

  // 取引更新
  const handleUpdateTransaction = async (id: string, updates: Partial<TransactionInput>) => {
    try {
      const updatedTransaction = await updateTransaction(id, updates);
      setTransactions(prev => 
        prev.map(t => t.id === id ? updatedTransaction : t)
      );
    } catch (error) {
      console.error('取引更新エラー:', error);
    }
  };

  // 取引削除
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('取引削除エラー:', error);
    }
  };

  // 新規銀行追加
  const handleAddBank = async (bankData: BankInput) => {
    try {
      const newBank = await addBank(bankData);
      setBanks(prev => [...prev, newBank]);
    } catch (error) {
      console.error('銀行追加エラー:', error);
    }
  };

  if (isLoading) {
    return <div>データを読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>エラーが発生しました: {error.message}</p>
        <button onClick={clearError}>エラーをクリア</button>
      </div>
    );
  }

  return (
    <div>
      {/* UI実装 */}
    </div>
  );
}
```

### 内部実装

```typescript
export function useDatabase(): UseDatabaseReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DatabaseError | null>(null);

  // エラーハンドリング用のヘルパー
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const dbError = err instanceof DatabaseError 
        ? err 
        : new DatabaseError('予期しないエラーが発生しました', err as Error);
      setError(dbError);
      throw dbError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Transaction operations
  const addTransaction = useCallback(async (transaction: TransactionInput) => {
    return withErrorHandling(async () => {
      const operations = new TransactionOperations();
      return await operations.create(transaction);
    });
  }, [withErrorHandling]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<TransactionInput>) => {
    return withErrorHandling(async () => {
      const operations = new TransactionOperations();
      return await operations.update(id, updates);
    });
  }, [withErrorHandling]);

  const deleteTransaction = useCallback(async (id: string) => {
    return withErrorHandling(async () => {
      const operations = new TransactionOperations();
      await operations.delete(id);
    });
  }, [withErrorHandling]);

  const getTransaction = useCallback(async (id: string) => {
    return withErrorHandling(async () => {
      const operations = new TransactionOperations();
      return await operations.getById(id);
    });
  }, [withErrorHandling]);

  const getTransactions = useCallback(async (filters?: TransactionFilters) => {
    return withErrorHandling(async () => {
      const operations = new TransactionOperations();
      return await operations.getAll(filters);
    });
  }, [withErrorHandling]);

  // Bank operations
  const addBank = useCallback(async (bank: BankInput) => {
    return withErrorHandling(async () => {
      const operations = new BankOperations();
      return await operations.create(bank);
    });
  }, [withErrorHandling]);

  const getBanks = useCallback(async () => {
    return withErrorHandling(async () => {
      const operations = new BankOperations();
      return await operations.getAll();
    });
  }, [withErrorHandling]);

  // Utility operations
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getDatabaseInfo = useCallback(async () => {
    return withErrorHandling(async () => {
      const db = getDatabase();
      return {
        version: db.verno,
        size: await db.open().then(() => 
          navigator.storage?.estimate?.().then(estimate => estimate.usage || 0) || 0
        ),
        tables: db.tables.map(table => ({
          name: table.name,
          schema: table.schema,
        })),
      };
    });
  }, [withErrorHandling]);

  const backup = useCallback(async () => {
    return withErrorHandling(async () => {
      const backupOps = new BackupOperations();
      return await backupOps.createBackup();
    });
  }, [withErrorHandling]);

  const restore = useCallback(async (data: BackupData) => {
    return withErrorHandling(async () => {
      const backupOps = new BackupOperations();
      await backupOps.restoreBackup(data);
    });
  }, [withErrorHandling]);

  return {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
    getTransactions,
    addBank,
    updateBank: async (id, updates) => withErrorHandling(async () => {
      const operations = new BankOperations();
      return await operations.update(id, updates);
    }),
    deleteBank: async (id) => withErrorHandling(async () => {
      const operations = new BankOperations();
      await operations.delete(id);
    }),
    getBanks,
    addCard: async (card) => withErrorHandling(async () => {
      const operations = new CardOperations();
      return await operations.create(card);
    }),
    updateCard: async (id, updates) => withErrorHandling(async () => {
      const operations = new CardOperations();
      return await operations.update(id, updates);
    }),
    deleteCard: async (id) => withErrorHandling(async () => {
      const operations = new CardOperations();
      await operations.delete(id);
    }),
    getCards: async () => withErrorHandling(async () => {
      const operations = new CardOperations();
      return await operations.getAll();
    }),
    isLoading,
    error,
    clearError,
    getDatabaseInfo,
    backup,
    restore,
  };
}
```

## 📊 useScheduleData

### インターフェース

```typescript
interface UseScheduleDataProps {
  year: number;
  month: number;
}

interface UseScheduleDataReturn {
  scheduleData: PaymentScheduleView | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateSchedule: (scheduleId: string, updates: Partial<ScheduleItem>) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  calculateSchedule: () => Promise<void>;
}

interface PaymentScheduleView {
  month: string;
  payments: PaymentSummary[];
  bankTotals: Map<string, number>;
  monthTotal: number;
  uniqueBanks: Bank[];
}
```

### 使用例

```typescript
import { useScheduleData } from '@/hooks';

function SchedulePage({ year, month }: SchedulePageProps) {
  const {
    scheduleData,
    isLoading,
    error,
    refetch,
    updateSchedule,
    deleteSchedule,
    calculateSchedule
  } = useScheduleData({ year, month });

  // スケジュール再計算
  const handleRecalculate = async () => {
    try {
      await calculateSchedule();
      refetch();
    } catch (error) {
      console.error('スケジュール計算エラー:', error);
    }
  };

  // スケジュール項目更新
  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<ScheduleItem>) => {
    try {
      await updateSchedule(scheduleId, updates);
      refetch();
    } catch (error) {
      console.error('スケジュール更新エラー:', error);
    }
  };

  if (isLoading) {
    return <ScheduleLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>スケジュールの読み込みに失敗しました</p>
        <button onClick={refetch}>再試行</button>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="empty-state">
        <p>スケジュールデータがありません</p>
        <button onClick={handleRecalculate}>
          スケジュールを計算
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <ScheduleHeader 
        month={scheduleData.month}
        total={scheduleData.monthTotal}
        onRecalculate={handleRecalculate}
      />
      
      <BankScheduleTable
        payments={scheduleData.payments}
        banks={scheduleData.uniqueBanks}
        onAmountClick={(payment) => {
          // 詳細モーダルを開く
        }}
        onUpdateSchedule={handleUpdateSchedule}
      />
    </div>
  );
}
```

### 内部実装

```typescript
export function useScheduleData({ 
  year, 
  month 
}: UseScheduleDataProps): UseScheduleDataReturn {
  const [scheduleData, setScheduleData] = useState<PaymentScheduleView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // データ取得
  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [transactions, banks, cards] = await Promise.all([
        getTransactionsForMonth(year, month),
        getBanks(),
        getCards()
      ]);

      const calculatedSchedule = await calculatePaymentSchedule({
        transactions,
        banks,
        cards,
        year,
        month
      });

      setScheduleData(calculatedSchedule);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  // 初期データ読み込み
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // スケジュール更新
  const updateSchedule = useCallback(async (
    scheduleId: string, 
    updates: Partial<ScheduleItem>
  ) => {
    const operations = new ScheduleOperations();
    await operations.update(scheduleId, updates);
  }, []);

  // スケジュール削除
  const deleteSchedule = useCallback(async (scheduleId: string) => {
    const operations = new ScheduleOperations();
    await operations.delete(scheduleId);
  }, []);

  // スケジュール再計算
  const calculateSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const calculator = new ScheduleCalculator();
      await calculator.recalculateMonth(year, month);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  return {
    scheduleData,
    isLoading,
    error,
    refetch: fetchScheduleData,
    updateSchedule,
    deleteSchedule,
    calculateSchedule,
  };
}
```

## 🔍 useFilteredSchedule

### インターフェース

```typescript
interface UseFilteredScheduleProps {
  scheduleData: PaymentScheduleView | null;
  initialFilters?: ScheduleFilters;
}

interface UseFilteredScheduleReturn {
  filteredData: PaymentScheduleView | null;
  appliedFilters: ScheduleFilters;
  updateFilters: (filters: Partial<ScheduleFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filterStats: FilterStats;
}

interface ScheduleFilters {
  dateRange?: { start: Date; end: Date };
  amountRange?: { min?: number; max?: number };
  searchText?: string;
  bankIds?: string[];
  paymentTypes?: ('card' | 'bank')[];
}

interface FilterStats {
  totalItems: number;
  filteredItems: number;
  hiddenItems: number;
  filterCount: number;
}
```

### 使用例

```typescript
import { useFilteredSchedule } from '@/hooks';

function FilterableScheduleView({ scheduleData }: FilterableScheduleViewProps) {
  const {
    filteredData,
    appliedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    filterStats
  } = useFilteredSchedule({
    scheduleData,
    initialFilters: {
      amountRange: { min: 0 },
    }
  });

  const handleSearchChange = (searchText: string) => {
    updateFilters({ searchText });
  };

  const handleAmountFilter = (min: number, max: number) => {
    updateFilters({ 
      amountRange: { min, max } 
    });
  };

  const handleBankFilter = (bankIds: string[]) => {
    updateFilters({ bankIds });
  };

  return (
    <div className="filterable-schedule">
      {/* フィルターUI */}
      <div className="filter-panel">
        <SearchInput
          value={appliedFilters.searchText || ''}
          onChange={handleSearchChange}
          placeholder="店舗名・用途で検索"
        />
        
        <AmountRangeFilter
          min={appliedFilters.amountRange?.min}
          max={appliedFilters.amountRange?.max}
          onChange={handleAmountFilter}
        />
        
        <BankFilter
          selectedBankIds={appliedFilters.bankIds || []}
          availableBanks={scheduleData?.uniqueBanks || []}
          onChange={handleBankFilter}
        />
        
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            フィルターをクリア
          </button>
        )}
      </div>

      {/* フィルター統計 */}
      <div className="filter-stats">
        {filterStats.filteredItems} / {filterStats.totalItems} 件表示
        {filterStats.hiddenItems > 0 && (
          <span className="hidden-count">
            ({filterStats.hiddenItems}件非表示)
          </span>
        )}
      </div>

      {/* フィルタされたスケジュールデータ */}
      {filteredData && (
        <BankScheduleTable
          payments={filteredData.payments}
          banks={filteredData.uniqueBanks}
          onAmountClick={(payment) => {
            // 詳細表示
          }}
        />
      )}
    </div>
  );
}
```

### 内部実装

```typescript
export function useFilteredSchedule({
  scheduleData,
  initialFilters = {}
}: UseFilteredScheduleProps): UseFilteredScheduleReturn {
  
  const [appliedFilters, setAppliedFilters] = useState<ScheduleFilters>(initialFilters);

  // フィルタ適用済みデータ
  const filteredData = useMemo(() => {
    if (!scheduleData) return null;

    let filteredPayments = [...scheduleData.payments];

    // 日付範囲フィルタ
    if (appliedFilters.dateRange) {
      const { start, end } = appliedFilters.dateRange;
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    // 金額範囲フィルタ
    if (appliedFilters.amountRange) {
      const { min, max } = appliedFilters.amountRange;
      filteredPayments = filteredPayments.filter(payment => {
        return (min === undefined || payment.totalAmount >= min) &&
               (max === undefined || payment.totalAmount <= max);
      });
    }

    // テキスト検索フィルタ
    if (appliedFilters.searchText) {
      const searchLower = appliedFilters.searchText.toLowerCase();
      filteredPayments = filteredPayments.filter(payment =>
        payment.transactions.some(transaction =>
          (transaction.storeName?.toLowerCase().includes(searchLower)) ||
          (transaction.usage?.toLowerCase().includes(searchLower))
        )
      );
    }

    // 銀行フィルタ
    if (appliedFilters.bankIds && appliedFilters.bankIds.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.bankPayments.some(bankPayment =>
          appliedFilters.bankIds!.includes(bankPayment.bankId)
        )
      );
    }

    // 支払い方法フィルタ
    if (appliedFilters.paymentTypes && appliedFilters.paymentTypes.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.transactions.some(transaction =>
          appliedFilters.paymentTypes!.includes(transaction.paymentType)
        )
      );
    }

    // 銀行別合計を再計算
    const filteredBankTotals = new Map<string, number>();
    let filteredMonthTotal = 0;

    filteredPayments.forEach(payment => {
      filteredMonthTotal += payment.totalAmount;
      payment.bankPayments.forEach(bankPayment => {
        const current = filteredBankTotals.get(bankPayment.bankId) || 0;
        filteredBankTotals.set(bankPayment.bankId, current + bankPayment.amount);
      });
    });

    return {
      ...scheduleData,
      payments: filteredPayments,
      bankTotals: filteredBankTotals,
      monthTotal: filteredMonthTotal,
    };
  }, [scheduleData, appliedFilters]);

  // フィルタ統計
  const filterStats = useMemo(() => {
    const totalItems = scheduleData?.payments.length || 0;
    const filteredItems = filteredData?.payments.length || 0;
    const hiddenItems = totalItems - filteredItems;
    const filterCount = Object.keys(appliedFilters).filter(key => {
      const value = appliedFilters[key as keyof ScheduleFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    return {
      totalItems,
      filteredItems,
      hiddenItems,
      filterCount,
    };
  }, [scheduleData, filteredData, appliedFilters]);

  // フィルタ更新
  const updateFilters = useCallback((newFilters: Partial<ScheduleFilters>) => {
    setAppliedFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // フィルタクリア
  const clearFilters = useCallback(() => {
    setAppliedFilters({});
  }, []);

  // アクティブフィルタの有無
  const hasActiveFilters = useMemo(() => {
    return filterStats.filterCount > 0;
  }, [filterStats.filterCount]);

  return {
    filteredData,
    appliedFilters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    filterStats,
  };
}
```

## ⚡ useOptimizedDatabase

### インターフェース

```typescript
interface UseOptimizedDatabaseProps {
  enableCache?: boolean;
  cacheSize?: number;
  enableBatching?: boolean;
  batchSize?: number;
  enablePagination?: boolean;
  pageSize?: number;
}

interface UseOptimizedDatabaseReturn extends UseDatabaseReturn {
  // 拡張機能
  batchAddTransactions: (transactions: TransactionInput[]) => Promise<Transaction[]>;
  batchUpdateTransactions: (updates: { id: string; data: Partial<TransactionInput> }[]) => Promise<Transaction[]>;
  batchDeleteTransactions: (ids: string[]) => Promise<void>;
  
  // ページネーション
  getTransactionsPaginated: (page: number, filters?: TransactionFilters) => Promise<{
    transactions: Transaction[];
    totalCount: number;
    hasNextPage: boolean;
  }>;
  
  // キャッシュ管理
  clearCache: () => void;
  getCacheInfo: () => CacheInfo;
  preloadData: (year: number, month: number) => Promise<void>;
}
```

### 使用例

```typescript
import { useOptimizedDatabase } from '@/hooks';

function LargeDataTransactionManager() {
  const {
    batchAddTransactions,
    getTransactionsPaginated,
    clearCache,
    preloadData,
    isLoading
  } = useOptimizedDatabase({
    enableCache: true,
    cacheSize: 1000,
    enableBatching: true,
    batchSize: 100,
    enablePagination: true,
    pageSize: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<{
    transactions: Transaction[];
    totalCount: number;
    hasNextPage: boolean;
  } | null>(null);

  // ページネーション付きデータ取得
  const loadPage = useCallback(async (page: number) => {
    try {
      const data = await getTransactionsPaginated(page);
      setPaginatedData(data);
    } catch (error) {
      console.error('ページデータ読み込みエラー:', error);
    }
  }, [getTransactionsPaginated]);

  // CSVインポート（バッチ処理）
  const handleCsvImport = async (csvData: TransactionInput[]) => {
    try {
      setIsLoading(true);
      const importedTransactions = await batchAddTransactions(csvData);
      console.log(`${importedTransactions.length}件のトランザクションをインポートしました`);
      loadPage(1); // 最初のページを再読み込み
    } catch (error) {
      console.error('CSVインポートエラー:', error);
    }
  };

  // データの事前読み込み
  const handlePreload = async (year: number, month: number) => {
    try {
      await preloadData(year, month);
      console.log(`${year}年${month}月のデータを事前読み込みしました`);
    } catch (error) {
      console.error('事前読み込みエラー:', error);
    }
  };

  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);

  return (
    <div className="large-data-manager">
      {/* バッチ操作UI */}
      <div className="batch-operations">
        <CsvImporter onImport={handleCsvImport} />
        <button onClick={() => clearCache()}>
          キャッシュをクリア
        </button>
      </div>

      {/* ページネーション付きデータ表示 */}
      {paginatedData && (
        <div className="paginated-transactions">
          <TransactionList transactions={paginatedData.transactions} />
          
          <Pagination
            currentPage={currentPage}
            totalCount={paginatedData.totalCount}
            pageSize={50}
            hasNextPage={paginatedData.hasNextPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* 事前読み込みUI */}
      <div className="preload-controls">
        <button onClick={() => handlePreload(2025, 9)}>
          来月のデータを事前読み込み
        </button>
      </div>
    </div>
  );
}
```

## 🧪 テスト戦略

### データベースフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDatabase } from '@/hooks';

// モックデータベース
jest.mock('@/lib/database/operations', () => ({
  TransactionOperations: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
  })),
}));

describe('useDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('取引を正常に追加できる', async () => {
    const mockTransaction = {
      id: '1',
      date: '2025-08-17',
      amount: 1000,
      storeName: 'テストストア',
    };

    const mockCreate = jest.fn().mockResolvedValue(mockTransaction);
    (TransactionOperations as jest.Mock).mockImplementation(() => ({
      create: mockCreate,
    }));

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      const transaction = await result.current.addTransaction({
        date: '2025-08-17',
        amount: 1000,
        storeName: 'テストストア',
        paymentType: 'card',
      });
      
      expect(transaction).toEqual(mockTransaction);
      expect(mockCreate).toHaveBeenCalledWith({
        date: '2025-08-17',
        amount: 1000,
        storeName: 'テストストア',
        paymentType: 'card',
      });
    });
  });

  it('エラーが発生した場合適切にハンドリングされる', async () => {
    const mockError = new Error('データベースエラー');
    const mockCreate = jest.fn().mockRejectedValue(mockError);
    
    (TransactionOperations as jest.Mock).mockImplementation(() => ({
      create: mockCreate,
    }));

    const { result } = renderHook(() => useDatabase());

    await act(async () => {
      try {
        await result.current.addTransaction({
          date: '2025-08-17',
          amount: 1000,
          paymentType: 'card',
        });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('ローディング状態が正しく管理される', async () => {
    const mockCreate = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    (TransactionOperations as jest.Mock).mockImplementation(() => ({
      create: mockCreate,
    }));

    const { result } = renderHook(() => useDatabase());

    expect(result.current.isLoading).toBe(false);

    const promise = act(async () => {
      result.current.addTransaction({
        date: '2025-08-17',
        amount: 1000,
        paymentType: 'card',
      });
    });

    expect(result.current.isLoading).toBe(true);

    await promise;

    expect(result.current.isLoading).toBe(false);
  });
});
```

## 📚 関連ドキュメント

- [データベースAPI](../api/database.md)
- [状態管理フック](./state-management.md)
- [カレンダーフック](./calendar.md)
- [データベース暗号化](../architecture/data-flow.md#encryption)
- [パフォーマンス最適化](../architecture/performance.md)

