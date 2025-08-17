/**
 * Comprehensive E2E Testing Suite
 * Phase 3 cross-browser compatibility and PWA functionality testing
 * Production-ready end-to-end validation
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data setup
const testData = {
  bank: {
    name: 'テスト銀行',
    accountNumber: '1234567890',
    accountType: 'savings' as const,
  },
  card: {
    name: 'テストカード',
    lastFourDigits: '1234',
    brand: 'VISA' as const,
    type: 'credit' as const,
  },
  transaction: {
    amount: 5000,
    description: 'E2Eテスト取引',
    categoryId: 'cat-1',
  },
  schedule: {
    title: 'E2Eテスト予定',
    amount: 3000,
    categoryId: 'cat-1',
    recurringType: 'monthly' as const,
  },
};

// Helper functions
async function setupTestEnvironment(page: Page) {
  // Navigate to the app
  await page.goto('/');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  
  // Setup test data if needed
  await page.evaluate(() => {
    // Clear any existing data
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });
}

async function addTestBank(page: Page, bankData = testData.bank) {
  await page.click('[data-testid="settings-button"]');
  await page.click('[data-testid="bank-master-tab"]');
  await page.click('[data-testid="add-bank-button"]');
  
  await page.fill('[data-testid="bank-name-input"]', bankData.name);
  await page.fill('[data-testid="account-number-input"]', bankData.accountNumber);
  await page.selectOption('[data-testid="account-type-select"]', bankData.accountType);
  
  await page.click('[data-testid="save-bank-button"]');
  await page.waitForSelector(`[data-testid="bank-item-${bankData.name}"]`);
}

async function addTestCard(page: Page, cardData = testData.card) {
  await page.click('[data-testid="settings-button"]');
  await page.click('[data-testid="card-master-tab"]');
  await page.click('[data-testid="add-card-button"]');
  
  await page.fill('[data-testid="card-name-input"]', cardData.name);
  await page.fill('[data-testid="last-four-digits-input"]', cardData.lastFourDigits);
  await page.selectOption('[data-testid="card-brand-select"]', cardData.brand);
  await page.selectOption('[data-testid="card-type-select"]', cardData.type);
  
  await page.click('[data-testid="save-card-button"]');
  await page.waitForSelector(`[data-testid="card-item-${cardData.name}"]`);
}

// Test suites
test.describe('Bank Payment Schedule E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test.describe('Application Loading & Basic Navigation', () => {
    test('should load the application successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Bank Payment Schedule/);
      await expect(page.locator('[data-testid="app-loaded"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    });

    test('should navigate between main sections', async ({ page }) => {
      // Test calendar navigation
      await page.click('[data-testid="calendar-tab"]');
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      // Test schedule navigation
      await page.click('[data-testid="schedule-tab"]');
      await expect(page.locator('[data-testid="schedule-view"]')).toBeVisible();
      
      // Test settings navigation
      await page.click('[data-testid="settings-tab"]');
      await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
    });

    test('should handle responsive design on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });
  });

  test.describe('Bank Management Workflow', () => {
    test('should add a new bank successfully', async ({ page }) => {
      await addTestBank(page);
      
      // Verify bank appears in list
      await expect(page.locator(`[data-testid="bank-item-${testData.bank.name}"]`)).toBeVisible();
      
      // Verify bank details
      await page.click(`[data-testid="bank-item-${testData.bank.name}"]`);
      await expect(page.locator('[data-testid="bank-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="bank-name"]')).toHaveText(testData.bank.name);
    });

    test('should edit an existing bank', async ({ page }) => {
      await addTestBank(page);
      
      const updatedName = 'テスト銀行 - 更新済み';
      
      await page.click(`[data-testid="edit-bank-${testData.bank.name}"]`);
      await page.fill('[data-testid="bank-name-input"]', updatedName);
      await page.click('[data-testid="save-bank-button"]');
      
      await expect(page.locator(`[data-testid="bank-item-${updatedName}"]`)).toBeVisible();
    });

    test('should delete a bank with confirmation', async ({ page }) => {
      await addTestBank(page);
      
      await page.click(`[data-testid="delete-bank-${testData.bank.name}"]`);
      await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
      
      await page.click('[data-testid="confirm-delete-button"]');
      await expect(page.locator(`[data-testid="bank-item-${testData.bank.name}"]`)).not.toBeVisible();
    });
  });

  test.describe('Card Management Workflow', () => {
    test('should add a new card successfully', async ({ page }) => {
      await addTestCard(page);
      
      // Verify card appears in list
      await expect(page.locator(`[data-testid="card-item-${testData.card.name}"]`)).toBeVisible();
      
      // Verify card details
      await page.click(`[data-testid="card-item-${testData.card.name}"]`);
      await expect(page.locator('[data-testid="card-details-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="card-name"]')).toHaveText(testData.card.name);
    });

    test('should validate card input fields', async ({ page }) => {
      await page.click('[data-testid="settings-button"]');
      await page.click('[data-testid="card-master-tab"]');
      await page.click('[data-testid="add-card-button"]');
      
      // Try to save without required fields
      await page.click('[data-testid="save-card-button"]');
      
      await expect(page.locator('[data-testid="card-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-four-digits-error"]')).toBeVisible();
    });
  });

  test.describe('Transaction Management Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await addTestBank(page);
      await addTestCard(page);
    });

    test('should add a new transaction via calendar', async ({ page }) => {
      await page.click('[data-testid="calendar-tab"]');
      
      // Click on a specific date
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      // Add transaction
      await page.click('[data-testid="add-transaction-button"]');
      await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      
      await page.click('[data-testid="save-transaction-button"]');
      
      // Verify transaction appears on calendar
      await expect(page.locator('[data-testid="transaction-indicator"]')).toBeVisible();
    });

    test('should edit an existing transaction', async ({ page }) => {
      // First add a transaction
      await page.click('[data-testid="calendar-tab"]');
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Edit the transaction
      await page.click('[data-testid="transaction-indicator"]');
      await page.click('[data-testid="edit-transaction-button"]');
      
      const updatedAmount = '8000';
      await page.fill('[data-testid="transaction-amount-input"]', updatedAmount);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Verify the update
      await page.click('[data-testid="transaction-indicator"]');
      await expect(page.locator('[data-testid="transaction-amount"]')).toHaveText(`¥${updatedAmount}`);
    });

    test('should delete a transaction', async ({ page }) => {
      // First add a transaction
      await page.click('[data-testid="calendar-tab"]');
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Delete the transaction
      await page.click('[data-testid="transaction-indicator"]');
      await page.click('[data-testid="delete-transaction-button"]');
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Verify transaction is gone
      await expect(page.locator('[data-testid="transaction-indicator"]')).not.toBeVisible();
    });
  });

  test.describe('Schedule Management Workflow', () => {
    test.beforeEach(async ({ page }) => {
      await addTestBank(page);
      await addTestCard(page);
    });

    test('should add a recurring schedule', async ({ page }) => {
      await page.click('[data-testid="schedule-tab"]');
      await page.click('[data-testid="add-schedule-button"]');
      
      await expect(page.locator('[data-testid="schedule-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="schedule-title-input"]', testData.schedule.title);
      await page.fill('[data-testid="schedule-amount-input"]', testData.schedule.amount.toString());
      await page.selectOption('[data-testid="schedule-card-select"]', testData.card.name);
      await page.selectOption('[data-testid="schedule-recurring-select"]', testData.schedule.recurringType);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await page.fill('[data-testid="schedule-date-input"]', nextMonth.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-schedule-button"]');
      
      // Verify schedule appears in list
      await expect(page.locator(`[data-testid="schedule-item-${testData.schedule.title}"]`)).toBeVisible();
    });

    test('should filter schedules by date range', async ({ page }) => {
      // Add a schedule first
      await page.click('[data-testid="schedule-tab"]');
      await page.click('[data-testid="add-schedule-button"]');
      
      await page.fill('[data-testid="schedule-title-input"]', testData.schedule.title);
      await page.fill('[data-testid="schedule-amount-input"]', testData.schedule.amount.toString());
      await page.selectOption('[data-testid="schedule-card-select"]', testData.card.name);
      await page.selectOption('[data-testid="schedule-recurring-select"]', testData.schedule.recurringType);
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await page.fill('[data-testid="schedule-date-input"]', nextMonth.toISOString().split('T')[0]);
      await page.click('[data-testid="save-schedule-button"]');
      
      // Apply date filter
      await page.click('[data-testid="schedule-filter-button"]');
      
      const currentMonth = new Date();
      await page.fill('[data-testid="filter-start-date"]', currentMonth.toISOString().split('T')[0]);
      
      const twoMonthsLater = new Date();
      twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
      await page.fill('[data-testid="filter-end-date"]', twoMonthsLater.toISOString().split('T')[0]);
      
      await page.click('[data-testid="apply-filter-button"]');
      
      // Verify filtered results
      await expect(page.locator(`[data-testid="schedule-item-${testData.schedule.title}"]`)).toBeVisible();
    });
  });

  test.describe('Calendar Integration', () => {
    test.beforeEach(async ({ page }) => {
      await addTestBank(page);
      await addTestCard(page);
    });

    test('should navigate between months', async ({ page }) => {
      await page.click('[data-testid="calendar-tab"]');
      
      // Get current month
      const currentMonth = await page.locator('[data-testid="current-month"]').textContent();
      
      // Navigate to next month
      await page.click('[data-testid="next-month-button"]');
      const nextMonth = await page.locator('[data-testid="current-month"]').textContent();
      
      expect(nextMonth).not.toBe(currentMonth);
      
      // Navigate back to previous month
      await page.click('[data-testid="prev-month-button"]');
      const backToCurrentMonth = await page.locator('[data-testid="current-month"]').textContent();
      
      expect(backToCurrentMonth).toBe(currentMonth);
    });

    test('should show day totals correctly', async ({ page }) => {
      await page.click('[data-testid="calendar-tab"]');
      
      // Add a transaction
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Check day total
      const dayTotal = page.locator(`[data-testid="day-total-${today.getDate()}"]`);
      await expect(dayTotal).toBeVisible();
      await expect(dayTotal).toContainText(testData.transaction.amount.toString());
    });

    test('should open day total modal with transaction details', async ({ page }) => {
      await page.click('[data-testid="calendar-tab"]');
      
      // Add a transaction
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Click on day total to open modal
      await page.click(`[data-testid="day-total-${today.getDate()}"]`);
      
      await expect(page.locator('[data-testid="day-total-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="modal-transaction-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="modal-transaction-item"]')).toContainText(testData.transaction.description);
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.click('[data-testid="calendar-tab"]');
      
      // Try to perform an action that requires network
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.click('[data-testid="save-transaction-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
    });

    test('should validate form inputs', async ({ page }) => {
      await page.click('[data-testid="calendar-tab"]');
      
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      
      // Try to save without required fields
      await page.click('[data-testid="save-transaction-button"]');
      
      await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="description-error"]')).toBeVisible();
    });

    test('should handle invalid amount inputs', async ({ page }) => {
      await addTestCard(page);
      
      await page.click('[data-testid="calendar-tab"]');
      
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      
      // Enter invalid amount
      await page.fill('[data-testid="transaction-amount-input"]', '-100');
      await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
      await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
      
      await page.click('[data-testid="save-transaction-button"]');
      
      await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('positive');
    });
  });

  test.describe('Performance & Load Testing', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await addTestBank(page);
      await addTestCard(page);
      
      // Navigate to calendar
      await page.click('[data-testid="calendar-tab"]');
      
      // Measure performance while adding multiple transactions
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const day = (i % 28) + 1; // Spread across the month
        const dateSelector = `[data-testid="calendar-day-${day}"]`;
        await page.click(dateSelector);
        
        await page.click('[data-testid="add-transaction-button"]');
        await page.fill('[data-testid="transaction-amount-input"]', (1000 + i * 100).toString());
        await page.fill('[data-testid="transaction-description-input"]', `取引 ${i + 1}`);
        await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
        await page.click('[data-testid="save-transaction-button"]');
        
        // Wait for transaction to be saved
        await page.waitForSelector('[data-testid="transaction-indicator"]', { timeout: 5000 });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (30 seconds for 20 transactions)
      expect(duration).toBeLessThan(30000);
      
      // Verify all transactions are visible
      const transactionCount = await page.locator('[data-testid="transaction-indicator"]').count();
      expect(transactionCount).toBe(20);
    });

    test('should maintain responsiveness during heavy operations', async ({ page }) => {
      await addTestBank(page);
      await addTestCard(page);
      
      await page.click('[data-testid="calendar-tab"]');
      
      // Start a heavy operation
      const today = new Date();
      const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
      await page.click(dateSelector);
      
      await page.click('[data-testid="add-transaction-button"]');
      
      // UI should remain responsive
      const modalVisible = await page.locator('[data-testid="transaction-modal"]').isVisible();
      expect(modalVisible).toBe(true);
      
      // Should be able to interact with form
      await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
      const inputValue = await page.locator('[data-testid="transaction-amount-input"]').inputValue();
      expect(inputValue).toBe(testData.transaction.amount.toString());
    });
  });
});

// PWA-specific tests
test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('should have proper PWA manifest', async ({ page }) => {
    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();
    
    // Verify manifest content
    const manifestHref = await manifestLink.getAttribute('href');
    expect(manifestHref).toBeTruthy();
    
    const manifestResponse = await page.goto(manifestHref!);
    expect(manifestResponse?.status()).toBe(200);
    
    const manifestContent = await manifestResponse?.json();
    expect(manifestContent.name).toBeTruthy();
    expect(manifestContent.short_name).toBeTruthy();
    expect(manifestContent.icons).toBeTruthy();
    expect(manifestContent.start_url).toBeTruthy();
    expect(manifestContent.display).toBeTruthy();
  });

  test('should register service worker', async ({ page }) => {
    // Wait for service worker registration
    await page.waitForFunction(() => 'serviceWorker' in navigator);
    
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('should work in offline mode', async ({ page, context }) => {
    await addTestBank(page);
    await addTestCard(page);
    
    // Add some data while online
    await page.click('[data-testid="calendar-tab"]');
    const today = new Date();
    const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
    await page.click(dateSelector);
    
    await page.click('[data-testid="add-transaction-button"]');
    await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
    await page.fill('[data-testid="transaction-description-input"]', testData.transaction.description);
    await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
    await page.click('[data-testid="save-transaction-button"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // App should still work with cached data
    await expect(page.locator('[data-testid="app-loaded"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Previously saved transaction should still be visible
    await expect(page.locator('[data-testid="transaction-indicator"]')).toBeVisible();
  });

  test('should sync data when coming back online', async ({ page, context }) => {
    await addTestBank(page);
    await addTestCard(page);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to add data while offline
    await page.click('[data-testid="calendar-tab"]');
    const today = new Date();
    const dateSelector = `[data-testid="calendar-day-${today.getDate()}"]`;
    await page.click(dateSelector);
    
    await page.click('[data-testid="add-transaction-button"]');
    await page.fill('[data-testid="transaction-amount-input"]', testData.transaction.amount.toString());
    await page.fill('[data-testid="transaction-description-input"]', 'オフライン取引');
    await page.selectOption('[data-testid="transaction-card-select"]', testData.card.name);
    await page.click('[data-testid="save-transaction-button"]');
    
    // Should show pending sync indicator
    await expect(page.locator('[data-testid="pending-sync-indicator"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should show sync in progress
    await expect(page.locator('[data-testid="syncing-indicator"]')).toBeVisible();
    
    // Should complete sync
    await expect(page.locator('[data-testid="sync-complete-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-sync-indicator"]')).not.toBeVisible();
  });
});

// Cross-browser compatibility tests
test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('should work correctly across different browsers', async ({ page, browserName }) => {
    // Test basic functionality in all browsers
    await expect(page.locator('[data-testid="app-loaded"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    
    // Test navigation
    await page.click('[data-testid="schedule-tab"]');
    await expect(page.locator('[data-testid="schedule-view"]')).toBeVisible();
    
    await page.click('[data-testid="settings-tab"]');
    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
    
    // Test back to calendar
    await page.click('[data-testid="calendar-tab"]');
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible();
    
    console.log(`✅ Basic functionality verified in ${browserName}`);
  });

  test('should handle browser-specific features', async ({ page, browserName }) => {
    // Test local storage support
    const hasLocalStorage = await page.evaluate(() => {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    });
    
    expect(hasLocalStorage).toBe(true);
    
    // Test IndexedDB support
    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });
    
    expect(hasIndexedDB).toBe(true);
    
    console.log(`✅ Browser features verified in ${browserName}`);
  });
});

// Accessibility tests
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.keyboard.press('Tab');
    
    // Should focus on first interactive element
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();
    
    // Should be able to navigate through all interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = await page.evaluate(() => document.activeElement?.tagName);
      expect(currentFocus).toBeTruthy();
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for ARIA labels on main navigation
    const navButtons = page.locator('[role="button"]');
    const count = await navButtons.count();
    
    for (let i = 0; i < count; i++) {
      const button = navButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support screen readers', async ({ page }) => {
    // Check for semantic HTML structure
    await expect(page.locator('main')).toBeAttached();
    await expect(page.locator('nav')).toBeAttached();
    
    // Check for heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for proper button roles
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});