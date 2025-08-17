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

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0.0以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## 🛠 技術スタック

- **フレームワーク**: Next.js 15 + React 18
- **言語**: TypeScript (Strict Mode)
- **スタイル**: Tailwind CSS
- **PWA**: @ducanh2912/next-pwa
- **データベース**: Dexie.js (IndexedDB wrapper)
- **暗号化**: Web Crypto API (AES-GCM + PBKDF2)
- **日付処理**: japanese-holidays-js
- **バリデーション**: Zod
- **テスト**: Jest + React Testing Library
- **E2E**: Playwright MCP

## 📱 PWA機能

### インストール
- **Desktop**: ChromeのURL欄のインストールアイコンをクリック
- **Mobile**: ブラウザの「ホーム画面に追加」メニュー

### オフライン機能
- 完全なオフライン利用が可能
- Service Workerによる自動キャッシュ
- データはブラウザ内に暗号化保存

## 🔐 セキュリティ

### データ保護
- すべてのデータはブラウザ内で暗号化保存
- 外部サーバーへのデータ送信なし
- パスワードベースのキー導出（PBKDF2）
- AES-GCM暗号化（100,000回イテレーション）

### プライバシー
- 完全にローカル処理
- 個人データの外部送信なし
- セッション終了時の自動ログアウト

## 🧪 テスト

```bash
# ユニットテスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# テストのウォッチモード
npm run test:watch

# 型チェック
npm run type-check

# リンティング
npm run lint
```

## 📊 データ構造

### 銀行マスタ
- 銀行名、メモ、作成日時

### カードマスタ
- カード名、引落銀行、締日、引落日
- 月シフト（翌月/翌々月）、土日祝調整

### 取引記録
- 取引日、支払い方法、店舗名、用途
- 金額、引落予定日（自動計算）

## 🧮 支払い計算ロジック

### カード支払いの場合
1. 取引日と締日を比較
2. 支払い月を決定（翌月/翌々月）
3. 引落日を設定（営業日調整）
4. 日本の祝日・土日を考慮

### 銀行直接引落の場合
- 指定された引落予定日をそのまま使用

## 🎨 デザインシステム

### カラーパレット
- **Primary**: #1f6feb (ブルー)
- **Background**: #f6f7fb (ライトグレー)
- **Panel**: #ffffff (ホワイト)
- **Border**: #e3e6ee, #e9edf5
- **Text**: #222222, #666666

### レスポンシブ対応
- モバイルファースト設計
- タッチフレンドリーUI
- 最小タッチターゲット44px

## 🚀 デプロイ

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

## 🔧 開発ガイド

### ディレクトリ構造
```
src/
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/             # ユーティリティ・ロジック
│   ├── database/    # Dexie.js関連
│   ├── hooks/       # カスタムフック
│   └── utils/       # ユーティリティ関数
└── types/           # TypeScript型定義
```

### コーディング規約
- TypeScript Strict Mode
- ESLint + Prettier
- Tailwind CSS utilities優先
- コンポーネント単位のテスト

## 📋 TODO・今後の機能

- [ ] CSVエクスポート/インポート
- [ ] 他デバイス同期
- [ ] パスワード変更機能
- [ ] 銀行API連携
- [ ] プッシュ通知（支払いリマインダー）
- [ ] ダークモード対応
- [ ] 多言語対応

## 🤝 コントリビューション

1. Forkしてください
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## ⚠️ 注意事項

- 本アプリは個人の家計管理を目的としています
- 金融機関の公式サービスではありません
- データの正確性については自己責任でお願いします
- バックアップは定期的に取ることを推奨します