/**
 * Playwright Global Teardown
 * Phase 3 comprehensive E2E testing cleanup
 * Cleans up test environment and generates reports
 */

import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  try {
    // Generate test summary report
    await generateTestSummaryReport();
    
    // Clean up test data
    await cleanupTestData();
    
    // Archive test results if in CI
    if (process.env.CI) {
      await archiveTestResults();
    }
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error as it shouldn't fail the test suite
  }
}

async function generateTestSummaryReport() {
  console.log('📊 Generating test summary report...');
  
  const reportDir = path.join(process.cwd(), 'playwright-report');
  const summaryPath = path.join(reportDir, 'test-summary.json');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const summary = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    ci: !!process.env.CI,
    nodeVersion: process.version,
    platform: process.platform,
    testResultsGenerated: true,
    reportPaths: {
      html: './playwright-report/index.html',
      json: './playwright-results.json',
      junit: './playwright-results.xml',
    },
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Test summary written to: ${summaryPath}`);
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up temporary test data...');
  
  // Clean up temporary files
  const tempDir = path.join(process.cwd(), 'temp-test-data');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Clean up old test results (keep last 10 runs)
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (fs.existsSync(testResultsDir)) {
    const files = fs.readdirSync(testResultsDir)
      .map(file => ({
        name: file,
        path: path.join(testResultsDir, file),
        stat: fs.statSync(path.join(testResultsDir, file))
      }))
      .filter(file => file.stat.isDirectory())
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
    
    // Remove old result directories (keep last 10)
    if (files.length > 10) {
      const filesToRemove = files.slice(10);
      filesToRemove.forEach(file => {
        fs.rmSync(file.path, { recursive: true, force: true });
      });
      console.log(`🗑️ Removed ${filesToRemove.length} old test result directories`);
    }
  }
}

async function archiveTestResults() {
  console.log('📦 Archiving test results for CI...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(process.cwd(), 'test-archives', timestamp);
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  // Copy important files to archive
  const filesToArchive = [
    'playwright-results.json',
    'playwright-results.xml',
    'playwright-report',
    'test-results',
  ];
  
  filesToArchive.forEach(file => {
    const sourcePath = path.join(process.cwd(), file);
    const destPath = path.join(archiveDir, file);
    
    if (fs.existsSync(sourcePath)) {
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  });
  
  // Create archive manifest
  const manifest = {
    timestamp,
    ciRun: process.env.CI,
    commitSha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
    branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME,
    files: filesToArchive.filter(file => 
      fs.existsSync(path.join(process.cwd(), file))
    ),
  };
  
  fs.writeFileSync(
    path.join(archiveDir, 'manifest.json'), 
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`📦 Test results archived to: ${archiveDir}`);
}

export default globalTeardown;