# プロジェクト構造詳細

銀行別引落予定表PWAアプリケーションの詳細なプロジェクト構造とファイル配置について説明します。

## 📁 ルートディレクトリ構造

```
bank-payment-schedule/
├── src/                    # ソースコード
├── public/                 # 静的ファイル
├── docs/                   # ドキュメント
├── __tests__/              # テストファイル
├── coverage/               # テストカバレッジ
├── playwright-report/      # E2Eテストレポート
├── context-engineering/    # 開発・設計資料
├── 設定ファイル群
└── README.md
```

## 🎯 src/ ディレクトリ（メインソースコード）

### App Router構造 (`src/app/`)

```
src/app/
├── globals.css             # グローバルスタイル
├── layout.tsx              # ルートレイアウト（認証・PWA設定）
├── page.tsx                # ホーム（カレンダー表示）
├── schedule/
│   └── page.tsx           # 引落予定表ページ
└── settings/
    └── page.tsx           # 設定・マスタ管理ページ
```

**重要なファイル:**
- `layout.tsx`: 全体のレイアウト、認証プロバイダー、PWA設定
- `page.tsx`: メインカレンダー画面、取引入力の起点
- `schedule/page.tsx`: 銀行別引落予定の一覧表示
- `settings/page.tsx`: 銀行・カードマスタの管理画面

### コンポーネント階層 (`src/components/`)

```
src/components/
├── calendar/               # カレンダー関連コンポーネント
│   ├── BaseModal.tsx      # モーダルのベースコンポーネント
│   ├── CalendarCell.tsx   # 個別日付セル
│   ├── CalendarView.tsx   # メインカレンダー
│   ├── CalendarViewWithStore.tsx  # ストア連携版
│   ├── DayTotalModal.tsx  # 日別合計表示モーダル
│   ├── MonthNavigation.tsx # 月間ナビゲーション
│   ├── ScheduleEditModal.tsx # スケジュール編集
│   ├── ScheduleModal.tsx  # スケジュール表示
│   ├── ScheduleViewModal.tsx # スケジュール一覧
│   ├── TransactionModal.tsx # 取引入力/編集
│   ├── TransactionViewModal.tsx # 取引一覧
│   └── index.ts           # エクスポート管理
├── schedule/              # スケジュール関連
│   ├── BankScheduleTable.tsx # 引落予定表
│   ├── MobileScheduleCard.tsx # モバイル版カード
│   ├── MonthSelector.tsx  # 月選択
│   ├── PaymentRow.tsx     # 支払い行
│   ├── ScheduleFilters.tsx # フィルター
│   ├── TransactionDetailModal.tsx # 取引詳細
│   └── index.ts
├── encryption/            # 暗号化・認証関連
│   ├── AutoLockWarning.tsx # 自動ロック警告
│   ├── EncryptionProvider.tsx # 暗号化プロバイダー
│   ├── MigrationDialog.tsx # データ移行
│   ├── PasswordChange.tsx # パスワード変更
│   ├── PasswordSetup.tsx  # パスワード設定
│   ├── SessionLock.tsx    # セッションロック
│   ├── SessionStatus.tsx  # セッション状態
│   └── index.ts
├── settings/              # 設定関連
│   ├── BankMaster.tsx     # 銀行マスタ管理
│   ├── CardMaster.tsx     # カードマスタ管理
│   ├── DataFixPanel.tsx   # データ修復パネル
│   └── index.ts
├── ui/                    # 汎用UIコンポーネント
│   ├── Button.tsx         # ボタン
│   ├── Input.tsx          # 入力フィールド
│   ├── Modal.tsx          # モーダル
│   ├── Navigation.tsx     # ナビゲーション
│   └── index.ts
├── database/              # データベース関連
│   ├── MigrationErrorDialog.tsx # 移行エラー
│   └── index.ts
├── demo/                  # デモ・開発用
│   └── StoreDemo.tsx
└── dev/                   # 開発ツール
    └── StoreDebugPanel.tsx
```

### フック管理 (`src/hooks/`)

```
src/hooks/
├── index.ts               # メインエクスポート
└── modal/                 # モーダル管理フック
    ├── index.ts
    ├── useModalManager.ts # モーダル統合管理
    └── useModalManagerAdapter.ts # ストア連携
```

### ライブラリ・ユーティリティ (`src/lib/`)

```
src/lib/
├── contexts/              # React Context
│   └── EncryptionContext.tsx # 暗号化コンテキスト
├── database/              # データベース層
│   ├── backup.ts          # バックアップ機能
│   ├── encryption.ts      # 暗号化処理
│   ├── encryptionConfig.ts # 暗号化設定
│   ├── errors.ts          # エラー定義
│   ├── index.ts           # エクスポート
│   ├── migrationHandler.ts # データ移行
│   ├── migrationUtils.ts  # 移行ユーティリティ
│   ├── operations.ts      # CRUD操作
│   ├── schema.ts          # Dexie.jsスキーマ
│   └── versionManager.ts  # バージョン管理
├── hooks/                 # 追加カスタムフック
│   ├── calendar/          # カレンダー専用フック
│   │   ├── index.ts
│   │   ├── useCalendarCalculations.ts # 計算処理
│   │   ├── useCalendarNavigation.ts   # ナビゲーション
│   │   └── useSwipeGesture.ts        # スワイプ操作
│   ├── optimizedUseDatabase.ts # 最適化データベースフック
│   ├── useAutoLock.ts     # 自動ロック
│   ├── useDatabase.ts     # データベース操作
│   ├── useEncryption.ts   # 暗号化
│   ├── useFilteredSchedule.ts # スケジュールフィルタ
│   ├── useScheduleData.ts # スケジュールデータ
│   └── useSwipeNavigation.ts # スワイプナビゲーション
├── utils/                 # ユーティリティ関数
│   ├── dataFixUtils.ts    # データ修復
│   ├── dateUtils.ts       # 日付処理
│   ├── index.ts
│   ├── logger.ts          # ログ機能
│   ├── paymentCalc.ts     # 支払い計算
│   ├── scheduleUtils.ts   # スケジュール処理
│   └── validation.ts      # バリデーション
├── utils.ts               # 汎用ユーティリティ
├── error/                 # エラー処理（新規）
└── query/                 # クエリ処理（新規）
```

