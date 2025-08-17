# 開発環境セットアップ

## 🚀 クイックスタート

### 前提条件

以下のソフトウェアが必要です：

| ソフトウェア | 最小バージョン | 推奨バージョン | 確認コマンド |
|--------------|----------------|----------------|--------------|
| Node.js | 18.0.0 | 20.x.x LTS | `node --version` |
| npm | 9.0.0 | latest | `npm --version` |
| Git | 2.30+ | latest | `git --version` |

### 環境セットアップ手順

#### 1. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/your-org/bank-payment-schedule.git

# SSHでクローン（推奨）
git clone git@github.com:your-org/bank-payment-schedule.git

# ディレクトリに移動
cd bank-payment-schedule
```

#### 2. 依存関係のインストール

```bash
# パッケージのインストール
npm install

# インストール確認
npm list --depth=0
```

#### 3. 開発サーバーの起動

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000 が自動で開きます
```

#### 4. 動作確認

ブラウザで以下を確認してください：

- [ ] カレンダーが表示される
- [ ] 日付をクリックできる
- [ ] モーダルが開く
- [ ] 設定ページにアクセスできる

## 🛠️ 開発ツールのセットアップ

### VSCode 拡張機能（推奨）

以下の拡張機能をインストールしてください：

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "orta.vscode-jest"
  ]
}
```

### VSCode 設定

プロジェクトルートに `.vscode/settings.json` を作成：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["clsx\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

## 🧪 テスト環境のセットアップ

### テストの実行

```bash
# 全テストの実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード（開発時）
npm run test:watch

# E2Eテスト
npm run test:e2e

# 特定のテストファイル
npm test -- modalSlice.test.ts

# 特定のテストパターン
npm test -- --testNamePattern="Modal"
```

### テスト結果の確認

```bash
# カバレッジレポートをブラウザで確認
open coverage/lcov-report/index.html

# または
npx live-server coverage/lcov-report
```

## 🔧 開発コマンド一覧

### 基本コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# 型チェック
npm run type-check

# Lint実行
npm run lint

# コードフォーマット
npm run format
```

### テストコマンド

```bash
# ユニットテスト
npm test

# 統合テスト
npm run test:integration

# パフォーマンステスト
npm run test:performance

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

### ビルド・デプロイコマンド

```bash
# 開発ビルド
npm run build:dev

# プロダクションビルド
npm run build

# 静的エクスポート
npm run export

# バンドルサイズ分析
npm run analyze

# PWAキャッシュ生成
npm run build:pwa
```

## 🗂️ プロジェクト構造理解

### ディレクトリ構成

```
bank-payment-schedule/
├── .github/              # GitHub Actions設定
├── .vscode/              # VSCode設定
├── __tests__/            # テストファイル
├── coverage/             # テストカバレッジレポート
├── docs/                 # ドキュメント（このファイル）
├── public/               # 静的ファイル
├── src/                  # ソースコード
│   ├── app/             # Next.js App Router
│   ├── components/      # Reactコンポーネント
│   ├── hooks/           # カスタムフック
│   ├── lib/             # ライブラリ・ユーティリティ
│   ├── store/           # Zustand状態管理
│   └── types/           # TypeScript型定義
├── package.json         # パッケージ設定
├── tailwind.config.js   # Tailwind CSS設定
├── tsconfig.json        # TypeScript設定
├── next.config.js       # Next.js設定
└── jest.config.js       # Jest設定
```

### 重要なファイル

| ファイル | 説明 | 編集タイミング |
|----------|------|----------------|
| `package.json` | 依存関係とスクリプト | パッケージ追加時 |
| `tsconfig.json` | TypeScript設定 | 型設定変更時 |
| `tailwind.config.js` | CSS設定 | デザインシステム変更時 |
| `next.config.js` | Next.js設定 | ビルド設定変更時 |
| `jest.config.js` | テスト設定 | テスト環境変更時 |

## 🌐 環境変数の設定

### 開発環境用設定

`.env.local` ファイルを作成：

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="銀行別引落予定表"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# デバッグ設定
DEBUG=true
VERBOSE_LOGGING=true

# パフォーマンス監視
ENABLE_PERFORMANCE_MONITORING=true
```

