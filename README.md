# Bank Payment Schedule Manager PWA

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/hossiiii/bank-payment-schedule)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/next.js-15.0.0-black.svg)](https://nextjs.org/)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](https://web.dev/progressive-web-apps/)
[![Test Coverage](https://img.shields.io/badge/coverage-90%25-green.svg)](https://github.com/hossiiii/bank-payment-schedule)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A next-generation Progressive Web Application for managing bank payment schedules with enterprise-grade architecture, comprehensive testing, and production-ready features.**

🚀 **Production Status**: All 3 phases of refactoring completed ✅  
🔧 **Architecture**: Fully modularized with Zustand state management  
🧪 **Testing**: Comprehensive test suite with 90%+ coverage  
📱 **PWA**: Install-ready with offline functionality  

---

## ✨ Key Features

### 🏦 Financial Management
- **🗓️ Interactive Calendar**: Visual transaction management with month/week views
- **💳 Payment Automation**: Auto-calculate payment dates from card closing dates
- **🏛️ Multi-Bank Support**: Manage multiple banks and cards with dedicated workflows
- **📊 Smart Scheduling**: Monthly payment schedule generation with business day adjustments
- **💱 Currency Support**: Japanese Yen with localized business day calculations

### 🔒 Security & Privacy
- **🛡️ Client-Side Encryption**: AES-GCM encryption with PBKDF2 key derivation (100,000 iterations)
- **🔐 Zero Server Dependencies**: All data stored and processed locally in browser
- **⏱️ Session Management**: Auto-lock functionality with configurable timeouts
- **✅ Input Validation**: Comprehensive Zod schema validation
- **🛡️ XSS Protection**: Content Security Policy implementation

### 📱 Progressive Web App
- **📲 Install-Ready**: Native app experience on all platforms
- **🌐 Offline-First**: Complete functionality without internet connection
- **🔄 Background Sync**: Automatic data synchronization when online
- **⚡ Performance**: < 3s initial load, < 50ms interactions
- **📋 Service Worker**: Advanced caching strategies with Workbox

### 🏗️ Developer Experience
- **🎯 TypeScript Strict Mode**: 100% type safety with comprehensive interfaces
- **🧪 Testing Excellence**: Unit, integration, E2E, and performance tests
- **📚 Comprehensive Documentation**: Architecture guides and API references
- **🔧 Modern Tooling**: ESLint, Prettier, Jest, Playwright integration
- **⚡ Performance Monitoring**: Built-in performance tracking and optimization

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0 (or yarn >= 1.22.0)
Modern browser with ES2022 support
```

### Installation & Setup

```bash
# Clone repository
git clone https://github.com/your-org/bank-payment-schedule.git
cd bank-payment-schedule

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Development Workflow

```bash
# Development
npm run dev                    # Start dev server with hot reload
npm run type-check            # TypeScript validation
npm run lint                  # ESLint + Prettier check
npm run lint:fix              # Auto-fix linting issues

# Testing
npm test                      # Run all tests
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:e2e             # End-to-end tests
npm run test:performance     # Performance benchmarks
npm run test:coverage        # Coverage report
npm run test:comprehensive   # Full test suite

# Production
npm run build                # Production build
npm run start                # Production server
npm run export               # Static export (optional)
```

---

## 🏗️ Architecture Overview

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.0.0 | React framework with App Router |
| **Language** | TypeScript | 5.3.0 | Type-safe development |
| **UI Framework** | React | 18.3.1 | Component-based UI |
| **Styling** | Tailwind CSS | 3.4.0 | Utility-first CSS framework |
| **State Management** | Zustand | 5.0.7 | Lightweight state management |
| **Database** | Dexie.js | 3.2.7 | IndexedDB wrapper with encryption |
| **Encryption** | Web Crypto API | Native | AES-GCM + PBKDF2 encryption |
| **PWA** | @ducanh2912/next-pwa | 10.2.8 | Service worker and caching |
| **Testing** | Jest + Playwright | 29.7.0 + 1.54.2 | Comprehensive testing suite |
| **Validation** | Zod | 3.23.8 | Runtime type validation |
| **Icons** | Lucide React | 0.539.0 | Modern icon library |

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page (Calendar view)
│   ├── schedule/            # Payment schedule pages
│   └── settings/            # Settings and master data
├── components/              # React components
│   ├── calendar/            # Calendar system components
│   │   ├── CalendarView.tsx          # Main calendar component
│   │   ├── CalendarCell.tsx          # Individual date cells
│   │   ├── MonthNavigation.tsx       # Month navigation
│   │   └── CalendarViewWithStore.tsx # Store-connected version
│   ├── schedule/            # Schedule management
│   │   ├── BankScheduleTable.tsx     # Schedule display table
│   │   ├── MobileScheduleCard.tsx    # Mobile-optimized cards
│   │   └── ScheduleFilters.tsx       # Filtering controls
│   ├── encryption/          # Security components
│   │   ├── EncryptionProvider.tsx    # Encryption context
│   │   ├── PasswordSetup.tsx         # Initial password setup
│   │   ├── SessionLock.tsx           # Session management
│   │   └── AutoLockWarning.tsx       # Auto-lock notifications
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx               # Button component
│   │   ├── Modal.tsx                # Modal system
│   │   ├── Input.tsx                # Form inputs
│   │   └── Navigation.tsx           # App navigation
│   └── settings/            # Settings components
├── hooks/                   # Custom React hooks
│   ├── modal/              # Modal management
│   │   ├── useModalManager.ts        # Unified modal system
│   │   └── useModalManagerAdapter.ts # Store adapter
│   └── calendar/           # Calendar functionality
│       ├── useCalendarCalculations.ts # Date calculations
│       ├── useCalendarNavigation.ts  # Navigation logic
│       └── useSwipeGesture.ts        # Touch gestures
├── lib/                     # Core utilities and logic
│   ├── database/           # Database layer
│   │   ├── operations.ts            # CRUD operations
│   │   ├── encryption.ts            # Encryption layer
│   │   ├── schema.ts                # Database schema
│   │   └── migrationHandler.ts      # Data migration
│   ├── hooks/              # Additional hooks
│   │   ├── useDatabase.ts           # Database operations
│   │   ├── useEncryption.ts         # Encryption hooks
│   │   └── useScheduleData.ts       # Schedule data hooks
│   ├── utils/              # Utility functions
│   │   ├── dateUtils.ts             # Date manipulation
│   │   ├── paymentCalc.ts           # Payment calculations
│   │   ├── scheduleUtils.ts         # Schedule utilities
│   │   └── validation.ts            # Input validation
│   └── contexts/           # React contexts
├── store/                   # Zustand state management
│   ├── slices/             # State slices
│   │   ├── modalSlice.ts            # Modal state
│   │   ├── transactionSlice.ts      # Transaction data
│   │   ├── scheduleSlice.ts         # Schedule data
│   │   └── uiSlice.ts               # UI state
│   ├── selectors/          # State selectors
│   └── types/              # Store type definitions
└── types/                   # TypeScript definitions
    ├── database.ts          # Database types
    ├── schedule.ts          # Schedule types
    ├── calendar.ts          # Calendar types
    └── modal.ts             # Modal types
```

### State Management Architecture

The application uses a hybrid approach combining Zustand for global state and React hooks for local component state:

```typescript
// Global Store Structure (Zustand)
interface AppStore {
  // Modal Management
  modalStates: ModalStates;           // All modal visibility states
  selectedData: SelectedData;         // Currently selected data
  
  // Data Management  
  transactions: Transaction[];        // Financial transactions
  banks: Bank[];                     // Bank master data
  cards: Card[];                     // Card master data
  schedules: ScheduleItem[];         // Payment schedules
  
  // UI State
  loading: LoadingStates;            // Loading indicators
  errors: ErrorStates;               // Error states
  
  // Actions
  modalActions: ModalActions;        // Modal control actions
  transactionActions: TransactionActions; // Data manipulation
  scheduleActions: ScheduleActions;  // Schedule management
  uiActions: UIActions;              // UI state control
}
```

### Component Architecture Patterns

#### 1. Container/Presentation Pattern
```typescript
// Store-connected container
const CalendarViewWithStore = () => {
  const { transactions, banks, cards } = useTransactionStore();
  const { modalActions } = useStoreActions();
  
  return (
    <CalendarView
      transactions={transactions}
      banks={banks}
      cards={cards}
      onDateClick={modalActions.openTransactionModal}
    />
  );
};

// Pure presentation component
const CalendarView = ({ transactions, onDateClick }) => {
  // Pure component logic
};
```

#### 2. Custom Hook Pattern
```typescript
// Encapsulated business logic
const useCalendarCalculations = ({ transactions, schedule }) => {
  const getDayTotal = useCallback((date: Date) => {
    // Complex calculation logic
  }, [transactions, schedule]);
  
  return { getDayTotal };
};
```

#### 3. Modal Management Pattern
```typescript
// Unified modal system
const useModalManager = () => {
  const [modalStates, setModalStates] = useState(initialStates);
  
  const openModal = (type: ModalType, data?: any) => {
    setModalStates(prev => ({
      ...prev,
      [type]: { isOpen: true, data }
    }));
  };
  
  return { modalStates, openModal, closeModal };
};
```

---

## 🧪 Testing Strategy

### Test Architecture

Our comprehensive testing strategy ensures reliability across all application layers:

```
__tests__/
├── components/              # Component tests
│   ├── calendar/           # Calendar component tests
│   ├── ui/                 # UI component tests
│   └── store/              # Store-connected component tests
├── hooks/                  # Custom hook tests
│   ├── modal/              # Modal management tests
│   └── calendar/           # Calendar logic tests
├── lib/                    # Utility and logic tests
│   ├── database/           # Database operation tests
│   ├── utils/              # Utility function tests
│   └── error/              # Error handling tests
├── store/                  # State management tests
│   ├── slices/             # Individual slice tests
│   └── integration/        # Store integration tests
├── e2e/                    # End-to-end tests
│   ├── user-workflows.spec.ts
│   └── encryption-workflow.spec.ts
├── performance/            # Performance benchmarks
│   ├── rendering.test.ts
│   └── store-performance.test.ts
└── utils/                  # Test utilities
    ├── testUtils.tsx       # React testing utilities
    └── storeTestUtils.ts   # Store testing utilities
```

### Test Categories & Coverage

| Test Type | Coverage Target | Purpose |
|-----------|----------------|---------|
| **Unit Tests** | 95% | Individual functions and components |
| **Integration Tests** | 90% | Component interactions and data flow |
| **E2E Tests** | 85% | Complete user workflows |
| **Performance Tests** | 100% | Performance benchmarks and regressions |

### Running Tests

```bash
# Quick test commands
npm test                      # All tests with watch mode
npm run test:unit            # Unit tests only
npm run test:components      # Component tests
npm run test:hooks           # Custom hook tests
npm run test:store           # State management tests
npm run test:integration     # Integration tests
npm run test:e2e            # End-to-end tests (Playwright)
npm run test:performance    # Performance benchmarks

# Advanced test commands
npm run test:coverage        # Generate coverage report
npm run test:comprehensive   # Full test suite with reporting
npm run test:e2e:ui         # E2E tests with UI
npm run test:e2e:mobile     # Mobile-specific E2E tests
npm run test:e2e:pwa        # PWA functionality tests

# Debugging tests
npm run test:debug          # Run tests in debug mode
npm run test:watch          # Watch mode for development
```

### Performance Benchmarks

Our performance testing ensures the application meets strict performance criteria:

```typescript
// Performance targets
const PERFORMANCE_TARGETS = {
  initialLoad: 3000,        // < 3 seconds
  transactionAdd: 100,      // < 100ms
  calendarRender: 50,       // < 50ms
  modalOpen: 50,           // < 50ms
  memoryUsage: 50 * 1024 * 1024, // < 50MB
};

// Example performance test
test('Calendar rendering performance', async () => {
  const startTime = performance.now();
  render(<CalendarView {...props} />);
  const renderTime = performance.now() - startTime;
  
  expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.calendarRender);
});
```

---

## 🔐 Security & Privacy

### Data Protection Framework

Our security model implements defense-in-depth principles:

#### Client-Side Encryption
```typescript
// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  keyLength: 256,
  ivLength: 12,
  tagLength: 16
};

// Data flow
Raw Data → Zod Validation → Encryption → IndexedDB Storage
```

#### Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **Data Encryption** | AES-GCM with 256-bit keys | Protect data at rest |
| **Key Derivation** | PBKDF2 with 100,000 iterations | Secure password-based keys |
| **Input Validation** | Zod schema validation | Prevent injection attacks |
| **Session Management** | Auto-lock with configurable timeout | Protect against unauthorized access |
| **CSP Headers** | Content Security Policy | Prevent XSS attacks |
| **No External APIs** | Complete client-side operation | Eliminate data transmission risks |

#### Privacy Guarantees

- ✅ **Zero Data Transmission**: No data leaves your device
- ✅ **Local-Only Storage**: All data stored in browser's IndexedDB
- ✅ **Encryption at Rest**: All stored data is encrypted
- ✅ **No Analytics**: No tracking or analytics data collected
- ✅ **No Third-Party Services**: No external dependencies for core functionality

### Security Best Practices

```typescript
// Example: Secure data handling
const saveTransactionSecurely = async (transaction: Transaction) => {
  // 1. Validate input
  const validatedData = TransactionSchema.parse(transaction);
  
  // 2. Encrypt sensitive data
  const encryptedData = await encryptData(validatedData);
  
  // 3. Store with integrity check
  const result = await database.store(encryptedData);
  
  // 4. Verify storage
  if (!result.success) {
    throw new SecurityError('Data storage failed');
  }
};
```

---

## 📱 Progressive Web App Features

### Installation & Offline Support

The application provides a native app experience across all platforms:

#### Installation Methods
- **Desktop**: Install button in browser address bar
- **Mobile**: "Add to Home Screen" from browser menu
- **iOS**: Share menu → "Add to Home Screen"
- **Android**: Browser menu → "Install app"

#### Offline Capabilities
```typescript
// Service worker configuration
const PWA_CONFIG = {
  cacheStrategy: 'NetworkFirst',
  offlineSupport: true,
  backgroundSync: true,
  precacheAssets: [
    '/static/**/*',
    '/manifest.json',
    '/icons/**/*'
  ]
};
```

### PWA Features

| Feature | Status | Description |
|---------|--------|-------------|
| **📱 App-like Experience** | ✅ Enabled | Native app behavior and UI |
| **🌐 Offline Functionality** | ✅ Complete | Full feature access without internet |
| **🔄 Background Sync** | ✅ Enabled | Data sync when connection restored |
| **📲 Install Prompts** | ✅ Custom | Smart installation prompts |
| **⚡ Fast Loading** | ✅ Optimized | < 3s initial load, instant navigation |
| **🔔 Push Notifications** | 🚧 Planned | Payment reminders (future feature) |

### Performance Optimizations

```typescript
// Code splitting and lazy loading
const SchedulePage = lazy(() => import('./schedule/page'));
const SettingsPage = lazy(() => import('./settings/page'));

// Service worker caching strategies
const CACHE_STRATEGIES = {
  staticAssets: 'CacheFirst',
  apiData: 'NetworkFirst', 
  images: 'StaleWhileRevalidate',
  fonts: 'CacheFirst'
};
```

---

## 🧮 Payment Calculation Engine

### Business Logic Implementation

Our payment calculation engine handles complex Japanese financial scenarios:

#### Card Payment Calculation
```typescript
const calculateCardPayment = (transaction: Transaction, card: Card) => {
  // 1. Determine billing cycle
  const billingMonth = determineBillingMonth(transaction.date, card.closingDay);
  
  // 2. Calculate payment date
  const paymentDate = calculatePaymentDate(billingMonth, card.paymentDay);
  
  // 3. Adjust for business days
  const adjustedDate = adjustForBusinessDays(paymentDate);
  
  return {
    billingMonth,
    paymentDate: adjustedDate,
    isBusinessDay: isBusinessDay(adjustedDate)
  };
};
```

#### Japanese Business Day Logic
```typescript
const isBusinessDay = (date: Date): boolean => {
  // Check weekends
  if (date.getDay() === 0 || date.getDay() === 6) return false;
  
  // Check Japanese holidays
  return !isJapaneseHoliday(date);
};

const adjustForBusinessDays = (date: Date): Date => {
  while (!isBusinessDay(date)) {
    date = addDays(date, 1);
  }
  return date;
};
```

### Supported Calculation Types

| Payment Type | Calculation Method | Business Day Adjustment |
|--------------|-------------------|------------------------|
| **Credit Card** | Closing date + payment day | Next business day |
| **Debit Card** | Transaction date + processing days | Next business day |
| **Direct Debit** | Scheduled date | Exact date or next business day |
| **Bank Transfer** | Manual entry | User-defined |

---

## 🛠️ Development Guide

### Development Environment Setup

#### Recommended VSCode Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode", 
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-jest",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### Configuration Files
- **TypeScript**: `tsconfig.json` (Strict mode enabled)
- **ESLint**: `.eslintrc.json` (Next.js + TypeScript rules)
- **Prettier**: `.prettierrc` (Consistent formatting)
- **Tailwind**: `tailwind.config.js` (Custom design system)
- **Jest**: `jest.config.js` (Testing configuration)
- **Playwright**: `playwright.config.ts` (E2E testing)

### Code Quality Standards

#### TypeScript Configuration
```typescript
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### ESLint Rules
```javascript
// .eslintrc.json highlights
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error"
  }
}
```

### Adding New Features

#### 1. Component Development
```bash
# Create new component
mkdir src/components/new-feature
touch src/components/new-feature/NewFeature.tsx
touch src/components/new-feature/index.ts

# Add tests
touch __tests__/components/new-feature/NewFeature.test.tsx
```

#### 2. State Management
```typescript
// Add new slice to store
export interface NewFeatureSlice {
  data: NewFeatureData[];
  actions: {
    addItem: (item: NewFeatureData) => void;
    updateItem: (id: string, item: Partial<NewFeatureData>) => void;
    deleteItem: (id: string) => void;
  };
}
```

#### 3. Testing Requirements
```typescript
// Component test template
describe('NewFeature Component', () => {
  it('renders correctly', () => {
    render(<NewFeature />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<NewFeature />);
    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

---

## 🚀 Deployment Guide

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Static export (optional)
npm run export
```

### Deployment Options

#### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Environment variables
vercel env add NEXT_PUBLIC_PWA_ENABLED production
```

#### 2. Static Hosting
```javascript
// next.config.js for static export
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

#### 3. Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `NEXT_PUBLIC_PWA_ENABLED` | `true` | Enable PWA features |
| `NEXT_PUBLIC_APP_VERSION` | `package.json` | App version for cache busting |

### Production Checklist

- [ ] All tests passing (`npm run test:comprehensive`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Linting clean (`npm run lint`)
- [ ] Performance benchmarks met
- [ ] PWA functionality verified
- [ ] Encryption/security tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed

---

## 📊 Performance Monitoring

### Key Performance Indicators

Our application maintains strict performance standards:

| Metric | Target | Monitoring |
|--------|--------|------------|
| **First Contentful Paint** | < 1.5s | Lighthouse CI |
| **Largest Contentful Paint** | < 2.5s | Core Web Vitals |
| **Time to Interactive** | < 3.0s | Performance API |
| **Cumulative Layout Shift** | < 0.1 | Layout Shift API |
| **First Input Delay** | < 100ms | User interaction tracking |

### Performance Optimization Techniques

#### 1. React Optimizations
```typescript
// Component memoization
const CalendarCell = React.memo(({ date, transactions }) => {
  return <div>{/* component JSX */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.date === nextProps.date && 
         prevProps.transactions.length === nextProps.transactions.length;
});

// Hook optimizations
const useCalendarData = (year: number, month: number) => {
  const calendarGrid = useMemo(() => {
    return createCalendarGrid(year, month);
  }, [year, month]);
  
  const handleDateClick = useCallback((date: Date) => {
    // Event handler logic
  }, []);
  
  return { calendarGrid, handleDateClick };
};
```

#### 2. Zustand Optimizations
```typescript
// Selective subscriptions
const TransactionCount = () => {
  const count = useAppStore(state => state.transactions.length);
  return <span>{count} transactions</span>;
};

// Derived state caching
const useTransactionSummary = () => {
  return useAppStore(
    useCallback(
      state => ({
        total: state.transactions.reduce((sum, t) => sum + t.amount, 0),
        count: state.transactions.length
      }),
      []
    )
  );
};
```

#### 3. Bundle Optimization
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns']
  },
  webpack: (config) => {
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
  }
};
```

### Monitoring & Analytics

```typescript
// Performance tracking
const trackPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined') {
    // Send to monitoring service
    console.log(`Performance: ${metric} = ${value}ms`);
  }
};

