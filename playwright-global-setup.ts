/**
 * Playwright Global Setup
 * Phase 3 comprehensive E2E testing setup
 * Prepares test environment and data
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');
  
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  // Start a browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Verify the app is loaded
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 30000 });
    console.log('✅ Application is ready');
    
    // Setup test database state
    console.log('🗄️ Setting up test database...');
    await setupTestDatabase(page);
    
    // Verify PWA manifest and service worker
    console.log('🔧 Verifying PWA functionality...');
    await verifyPWASetup(page);
    
    // Create test data directory
    const testDataDir = path.join(process.cwd(), 'test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Generate test screenshots for visual regression testing
    console.log('📸 Generating baseline screenshots...');
    await generateBaselineScreenshots(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestDatabase(page: any) {
  // Clear any existing data
  await page.evaluate(async () => {
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    
    // Clear IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      return new Promise<void>((resolve) => {
        const deleteReq = window.indexedDB.deleteDatabase('BankPaymentScheduleDB');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve(); // Continue even if deletion fails
        deleteReq.onblocked = () => resolve(); // Continue even if blocked
      });
    }
    
    return Promise.resolve();
  });
  
  // Setup test data
  await page.evaluate(() => {
    // Initialize test configuration
    const testConfig = {
      isTestEnvironment: true,
      testDataVersion: '1.0.0',
      setupTimestamp: new Date().toISOString(),
    };
    
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('test-config', JSON.stringify(testConfig));
    }
  });
  
  return Promise.resolve();
}

async function verifyPWASetup(page: any) {
  // Check manifest
  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
  if (!manifestLink) {
    throw new Error('PWA manifest not found');
  }
  
  // Verify manifest content
  const manifestResponse = await page.goto(manifestLink);
  if (manifestResponse.status() !== 200) {
    throw new Error('PWA manifest not accessible');
  }
  
  const manifestContent = await manifestResponse.json();
  if (!manifestContent.name || !manifestContent.start_url) {
    throw new Error('PWA manifest is invalid');
  }
  
  // Go back to the main page
  await page.goto(page.url().split('/manifest.json')[0]);
  
  // Check service worker registration
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      return false;
    }
  });
  
  if (!swRegistered) {
    console.warn('⚠️ Service worker not registered (this may be expected in test environment)');
  }
}

async function generateBaselineScreenshots(page: any) {
  const screenshotDir = path.join(process.cwd(), 'test-data', 'screenshots', 'baseline');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  // Calendar view
  await page.goto('/');
  await page.waitForSelector('[data-testid="calendar-view"]');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'calendar-view.png'),
    fullPage: true 
  });
  
  // Schedule view
  await page.click('[data-testid="schedule-tab"]');
  await page.waitForSelector('[data-testid="schedule-view"]');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'schedule-view.png'),
    fullPage: true 
  });
  
  // Settings view
  await page.click('[data-testid="settings-tab"]');
  await page.waitForSelector('[data-testid="settings-view"]');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'settings-view.png'),
    fullPage: true 
  });
  
  // Mobile views
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/');
  await page.waitForSelector('[data-testid="calendar-view"]');
  await page.screenshot({ 
    path: path.join(screenshotDir, 'mobile-calendar-view.png'),
    fullPage: true 
  });
}

export default globalSetup;