### 本番環境用設定

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="銀行別引落予定表"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# セキュリティ設定
ENABLE_CSP=true
ENABLE_HTTPS_ONLY=true

# パフォーマンス設定
ENABLE_BUNDLE_ANALYZER=false
ENABLE_SOURCE_MAPS=false
```

## 🔒 セキュリティ設定

### Content Security Policy

`next.config.js` でCSPを設定：

```javascript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
  worker-src 'self' blob:;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 📱 PWA 設定

### Service Worker の設定

`public/sw.js` の確認：

```javascript
// Service Worker が正しく設定されているか確認
const CACHE_NAME = 'bank-payment-schedule-v1';
const urlsToCache = [
  '/',
  '/schedule',
  '/settings',
  '/static/css/main.css',
  '/static/js/main.js'
];

// インストール時のキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Manifest ファイルの確認

`public/manifest.json` の設定確認：

```json
{
  "name": "銀行別引落予定表",
  "short_name": "引落予定表",
  "description": "銀行別の引落予定を管理するPWAアプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1f6feb",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. npm install が失敗する

```bash
# キャッシュをクリア
npm cache clean --force

# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. 開発サーバーが起動しない

```bash
# ポートが使用中の場合
lsof -ti:3000 | xargs kill -9

# 別のポートで起動
npm run dev -- --port 3001
```

#### 3. TypeScript エラーが表示される

```bash
# 型定義の再生成
npm run type-check

# Next.js の型定義を更新
rm .next/types/link.d.ts
npm run dev
```

#### 4. テストが失敗する

```bash
# テストキャッシュをクリア
npm test -- --clearCache

# 個別のテストファイルを実行
npm test -- __tests__/components/CalendarView.test.tsx
```

#### 5. ビルドが失敗する

```bash
# Next.js キャッシュをクリア
rm -rf .next

# 完全なクリーンビルド
npm run clean && npm run build
```

### ログの確認方法

#### 開発時のログ

```bash
# 詳細ログを有効化
DEBUG=* npm run dev

# 特定の機能のログのみ
DEBUG=database:* npm run dev
```

#### ブラウザでのデバッグ

1. **開発者ツールを開く**: `F12`
2. **コンソールタブ**: JavaScript エラーとログを確認
3. **ネットワークタブ**: API リクエストを確認
4. **アプリケーションタブ**: IndexedDB とローカルストレージを確認

### パフォーマンス問題の特定

```bash
# バンドルサイズ分析
npm run analyze

# メモリ使用量の監視
node --inspect-brk=0.0.0.0:9229 ./node_modules/.bin/next dev

# プロファイリング
NODE_ENV=development npm run dev
```

## 🎯 次のステップ

セットアップが完了したら、以下のドキュメントを参照してください：

1. **[プロジェクト構造](./project-structure.md)** - コードベースの理解
2. **[最初の機能実装](./first-feature.md)** - 実際の開発を始める
3. **[アーキテクチャ概要](../architecture/overview.md)** - システム設計の理解
4. **[開発ガイド](../guides/development.md)** - 開発のベストプラクティス

## 🤝 サポート

### ヘルプが必要な場合

1. **ドキュメント確認**: まずは関連ドキュメントを確認
2. **Issue 検索**: GitHub Issues で既知の問題を検索
3. **新規 Issue 作成**: 新しい問題の場合は Issue を作成
4. **チームに相談**: Slack の #development チャンネルで質問

### 有用なリソース

- **Next.js ドキュメント**: https://nextjs.org/docs
- **React ドキュメント**: https://react.dev/
- **TypeScript ドキュメント**: https://www.typescriptlang.org/docs/
- **Tailwind CSS ドキュメント**: https://tailwindcss.com/docs
- **Zustand ドキュメント**: https://github.com/pmndrs/zustand

---

**最終更新**: 2025-08-17  
**次のステップ**: [プロジェクト構造](./project-structure.md)
