# UIコンポーネントライブラリ

## 🧩 概要

UIコンポーネントライブラリは、アプリケーション全体で再利用可能なUIコンポーネントを提供します。一貫性のあるデザインシステムとアクセシビリティを重視した設計になっています。

## 📦 コンポーネント一覧

| コンポーネント | 説明 | 用途 |
|----------------|------|------|
| `Button` | 基本ボタン | アクション実行、フォーム送信 |
| `Input` | 入力フィールド | テキスト入力、数値入力 |
| `Modal` | モーダルダイアログ | 情報表示、フォーム表示 |
| `Navigation` | ナビゲーション | ページ遷移、タブ切り替え |

## 🎨 デザインシステム

### カラーパレット

```typescript
// Primary Colors
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    500: '#3b82f6',  // メインブルー
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    700: '#047857',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#b45309',
  }
};
```

### タイポグラフィ

```typescript
const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  }
};
```

### スペーシング

```typescript
const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};
```

## 🎯 Button コンポーネント

### インターフェース

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
```

### 使用例

```typescript
import { Button } from '@/components/ui';

function ExampleUsage() {
  return (
    <div className="space-y-4">
      {/* 基本的な使用 */}
      <Button onClick={() => console.log('clicked')}>
        クリック
      </Button>

      {/* バリエーション */}
      <Button variant="primary" size="lg">
        プライマリ（大）
      </Button>
      
      <Button variant="outline" loading>
        読み込み中...
      </Button>
      
      <Button variant="danger" disabled>
        削除（無効）
      </Button>

      {/* アイコン付きボタン */}
      <Button 
        icon={<PlusIcon />} 
        iconPosition="left"
        variant="primary"
      >
        追加
      </Button>

      {/* 全幅ボタン */}
      <Button fullWidth variant="primary">
        送信
      </Button>
    </div>
  );
}
```

### スタイルバリエーション

```css
/* Primary */
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

/* Secondary */
.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

/* Outline */
.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500;
}

/* Ghost */
.btn-ghost {
  @apply text-gray-700 hover:bg-gray-100 focus:ring-gray-500;
}

/* Danger */
.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}
```

## 📝 Input コンポーネント

### インターフェース

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success';
  label?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  errorText?: string;
  fullWidth?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}
```

### 使用例

```typescript
import { Input } from '@/components/ui';
import { useState } from 'react';

function FormExample() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [emailError, setEmailError] = useState('');

  return (
    <div className="space-y-4">
      {/* 基本的な入力 */}
      <Input
        label="メールアドレス"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        required
      />

      {/* エラー状態 */}
      <Input
        label="メールアドレス"
        type="email"
        variant="error"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        errorText={emailError}
      />

      {/* 数値入力 */}
      <Input
        label="金額"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={0}
        step={1}
        icon={<YenIcon />}
        iconPosition="left"
        helperText="金額を入力してください"
      />

      {/* アイコン付き */}
      <Input
        label="検索"
        placeholder="取引を検索..."
        icon={<SearchIcon />}
        iconPosition="left"
        fullWidth
      />
    </div>
  );
}
```

## 🪟 Modal コンポーネント

### インターフェース

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
```

### 使用例

```typescript
import { Modal, Button } from '@/components/ui';
import { useState } from 'react';

function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        モーダルを開く
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="確認"
        description="この操作を実行しますか？"
        size="md"
        footer={
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button variant="primary" onClick={() => {
              // 実行処理
              setIsOpen(false);
            }}>
              実行
            </Button>
          </div>
        }
      >
        <p>この操作は取り消すことができません。</p>
      </Modal>
    </>
  );
}
```

## 🧭 Navigation コンポーネント

### インターフェース

```typescript
interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
}

interface NavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'tabs' | 'pills' | 'sidebar';
  size?: 'sm' | 'md' | 'lg';
  onItemClick?: (item: NavigationItem) => void;
  className?: string;
}
```

### 使用例

```typescript
import { Navigation } from '@/components/ui';
import { useRouter } from 'next/navigation';

function NavigationExample() {
  const router = useRouter();

  const navItems = [
    {
      href: '/',
      label: 'カレンダー',
      icon: <CalendarIcon />,
      active: true,
    },
    {
      href: '/schedule',
      label: '引落予定',
      icon: <ScheduleIcon />,
      badge: '3',
    },
    {
      href: '/settings',
      label: '設定',
      icon: <SettingsIcon />,
    },
  ];

  return (
    <Navigation
      items={navItems}
      variant="tabs"
      onItemClick={(item) => router.push(item.href)}
    />
  );
}
```

## ♿ アクセシビリティ

### ARIA サポート

すべてのコンポーネントは適切なARIA属性をサポートしています：

```typescript
// Button コンポーネントの例
<button
  aria-label={ariaLabel || children}
  aria-disabled={disabled}
  aria-pressed={pressed}
  role="button"
  tabIndex={disabled ? -1 : 0}
>
  {children}
</button>

// Modal コンポーネントの例
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">{title}</h2>
  <p id="modal-description">{description}</p>
  {children}
</div>
```

### キーボードナビゲーション

- **Tab**: フォーカス移動
- **Enter/Space**: ボタン実行
- **Escape**: モーダル閉じる
- **Arrow Keys**: ナビゲーション項目移動

### フォーカス管理

```typescript
// モーダル内でのフォーカストラップ
export function useFocusTrap(containerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [containerRef]);
}
```

## 🎨 テーマ設定

### テーマプロバイダー

```typescript
interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  };
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### テーマカスタマイズ

```typescript
// カスタムテーマの例
const customTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: {
      ...defaultTheme.colors.primary,
      500: '#10b981', // カスタムプライマリカラー
    },
  },
};
```

## 🧪 テスト戦略

### コンポーネントテスト例

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('基本的なレンダリング', () => {
    render(<Button>テストボタン</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('テストボタン');
  });

  it('クリックイベントが正しく動作する', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>クリック</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled状態が正しく動作する', () => {
    render(<Button disabled>無効ボタン</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('loading状態が正しく表示される', () => {
    render(<Button loading>読み込み中</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

## 📚 関連ドキュメント

- [デザインシステム](../../design-system.md)
- [アクセシビリティガイド](../../accessibility.md)
- [テスト戦略](../../guides/testing.md)
- [Tailwind CSS設定](../../technical/tailwind-config.md)