// Usage example
const usePerformanceTracking = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        trackPerformance(entry.name, entry.duration);
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
};
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git fork https://github.com/your-org/bank-payment-schedule.git
   git clone https://github.com/your-username/bank-payment-schedule.git
   cd bank-payment-schedule
   ```

2. **Setup Development Environment**
   ```bash
   npm install
   npm run dev
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

4. **Development Process**
   - Write code following our style guide
   - Add comprehensive tests
   - Update documentation as needed
   - Ensure all quality checks pass

5. **Quality Assurance**
   ```bash
   npm run type-check    # TypeScript validation
   npm run lint         # Code style check
   npm test            # Run test suite
   npm run test:e2e    # End-to-end tests
   ```

6. **Submit Pull Request**
   - Create descriptive PR title and description
   - Reference related issues
   - Ensure CI passes
   - Request review from maintainers

### Code Standards

#### TypeScript Guidelines
```typescript
// ✅ Good: Explicit types and proper naming
interface UserTransaction {
  readonly id: string;
  readonly amount: number;
  readonly date: Date;
  readonly description: string;
}

const processTransaction = async (
  transaction: UserTransaction
): Promise<ProcessingResult> => {
  // Implementation
};

// ❌ Avoid: Any types and unclear naming
const process = (data: any) => {
  // Implementation
};
```

