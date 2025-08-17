# 最初の機能実装ガイド

新規開発者が最初の機能を実装するための実践的なガイドです。実際のコード例とベストプラクティスを含めて説明します。

## 🎯 想定シナリオ: 新しいモーダル機能の追加

例として「月別統計モーダル」を追加する手順を説明します。この機能では、選択月の支出統計を表示します。

## 📋 実装手順

### Step 1: 型定義の追加

まず、新機能に必要な型を定義します。

**`src/types/modal.ts`** に追加:

```typescript
// 既存の ModalType に追加
export type ModalType = 
  | 'transaction'
  | 'transactionView'
  | 'scheduleView'
  | 'scheduleEdit'
  | 'dayTotal'
  | 'monthlyStats';  // ← 新規追加

// 月別統計データの型定義
export interface MonthlyStatsData {
  year: number;
  month: number;
  totalExpense: number;
  bankBreakdown: {
    bankId: string;
    bankName: string;
    amount: number;
    percentage: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  dayAverages: {
    weekday: number;
    average: number;
  }[];
}

// 月別統計モーダルのプロパティ
export interface MonthlyStatsModalProps {
  data: MonthlyStatsData | null;
  isOpen: boolean;
  onClose: () => void;
}
```

### Step 2: ユーティリティ関数の作成

統計計算のロジックを作成します。

**`src/lib/utils/statsUtils.ts`** を新規作成:

```typescript
import { Transaction, Bank } from '@/types/database';
import { MonthlyStatsData } from '@/types/modal';

/**
 * 月別統計データを計算する
 */
export function calculateMonthlyStats(
  transactions: Transaction[],
  banks: Bank[],
  year: number,
  month: number
): MonthlyStatsData {
  // 指定月の取引をフィルタリング
  const monthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getFullYear() === year && 
           transactionDate.getMonth() + 1 === month;
  });

  // 総支出計算
  const totalExpense = monthTransactions.reduce(
    (sum, transaction) => sum + transaction.amount, 0
  );

  // 銀行別内訳
  const bankAmounts = new Map<string, number>();
  monthTransactions.forEach(transaction => {
    if (transaction.bankId) {
      const current = bankAmounts.get(transaction.bankId) || 0;
      bankAmounts.set(transaction.bankId, current + transaction.amount);
    }
  });

  const bankBreakdown = Array.from(bankAmounts.entries()).map(([bankId, amount]) => {
    const bank = banks.find(b => b.id === bankId);
    return {
      bankId,
      bankName: bank?.name || '不明',
      amount,
      percentage: (amount / totalExpense) * 100
    };
  }).sort((a, b) => b.amount - a.amount);

  // カテゴリ別内訳（仮実装）
  const categoryBreakdown = [
    { category: '食費', amount: totalExpense * 0.3, percentage: 30 },
    { category: '交通費', amount: totalExpense * 0.2, percentage: 20 },
    { category: 'その他', amount: totalExpense * 0.5, percentage: 50 }
  ];

  // 曜日別平均（仮実装）
  const dayAverages = Array.from({ length: 7 }, (_, i) => ({
    weekday: i,
    average: totalExpense / 30
  }));

  return {
    year,
    month,
    totalExpense,
    bankBreakdown,
    categoryBreakdown,
    dayAverages
  };
}

/**
 * 金額をフォーマットする
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

/**
 * パーセンテージをフォーマットする
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}
```

### Step 3: モーダルコンポーネントの作成

統計表示用のモーダルコンポーネントを作成します。

**`src/components/calendar/MonthlyStatsModal.tsx`** を新規作成:

