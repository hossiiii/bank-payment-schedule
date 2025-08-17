# CalendarView コンポーネント

## 📅 概要

`CalendarView`は銀行別引落予定表の中核となるコンポーネントで、月次カレンダー形式で取引データと引落予定を表示します。

## 🎯 Props API

### CalendarViewProps

```typescript
interface CalendarViewProps {
  year: number;                    // 表示年
  month: number;                   // 表示月 (1-12)
  transactions: Transaction[];     // 取引データ配列
  schedule?: MonthlySchedule;      // 月次引落予定
  banks: Bank[];                   // 銀行マスターデータ
  cards: Card[];                   // カードマスターデータ
  onDateClick: (date: Date) => void;                    // 日付クリック時
  onTransactionClick: (transaction: Transaction) => void; // 取引クリック時
  onTransactionViewClick?: (date: Date, transactions: Transaction[]) => void; // 取引一覧表示
  onScheduleViewClick?: (date: Date, scheduleItems: ScheduleItem[]) => void;  // 予定一覧表示
  onMonthChange?: (year: number, month: number) => void; // 月変更時
  className?: string;              // 追加CSSクラス
}
```

### Prop 詳細説明

#### 必須Props

| Prop | 型 | 説明 | 例 |
|------|----|----|-----|
| `year` | `number` | 表示する年（4桁） | `2024` |
| `month` | `number` | 表示する月（1-12） | `3` |
| `transactions` | `Transaction[]` | 表示する取引データ | `[{id: '1', amount: 1500, ...}]` |
| `banks` | `Bank[]` | 銀行マスターデータ | `[{id: '1', name: '三菱UFJ銀行'}]` |
| `cards` | `Card[]` | カードマスターデータ | `[{id: '1', name: 'メインカード'}]` |
| `onDateClick` | `(date: Date) => void` | 日付クリック時の処理 | 新規取引追加モーダル表示 |
| `onTransactionClick` | `(transaction: Transaction) => void` | 取引クリック時の処理 | 取引詳細モーダル表示 |

#### 任意Props

| Prop | 型 | デフォルト | 説明 |
|------|----|-----------|----|
| `schedule` | `MonthlySchedule?` | `undefined` | 月次引落予定データ |
| `onTransactionViewClick` | `function?` | `undefined` | 取引一覧モーダル表示 |
| `onScheduleViewClick` | `function?` | `undefined` | 予定一覧モーダル表示 |
| `onMonthChange` | `function?` | `undefined` | 月変更時のコールバック |
| `className` | `string?` | `''` | 追加CSSクラス |

## 🏗️ 内部構造

### コンポーネント構成

```typescript
export function CalendarView({
  year,
  month,
  transactions,
  schedule,
  banks,
  cards,
  onDateClick,
  onTransactionClick,
  onTransactionViewClick,
  onScheduleViewClick,
  onMonthChange,
  className
}: CalendarViewProps) {
  // 内部状態
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // カスタムフック
  const { getDayTotal } = useCalendarCalculations({ transactions, schedule });
  const { currentDate, navigateMonth } = useCalendarNavigation(year, month);
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: () => navigateMonth(1),
    onSwipeRight: () => navigateMonth(-1),
  });

  // カレンダーグリッドの生成
  const calendarGrid = useMemo(() => 
    createCalendarGrid(year, month), [year, month]
  );

  return (
    <div 
      className={cn('calendar-view', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <MonthNavigation
        year={year}
        month={month}
        onPrevious={() => onMonthChange?.(/* previous month */)}
        onNext={() => onMonthChange?.(/* next month */)}
      />
      
      <div className="calendar-grid">
        <CalendarHeader />
        {calendarGrid.map((week, weekIndex) => (
          <CalendarWeek key={weekIndex}>
            {week.map((day, dayIndex) => (
              <CalendarCell
                key={`${day.date.getTime()}-${dayIndex}`}
                date={day.date}
                dayTotal={getDayTotal(day.date)}
                isToday={day.isToday}
                isCurrentMonth={day.isCurrentMonth}
                isSelected={selectedDate?.getTime() === day.date.getTime()}
                onClick={handleDateClick}
                onTransactionClick={onTransactionClick}
              />
            ))}
          </CalendarWeek>
        ))}
      </div>
    </div>
  );
}
```

