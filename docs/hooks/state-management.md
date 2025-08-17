# 状態管理フック

## 🎣 概要

状態管理フックは、Zustandストアとコンポーネントの間のインターフェースを提供し、効率的な状態の読み取り・更新を実現します。

## 🏪 ストアフック

### useAppStore

メインのZustandストアへの直接アクセスを提供します。

```typescript
// 基本使用方法
const store = useAppStore();

// 選択的購読（推奨）
const transactions = useAppStore(state => state.transactions);
const actions = useAppStore(state => state.actions);

// セレクタ関数の使用
const transactionCount = useAppStore(state => state.transactions.length);
```

**パフォーマンス注意点**:
- 全体ストアアクセス（`useAppStore()`）は避ける
- 必要な部分のみを選択的に購読する
- セレクタ関数はメモ化を検討する

### 専用ストアフック

#### useModalStore

モーダル関連の状態とアクションを提供します。

```typescript
interface ModalStoreReturn {
  modalStates: ModalStates;
  selectedData: SelectedData;
  actions: ModalActions;
}

function useModalStore(): ModalStoreReturn;

// 使用例
function MyComponent() {
  const { modalStates, selectedData, actions } = useModalStore();
  
  const handleOpenModal = () => {
    actions.openModal('transaction', { 
      date: new Date(),
      transaction: null 
    });
  };
  
  return (
    <div>
      <button onClick={handleOpenModal}>
        新規取引追加
      </button>
      {modalStates.transaction && (
        <TransactionModal
          isOpen={modalStates.transaction}
          selectedData={selectedData}
          onClose={() => actions.closeModal('transaction')}
        />
      )}
    </div>
  );
}
```

#### useTransactionStore

取引関連の状態とアクションを提供します。

```typescript
interface TransactionStoreReturn {
  transactions: Transaction[];
  banks: Bank[];
  cards: Card[];
  actions: TransactionActions;
}

function useTransactionStore(): TransactionStoreReturn;

// 使用例
function TransactionList() {
  const { transactions, actions } = useTransactionStore();
  const [loading, setLoading] = useState(false);
  
  const handleAddTransaction = async (transactionInput: TransactionInput) => {
    try {
      setLoading(true);
      await actions.createTransaction(transactionInput);
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {transactions.map(transaction => (
        <TransactionItem 
          key={transaction.id} 
          transaction={transaction}
          onEdit={(updates) => actions.updateTransaction(transaction.id, updates)}
          onDelete={() => actions.deleteTransaction(transaction.id)}
        />
      ))}
    </div>
  );
}
```

#### useScheduleStore

スケジュール関連の状態とアクションを提供します。

```typescript
interface ScheduleStoreReturn {
  schedules: { [key: string]: MonthlySchedule };
  actions: ScheduleActions;
}

function useScheduleStore(): ScheduleStoreReturn;

// 使用例
function ScheduleView({ year, month }: { year: number; month: number }) {
  const { schedules, actions } = useScheduleStore();
  const scheduleKey = `${year}-${month}`;
  const currentSchedule = schedules[scheduleKey];
  
  useEffect(() => {
    if (!currentSchedule) {
      actions.fetchMonthlySchedule(year, month);
    }
  }, [year, month, currentSchedule, actions]);
  
  return (
    <div>
      {currentSchedule?.items.map(item => (
        <ScheduleItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

#### useUIStore

UI状態（ローディング、エラー）を管理します。

```typescript
interface UIStoreReturn {
  loading: LoadingStates;
  errors: ErrorStates;
  actions: UIActions;
}

function useUIStore(): UIStoreReturn;

// 使用例
function GlobalLoadingIndicator() {
  const { loading } = useUIStore();
  const isAnyLoading = Object.values(loading).some(Boolean);
  
  if (!isAnyLoading) return null;
  
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p>処理中...</p>
    </div>
  );
}

