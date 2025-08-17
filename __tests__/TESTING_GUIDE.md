# Testing Guide for Bank Payment Schedule App

## Quick Start

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test patterns
npm test -- --testNamePattern="Modal"
npm test -- store/slices/
```

### Test Development Workflow

1. **Create Test File**: Place in appropriate directory under `__tests__/`
2. **Import Utilities**: Use existing test utilities from `utils/`
3. **Structure Tests**: Follow AAA pattern (Arrange-Act-Assert)
4. **Run Tests**: Use watch mode during development
5. **Check Coverage**: Ensure adequate coverage

## Test Categories

### 🧪 Unit Tests - Store Slices
**Path**: `__tests__/store/slices/`

Test individual store slices in isolation:
```typescript
// Example: Testing modal slice
describe('Modal Slice', () => {
  it('should open transaction modal with correct data', () => {
    const mockDate = new Date('2024-02-15');
    const mockTransaction = createMockTransaction();
    
    act(() => {
      store.openModal('transaction', { date: mockDate, transaction: mockTransaction });
    });

    expect(store.getState().modals.transaction.isOpen).toBe(true);
    expect(store.getState().modals.transaction.data.transaction).toEqual(mockTransaction);
  });
});
```

### 🔗 Integration Tests
**Path**: `__tests__/store/integration/`

Test store integration with hooks and components:
```typescript
// Example: Testing hook + store integration
describe('Store Integration', () => {
  it('should integrate modal hook with store correctly', () => {
    const { result } = renderHook(() => useModalManagerWithStore());
    
    act(() => {
      result.current.openTransactionModal(new Date(), mockTransaction);
    });

    expect(mockStore.actions.openModal).toHaveBeenCalledWith('transaction', {
      date: expect.any(Date),
      transaction: mockTransaction,
    });
  });
});
```

### 🖥️ Component Tests
**Path**: `__tests__/components/store/`

Test UI components with store integration:
```typescript
// Example: Testing component with store
describe('Calendar View with Store', () => {
  it('should display day totals from store', async () => {
    render(<CalendarViewWithStore />);
    
    await waitFor(() => {
      const dayWithData = screen.getByTestId('calendar-day-15');
      expect(dayWithData).toHaveClass('has-data');
      expect(dayWithData.textContent).toContain('¥20,000');
    });
  });
});
```

### ⚡ Performance Tests
**Path**: `__tests__/performance/`

Benchmark critical operations:
```typescript
// Example: Performance testing
describe('Store Performance', () => {
  it('should handle 1000 transactions efficiently', async () => {
    const transactions = Array.from({ length: 1000 }, (_, i) =>
      createMockTransaction({ id: `perf-tx-${i}` })
    );

    const startTime = performance.now();
    
    await act(async () => {
      store.addMultipleTransactions(transactions);
    });
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100); // < 100ms
  });
});
```

### 🚨 Edge Case Tests
**Path**: `__tests__/edge-cases/`

Test boundary conditions and error scenarios:
```typescript
// Example: Edge case testing
describe('Store Edge Cases', () => {
  it('should reject invalid transaction data', () => {
    expect(() => {
      store.addTransaction(null);
    }).toThrow('Invalid transaction data');
  });
});
```

## Common Test Patterns

### 🏗️ Test Setup Pattern
```typescript
describe('Feature Tests', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let actionTester: ReturnType<typeof createStoreActionTester>;

  beforeEach(() => {
    mockStore = createMockStore();
    actionTester = createStoreActionTester();
    jest.clearAllMocks();
  });

  // Tests here...
});
```

### 🎭 Mock Data Pattern
```typescript
// Use factory functions for consistent mock data
const testTransaction = createMockTransaction({
  id: 'test-tx-1',
  amount: 5000,
  description: 'Test Transaction',
});