### 使用フック

| フック | 目的 | 戻り値 |
|--------|------|--------|
| `useCalendarCalculations` | 日別データ計算 | `{ getDayTotal, dayTotals, getMonthTotal }` |
| `useCalendarNavigation` | 月次ナビゲーション | `{ currentDate, navigateMonth, isToday }` |
| `useSwipeGesture` | スワイプジェスチャー | `{ onTouchStart, onTouchMove, onTouchEnd }` |

## 💫 アニメーション・インタラクション

### スワイプジェスチャー

```typescript
// スワイプ対応の実装例
const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
  onSwipeLeft: () => {
    // 次の月へ
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    onMonthChange?.(nextYear, nextMonth);
  },
  onSwipeRight: () => {
    // 前の月へ
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    onMonthChange?.(prevYear, prevMonth);
  },
  threshold: 50, // 50px以上のスワイプで発火
  velocity: 0.3, // 最小スワイプ速度
});
```

### トランジション効果

```scss
.calendar-view {
  transition: transform 0.3s ease-out;
  
  &.entering {
    transform: translateX(100%);
  }
  
  &.entered {
    transform: translateX(0);
  }
  
  &.exiting {
    transform: translateX(-100%);
  }
}

.calendar-cell {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}
```

## 🎨 スタイリング

### CSS クラス

| クラス | 説明 | 適用条件 |
|--------|------|----------|
| `.calendar-view` | ベースコンテナ | 常時 |
| `.calendar-grid` | グリッドレイアウト | 常時 |
| `.calendar-header` | 曜日ヘッダー | 常時 |
| `.calendar-week` | 週行コンテナ | 各週 |
| `.loading` | ローディング状態 | データ取得中 |
| `.error` | エラー状態 | エラー発生時 |

### レスポンシブ対応

```scss
.calendar-view {
  // デスクトップ (1024px以上)
  @media (min-width: 1024px) {
    .calendar-cell {
      min-height: 120px;
      padding: 12px;
    }
  }
  
  // タブレット (768px - 1023px)
  @media (min-width: 768px) and (max-width: 1023px) {
    .calendar-cell {
      min-height: 100px;
      padding: 10px;
    }
  }
  
  // モバイル (767px以下)
  @media (max-width: 767px) {
    .calendar-cell {
      min-height: 80px;
      padding: 8px;
      font-size: 0.875rem;
    }
    
    .day-total {
      font-size: 0.75rem;
    }
  }
}
```

## 🔄 状態管理

### 内部状態

```typescript
// コンポーネント内部で管理される状態
interface CalendarViewState {
  selectedDate: Date | null;     // 現在選択中の日付
  isAnimating: boolean;          // アニメーション中フラグ
  touchStartX: number;           // タッチ開始X座標
  touchStartY: number;           // タッチ開始Y座標
}
```

### 外部状態との連携

```typescript
// Zustand Store との連携例
function CalendarViewWithStore() {
  const { transactions, loading, error } = useTransactionStore();
  const { openModal } = useModalStore();
  const [currentYear, currentMonth] = useCurrentDate();
  
  const handleDateClick = useCallback((date: Date) => {
    openModal('transaction', { date });
  }, [openModal]);
  
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    openModal('transactionView', { transaction });
  }, [openModal]);
  
  if (loading) return <CalendarSkeleton />;
  if (error) return <CalendarError error={error} />;
  
  return (
    <CalendarView
      year={currentYear}
      month={currentMonth}
      transactions={transactions}
      onDateClick={handleDateClick}
      onTransactionClick={handleTransactionClick}
    />
  );
}
```

## 📊 パフォーマンス最適化

### メモ化戦略