function ErrorBoundary() {
  const { errors, actions } = useUIStore();
  const hasErrors = Object.values(errors).some(Boolean);
  
  if (!hasErrors) return null;
  
  return (
    <div className="error-boundary">
      {Object.entries(errors).map(([key, error]) => 
        error && (
          <div key={key} className="error-message">
            <p>{error.message}</p>
            <button onClick={() => actions.clearError(key as keyof ErrorStates)}>
              閉じる
            </button>
          </div>
        )
      )}
    </div>
  );
}
```

## 🎯 セレクタフック

### useModalState

特定のモーダル状態を効率的に購読します。

```typescript
function useModalState(modalType?: ModalType): boolean | ModalStates;

// 使用例
function TransactionModalContainer() {
  const isOpen = useModalState('transaction'); // boolean
  const allModalStates = useModalState(); // ModalStates
  
  return (
    <TransactionModal 
      isOpen={isOpen}
      onClose={() => /* close modal */}
    />
  );
}
```

### useSelectedData

現在選択されているデータを取得します。

```typescript
function useSelectedData(): SelectedData;

// 使用例
function ModalContent() {
  const selectedData = useSelectedData();
  
  if (selectedData.transaction) {
    return <TransactionDetails transaction={selectedData.transaction} />;
  }
  
  if (selectedData.date) {
    return <NewTransactionForm date={selectedData.date} />;
  }
  
  return <EmptyState />;
}
```

### useTransactions

取引データを効率的に取得します。

```typescript
function useTransactions(): Transaction[];