const testDataSet = createMockDataSet(); // Complete dataset
```

### ⏱️ Async Testing Pattern
```typescript
// Proper async testing with act()
it('should handle async operations', async () => {
  await act(async () => {
    await store.saveTransaction(transactionInput);
  });

  expect(store.getState().transactions.items).toContainEqual(
    expect.objectContaining({ id: expect.any(String) })
  );
});
```

### 🔍 State Assertion Pattern
```typescript
// Use utility functions for complex assertions
expectModalState(store.getState().modals, {
  transaction: true,
  transactionView: false,
  scheduleView: false,
});

expectSelectedData(store.getState().selectedData, {
  date: mockDate,
  transaction: mockTransaction,
  transactions: [],
});
```

## Test Utilities Reference

### 🛠️ Core Utilities (`testUtils.tsx`)

#### Mock Factories
```typescript
createMockTransaction(overrides?)     // Create test transaction
createMockScheduleItem(overrides?)   // Create test schedule
createMockDayTotalData(overrides?)   // Create test day totals
createMockBank(overrides?)           // Create test bank
createMockCard(overrides?)           // Create test card
createMockDataSet()                  // Create complete test dataset
```

#### Async Utilities
```typescript
createAsyncMock(returnValue, delay?, shouldReject?) // Mock async functions
createErrorMock(message?)                          // Mock error scenarios
measureHookPerformance(hookFn, iterations?)       // Measure performance
```

#### Assertion Utilities
```typescript
expectModalState(modalStates, expectedStates)     // Assert modal states
expectSelectedData(selectedData, expectedData)    // Assert selected data
validateTransactionInput(input)                   // Validate transaction
validateScheduleItem(item)                        // Validate schedule
```

#### Rendering Utilities
```typescript
renderWithProviders(ui, options?)                 // Render with store providers
createStoreTestWrapper(initialState?)             // Create test wrapper
```

### 🏪 Store Utilities (`storeTestUtils.ts`)

#### State Management
```typescript
createInitialStoreState()                         // Initial store state
compareStoreStates(state1, state2, ignorePaths?)  // Compare states
```

#### Action Testing
```typescript
createStoreActionTester()                         // Track actions
testAsyncAction(actionFn, expectedStates, stateGetter) // Test async actions
measureStoreActionPerformance(actionFn, iterations?)   // Measure performance
```

#### Subscription Testing
```typescript
createStoreSubscriptionTester()                   // Test subscriptions
createMiddlewareTester()                          // Test middleware
createPersistenceTester()                         // Test persistence
```

#### Error Testing
```typescript
createStoreErrorTester()                          // Track errors
```

## Writing Effective Tests

### ✅ Do's

1. **Use Descriptive Names**: Tests should clearly describe what they validate
   ```typescript
   // ✅ Good
   it('should open transaction modal when clicking empty calendar day', () => {})
   
   // ❌ Bad
   it('should work correctly', () => {})
   ```

2. **Test One Thing**: Each test should validate a single behavior
   ```typescript
   // ✅ Good - Tests one specific behavior
   it('should update transaction amount when valid amount provided', () => {})
   
   // ❌ Bad - Tests multiple behaviors
   it('should update transaction and close modal and refresh data', () => {})
   ```

3. **Use Realistic Data**: Mock data should reflect real usage
   ```typescript
   // ✅ Good
   const realTransaction = createMockTransaction({
     amount: 1500,
     description: 'コンビニ決済',
     date: '2024-02-15',
   });
   
   // ❌ Bad
   const fakeTransaction = { amount: 999999, description: 'test' };
   ```

4. **Test Error Scenarios**: Include failure cases
   ```typescript
   it('should handle network errors gracefully', async () => {
     mockApi.mockRejectedValue(new Error('Network error'));
     
     await expect(store.loadTransactions()).rejects.toThrow('Network error');
     expect(store.getState().error).toBe('Network error');
   });
   ```

### ❌ Don'ts

1. **Don't Test Implementation Details**: Focus on behavior, not internals
2. **Don't Create Test Dependencies**: Tests should be independent
3. **Don't Ignore Edge Cases**: Test boundary conditions
4. **Don't Skip Error Handling**: Always test error scenarios

### 🧪 Test Structure Template

```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Initialize test environment
  });

  describe('Normal Operations', () => {
    it('should handle successful case', () => {
      // Arrange
      const input = createMockInput();
      
      // Act
      const result = performOperation(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid input', () => {
      expect(() => performOperation(null)).toThrow('Invalid input');
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary values', () => {
      // Test with edge case values
    });
  });
});
```

## Debugging Tests

### 🐛 Common Issues

#### Test Timeouts
```typescript
// Increase timeout for slow operations
jest.setTimeout(10000);

