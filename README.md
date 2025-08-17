# 銀行別引落予定表 PWA

次世代の銀行別引落予定を管理するPWAアプリケーション。完全にブラウザ内で動作し、暗号化されたデータ保存とオフライン対応を提供します。

## 🌟 主な機能

- **📅 取引記録カレンダー**: 月/週表示での取引管理
- **🏦 銀行別引落予定表**: 月次の引落予定と銀行別集計
- **⚙️ マスタ管理**: 銀行・カード情報の管理
- **🔒 暗号化保存**: ブラウザ内での安全なデータ保存
- **📱 PWA対応**: インストール可能、オフライン利用可能
- **🧮 自動計算**: カード締日・引落日から支払い予定日を自動計算
- **🇯🇵 日本対応**: 営業日調整（土日祝日対応）

## 🚀 開発者クイックスタート

### 前提条件
- Node.js 18.0.0以上
- npm または yarn
- モダンブラウザ（Chrome 88+, Firefox 78+, Safari 14+）

### セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd bank-payment-schedule

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### 開発ワークフロー

```bash
# 型チェック
npm run type-check

# リンティング & フォーマット
npm run lint

# テスト実行
npm test                    # ユニットテスト
npm run test:coverage       # カバレッジ付き
npm run test:e2e           # E2Eテスト

# ビルド
npm run build              # プロダクションビルド
npm start                  # プロダクション起動
```

## 🏗️ アーキテクチャ概要

### 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (Strict Mode)
- **UI**: React 18 + Tailwind CSS
- **状態管理**: Zustand (グローバル) + React Hooks (ローカル)
- **データベース**: Dexie.js (IndexedDB wrapper)
- **暗号化**: Web Crypto API (AES-GCM + PBKDF2)
- **PWA**: @ducanh2912/next-pwa
- **テスト**: Jest + React Testing Library + Playwright
- **バリデーション**: Zod

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ (カレンダー)
│   ├── schedule/          # 引落予定表ページ
│   └── settings/          # 設定ページ
├── components/            # Reactコンポーネント
│   ├── calendar/          # カレンダー関連
│   ├── schedule/          # スケジュール関連
│   ├── encryption/        # 暗号化関連
│   ├── ui/               # 汎用UIコンポーネント
│   └── ...
├── hooks/                 # カスタムフック
│   ├── modal/            # モーダル管理
│   └── calendar/         # カレンダー機能
├── lib/                   # ユーティリティ・ロジック
│   ├── database/         # Dexie.js関連
│   ├── hooks/            # 追加カスタムフック
│   ├── utils/            # ユーティリティ関数
│   └── contexts/         # React Context
├── store/                 # Zustand グローバル状態
│   ├── slices/           # 状態スライス
│   ├── selectors/        # セレクター
│   └── types/            # ストア型定義
└── types/                 # TypeScript型定義
```

### 主要コンポーネント

#### カレンダーシステム
- **CalendarView**: メインカレンダーコンポーネント
- **CalendarCell**: 個別日付セル
- **MonthNavigation**: 月間ナビゲーション

#### モーダルシステム
- **useModalManager**: 統合モーダル管理フック
- **BaseModal**: ベースモーダルコンポーネント
- **TransactionModal**: 取引入力/編集
- **DayTotalModal**: 日別合計表示

#### 状態管理 (Zustand)
```typescript
// グローバルストア構造
interface AppStore {
  modalStates: ModalStates;      // モーダル状態
  selectedData: SelectedData;    // 選択されたデータ
  transactions: Transaction[];   // 取引データ
  banks: Bank[];                // 銀行マスタ
  cards: Card[];                // カードマスタ
  schedules: ScheduleItem[];    // スケジュールデータ
  loading: LoadingStates;       // ローディング状態
  errors: ErrorStates;          // エラー状態
}
```

## 📚 開発ドキュメント

詳細な開発ドキュメントは [`/docs`](./docs) ディレクトリにあります：

### 入門ガイド
- [📝 開発環境セットアップ](./docs/getting-started/setup.md)
- [🏗️ プロジェクト構造詳細](./docs/getting-started/project-structure.md)
- [⭐ 最初の機能実装](./docs/getting-started/first-feature.md)

### アーキテクチャ
- [🏛️ システム概要](./docs/architecture/overview.md)
- [🔄 データフロー](./docs/architecture/data-flow.md)
- [🗃️ 状態管理](./docs/architecture/state-management.md)
- [⚡ パフォーマンス](./docs/architecture/performance.md)

### コンポーネントAPI
- [📅 カレンダーコンポーネント](./docs/components/calendar/)
- [🪟 モーダルコンポーネント](./docs/components/modals/)
- [🧩 UIコンポーネント](./docs/components/ui/)

### 開発ガイド
- [💻 日常開発ワークフロー](./docs/guides/development.md)
- [🧪 テスト戦略](./docs/guides/testing.md)
- [🚀 デプロイメント](./docs/guides/deployment.md)
- [🔧 トラブルシューティング](./docs/guides/troubleshooting.md)

## 🧪 テスト戦略

### テスト分類
- **ユニットテスト**: 個別関数・フック・コンポーネント
- **統合テスト**: モーダル連携・状態管理
- **E2Eテスト**: ユーザーワークフロー
- **パフォーマンステスト**: レンダリング性能

### テスト実行
```bash
# 各種テスト
npm run test:unit           # ユニットテストのみ
npm run test:store          # ストアテスト
npm run test:hooks          # フックテスト
npm run test:components     # コンポーネントテスト
npm run test:integration    # 統合テスト
npm run test:performance    # パフォーマンステスト
npm run test:e2e           # E2Eテスト