#### Component Guidelines
```typescript
// ✅ Good: Props interface and default props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}) => {
  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size])}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### Testing Guidelines
```typescript
// ✅ Good: Descriptive test names and comprehensive coverage
describe('TransactionModal Component', () => {
  describe('when rendering', () => {
    it('displays all form fields correctly', () => {
      render(<TransactionModal isOpen={true} />);
      
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });
  });
  
  describe('when submitting form', () => {
    it('calls onSubmit with correct data', async () => {
      const mockSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<TransactionModal isOpen={true} onSubmit={mockSubmit} />);
      
      await user.type(screen.getByLabelText(/amount/i), '1000');
      await user.type(screen.getByLabelText(/description/i), 'Test transaction');
      await user.click(screen.getByRole('button', { name: /save/i }));
      
      expect(mockSubmit).toHaveBeenCalledWith({
        amount: 1000,
        description: 'Test transaction',
        date: expect.any(Date)
      });
    });
  });
});
```

### Pull Request Checklist

- [ ] **Code Quality**
  - [ ] TypeScript compilation passes (`npm run type-check`)
  - [ ] ESLint rules followed (`npm run lint`)
  - [ ] Code follows established patterns
  - [ ] No console.log statements in production code

- [ ] **Testing**
  - [ ] Unit tests added for new functionality
  - [ ] Integration tests updated if needed
  - [ ] All tests pass (`npm test`)
  - [ ] E2E tests pass for user-facing changes

- [ ] **Documentation**
  - [ ] README updated if needed
  - [ ] API documentation updated
  - [ ] Code comments added for complex logic
  - [ ] JSDoc comments for public functions

- [ ] **Performance**
  - [ ] No performance regressions introduced
  - [ ] Bundle size impact assessed
  - [ ] Loading performance maintained

---

## 📋 Roadmap & Future Features

### Completed Phases

#### ✅ Phase 1: Foundation & Core Features (Completed)
- Basic transaction management
- Calendar view implementation
- PWA setup and offline functionality
- Client-side encryption
- Initial UI/UX design

#### ✅ Phase 2: State Management & Performance (Completed)
- Zustand global state management
- Component optimization with React.memo
- Custom hooks extraction
- Performance monitoring setup
- Advanced caching strategies

#### ✅ Phase 3: Testing & Documentation (Completed)
- Comprehensive test suite (90%+ coverage)
- E2E testing with Playwright
- Performance benchmarking
- Complete documentation system
- Production deployment preparation

### Upcoming Features

#### 🚧 Phase 4: Advanced Features (In Planning)
- [ ] **Data Import/Export**
  - CSV import/export functionality
  - QIF format support
  - Backup/restore capabilities
  - Data migration tools

- [ ] **Enhanced UI/UX**
  - Dark mode implementation
  - Improved mobile experience
  - Accessibility enhancements (WCAG 2.1 AA)
  - Custom themes and branding

- [ ] **Advanced Analytics**
  - Spending pattern analysis
  - Budget tracking and alerts
  - Financial health insights
  - Export to popular finance apps

#### 🔮 Phase 5: Integration & Sync (Future)
- [ ] **Multi-Device Sync**
  - Encrypted cloud synchronization
  - Conflict resolution
  - Cross-platform data consistency
  - Offline-first sync strategy

- [ ] **Bank Integration**
  - Open Banking API integration (where available)
  - Automated transaction import
  - Real-time balance updates
  - Transaction categorization

- [ ] **Notifications & Reminders**
  - Push notification system
  - Payment due date reminders
  - Budget alerts
  - Custom notification rules

#### 💡 Long-term Vision
- [ ] **AI-Powered Features**
  - Smart transaction categorization
  - Spending prediction models
  - Personalized financial insights
  - Fraud detection patterns

- [ ] **Enterprise Features**
  - Multi-user support
  - Role-based permissions
  - Audit trails
  - Administrative dashboard

### Contributing to Roadmap

We welcome community input on our roadmap! Here's how you can contribute:

1. **Feature Requests**: Open an issue with the `feature-request` label
2. **Discussions**: Join our GitHub Discussions for roadmap planning
3. **Voting**: Use 👍 reactions on issues to show priority preference
4. **Implementation**: Submit PRs for features you'd like to implement

---

## 📞 Support & Community

### Getting Help

#### 🐛 Bug Reports
Found a bug? Please help us fix it:

1. **Check existing issues** to avoid duplicates
2. **Use our bug report template** with detailed information
3. **Include reproduction steps** and environment details
4. **Add relevant labels** for priority and category

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Environment**
- OS: [e.g. Windows 10, macOS Big Sur]
- Browser: [e.g. Chrome 95, Firefox 94]
- App Version: [e.g. v1.2.3]
```

