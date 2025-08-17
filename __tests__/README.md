# Bank Payment Schedule App - Test Suite Documentation

## Overview

This document provides comprehensive documentation for the test suite supporting Phase 2 of the refactoring plan, which introduces Zustand for global state management while maintaining compatibility with existing hooks and components.

## Test Architecture

### Directory Structure

```
__tests__/
├── utils/
│   ├── testUtils.tsx              # Common testing utilities and mock factories
│   └── storeTestUtils.ts          # Zustand store-specific testing utilities
├── store/
│   ├── slices/
│   │   ├── modalSlice.test.ts     # Modal state management tests
│   │   ├── transactionSlice.test.ts # Transaction state management tests
│   │   └── scheduleSlice.test.ts  # Schedule state management tests
│   └── integration/
│       └── storeIntegration.test.ts # Store + hooks integration tests
├── components/
│   └── store/
│       ├── CalendarViewWithStore.test.tsx # Calendar component with store
│       └── ModalManagerWithStore.test.tsx # Modal management with store
├── performance/
│   └── storePerformance.test.ts   # Performance benchmarks
├── edge-cases/
│   └── storeEdgeCases.test.ts     # Edge cases and boundary conditions
└── README.md                      # This documentation
```

## Testing Strategy

### 1. Unit Tests (Store Slices)

**Purpose**: Validate individual store slices in isolation
**Location**: `__tests__/store/slices/`

#### Modal Slice Tests (`modalSlice.test.ts`)
- Initial state validation
- Modal opening/closing operations
- Cross-modal transitions
- Error handling for invalid data
- Performance under rapid operations
- Type safety validation

#### Transaction Slice Tests (`transactionSlice.test.ts`)
- CRUD operations (Create, Read, Update, Delete)
- Validation and error handling
- Filtering and search operations
- Async operation handling
- State consistency under concurrent operations
- Large dataset performance

#### Schedule Slice Tests (`scheduleSlice.test.ts`)
- Schedule CRUD operations
- Recurring schedule generation (monthly, weekly, annual)
- Schedule calculations and totals
- Conflict detection and resolution
- Performance with complex calculations

### 2. Integration Tests

**Purpose**: Validate store integration with existing hooks and components
**Location**: `__tests__/store/integration/`

#### Store Integration Tests (`storeIntegration.test.ts`)
- Modal management with store
- Transaction operations through hooks
- Calendar calculations with store data
- Store subscription handling
- Error propagation and recovery
- Real-world user workflows

### 3. Component Tests with Store

**Purpose**: Validate UI components with store integration
**Location**: `__tests__/components/store/`

#### Calendar View Tests (`CalendarViewWithStore.test.tsx`)
- Calendar rendering with store data
- Day click interactions
- Modal transitions
- Data display accuracy
- Navigation and date changes
- Performance with large datasets

#### Modal Manager Tests (`ModalManagerWithStore.test.tsx`)
- Modal lifecycle management
- Form interactions and validation
- Cross-modal data flow
- Error handling in UI
- Accessibility compliance

### 4. Performance Tests

**Purpose**: Ensure store operations meet performance requirements
**Location**: `__tests__/performance/`

#### Performance Benchmarks (`storePerformance.test.ts`)
- Large dataset operations (1000+ transactions)
- Complex filtering and calculations
- Subscription notification efficiency
- Memory usage monitoring
- Concurrent operation handling

**Performance Targets**:
- 1000 transaction additions: < 100ms
- 5000 transaction additions: < 500ms
- Complex filtering: < 50ms
- Modal operations: < 50ms
- Memory growth: < 2x initial usage

### 5. Edge Case Tests

**Purpose**: Validate handling of boundary conditions and error scenarios
**Location**: `__tests__/edge-cases/`

#### Edge Case Coverage (`storeEdgeCases.test.ts`)
- Invalid data rejection
- Duplicate data handling
- Non-existent entity operations
- Boundary value testing
- Data type coercion edge cases
- State corruption prevention

## Test Utilities

### Core Test Utilities (`testUtils.tsx`)

#### Mock Data Factories
```typescript
createMockTransaction(overrides?)     // Create test transaction
createMockScheduleItem(overrides?)   // Create test schedule
createMockDayTotalData(overrides?)   // Create test day totals
createMockDataSet()                  // Create complete test dataset
```

#### Async Testing Utilities
```typescript
createAsyncMock(returnValue, delay, shouldReject) // Mock async operations
createErrorMock(message)                         // Mock error scenarios
measureHookPerformance(hookFn, iterations)      // Measure hook performance
```

#### Validation Utilities
```typescript
validateTransactionInput(input)    // Validate transaction data
validateScheduleItem(item)         // Validate schedule data
expectModalState(states, expected) // Assert modal states
expectSelectedData(data, expected) // Assert selected data
```

### Store Test Utilities (`storeTestUtils.ts`)