// 使用例
function TransactionSummary() {
  const transactions = useTransactions();
  const totalAmount = useMemo(() => 
    transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  
  return (
    <div>
      <p>取引件数: {transactions.length}</p>
      <p>合計金額: ¥{totalAmount.toLocaleString()}</p>
    </div>
  );
}
```

### 派生状態フック

#### useIsLoading

ローディング状態をチェックします。

```typescript
function useIsLoading(key?: keyof LoadingStates): boolean;

// 使用例
function SaveButton({ onSave }: { onSave: () => void }) {
  const isSaving = useIsLoading('saving');
  
  return (
    <button 
      onClick={onSave}
      disabled={isSaving}
      className={isSaving ? 'loading' : ''}
    >
      {isSaving ? '保存中...' : '保存'}
    </button>
  );
}

function GlobalLoadingCheck() {
  const isAnyLoading = useIsLoading(); // 何かローディング中かチェック
  
  return isAnyLoading ? <LoadingSpinner /> : null;
}
```

#### useHasError

エラー状態をチェックします。

```typescript
function useHasError(key?: keyof ErrorStates): boolean;

// 使用例
function TransactionForm() {
  const hasTransactionError = useHasError('transactions');
  const hasAnyError = useHasError();
  
  return (
    <form>
      {hasTransactionError && (
        <div className="error-alert">
          取引の処理中にエラーが発生しました
        </div>
      )}
      {/* フォーム内容 */}
    </form>
  );
}
```

## ⚡ パフォーマンス最適化フック

### useStoreActions

アクションのみを効率的に取得します。

```typescript
function useStoreActions(): {
  modal: ModalActions & EnhancedModalActions;
  transaction: TransactionActions & EnhancedTransactionActions;
  schedule: ScheduleActions & EnhancedScheduleActions;
  ui: UIActions & EnhancedUIActions;
};

// 使用例
function ActionButtons() {
  const { modal, transaction } = useStoreActions();
  
  // アクションのみを使用するため、状態変更時に再描画されない
  const handleAddTransaction = useCallback(() => {
    modal.openModal('transaction', { date: new Date() });
  }, [modal]);
  
  return (
    <div>
      <button onClick={handleAddTransaction}>
        新規取引
      </button>
    </div>
  );
}
```

### 選択的購読パターン

#### 浅い比較での最適化

```typescript
// ❌ 悪い例: 不要な再描画が発生
function BadComponent() {
  const { transactions, loading } = useTransactionStore();
  return <div>件数: {transactions.length}</div>;
}

// ✅ 良い例: 必要な値のみ購読
function GoodComponent() {
  const transactionCount = useAppStore(state => state.transactions.length);
  return <div>件数: {transactionCount}</div>;
}
```

#### 深い比較での最適化

```typescript
// カスタムセレクタでの深い比較
const selectTransactionsByType = createSelector(
  (state: AppStore) => state.transactions,
  (transactions) => {
    return transactions.reduce((acc, t) => {
      acc[t.paymentType] = acc[t.paymentType] || [];
      acc[t.paymentType].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }
);

function TransactionsByType() {
  const transactionsByType = useAppStore(selectTransactionsByType);
  
  return (
    <div>
      {Object.entries(transactionsByType).map(([type, transactions]) => (
        <div key={type}>
          <h3>{type}</h3>
          <p>{transactions.length}件</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔄 カスタムフック

### useModalManager

モーダルの状態管理を簡素化します。

```typescript
interface UseModalManagerReturn {
  isOpen: (modalType: ModalType) => boolean;
  open: (modalType: ModalType, data?: Partial<SelectedData>) => void;
  close: (modalType: ModalType) => void;
  closeAll: () => void;
  selectedData: SelectedData;
}

function useModalManager(): UseModalManagerReturn;

// 使用例
function CalendarView() {
  const modalManager = useModalManager();
  
  const handleDateClick = (date: Date) => {
    modalManager.open('transaction', { date });
  };
  
  const handleTransactionClick = (transaction: Transaction) => {
    modalManager.open('transactionView', { transaction });
  };
  
  return (
    <div>
      {/* カレンダー実装 */}
      
      <TransactionModal
        isOpen={modalManager.isOpen('transaction')}
        onClose={() => modalManager.close('transaction')}
        selectedData={modalManager.selectedData}
      />
      
      <TransactionViewModal
        isOpen={modalManager.isOpen('transactionView')}
        onClose={() => modalManager.close('transactionView')}
        selectedData={modalManager.selectedData}
      />
    </div>
  );
}
```

### useTransactionManager

取引操作を簡素化します。

```typescript
interface UseTransactionManagerReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: DatabaseError | null;
  add: (transaction: TransactionInput) => Promise<void>;
  update: (id: string, updates: Partial<Transaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function useTransactionManager(): UseTransactionManagerReturn;

// 使用例
function TransactionManagement() {
  const {
    transactions,
    isLoading,
    error,
    add,
    update,
    remove,
    refresh
  } = useTransactionManager();
  
  const handleSubmit = async (data: TransactionInput) => {
    try {
      await add(data);
      // 成功時の処理
    } catch (error) {
      // エラー処理
    }
  };
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} onRetry={refresh} />;
  
  return (
    <div>
      {transactions.map(transaction => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          onUpdate={(updates) => update(transaction.id, updates)}
          onDelete={() => remove(transaction.id)}
        />
      ))}
    </div>
  );
}
```

## 🧪 テスト戦略

### フックのテスト

```typescript
describe('State Management Hooks', () => {
  describe('useModalStore', () => {
    it('should provide modal state and actions', () => {
      const { result } = renderHook(() => useModalStore(), {
        wrapper: StoreProvider,
      });
      
      expect(result.current.modalStates).toBeDefined();
      expect(result.current.actions).toBeDefined();
      expect(typeof result.current.actions.openModal).toBe('function');
    });
    
    it('should update modal state correctly', async () => {
      const { result } = renderHook(() => useModalStore(), {
        wrapper: StoreProvider,
      });
      
      act(() => {
        result.current.actions.openModal('transaction', { 
          date: new Date('2024-03-15') 
        });
      });
      
      expect(result.current.modalStates.transaction).toBe(true);
      expect(result.current.selectedData.date).toEqual(
        new Date('2024-03-15')
      );
    });
  });
  
  describe('useTransactionStore', () => {
    it('should handle transaction operations', async () => {
      const { result } = renderHook(() => useTransactionStore(), {
        wrapper: StoreProvider,
      });
      
      const mockTransaction = createMockTransaction();
      
      await act(async () => {
        await result.current.actions.createTransaction(mockTransaction);
      });
      
      expect(result.current.transactions).toContainEqual(
        expect.objectContaining({
          amount: mockTransaction.amount,
          description: mockTransaction.description,
        })
      );
    });
  });
  
  describe('useModalManager', () => {
    it('should simplify modal management', () => {
      const { result } = renderHook(() => useModalManager(), {
        wrapper: StoreProvider,
      });
      
      act(() => {
        result.current.open('transaction');
      });
      
      expect(result.current.isOpen('transaction')).toBe(true);
      
      act(() => {
        result.current.close('transaction');
      });
      
      expect(result.current.isOpen('transaction')).toBe(false);
    });
  });
});
```

### パフォーマンステスト

```typescript
describe('Hook Performance', () => {
  it('should not cause unnecessary re-renders', () => {
    let renderCount = 0;
    
    function TestComponent() {
      renderCount++;
      const transactionCount = useAppStore(state => state.transactions.length);
      return <div>{transactionCount}</div>;
    }
    
    const { rerender } = render(<TestComponent />, {
      wrapper: StoreProvider,
    });
    
    const initialRenderCount = renderCount;
    
    // 関係ない状態を変更
    act(() => {
      useAppStore.getState().actions.setLoading('banks', true);
    });
    
    rerender(<TestComponent />);
    
    // 再描画されないことを確認
    expect(renderCount).toBe(initialRenderCount);
  });
});
```

## 📚 ベストプラクティス

### 1. 適切なフックの選択

```typescript
// ✅ 良い例: 必要な部分のみを購読
function TransactionCount() {
  const count = useAppStore(state => state.transactions.length);
  return <span>{count}</span>;
}

// ❌ 悪い例: 全体を購読
function TransactionCountBad() {
  const { transactions } = useTransactionStore();
  return <span>{transactions.length}</span>;
}
```

### 2. セレクタの再利用

```typescript
// セレクタ関数を外部で定義
const selectTransactionCount = (state: AppStore) => state.transactions.length;
const selectTransactionTotal = (state: AppStore) => 
  state.transactions.reduce((sum, t) => sum + t.amount, 0);

// 複数のコンポーネントで再利用
function TransactionSummary() {
  const count = useAppStore(selectTransactionCount);
  const total = useAppStore(selectTransactionTotal);
  
  return (
    <div>
      <p>件数: {count}</p>
      <p>合計: ¥{total.toLocaleString()}</p>
    </div>
  );
}
```

### 3. エラーハンドリング

```typescript
function useTransactionWithErrorHandling() {
  const { actions } = useTransactionStore();
  const { setError } = useUIStore();
  
  const createTransactionSafely = useCallback(async (
    transaction: TransactionInput
  ) => {
    try {
      await actions.createTransaction(transaction);
    } catch (error) {
      setError('transactions', error as DatabaseError);
      throw error; // 必要に応じて再スロー
    }
  }, [actions, setError]);
  
  return { createTransaction: createTransactionSafely };
}
```

### 4. 型安全性の確保

```typescript
// 型安全なセレクタ
function useTypedSelector<T>(
  selector: (state: AppStore) => T
): T {
  return useAppStore(selector);
}

// 使用例
function TypedComponent() {
  const transactions = useTypedSelector(state => state.transactions);
  // transactions は Transaction[] として型推論される
  
  return (
    <div>
      {transactions.map(t => (
        <div key={t.id}>{t.description}</div>
      ))}
    </div>
  );
}
```

---

**関連ドキュメント**:
- [状態管理アーキテクチャ](../architecture/state-management.md)
- [カレンダーフック](./calendar.md)
- [データベースフック](./database.md)
- [パフォーマンス最適化](../architecture/performance.md)
