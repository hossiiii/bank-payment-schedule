# カレンダーフック

## 🎣 概要

カレンダーフックは、カレンダー機能に特化したカスタムフックのコレクションです。取引データの計算、ナビゲーション、ユーザーインタラクションを効率的に管理します。

## 📦 フック一覧

| フック | 説明 | 主な用途 |
|--------|------|----------|
| `useCalendarCalculations` | 日別集計計算 | 取引・スケジュールの日別合計 |
| `useCalendarNavigation` | 月間ナビゲーション | 前後月移動、現在月表示 |
| `useSwipeGesture` | スワイプ操作 | タッチジェスチャー処理 |

## 🧮 useCalendarCalculations

### インターフェース

```typescript
interface UseCalendarCalculationsProps {
  transactions: Transaction[];
  schedule?: MonthlySchedule;
}

interface UseCalendarCalculationsReturn {
  dayTotals: Map<string, DayTotalData>;
  getDayTotal: (date: Date) => DayTotalData | undefined;
  hasDayData: (date: Date) => boolean;
  getMonthTotal: () => number;
  getTransactionTotal: () => number;
  getScheduleTotal: () => number;
  getBankTotals: () => Map<string, number>;
  getCardTotals: () => Map<string, number>;
}

interface DayTotalData {
  date: string;
  totalAmount: number;
  transactionTotal: number;
  scheduleTotal: number;
  cardTotal: number;
  directTotal: number;
  transactionCount: number;
  scheduleCount: number;
  transactions: Transaction[];
  scheduleItems: ScheduleItem[];
  hasData: boolean;
  hasTransactions: boolean;
  hasSchedule: boolean;
}
```

### 使用例