# 包括的テスト
npm run test:comprehensive  # 全テスト実行
```

### テストカバレッジ目標
- **全体**: 90%以上
- **コアロジック**: 95%以上
- **状態管理**: 95%以上
- **コンポーネント**: 80%以上

## 🔐 セキュリティとプライバシー

### データ保護
- すべてのデータはブラウザ内で暗号化保存
- 外部サーバーへのデータ送信なし
- パスワードベースのキー導出（PBKDF2）
- AES-GCM暗号化（100,000回イテレーション）

### セキュリティ機能
- セッション管理とタイムアウト
- 入力検証（Zod スキーマ）
- XSS対策（Content Security Policy）
- データ完全性チェック

## 📱 PWA機能

### インストール
- **Desktop**: ChromeのURL欄のインストールアイコンをクリック
- **Mobile**: ブラウザの「ホーム画面に追加」メニュー

### オフライン機能
- 完全なオフライン利用が可能
- Service Workerによる自動キャッシュ
- データはブラウザ内に暗号化保存
- オフライン時の操作も同期

## 🧮 支払い計算ロジック

### カード支払いの場合
1. 取引日と締日を比較
2. 支払い月を決定（翌月/翌々月）
3. 引落日を設定（営業日調整）
4. 日本の祝日・土日を考慮

### 銀行直接引落の場合
- 指定された引落予定日をそのまま使用

## 🛠️ 開発ツール設定

### VSCode推奨拡張
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### 設定ファイル
- **TypeScript**: `tsconfig.json` (Strict Mode)
- **ESLint**: `.eslintrc.json`
- **Prettier**: `.prettierrc`
- **Tailwind**: `tailwind.config.js`
- **Jest**: `jest.config.js`
- **Playwright**: `playwright.config.ts`

## 🚀 デプロイメント

### Vercel（推奨）
```bash
npm i -g vercel
vercel --prod
```

### 静的エクスポート
```bash
# next.config.jsで output: 'export' を有効化
npm run build
```

### 環境変数
- `NODE_ENV`: development | production
- `NEXT_PUBLIC_PWA_ENABLED`: PWA機能の有効/無効

## 📊 パフォーマンス指標

### 目標値
- **初期読み込み**: < 3秒
- **取引追加**: < 100ms
- **カレンダー描画**: < 50ms
- **メモリ使用量**: < 50MB

### 最適化手法
- React.memo でコンポーネント再レンダリング抑制
- useMemo で計算結果キャッシュ
- useCallback でイベントハンドラー最適化
- Zustand セレクターで必要な状態のみ購読

## 🤝 コントリビューション

### 開発フロー
1. Issueを作成または既存Issueをアサイン
2. フィーチャーブランチを作成 (`feature/amazing-feature`)
3. 実装・テスト・ドキュメント更新
4. Pull Requestを作成

### コーディング規約
- TypeScript Strict Mode
- ESLint + Prettier準拠
- Tailwind CSS utilities優先
- コンポーネント単位のテスト
- JSDoc コメント推奨

### PR要件
- [ ] すべてのテストが通過
- [ ] TypeScript エラーなし
- [ ] ESLint警告なし
- [ ] 適切なテストを追加
- [ ] ドキュメント更新（必要に応じて）

## 📋 開発ロードマップ

### Phase 1 ✅ 完了
- 基本機能実装
- PWA対応
- データ暗号化

### Phase 2 ✅ 完了
- Zustand グローバル状態管理導入
- パフォーマンス最適化
- テスト基盤強化

### Phase 3 ✅ 完了
- 包括的ドキュメントシステム
- アーキテクチャ設計文書
- 開発者ガイド整備

### 今後の機能
- [ ] CSVエクスポート/インポート
- [ ] 他デバイス同期
- [ ] パスワード変更機能
- [ ] 銀行API連携
- [ ] プッシュ通知（支払いリマインダー）
- [ ] ダークモード対応
- [ ] 多言語対応

## 📞 サポート

### 開発に関する質問
- **技術的質問**: GitHub Issues
- **バグレポート**: GitHub Issues (bug テンプレート使用)
- **機能リクエスト**: GitHub Issues (feature テンプレート使用)

### ドキュメント
- **API仕様**: [/docs/api](./docs/api/)
- **アーキテクチャ**: [/docs/architecture](./docs/architecture/)
- **トラブルシューティング**: [/docs/guides/troubleshooting.md](./docs/guides/troubleshooting.md)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## ⚠️ 注意事項

- 本アプリは個人の家計管理を目的としています
- 金融機関の公式サービスではありません
- データの正確性については自己責任でお願いします
- バックアップは定期的に取ることを推奨します

---

**最終更新**: 2025-08-17  
**バージョン**: Phase 3 Complete  
**メンテナー**: Development Team
