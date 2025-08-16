# 銀行支払いスケジュール管理システム - リファクタリング計画

## 📋 概要

**期間**: 8週間（3フェーズ）  
**環境**: TypeScript, Next.js 13+, React 18  
**目標**: 可読性向上、保守性強化、パフォーマンス最適化  

## 🔍 現状分析

### 主要問題点（優先度順）

#### 🔴 高優先度
- **`src/app/page.tsx` (463行)**: 複数モーダル状態管理が混在、ビジネスロジックとUI表示が密結合
- **`useDatabase.ts`**: 巨大なフック関数（`useBanks`: 175行、`useTransactions`: 184行）
- **モーダル管理**: 8つの異なるモーダル状態とハンドラーが一つのコンポーネントに集約

#### 🟡 中優先度
- **`CalendarView.tsx` (430行)**: カレンダー表示とスワイプナビゲーションが同一コンポーネント
- **重複コード**: モーダル開閉ハンドラーの重複パターン
- **複雑な計算ロジック**: `calculateDayTotals`関数（89-172行）

#### 🟢 低優先度
- **console.log文**: 102個のconsole文の整理
- **TODOコメント**: 未実装機能の完成または削除

## 🚀 3フェーズ実装計画

---

## フェーズ1: 基盤整備とコンポーネント分離（2週間）

### 目標
状態管理とビジネスロジックの分離、再利用可能なカスタムフックの作成

### 新しいディレクトリ構造
```
src/
├── hooks/
│   ├── modal/
│   │   ├── useModalState.ts        # モーダル状態管理の統一
│   │   └── useModalHandlers.ts     # モーダル操作ハンドラー
│   ├── calendar/
│   │   ├── useCalendarNavigation.ts # カレンダーナビゲーション
│   │   ├── useCalendarData.ts      # カレンダーデータ取得
│   │   └── useSwipeGesture.ts      # スワイプジェスチャー
│   ├── transaction/
│   │   ├── useTransactionOperations.ts # トランザクション操作
│   │   └── useTransactionFilters.ts    # フィルタリングロジック
│   └── database/
│       ├── useTransactionQueries.ts # トランザクションクエリ
│       ├── useCategoryQueries.ts    # カテゴリクエリ
│       └── useAccountQueries.ts     # アカウントクエリ
```

### 1.1 モーダル管理ロジックの統一化 (5日間) 🔴

**現状問題**: `page.tsx`で6つのモーダル状態を個別管理

**実装内容**:
```typescript
// src/hooks/modal/useModalState.ts
interface ModalState<T = any> {
  isOpen: boolean;
  data: T | null;
}

export function useModalManager<T = any>() {
  const [state, setState] = useState<ModalState<T>>({
    isOpen: false,
    data: null
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data || null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  return { isOpen: state.isOpen, data: state.data, open, close };
}
```

**タスク詳細**:
- [ ] モーダル状態管理Context作成 (1.5日)
- [ ] モーダルハンドラの統合 (1.5日)
- [ ] page.tsx の簡素化（352行→150行以下） (2日)

### 1.2 カレンダーコンポーネントのリファクタリング (4日間) 🟡

**現状問題**: `CalendarView.tsx`が431行、複数責務を持つ

**実装内容**:
```typescript
// src/hooks/calendar/useCalendarNavigation.ts
export function useCalendarNavigation(initialDate = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  
  const navigateToMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return { currentDate, navigateToMonth, navigateToToday };
}
```

**タスク詳細**:
- [ ] CalendarGridコンポーネント分離 (1.5日)
- [ ] DayTotalCalculator抽出 (1日)
- [ ] SwipeNavigationの分離 (1日)
- [ ] イベントハンドラの整理 (0.5日)

### 1.3 型定義の整理とstrict モード対応 (2日間) 🟡

**タスク詳細**:
- [ ] 型定義ファイルの分割 (1日)
- [ ] TypeScript strict モード対応 (1日)

### 1.4 共通UIコンポーネントの標準化 (2日間) 🟢

**タスク詳細**:
- [ ] Button コンポーネント拡張 (1日)
- [ ] Modal コンポーネント改善 (1日)

---

## フェーズ2: ステート管理とデータフローの最適化（3週間）

### 目標
グローバル状態管理の導入、データ取得ロジックの最適化

### 新しいアーキテクチャ
```
src/
├── store/
│   ├── slices/
│   │   ├── transactionSlice.ts
│   │   ├── categorySlice.ts
│   │   └── uiSlice.ts
│   └── hooks.ts
├── services/
│   ├── api/
│   │   └── transactionService.ts
│   └── database/
│       ├── transactionRepository.ts
│       └── categoryRepository.ts
```

### 2.1 Global State導入 (5日間) 🔴

**Zustand導入によるモーダル状態の統一管理**