```typescript
import { useCalendarCalculations } from '@/hooks/calendar';

function CalendarComponent({ year, month }: CalendarProps) {
  const transactions = useAppStore(state => state.transactions);
  const schedule = useAppStore(state => state.schedules.find(s => 
    s.year === year && s.month === month
  ));

  const {
    dayTotals,
    getDayTotal,
    hasDayData,
    getMonthTotal,
    getBankTotals
  } = useCalendarCalculations({
    transactions: transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    }),
    schedule
  });

  const handleDateClick = (date: Date) => {
    const dayData = getDayTotal(date);
    if (dayData) {
      // 日別詳細モーダルを開く
      openDayTotalModal(date, dayData);
    } else {
      // 新規取引モーダルを開く
      openTransactionModal(date);
    }
  };

  const monthTotal = getMonthTotal();
  const bankTotals = getBankTotals();

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h2>{year}年{month}月</h2>
        <div className="month-total">
          合計: {monthTotal.toLocaleString()}円
        </div>
      </div>
      
      <div className="calendar-grid">
        {calendarDays.map(date => (
          <CalendarCell
            key={date.toISOString()}
            date={date}
            dayTotal={getDayTotal(date)}
            hasData={hasDayData(date)}
            onClick={() => handleDateClick(date)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 内部実装

```typescript
export function useCalendarCalculations({
  transactions,
  schedule
}: UseCalendarCalculationsProps): UseCalendarCalculationsReturn {
  
  const dayTotals = useMemo(() => {
    const totals = new Map<string, DayTotalData>();
    
    // 取引データの処理
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

  const getDayTotal = useCallback((date: Date) => {
    return dayTotals.get(formatDateISO(date));
  }, [dayTotals]);

  const hasDayData = useCallback((date: Date) => {
    return dayTotals.has(formatDateISO(date));
  }, [dayTotals]);

  const getMonthTotal = useCallback(() => {
    return Array.from(dayTotals.values())
      .reduce((sum, day) => sum + day.totalAmount, 0);
  }, [dayTotals]);

  const getTransactionTotal = useCallback(() => {
    return Array.from(dayTotals.values())
      .reduce((sum, day) => sum + day.transactionTotal, 0);
  }, [dayTotals]);

  const getScheduleTotal = useCallback(() => {
    return Array.from(dayTotals.values())
      .reduce((sum, day) => sum + day.scheduleTotal, 0);
  }, [dayTotals]);

  const getBankTotals = useCallback(() => {
    const bankTotals = new Map<string, number>();
    
    Array.from(dayTotals.values()).forEach(dayData => {
      dayData.transactions.forEach(transaction => {
        if (transaction.bankId) {
          const current = bankTotals.get(transaction.bankId) || 0;
          bankTotals.set(transaction.bankId, current + transaction.amount);
        }
      });
    });
    
    return bankTotals;
  }, [dayTotals]);

  const getCardTotals = useCallback(() => {
    const cardTotals = new Map<string, number>();
    
    Array.from(dayTotals.values()).forEach(dayData => {
      dayData.transactions.forEach(transaction => {
        if (transaction.cardId) {
          const current = cardTotals.get(transaction.cardId) || 0;
          cardTotals.set(transaction.cardId, current + transaction.amount);
        }
      });
    });
    
    return cardTotals;
  }, [dayTotals]);

  return {
    dayTotals,
    getDayTotal,
    hasDayData,
    getMonthTotal,
    getTransactionTotal,
    getScheduleTotal,
    getBankTotals,
    getCardTotals,
  };
}
```

## 🧭 useCalendarNavigation

### インターフェース

```typescript
interface UseCalendarNavigationProps {
  year: number;
  month: number;
  onMonthChange?: (year: number, month: number) => void;
}

interface UseCalendarNavigationReturn {
  currentDate: Date;
  previousMonth: () => void;
  nextMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  goToToday: () => void;
  isCurrentMonth: boolean;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  monthName: string;
  yearMonth: string;
}
```

### 使用例

```typescript
import { useCalendarNavigation } from '@/hooks/calendar';

function MonthNavigation({ year, month, onMonthChange }: MonthNavigationProps) {
  const {
    previousMonth,
    nextMonth,
    goToToday,
    isCurrentMonth,
    isPreviousDisabled,
    isNextDisabled,
    monthName,
    yearMonth
  } = useCalendarNavigation({
    year,
    month,
    onMonthChange
  });

  return (
    <div className="flex items-center justify-between p-4">
      <button
        onClick={previousMonth}
        disabled={isPreviousDisabled}
        className="p-2 hover:bg-gray-100 disabled:opacity-50"
        aria-label="前の月"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">
          {yearMonth}
        </h2>
        
        {!isCurrentMonth && (
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            今月
          </button>
        )}
      </div>

      <button
        onClick={nextMonth}
        disabled={isNextDisabled}
        className="p-2 hover:bg-gray-100 disabled:opacity-50"
        aria-label="次の月"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### 機能詳細

#### 月間ナビゲーション
```typescript
const previousMonth = useCallback(() => {
  const newDate = new Date(year, month - 2); // month is 1-indexed
  onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
}, [year, month, onMonthChange]);

const nextMonth = useCallback(() => {
  const newDate = new Date(year, month); // month is 1-indexed
  onMonthChange?.(newDate.getFullYear(), newDate.getMonth() + 1);
}, [year, month, onMonthChange]);
```

#### 制限チェック
```typescript
const isPreviousDisabled = useMemo(() => {
  // 例: 2020年1月より前は無効
  const minDate = new Date(2020, 0);
  const currentDate = new Date(year, month - 1);
  return currentDate <= minDate;
}, [year, month]);

const isNextDisabled = useMemo(() => {
  // 例: 現在月の2年後まで
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const currentDate = new Date(year, month - 1);
  return currentDate >= maxDate;
}, [year, month]);
```

## 👆 useSwipeGesture

### インターフェース

```typescript
interface UseSwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  preventDefaultTouchBehavior?: boolean;
  enableClickInterception?: boolean;
}

interface UseSwipeGestureReturn {
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  touchActionStyle: {
    touchAction: string;
  };
  isTracking: boolean;
}
```

### 使用例

```typescript
import { useSwipeGesture } from '@/hooks/calendar';

function SwipeableCalendar({ onMonthChange }: SwipeableCalendarProps) {
  const { handlePreviousMonth, handleNextMonth } = useCalendarNavigation({
    year,
    month,
    onMonthChange
  });

  const { swipeHandlers, touchActionStyle } = useSwipeGesture({
    onSwipeLeft: handleNextMonth,
    onSwipeRight: handlePreviousMonth,
    threshold: 60, // 60px以上のスワイプで反応
    velocityThreshold: 0.1, // 速度閾値
    preventDefaultTouchBehavior: true,
    enableClickInterception: false
  });

  return (
    <div 
      className="calendar-container"
      {...swipeHandlers}
      style={touchActionStyle}
    >
      {/* カレンダーコンテンツ */}
    </div>
  );
}
```

### 内部実装

```typescript
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  preventDefaultTouchBehavior = false,
  enableClickInterception = true
}: UseSwipeGestureProps): UseSwipeGestureReturn {
  
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: Date.now(),
    });
    setIsTracking(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;

    if (preventDefaultTouchBehavior) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchState(prev => prev ? {
      ...prev,
      lastX: touch.clientX,
      lastY: touch.clientY,
      lastTime: now,
    } : null);
  }, [touchState, preventDefaultTouchBehavior]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;

    const deltaX = touchState.lastX - touchState.startX;
    const deltaY = touchState.lastY - touchState.startY;
    const deltaTime = touchState.lastTime - touchState.startTime;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // 水平スワイプの判定
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    }
    // 垂直スワイプの判定
    else {
      if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setTouchState(null);
    setIsTracking(false);
  }, [touchState, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const touchActionStyle = useMemo(() => ({
    touchAction: preventDefaultTouchBehavior ? 'none' : 'auto'
  }), [preventDefaultTouchBehavior]);

  return {
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    touchActionStyle,
    isTracking,
  };
}
```

## 📅 統合使用例

### 完全なカレンダーコンポーネント

```typescript
import { 
  useCalendarCalculations, 
  useCalendarNavigation, 
  useSwipeGesture 
} from '@/hooks/calendar';

function CompleteCalendar({
  year,
  month,
  transactions,
  schedule,
  onMonthChange,
  onDateClick
}: CompleteCalendarProps) {
  
  // 計算フック
  const {
    dayTotals,
    getDayTotal,
    hasDayData,
    getMonthTotal
  } = useCalendarCalculations({
    transactions,
    schedule
  });

  // ナビゲーションフック
  const {
    previousMonth,
    nextMonth,
    goToToday,
    isCurrentMonth,
    monthName
  } = useCalendarNavigation({
    year,
    month,
    onMonthChange
  });

  // スワイプジェスチャーフック
  const { swipeHandlers, touchActionStyle } = useSwipeGesture({
    onSwipeLeft: nextMonth,
    onSwipeRight: previousMonth,
    threshold: 60,
    velocityThreshold: 0.1,
    preventDefaultTouchBehavior: true
  });

  // カレンダーグリッドの生成
  const calendarGrid = useMemo(() => {
    return createCalendarGrid(year, month);
  }, [year, month]);

  const handleDateClick = useCallback((date: Date) => {
    const dayData = getDayTotal(date);
    onDateClick(date, dayData);
  }, [getDayTotal, onDateClick]);

  return (
    <div 
      className="calendar-container"
      {...swipeHandlers}
      style={touchActionStyle}
    >
      {/* ヘッダー */}
      <div className="calendar-header">
        <button onClick={previousMonth}>
          <ChevronLeftIcon />
        </button>
        
        <div className="month-info">
          <h2>{year}年 {monthName}</h2>
          <div className="month-total">
            {getMonthTotal().toLocaleString()}円
          </div>
        </div>
        
        <button onClick={nextMonth}>
          <ChevronRightIcon />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="weekday-headers">
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div key={index} className="weekday-header">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid">
        {calendarGrid.map((calendarDay, index) => (
          <CalendarCell
            key={index}
            date={calendarDay.date}
            dayTotal={calendarDay.date ? getDayTotal(calendarDay.date) : undefined}
            hasData={calendarDay.date ? hasDayData(calendarDay.date) : false}
            isToday={calendarDay.isToday}
            isCurrentMonth={calendarDay.isCurrentMonth}
            onClick={() => calendarDay.date && handleDateClick(calendarDay.date)}
          />
        ))}
      </div>

      {/* 今月に戻るボタン */}
      {!isCurrentMonth && (
        <button
          onClick={goToToday}
          className="go-to-today-btn"
        >
          今月に戻る
        </button>
      )}
    </div>
  );
}
```

## 🧪 テスト戦略

### フックテストの例

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCalendarCalculations } from '@/hooks/calendar';

describe('useCalendarCalculations', () => {
  const mockTransactions = [
    {
      id: '1',
      date: '2025-08-15',
      amount: 1000,
      paymentType: 'card' as const,
      storeName: 'テストストア',
    },
    {
      id: '2',
      date: '2025-08-15',
      amount: 2000,
      paymentType: 'bank' as const,
      storeName: 'テストストア2',
    },
  ];

  it('日別合計を正しく計算する', () => {
    const { result } = renderHook(() =>
      useCalendarCalculations({
        transactions: mockTransactions,
      })
    );

    const dayTotal = result.current.getDayTotal(new Date('2025-08-15'));
    
    expect(dayTotal).toBeDefined();
    expect(dayTotal!.totalAmount).toBe(3000);
    expect(dayTotal!.transactionCount).toBe(2);
    expect(dayTotal!.cardTotal).toBe(1000);
    expect(dayTotal!.directTotal).toBe(2000);
  });

  it('月合計を正しく計算する', () => {
    const { result } = renderHook(() =>
      useCalendarCalculations({
        transactions: mockTransactions,
      })
    );

    expect(result.current.getMonthTotal()).toBe(3000);
  });

  it('データの有無を正しく判定する', () => {
    const { result } = renderHook(() =>
      useCalendarCalculations({
        transactions: mockTransactions,
      })
    );

    expect(result.current.hasDayData(new Date('2025-08-15'))).toBe(true);
    expect(result.current.hasDayData(new Date('2025-08-16'))).toBe(false);
  });
});
```

## ⚡ パフォーマンス最適化

### メモ化とコールバック

```typescript
// 依存配列を最小限に
const dayTotals = useMemo(() => {
  // 重い計算処理
}, [transactions, schedule]); // 必要最小限の依存

// コールバックの安定化
const getDayTotal = useCallback((date: Date) => {
  return dayTotals.get(formatDateISO(date));
}, [dayTotals]);

// 日付フォーマットのメモ化
const formatDateISO = useMemo(() => {
  const formatter = new Intl.DateTimeFormat('sv-SE'); // ISO format
  return (date: Date) => formatter.format(date);
}, []);
```

### 計算の最適化

```typescript
// 大量データ向けの最適化
const optimizedDayTotals = useMemo(() => {
  if (transactions.length > 10000) {
    // 大量データの場合は段階的処理
    return computeLargeDayTotals(transactions, schedule);
  }
  return computeStandardDayTotals(transactions, schedule);
}, [transactions, schedule]);
```

## 📚 関連ドキュメント

- [モーダル管理フック](./modal.md)
- [データベースフック](./database.md)
- [状態管理フック](./state-management.md)
- [カレンダーコンポーネント](../components/calendar/)
- [パフォーマンス最適化](../architecture/performance.md)