#### Store State Management
```typescript
createInitialStoreState()          // Create initial store state
compareStoreStates(state1, state2) // Compare store states
createStoreTestWrapper(state)      // Wrap components with store
```

#### Action Testing
```typescript
createStoreActionTester()           // Track store actions
testAsyncAction(actionFn, states)   // Test async store actions
measureStoreActionPerformance()     // Measure action performance
```

#### Subscription Testing
```typescript
createStoreSubscriptionTester()     // Test store subscriptions
createMiddlewareTester()            // Test store middleware
createPersistenceTester()           // Test store persistence
```

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:performance   # Performance tests
npm run test:coverage      # With coverage report
```

### Watch Mode
```bash
npm run test:watch         # Watch mode for development
```

### Specific Test Files
```bash
npm test modalSlice.test.ts
npm test storeIntegration.test.ts
npm test -- --testNamePattern="Modal"
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Overall**: 90%
- **Store Slices**: 95%
- **Integration**: 85%
- **Components**: 80%
- **Edge Cases**: 100%

### Critical Paths (100% Coverage Required)
- Data validation and sanitization
- Error handling and recovery
- State transitions and consistency
- Security-related operations

## Best Practices

### Test Organization
1. **Arrange-Act-Assert (AAA) Pattern**: Structure tests clearly
2. **Descriptive Test Names**: Use clear, specific test descriptions
3. **Single Responsibility**: Each test validates one specific behavior
4. **Test Independence**: Tests should not depend on each other

### Mock Strategy
1. **Minimal Mocking**: Mock only external dependencies
2. **Realistic Data**: Use realistic test data that matches production
3. **Error Scenarios**: Include both success and failure cases
4. **Edge Cases**: Test boundary conditions and invalid inputs

### Performance Considerations
1. **Benchmark Critical Operations**: Set performance expectations
2. **Memory Monitoring**: Watch for memory leaks in long-running tests
3. **Concurrent Testing**: Validate behavior under concurrent load
4. **Real-world Scenarios**: Test with realistic dataset sizes

## Debugging Test Failures

### Common Issues and Solutions

#### Test Timeout Issues
```typescript
// Increase timeout for complex operations
jest.setTimeout(10000);

// Use proper async/await patterns
await act(async () => {
  await asyncOperation();
});
```

#### State Synchronization Issues
```typescript
// Wait for state updates
await waitFor(() => {
  expect(screen.getByTestId('element')).toBeInTheDocument();
});

// Use act() for state changes
act(() => {
  storeAction();
});
```

#### Mock Data Issues
```typescript
// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Use consistent mock data
const mockData = createMockDataSet();
```

### Test Debugging Tools

#### Store State Inspection
```typescript
// Log store state for debugging
console.log(JSON.stringify(store.getState(), null, 2));

// Use store action tester
const actionTester = createStoreActionTester();
console.log(actionTester.getAllActions());
```

#### Component State Debugging
```typescript
// Use debug from testing-library
import { render, screen } from '@testing-library/react';
const { debug } = render(<Component />);
debug(); // Logs current DOM state
```

## Contributing to Tests

### Adding New Tests

1. **Identify Test Category**: Determine appropriate test directory
2. **Follow Naming Convention**: Use descriptive file names
3. **Use Existing Utilities**: Leverage common test utilities
4. **Include Documentation**: Document complex test scenarios

### Test Review Checklist

- [ ] Tests follow AAA pattern
- [ ] Descriptive test names
- [ ] Appropriate assertions
- [ ] Error scenarios covered
- [ ] Performance considerations
- [ ] No test interdependencies
- [ ] Proper cleanup in afterEach/afterAll

### Updating Tests for New Features

1. **Update Mock Factories**: Add new data types
2. **Extend Store Tests**: Test new store slices
3. **Add Integration Tests**: Test feature interactions
4. **Update Performance Tests**: Benchmark new operations
5. **Cover Edge Cases**: Test boundary conditions

## Continuous Integration

### Test Pipeline
1. **Lint and Type Check**: Validate code quality
2. **Unit Tests**: Fast feedback on core functionality
3. **Integration Tests**: Validate feature interactions
4. **Performance Tests**: Ensure performance requirements
5. **Coverage Report**: Validate coverage targets

### Quality Gates
- All tests must pass
- Coverage targets must be met
- Performance benchmarks must pass
- No critical security vulnerabilities

## Future Considerations

### Test Evolution
- Add E2E tests with Playwright for complete user journeys
- Implement visual regression testing
- Add accessibility testing automation
- Expand performance monitoring

### Monitoring
- Set up test performance monitoring in CI
- Track test reliability metrics
- Monitor coverage trends over time
- Alert on performance regressions

---

This test suite provides comprehensive coverage for Phase 2 refactoring while ensuring system reliability, performance, and maintainability. Regular review and updates ensure the test suite evolves with the application.