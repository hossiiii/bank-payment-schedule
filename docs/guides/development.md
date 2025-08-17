# 開発ガイド

## 💻 日常開発ワークフロー

このガイドでは、銀行別引落予定表PWAの日常的な開発ワークフローを説明します。効率的で品質の高い開発を実現するためのベストプラクティスを含んでいます。

## 🚀 開発環境セットアップ

### 前提条件
- Node.js 18.0.0以上
- npm 9.0.0以上
- Git 2.30以上
- VSCode（推奨）

### 初期セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd bank-payment-schedule

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### VSCode拡張機能の設定

推奨拡張機能を自動インストール：

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## 🔄 開発サイクル

### 1. 機能開発の流れ

#### a) ブランチ作成
```bash
# 最新のmainブランチから作業ブランチを作成
git checkout main
git pull origin main
git checkout -b feature/new-feature-name
```

#### b) 開発作業
```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# 型チェック（別ターミナル）
npm run type-check --watch

# テスト監視（別ターミナル）
npm run test:watch
```

#### c) コード品質チェック
```bash
# リンティング
npm run lint

# 型チェック
npm run type-check

# テスト実行
npm test

# カバレッジ確認
npm run test:coverage
```

### 2. コードレビューワークフロー

#### レビュー前チェックリスト
- [ ] すべてのテストが通過
- [ ] TypeScript エラーなし
- [ ] ESLint 警告なし
- [ ] テストカバレッジ要件を満たしている
- [ ] ドキュメントが更新されている
- [ ] アクセシビリティ要件をクリア

## 🛠️ 開発ツールの活用

### 1. デバッグ環境

#### React DevTools
- コンポーネント階層とstate/propsの確認
- パフォーマンスプロファイリング

#### Zustand DevTools
```typescript
// store/index.ts でdevtoolsが有効化済み
const useAppStore = create<AppStore>()(
  devtools(
    (...args) => ({
      // store implementation
    }),
    {
      name: 'bank-payment-schedule-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### 2. データベース管理

#### IndexedDB の確認
ブラウザのDevTools > Application > IndexedDBで直接確認可能

#### 開発用データリセット
```javascript
// 開発用データリセット
const resetDatabase = async () => {
  const db = getDatabase();
  await db.delete();
  location.reload();
};
```

## 🎯 機能開発パターン

### 1. 新しいモーダルの追加

#### Step 1: 型定義
```typescript
// src/types/modal.ts
export type ModalType = 
  | 'existing-modal'
  | 'new-modal'; // 新規追加
```

#### Step 2: ストア更新
```typescript
// src/store/slices/modalSlice.ts
interface ModalStates {
  newModal: boolean; // 新規追加
}
```

#### Step 3: コンポーネント作成
```typescript
// src/components/calendar/NewModal.tsx
export function NewModal({ isOpen, onClose, data }: NewModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="新しいモーダル">
      {/* 実装 */}
    </BaseModal>
  );
}
```

### 2. 新しいフックの作成

#### カスタムフックのテンプレート
```typescript
// src/hooks/useNewFeature.ts
interface UseNewFeatureProps {
  // props定義
}

interface UseNewFeatureReturn {
  // return値定義
}

export function useNewFeature({
  // props
}: UseNewFeatureProps): UseNewFeatureReturn {
  // 状態管理
  const [state, setState] = useState();
  
  // 副作用
  useEffect(() => {
    // 初期化処理
  }, []);
  
  // メモ化された値
  const memoizedValue = useMemo(() => {
    // 計算処理
  }, [dependencies]);
  
  return {
    // return values
  };
}
```

## 🔧 トラブルシューティング

### 1. よくある問題と解決法

#### TypeScript エラー
```bash
# 型チェックでエラーが出る場合
npm run type-check

# よくあるエラーパターン：
# - import/export の型エラー → index.ts でのre-export確認
# - useState の初期値型エラー → 適切な型注釈追加
# - Props の型エラー → インターフェース定義確認
```

#### ビルドエラー
```bash
# ビルド失敗時の対応
npm run build

# よくあるエラーパターン：
# - 動的import エラー → Next.js の dynamic() 使用
# - 環境変数エラー → .env ファイル確認
# - 循環依存エラー → import 構造見直し
```

### 2. パフォーマンス問題

#### 再レンダリング最適化
```typescript
// 対策例：
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  // カスタム比較関数
  return prevProps.data.id === nextProps.data.id;
});
```

#### バンドルサイズ最適化
```bash
# バンドル分析
npm run build
npx @next/bundle-analyzer
```

## 📊 コード品質管理

### 1. 静的解析

#### ESLint設定の活用
```bash
# 特定ファイルのみチェック
npx eslint src/components/NewComponent.tsx

# 自動修正
npx eslint src/components/NewComponent.tsx --fix
```

### 2. テスト品質

#### カバレッジ目標
- 全体: 90%以上
- 新規機能: 95%以上
- クリティカルパス: 100%

#### テスト戦略
```typescript
// ユニットテスト：純粋関数、フック
describe('純粋関数', () => {
  it('期待される動作をする', () => {
    expect(pureFunction(input)).toBe(expectedOutput);
  });
});

// 統合テスト：コンポーネント間連携
describe('コンポーネント統合', () => {
  it('ユーザーフローが正しく動作する', async () => {
    // ユーザー操作シミュレーション
  });
});
```

## 🚀 継続的改善

### 1. 定期的なメンテナンス

#### 依存関係更新
```bash
# 週次での依存関係チェック
npm outdated

# セキュリティアップデート
npm audit
npm audit fix
```

### 2. チーム開発

#### コードレビュー基準
- 機能性：要件を満たしているか
- 保守性：理解しやすく変更しやすいか
- 性能：パフォーマンス要件を満たしているか
- セキュリティ：セキュリティリスクはないか
- テスト：適切にテストされているか

この開発ガイドに従うことで、効率的で高品質な開発を継続できます。