**実装内容**:
```typescript
// src/store/transactionStore.ts
interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  fetchTransactions: (dateRange: DateRange) => Promise<void>;
  addTransaction: (data: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  fetchTransactions: async (dateRange) => {
    set({ isLoading: true, error: null });
    try {
      const data = await transactionService.getByDateRange(dateRange);
      set({ transactions: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

**タスク詳細**:
- [ ] Zustandセットアップ (1日)
- [ ] モーダルStore実装 (2日)
- [ ] 既存Context からStore移行 (2日)

### 2.2 データ取得ロジックの最適化 (4日間) 🟡

**タスク詳細**:
- [ ] useDatabase hooks統合 (2日)
- [ ] データ同期処理改善 (2日)

### 2.3 エラーハンドリングの統一化 (3日間) 🟡

**タスク詳細**:
- [ ] ErrorBoundary実装 (1.5日)
- [ ] エラー通知システム (1.5日)

### 2.4 パフォーマンス最適化 (3日間) 🟢

**タスク詳細**:
- [ ] React.memo適用 (1.5日)
- [ ] useMemo/useCallback最適化 (1.5日)

---

## フェーズ3: 保守性とテスタビリティの向上（3週間）

### 目標
テスト可能な構造、ドキュメント整備、最終品質保証

### 3.1 Custom Hooks の抽出 (5日間) 🟢

**実装内容**:
```typescript
// src/features/calendar/hooks/useCalendarCalculations.ts
export function useCalendarCalculations(currentDate: Date, transactions: Transaction[]) {
  const monthDays = useMemo(() => 
    generateMonthDays(currentDate), [currentDate]
  );
  
  const dailyTotals = useMemo(() => 
    calculateDailyTotals(transactions), [transactions]
  );
  
  const monthlyStats = useMemo(() => 
    calculateMonthlyStats(transactions), [transactions]
  );
  
  return { monthDays, dailyTotals, monthlyStats };
}
```

**タスク詳細**:
- [ ] useCalendarOperations hook (2日)
- [ ] useModalManagement hook (2日)
- [ ] useTransactionOperations hook (1日)

### 3.2 テストスイートの構築 (7日間) 🟡

**タスク詳細**:
- [ ] コンポーネントテスト (3日)
- [ ] Hooksテスト (2日)
- [ ] 統合テスト (2日)

### 3.3 ドキュメント整備 (3日間) 🟢

**タスク詳細**:
- [ ] コンポーネント仕様書 (1.5日)
- [ ] APIドキュメント (1.5日)

### 3.4 最終検証とパフォーマンステスト (6日間) 🟡

**タスク詳細**:
- [ ] パフォーマンス計測 (2日)
- [ ] バグ修正 (3日)
- [ ] デプロイ準備 (1日)

---

## 📊 期待される効果

### 定量的効果
- **コード行数**: 主要コンポーネントを200行以下に削減
- **再利用性**: 共通フックにより約30%のコード削減
- **テストカバレッジ**: 70%以上を達成可能
- **ビルドサイズ**: コード分割により初期バンドルサイズ20%削減

### 定性的効果
- **開発効率**: 新機能追加時間を50%短縮
- **保守性**: 責務が明確化され、デバッグ時間削減
- **拡張性**: 新しいビュー（グラフ、レポート）の追加が容易
- **チーム開発**: 並行開発が可能な構造

---

## ⚠️ リスク管理

### リスクマトリックス

| タスク | 影響度 | 確率 | リスクレベル | 対策 |
|--------|--------|------|-------------|------|
| モーダル管理統一化 | 高 | 中 | 🔴 | 段階的移行、機能テスト強化 |
| Global State導入 | 高 | 中 | 🔴 | 並行開発、ロールバック計画 |
| カレンダー分離 | 中 | 低 | 🟡 | 既存機能維持テスト |
| データ最適化 | 中 | 中 | 🟡 | パフォーマンス監視 |
| UI標準化 | 低 | 低 | 🟢 | デザインレビュー |

### 対策
- **高リスクタスク**: 段階的移行、機能フラグ使用
- **データベース操作**: バックアップ機能の事前確認
- **並行開発**: ブランチ戦略の明確化
- **ユーザビリティ**: スワイプナビゲーション機能の動作維持

---

## 🎯 品質チェックリスト

### 各フェーズ完了時
- [ ] TypeScript エラー 0件
- [ ] ESLint 警告 0件
- [ ] 既存機能の回帰テストパス
- [ ] パフォーマンス劣化なし
- [ ] アクセシビリティ基準維持

### 最終チェック
- [ ] バンドルサイズ増加 <10%
- [ ] 初期表示速度劣化なし
- [ ] モバイル操作性維持
- [ ] 全ブラウザ動作確認

---

## 📅 実装スケジュール

```
Week 1-2:  フェーズ1（基盤整備）
Week 3-5:  フェーズ2（ステート管理最適化）
Week 6-8:  フェーズ3（保守性向上）
Week 9:    最終調整とドキュメント化
```

---

## 🔄 進捗管理

### 週次レポートテンプレート
```markdown
## 週次進捗レポート - 第X週

### 完了タスク
- [x] タスク名 (予定工数 / 実工数)

### 進行中タスク  
- [ ] タスク名 (進捗率)

### 課題・ブロッカー
- 課題内容と対策

### 来週の予定
- 予定タスク一覧

### リスク状況
- 新たなリスク・変更点
```

---

## 📝 特別考慮事項

### 1. 並行開発への配慮
- 新機能追加との競合を避けるため、ブランチ戦略を明確化
- カレンダー機能は優先的にリファクタリング対象

### 2. データベース操作の慎重な取り扱い
- 引落予定データの更新・削除機能（TODO状態）は慎重に実装
- バックアップ機能の事前確認

### 3. ユーザビリティの維持
- スワイプナビゲーション機能の動作維持
- モーダル遷移のUX品質保持

---

**最終更新**: 2025-08-16  
**作成者**: Claude Code  
**レビュー**: 未実施