```typescript
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MonthlyStatsModalProps } from '@/types/modal';
import { formatAmount, formatPercentage } from '@/lib/utils/statsUtils';
import { BaseModal } from './BaseModal';

export function MonthlyStatsModal({
  data,
  isOpen,
  onClose
}: MonthlyStatsModalProps) {
  if (!data) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${data.year}年${data.month}月の統計`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* 総支出 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            総支出
          </h3>
          <p className="text-2xl font-bold text-blue-700">
            {formatAmount(data.totalExpense)}
          </p>
        </div>

        {/* 銀行別内訳 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            銀行別内訳
          </h3>
          <div className="space-y-2">
            {data.bankBreakdown.map((bank) => (
              <div
                key={bank.bankId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{bank.bankName}</span>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatAmount(bank.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPercentage(bank.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* カテゴリ別内訳 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            カテゴリ別内訳
          </h3>
          <div className="space-y-2">
            {data.categoryBreakdown.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{category.category}</span>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatAmount(category.amount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPercentage(category.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
```

### Step 4: ストアへの統合

Zustandストアに新しいモーダル状態を追加します。

**`src/store/slices/modalSlice.ts`** を更新:

```typescript
// ModalStates インターフェースに追加
export interface ModalStates {
  transaction: boolean;
  transactionView: boolean;
  scheduleView: boolean;
  scheduleEdit: boolean;
  dayTotal: boolean;
  monthlyStats: boolean;  // ← 追加
}

// SelectedData インターフェースに追加
export interface SelectedData {
  date: Date | null;
  transaction: Transaction | null;
  transactions: Transaction[];
  scheduleItems: ScheduleItem[];
  scheduleItem: ScheduleItem | null;
  dayTotalData: DayTotalData | null;
  monthlyStatsData: MonthlyStatsData | null;  // ← 追加
}

// 初期状態に追加
const initialModalStates: ModalStates = {
  transaction: false,
  transactionView: false,
  scheduleView: false,
  scheduleEdit: false,
  dayTotal: false,
  monthlyStats: false,  // ← 追加
};

const initialSelectedData: SelectedData = {
  date: null,
  transaction: null,
  transactions: [],
  scheduleItems: [],
  scheduleItem: null,
  dayTotalData: null,
  monthlyStatsData: null,  // ← 追加
};

// アクションに追加
export interface ModalActions {
  // ... 既存のアクション
  openMonthlyStatsModal: (data: MonthlyStatsData) => void;
  closeMonthlyStatsModal: () => void;
}

// 実装に追加
openMonthlyStatsModal: (data) => {
  set((state) => ({
    modalStates: {
      ...state.modalStates,
      monthlyStats: true,
    },
    selectedData: {
      ...state.selectedData,
      monthlyStatsData: data,
    },
  }));
},

closeMonthlyStatsModal: () => {
  set((state) => ({
    modalStates: {
      ...state.modalStates,
      monthlyStats: false,
    },
    selectedData: {
      ...state.selectedData,
      monthlyStatsData: null,
    },
  }));
},
```

### Step 5: フックの作成

統計データを計算するカスタムフックを作成します。

**`src/hooks/useMonthlyStats.ts`** を新規作成:

```typescript
import { useMemo } from 'react';
import { useTransactionStore } from '@/store';
import { calculateMonthlyStats } from '@/lib/utils/statsUtils';
import { MonthlyStatsData } from '@/types/modal';

export interface UseMonthlyStatsProps {
  year: number;
  month: number;
}

export interface UseMonthlyStatsReturn {
  data: MonthlyStatsData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMonthlyStats({ 
  year, 
  month 
}: UseMonthlyStatsProps): UseMonthlyStatsReturn {
  const { transactions, banks } = useTransactionStore();

  const data = useMemo(() => {
    try {
      if (!transactions.length || !banks.length) {
        return null;
      }

      return calculateMonthlyStats(transactions, banks, year, month);
    } catch (error) {
      console.error('Failed to calculate monthly stats:', error);
      return null;
    }
  }, [transactions, banks, year, month]);

  return {
    data,
    isLoading: false, // 実際の実装では非同期処理のローディング状態
    error: null,      // 実際の実装ではエラーハンドリング
  };
}
```

### Step 6: UI統合

カレンダーコンポーネントに統計ボタンとモーダルを統合します。

**`src/components/calendar/CalendarView.tsx`** を更新:

```typescript
// インポートに追加
import { MonthlyStatsModal } from './MonthlyStatsModal';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { useAppStore } from '@/store';

// CalendarViewProps に追加
export interface CalendarViewProps {
  // ... 既存のプロパティ
  onMonthlyStatsClick?: (year: number, month: number) => void;
}

// CalendarView コンポーネント内に追加
export function CalendarView({ 
  year, 
  month,
  // ... 既存のプロパティ
  onMonthlyStatsClick 
}: CalendarViewProps) {
  // 統計データフック
  const { data: monthlyStatsData } = useMonthlyStats({ year, month });
  
  // ストアから統計モーダル状態を取得
  const monthlyStatsModalOpen = useAppStore(state => state.modalStates.monthlyStats);
  const monthlyStatsData = useAppStore(state => state.selectedData.monthlyStatsData);
  const { openMonthlyStatsModal, closeMonthlyStatsModal } = useAppStore(state => state.modalActions);

  // 統計ボタンクリックハンドラー
  const handleStatsClick = () => {
    if (monthlyStatsData) {
      openMonthlyStatsModal(monthlyStatsData);
    }
    onMonthlyStatsClick?.(year, month);
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      {/* ヘッダーに統計ボタンを追加 */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {year}年 {getMonthNameJP(month)}
        </h2>
        <button
          onClick={handleStatsClick}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          disabled={!monthlyStatsData}
        >
          統計
        </button>
      </div>

      {/* 既存のカレンダー内容 */}
      {/* ... */}

      {/* 統計モーダル */}
      <MonthlyStatsModal
        data={monthlyStatsData}
        isOpen={monthlyStatsModalOpen}
        onClose={closeMonthlyStatsModal}
      />
    </div>
  );
}
```

### Step 7: テストの作成

新機能のテストを作成します。

**`__tests__/components/calendar/MonthlyStatsModal.test.tsx`**:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyStatsModal } from '@/components/calendar/MonthlyStatsModal';
import { MonthlyStatsData } from '@/types/modal';

const mockData: MonthlyStatsData = {
  year: 2025,
  month: 8,
  totalExpense: 150000,
  bankBreakdown: [
    { bankId: '1', bankName: 'SBI銀行', amount: 100000, percentage: 66.7 },
    { bankId: '2', bankName: '楽天銀行', amount: 50000, percentage: 33.3 }
  ],
  categoryBreakdown: [
    { category: '食費', amount: 45000, percentage: 30 },
    { category: '交通費', amount: 30000, percentage: 20 },
    { category: 'その他', amount: 75000, percentage: 50 }
  ],
  dayAverages: []
};

describe('MonthlyStatsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('データが正しく表示される', () => {
    render(
      <MonthlyStatsModal
        data={mockData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('2025年8月の統計')).toBeInTheDocument();
    expect(screen.getByText('¥150,000')).toBeInTheDocument();
    expect(screen.getByText('SBI銀行')).toBeInTheDocument();
    expect(screen.getByText('楽天銀行')).toBeInTheDocument();
  });

  it('閉じるボタンが動作する', () => {
    render(
      <MonthlyStatsModal
        data={mockData}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('閉じる'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('データがnullの場合は何も表示しない', () => {
    const { container } = render(
      <MonthlyStatsModal
        data={null}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
```