### Zustand ストア (`src/store/`)

```
src/store/
├── index.ts               # メインストア
├── selectors/             # セレクター
│   └── index.ts
├── slices/                # 状態スライス
│   ├── modalSlice.ts      # モーダル状態
│   ├── scheduleSlice.ts   # スケジュール状態
│   ├── transactionSlice.ts # 取引状態
│   └── uiSlice.ts         # UI状態
└── types/                 # ストア型定義
    └── index.ts
```

### 型定義 (`src/types/`)

```
src/types/
├── calendar.ts            # カレンダー型
├── database.ts            # データベース型
├── modal.ts               # モーダル型
└── schedule.ts            # スケジュール型
```

## 🧪 テスト構造 (`__tests__/`)

```
__tests__/
├── components/            # コンポーネントテスト
│   ├── calendar/         # カレンダーコンポーネント
│   └── store/           # ストア連携コンポーネント
├── e2e/                  # E2Eテスト
├── hooks/                # フックテスト
├── integration/          # 統合テスト
├── lib/                  # ライブラリテスト
│   ├── database/        # データベース操作
│   └── utils/           # ユーティリティ
├── performance/          # パフォーマンステスト
├── store/                # ストアテスト
│   ├── slices/          # スライステスト
│   └── integration/     # ストア統合テスト
├── types/                # 型テスト
├── utils/                # テストユーティリティ
└── scripts/              # テスト実行スクリプト
```

## 📄 設定ファイル

### TypeScript設定
- `tsconfig.json`: メインTypeScript設定（Strict Mode）
- `next-env.d.ts`: Next.js型定義

### ビルド・バンドル設定
- `next.config.js`: Next.js設定（PWA、画像最適化）
- `tailwind.config.js`: Tailwind CSS設定
- `postcss.config.js`: PostCSS設定

### コード品質
- `.eslintrc.json`: ESLint設定
- `.prettierrc`: Prettier設定

### テスト設定
- `jest.config.js`: Jest設定
- `jest.setup.js`: Jest初期化
- `playwright.config.ts`: Playwright E2Eテスト設定
- `playwright-global-setup.ts`: グローバルセットアップ
- `playwright-global-teardown.ts`: グローバルクリーンアップ

### パッケージ管理
- `package.json`: 依存関係とスクリプト
- `package-lock.json`: 依存関係ロック

## 🎯 重要なアーキテクチャパターン

### 1. レイヤード アーキテクチャ

```
表現層 (Presentation)
├── pages/ (App Router)
├── components/
└── hooks/

ビジネス層 (Business Logic)
├── lib/utils/ (計算・バリデーション)
├── store/ (状態管理)
└── lib/hooks/ (ビジネスロジック)

データ層 (Data Access)
├── lib/database/ (データベース操作)
├── types/ (データモデル)
└── lib/contexts/ (外部システム)
```

### 2. モジュール分離

```
機能別モジュール:
- Calendar Module (calendar/, types/calendar.ts)
- Schedule Module (schedule/, types/schedule.ts)
- Database Module (lib/database/, types/database.ts)
- Encryption Module (encryption/, lib/contexts/)
- UI Module (ui/)
```

### 3. 状態管理パターン

```
グローバル状態 (Zustand):
- モーダル状態
- データキャッシュ
- UI状態

ローカル状態 (React Hooks):
- フォーム状態
- 一時的UI状態
- コンポーネント内部状態

Context状態:
- 認証状態
- テーマ設定
```

## 📋 ファイル命名規則

### コンポーネント
- `PascalCase.tsx`: React コンポーネント
- `index.ts`: エクスポート管理（re-export）

### フック
- `use*.ts`: カスタムフック

### ユーティリティ
- `camelCase.ts`: ユーティリティ関数
- `*Utils.ts`: 特定分野のユーティリティ

### 型定義
- `camelCase.ts`: 型定義ファイル
- `*Types.ts`: 特定分野の型（避ける、上記を優先）

### テスト
- `*.test.ts/tsx`: 単体テスト
- `*.spec.ts`: E2Eテスト
- `*.integration.test.ts`: 統合テスト

## 🔧 依存関係の方向

```
App Pages → Components → Hooks → Lib → Types
     ↓           ↓         ↓      ↓
   Store ←→ Selectors ←→ Utils ←→ Database
```

**重要な原則:**
- 上位層は下位層に依存できる
- 下位層は上位層に依存しない
- 同一層内では相互依存を最小化
- Store は独立したモジュールとして管理

## 📚 パフォーマンス考慮事項

### ファイルサイズ最適化
- コンポーネントの適切な分割
- Tree-shaking対応のエクスポート
- Dynamic import での遅延読み込み

### バンドル分析
```bash
# バンドルサイズ分析
npm run build
npm run analyze  # （要設定追加）
```

### コード分割戦略
- ページ単位での自動分割 (Next.js App Router)
- 重いライブラリの動的読み込み
- モーダルコンポーネントの遅延読み込み

この構造により、スケーラブルで保守性の高いアプリケーションを実現しています。
