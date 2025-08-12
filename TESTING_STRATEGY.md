# テスト戦略と品質担保

## 現在のテスト状況

### ✅ 実装済み（176件PASS）
- **支払い計算ロジック**: カード/銀行の支払い日計算、月末処理、うるう年対応
- **日付ユーティリティ**: 営業日判定、月計算
- **バリデーション**: 金額、文字列検証
- **基本UIコンポーネント**: Button, Input, Modal

### ❌ 課題（36件FAIL + 未実装）
- **UIテスト**: アクセシビリティ属性の不整合
- **データベース操作**: 完全に未テスト（最優先課題）
- **統合テスト**: コンポーネント間の連携未テスト
- **E2Eテスト**: ユーザーフローの動作保証なし

## 優先度別テスト実装計画

### 🚨 優先度：最高（データベース）
**現在の最大リスク**: 銀行引落のUnknown Bank問題のようなデータ不整合

```typescript
// 必要なテスト
describe('Database Operations', () => {
  describe('Transaction Creation', () => {
    it('should create bank transaction with correct bank reference')
    it('should create card transaction with correct card/bank reference')
    it('should calculate scheduled payment dates correctly')
    it('should maintain data consistency across bank/card/transaction')
  })
  
  describe('Monthly Schedule', () => {
    it('should retrieve correct bank names for all payment types')
    it('should handle mixed card/bank transactions')
    it('should aggregate bank totals correctly')
  })
})
```

### 🔥 優先度：高（統合テスト）
**目的**: コンポーネント間の連携保証

```typescript
// TransactionModal + Database統合テスト
describe('Transaction Creation Flow', () => {
  it('should save bank transaction and display in schedule')
  it('should save card transaction and display in schedule')
  it('should validate form before saving')
  it('should handle payment type switching')
})
```

### 📋 優先度：中（E2Eテスト）
**目的**: ユーザーフローの完全性保証

```playwright
// E2Eテストシナリオ
test('Complete user workflow', async ({ page }) => {
  // 1. 銀行追加
  await page.goto('/settings')
  await page.click('銀行を追加')
  await page.fill('input[name="name"]', 'テスト銀行')
  await page.click('保存')
  
  // 2. 取引作成
  await page.goto('/')
  await page.click('[data-testid="calendar-day"]')
  await page.check('input[value="bank"]')
  await page.selectOption('select[name="bankId"]', 'テスト銀行')
  await page.fill('input[name="amount"]', '1000')
  await page.click('保存')
  
  // 3. 表示確認
  await page.goto('/schedule')
  await expect(page.locator('text=テスト銀行')).toBeVisible()
  await expect(page.locator('text=Unknown Bank')).not.toBeVisible()
})
```

## 品質担保メトリクス

### 📊 目標カバレッジ
- **データベース操作**: 95%以上
- **ビジネスロジック**: 90%以上
- **UIコンポーネント**: 80%以上
- **統合テスト**: 主要フロー100%

### 🔍 継続的品質チェック
1. **Pre-commit Hook**: テスト実行 + リント
2. **CI/CD**: 全テスト + カバレッジ検証
3. **型安全性**: TypeScript strict mode
4. **データ整合性**: 外部キー制約 + バリデーション

## 段階的実装手順

### Phase 1: データベーステスト（今週）
```bash
# 1. Database operations test
npm run test __tests__/lib/database/

# 2. Transaction flow test  
npm run test __tests__/integration/transaction.test.ts
```

### Phase 2: 統合テスト（来週）
```bash
# Component integration tests
npm run test __tests__/integration/
```

### Phase 3: E2Eテスト（再来週）
```bash
# End-to-end user workflows
npm run test:e2e
```

## 現在の問題解決

### 1. UIテスト修正
```typescript
// aria-invalid属性の追加
<input 
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>
```

### 2. データベーステスト追加
```typescript
// IndexedDB mock setup
beforeEach(async () => {
  await clearDatabase()
  await seedTestData()
})
```

### 3. E2Eテスト環境
```javascript
// playwright.config.js
module.exports = {
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    port: 3001,
  }
}
```

## 品質指標の監視

### 自動チェック項目
- [ ] 全テストPASS
- [ ] カバレッジ >80%
- [ ] TypeScript errors = 0
- [ ] Lint warnings = 0
- [ ] Bundle size < 500KB
- [ ] Performance score >90

### 手動チェック項目
- [ ] 主要ユーザーフローの動作確認
- [ ] データ整合性の確認
- [ ] エラーハンドリングの確認
- [ ] アクセシビリティ基準の遵守

---

**次のアクション**: データベース操作テストの実装から開始