**`__tests__/hooks/useMonthlyStats.test.ts`**:

```typescript
import { renderHook } from '@testing-library/react';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';

// モックストア
jest.mock('@/store', () => ({
  useTransactionStore: () => ({
    transactions: [
      {
        id: '1',
        date: '2025-08-15',
        amount: 1000,
        bankId: 'bank1',
        storeName: 'テストストア'
      }
    ],
    banks: [
      { id: 'bank1', name: 'テスト銀行' }
    ]
  })
}));

describe('useMonthlyStats', () => {
  it('統計データを正しく計算する', () => {
    const { result } = renderHook(() =>
      useMonthlyStats({ year: 2025, month: 8 })
    );

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.totalExpense).toBe(1000);
    expect(result.current.data?.bankBreakdown).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

### Step 8: エクスポートの更新

新しいコンポーネントとフックをエクスポートに追加します。

**`src/components/calendar/index.ts`** に追加:

```typescript
export { MonthlyStatsModal } from './MonthlyStatsModal';
```

**`src/hooks/index.ts`** に追加:

```typescript
export { useMonthlyStats } from './useMonthlyStats';
```

**`src/lib/utils/index.ts`** に追加:

```typescript
export * from './statsUtils';
```

## 🧪 テスト実行

実装後は以下のコマンドでテストを実行します：

```bash
# 新しいテストを実行
npm test -- --testPathPattern="MonthlyStats"

# 全テストを実行してリグレッションがないか確認
npm test

# 型チェック
npm run type-check

# リンティング
npm run lint
```

## 📝 コミット例

適切なコミットメッセージでコミットします：

```bash
git add .
git commit -m "feat: add monthly statistics modal

- Add MonthlyStatsData type definition
- Create calculateMonthlyStats utility function
- Implement MonthlyStatsModal component
- Add useMonthlyStats custom hook
- Integrate with CalendarView component
- Add comprehensive tests for new functionality

Implements monthly expense statistics with bank and category breakdowns."
```

## 🔄 レビューチェックリスト

Pull Request作成前に以下を確認：

- [ ] TypeScript エラーなし
- [ ] ESLint 警告なし
- [ ] テストカバレッジ 80% 以上
- [ ] コンポーネントが適切にメモ化されている
- [ ] アクセシビリティ要件を満たしている
- [ ] モバイル対応が考慮されている
- [ ] エラーハンドリングが実装されている
- [ ] ローディング状態が適切に処理されている

## 🚀 次のステップ

1. **機能拡張**: グラフ表示、エクスポート機能など
2. **パフォーマンス最適化**: 大量データでの動作確認
3. **ユーザビリティ改善**: アニメーション、フィードバック改善
4. **国際化対応**: 多言語対応の準備

この実装パターンに従うことで、一貫性のある高品質な機能を効率的に追加できます。