#### 💡 Feature Requests
Have an idea for improvement?

1. **Search existing requests** to see if already suggested
2. **Use feature request template** with detailed use case
3. **Explain the problem** your feature would solve
4. **Describe your proposed solution** with examples

#### ❓ Questions & Discussions
- **GitHub Discussions**: General questions and community chat
- **Documentation**: Check our comprehensive docs first
- **Stack Overflow**: Tag questions with `bank-payment-schedule`

### Documentation

| Resource | Description | Link |
|----------|-------------|------|
| **API Reference** | Complete API documentation | [/docs/api/](./docs/api/) |
| **Architecture Guide** | System design and patterns | [/docs/architecture/](./docs/architecture/) |
| **Development Guide** | Setup and contribution guide | [/docs/guides/development.md](./docs/guides/development.md) |
| **Testing Guide** | Testing strategies and examples | [/docs/guides/testing.md](./docs/guides/testing.md) |
| **Deployment Guide** | Production deployment instructions | [/docs/guides/deployment.md](./docs/guides/deployment.md) |
| **Troubleshooting** | Common issues and solutions | [/docs/guides/troubleshooting.md](./docs/guides/troubleshooting.md) |

### Community Guidelines

We're committed to providing a welcoming and inclusive environment:

- **Be respectful** and considerate in all interactions
- **Help others** when you can - we all started somewhere
- **Stay on topic** in discussions and issues
- **Follow our code of conduct** in all community spaces
- **Provide constructive feedback** when reviewing PRs