// Or use waitFor with timeout
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });
```

#### Async State Issues
```typescript
// ✅ Proper async testing
await act(async () => {
  await asyncOperation();
});

await waitFor(() => {
  expect(state.loading).toBe(false);
});

// ❌ Missing act() or waitFor()
asyncOperation();
expect(state.loading).toBe(false); // May fail
```

#### Mock Issues
```typescript
// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  mockStore.reset();
});
```

### 🔍 Debugging Tools

#### Store State Inspection
```typescript
// Log store state for debugging
console.log('Store state:', JSON.stringify(store.getState(), null, 2));

// Use action tester to track actions
const actions = actionTester.getAllActions();
console.log('Actions fired:', actions);
```

#### Component Debugging
```typescript
import { screen } from '@testing-library/react';

// Log current DOM state
screen.debug();

// Log specific element
screen.debug(screen.getByTestId('element'));
```

#### Test Isolation
```typescript
// Run single test for debugging
npm test -- --testNamePattern="specific test name"

// Run single file
npm test modalSlice.test.ts
```

## Performance Testing

### 📊 Benchmarking

Set performance expectations:
```typescript
describe('Performance Requirements', () => {
  it('should load 1000 transactions in under 100ms', async () => {
    const transactions = createLargeDataset(1000);
    
    const startTime = performance.now();
    await store.loadTransactions(transactions);
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(100);
  });
});
```

### 🧠 Memory Testing

Monitor memory usage:
```typescript
it('should not create memory leaks', () => {
  const initialMemory = performance.memory?.usedJSHeapSize;
  
  // Perform operations
  for (let i = 0; i < 100; i++) {
    store.addTransaction(createMockTransaction());
    store.clearTransactions();
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize;
  const growth = finalMemory - initialMemory;
  
  expect(growth).toBeLessThan(initialMemory * 0.5); // Less than 50% growth
});
```

## Coverage Guidelines

### 📈 Coverage Targets
- **Critical paths**: 100%
- **Store slices**: 95%
- **Integration**: 85%
- **Components**: 80%
- **Overall**: 90%

### 📊 Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### 🎯 Focus Areas

**100% Coverage Required**:
- Data validation
- Error handling
- Security operations
- State transitions

**High Priority (95%+)**:
- Core business logic
- User interactions
- Data persistence

## Continuous Integration

### 🚀 CI Pipeline

1. **Code Quality**: ESLint, TypeScript checks
2. **Unit Tests**: Fast feedback
3. **Integration Tests**: Feature validation
4. **Performance Tests**: Benchmark validation
5. **Coverage Check**: Meet targets

### 🚨 Quality Gates

All must pass:
- [ ] All tests pass
- [ ] Coverage targets met
- [ ] Performance benchmarks pass
- [ ] No critical vulnerabilities

## Troubleshooting

### 🔧 Common Solutions

#### Tests Running Slowly
- Use `jest.setTimeout()` for long operations
- Mock external dependencies
- Use `--maxWorkers=1` for debugging

#### Flaky Tests
- Add proper `waitFor()` for async operations
- Use `act()` for state changes
- Reset mocks and state between tests

#### Coverage Issues
- Check for unreachable code
- Add tests for error scenarios
- Use `/* istanbul ignore next */` for truly untestable code

#### Mock Problems
- Clear mocks in `beforeEach()`
- Use `jest.resetModules()` if needed
- Verify mock implementation matches real API

---

This guide covers the essential patterns and practices for testing the Bank Payment Schedule app. Follow these guidelines to write effective, maintainable tests that provide confidence in the application's reliability.