```typescript
// 重い計算のメモ化
const calendarGrid = useMemo(() => 
  createCalendarGrid(year, month), [year, month]
);

const dayTotalsMemo = useMemo(() => 
  calculateDayTotals(transactions, schedule), [transactions, schedule]
);

// コールバック関数のメモ化
const handleDateClick = useCallback((date: Date) => {
  const dayData = getDayTotal(date);
  onDateClick(date, dayData);
}, [getDayTotal, onDateClick]);
```

### 仮想化対応

```typescript
// 大量データ対応の仮想化
function VirtualizedCalendarView({ transactions }: { transactions: Transaction[] }) {
  const {
    visibleTransactions,
    scrollToDate,
    onScroll
  } = useVirtualizedCalendar({
    transactions,
    itemHeight: 80,
    containerHeight: 600,
  });
  
  return (
    <div className="virtualized-calendar" onScroll={onScroll}>
      {visibleTransactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

## 🧪 テスト

### ユニットテスト

```typescript
describe('CalendarView', () => {
  const defaultProps: CalendarViewProps = {
    year: 2024,
    month: 3,
    transactions: [createMockTransaction()],
    banks: [createMockBank()],
    cards: [createMockCard()],
    onDateClick: jest.fn(),
    onTransactionClick: jest.fn(),
  };
  
  it('should render calendar grid correctly', () => {
    render(<CalendarView {...defaultProps} />);
    
    // 7列（曜日）× 6行（最大週数）のグリッドを確認
    const cells = screen.getAllByRole('button');
    expect(cells.length).toBeGreaterThanOrEqual(35);
    expect(cells.length).toBeLessThanOrEqual(42);
  });
  
  it('should handle date click correctly', async () => {
    const mockOnDateClick = jest.fn();
    render(
      <CalendarView 
        {...defaultProps} 
        onDateClick={mockOnDateClick} 
      />
    );
    
    const dateCell = screen.getByText('15');
    await user.click(dateCell);
    
    expect(mockOnDateClick).toHaveBeenCalledWith(
      expect.any(Date)
    );
  });
  
  it('should display day totals correctly', () => {
    const transactionWithAmount = createMockTransaction({
      date: new Date(2024, 2, 15).getTime(),
      amount: 1500,
    });
    
    render(
      <CalendarView 
        {...defaultProps} 
        transactions={[transactionWithAmount]} 
      />
    );
    
    expect(screen.getByText('¥1,500')).toBeInTheDocument();
  });
  
  it('should handle month navigation', async () => {
    const mockOnMonthChange = jest.fn();
    render(
      <CalendarView 
        {...defaultProps} 
        onMonthChange={mockOnMonthChange} 
      />
    );
    
    const nextButton = screen.getByLabelText('次の月');
    await user.click(nextButton);
    
    expect(mockOnMonthChange).toHaveBeenCalledWith(2024, 4);
  });
});
```

### 統合テスト

```typescript
describe('CalendarView Integration', () => {
  it('should integrate with store correctly', async () => {
    const { store } = renderWithStore(<CalendarViewWithStore />);
    
    // トランザクション追加
    await act(async () => {
      store.getState().actions.addTransaction(createMockTransaction({
        date: new Date(2024, 2, 15).getTime(),
        amount: 2000,
      }));
    });
    
    // カレンダーに反映されることを確認
    await waitFor(() => {
      expect(screen.getByText('¥2,000')).toBeInTheDocument();
    });
  });
  
  it('should handle modal interactions', async () => {
    renderWithStore(<CalendarViewWithStore />);
    
    const dateCell = screen.getByText('15');
    await user.click(dateCell);
    
    // モーダルが開くことを確認
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

## 🎯 使用例

### 基本的な使用方法

```typescript
function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  
  const { transactions, loading } = useTransactions({ year, month });
  const { schedule } = useSchedule({ year, month });
  const { banks } = useBanks();
  const { cards } = useCards();
  
  const handleDateClick = (date: Date) => {
    // 新規取引追加モーダルを開く
    console.log('Date clicked:', date);
  };
  
  const handleTransactionClick = (transaction: Transaction) => {
    // 取引詳細モーダルを開く
    console.log('Transaction clicked:', transaction);
  };
  
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setCurrentDate(new Date(newYear, newMonth - 1, 1));
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <CalendarView
      year={year}
      month={month}
      transactions={transactions}
      schedule={schedule}
      banks={banks}
      cards={cards}
      onDateClick={handleDateClick}
      onTransactionClick={handleTransactionClick}
      onMonthChange={handleMonthChange}
    />
  );
}
```

### カスタマイズ例

```typescript
// 特定の銀行のみ表示するカレンダー
function BankSpecificCalendar({ bankId }: { bankId: string }) {
  const allTransactions = useTransactions();
  const filteredTransactions = useMemo(() =>
    allTransactions.filter(t => t.bankId === bankId),
    [allTransactions, bankId]
  );
  
  return (
    <CalendarView
      year={2024}
      month={3}
      transactions={filteredTransactions}
      onDateClick={(date) => {
        // 特定銀行の取引追加
      }}
      className="bank-specific-calendar"
    />
  );
}

// 読み取り専用カレンダー
function ReadOnlyCalendar({ transactions }: { transactions: Transaction[] }) {
  return (
    <CalendarView
      year={2024}
      month={3}
      transactions={transactions}
      onDateClick={() => {}} // 何もしない
      onTransactionClick={() => {}} // 何もしない
      className="readonly-calendar"
    />
  );
}
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. カレンダーが正しく表示されない

```typescript
// 原因: 不正な year/month 値
// 解決策: バリデーション追加
const isValidDate = (year: number, month: number) => {
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
};

if (!isValidDate(year, month)) {
  console.error('Invalid date:', { year, month });
  return <div>Invalid date parameters</div>;
}
```

#### 2. パフォーマンスが悪い

```typescript
// 原因: 不要な再描画
// 解決策: メモ化の強化
const CalendarViewOptimized = React.memo(CalendarView, (prev, next) => {
  return (
    prev.year === next.year &&
    prev.month === next.month &&
    prev.transactions.length === next.transactions.length &&
    prev.transactions.every((t, i) => t.id === next.transactions[i]?.id)
  );
});
```

#### 3. タッチジェスチャーが効かない

```typescript
// 原因: passive リスナーの問題
// 解決策: イベントオプション調整
useEffect(() => {
  const element = ref.current;
  if (!element) return;
  
  const options = { passive: false };
  element.addEventListener('touchstart', onTouchStart, options);
  element.addEventListener('touchmove', onTouchMove, options);
  element.addEventListener('touchend', onTouchEnd, options);
  
  return () => {
    element.removeEventListener('touchstart', onTouchStart, options);
    element.removeEventListener('touchmove', onTouchMove, options);
    element.removeEventListener('touchend', onTouchEnd, options);
  };
}, []);
```

## 📝 開発ガイドライン

### 新機能追加時の注意点

1. **Props の後方互換性**: 既存の Props を変更する際は `@deprecated` でマークし、段階的に移行
2. **パフォーマンス**: 新しい計算ロジックは必ずメモ化を検討
3. **アクセシビリティ**: キーボードナビゲーションとスクリーンリーダー対応
4. **テスト**: 新機能には対応するテストを必ず追加

### コードレビューチェックポイント

- [ ] Props の型定義が適切か
- [ ] メモ化が適切に使用されているか
- [ ] エラーハンドリングが実装されているか
- [ ] アクセシビリティ要件を満たしているか
- [ ] テストカバレッジが十分か
- [ ] ドキュメントが更新されているか

---

**関連ドキュメント**:
- [CalendarCell](./CalendarCell.md)
- [MonthNavigation](./MonthNavigation.md)
- [DayTotalModal](./DayTotalModal.md)
- [カレンダーフック](../../hooks/calendar.md)