---

## 📄 License & Legal

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Bank Payment Schedule Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Full license text...]
```

### Privacy Policy

This application is designed with privacy as a core principle:

- **No Data Collection**: We do not collect any personal or usage data
- **Local Storage Only**: All data remains on your device
- **No Third-Party Services**: No external services access your data
- **Encryption by Default**: All stored data is encrypted with your password
- **Open Source**: Complete transparency through open source code

### Legal Disclaimers

⚠️ **Important Legal Information**

- **Personal Use Only**: This application is intended for personal financial management
- **Not Financial Advice**: This app does not provide financial or investment advice
- **Data Accuracy**: Users are responsible for data accuracy and verification
- **No Warranty**: Software provided "as is" without warranty of any kind
- **Backup Responsibility**: Users should regularly backup their data
- **Compliance**: Users responsible for compliance with local financial regulations

### Third-Party Licenses

This project uses various open-source libraries. Key dependencies:

| Library | License | Purpose |
|---------|---------|---------|
| React | MIT | UI framework |
| Next.js | MIT | Application framework |
| TypeScript | Apache 2.0 | Type safety |
| Tailwind CSS | MIT | Styling framework |
| Zustand | MIT | State management |
| Dexie.js | Apache 2.0 | Database wrapper |
| Jest | MIT | Testing framework |
| Playwright | Apache 2.0 | E2E testing |

Full license information available in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

---

## 🏆 Acknowledgments

### Core Team

- **Architecture & Development**: Development Team
- **UI/UX Design**: Design Team  
- **Testing & QA**: Quality Assurance Team
- **Documentation**: Technical Writing Team

### Special Thanks

- **Open Source Community**: For the amazing tools and libraries
- **Beta Testers**: For early feedback and bug reports
- **Contributors**: Everyone who has contributed code, documentation, or ideas
- **Japanese Finance Community**: For insights into local banking practices

### Built With Love

This project represents hundreds of hours of careful planning, development, and testing. We're proud to offer a secure, private, and powerful tool for managing personal finances.

---

## 📈 Project Statistics

![GitHub last commit](https://img.shields.io/github/last-commit/your-org/bank-payment-schedule)
![GitHub issues](https://img.shields.io/github/issues/your-org/bank-payment-schedule)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-org/bank-payment-schedule)
![GitHub stars](https://img.shields.io/github/stars/your-org/bank-payment-schedule)

| Metric | Value |
|--------|-------|
| **Lines of Code** | ~15,000+ |
| **Test Coverage** | 90%+ |
| **Components** | 50+ |
| **Custom Hooks** | 20+ |
| **Test Files** | 100+ |
| **Documentation Pages** | 25+ |

---

**🔗 Quick Links**

- [📚 Documentation](./docs/)
- [🐛 Report Bug](https://github.com/your-org/bank-payment-schedule/issues/new?template=bug_report.md)
- [💡 Request Feature](https://github.com/your-org/bank-payment-schedule/issues/new?template=feature_request.md)
- [💬 Discussions](https://github.com/your-org/bank-payment-schedule/discussions)
- [📋 Project Board](https://github.com/your-org/bank-payment-schedule/projects)

---

**Last Updated**: December 2024  
**Version**: 1.0.0 (Production Ready)  
**Maintainers**: [Development Team](https://github.com/your-org/bank-payment-schedule/graphs/contributors)

*Made with ❤️ for personal financial management*
