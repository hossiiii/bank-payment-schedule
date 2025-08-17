#!/usr/bin/env node

/**
 * Comprehensive Test Execution Script
 * Phase 3 testing suite orchestration
 * Runs all tests and generates quality reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testSuites: {
    unit: {
      name: 'Unit Tests',
      command: 'npm run test:coverage',
      required: true,
      timeout: 300000, // 5 minutes
    },
    integration: {
      name: 'Integration Tests',
      command: 'npm run test:integration',
      required: true,
      timeout: 600000, // 10 minutes
    },
    e2e: {
      name: 'E2E Tests',
      command: 'npm run test:e2e',
      required: true,
      timeout: 1800000, // 30 minutes
    },
    performance: {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      required: false,
      timeout: 900000, // 15 minutes
    },
  },
  reports: {
    outputDir: './test-reports',
    summaryFile: 'test-execution-summary.json',
    htmlReport: 'comprehensive-test-report.html',
  },
  qualityGates: {
    minCoverage: 85,
    maxFailures: 0,
    maxPerformanceRegression: 20, // percentage
  },
};

// Test execution state
let testResults = {
  startTime: new Date(),
  endTime: null,
  duration: 0,
  suites: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
  coverage: {},
  qualityGates: {
    passed: false,
    failures: [],
  },
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🐛',
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function createReportsDirectory() {
  if (!fs.existsSync(config.reports.outputDir)) {
    fs.mkdirSync(config.reports.outputDir, { recursive: true });
  }
}

async function runTestSuite(suiteKey, suiteConfig) {
  log(`Starting ${suiteConfig.name}...`, 'info');
  
  const startTime = Date.now();
  const result = {
    name: suiteConfig.name,
    command: suiteConfig.command,
    startTime: new Date(startTime),
    endTime: null,
    duration: 0,
    exitCode: null,
    stdout: '',
    stderr: '',
    passed: false,
    required: suiteConfig.required,
  };
  
  try {
    const output = execSync(suiteConfig.command, {
      timeout: suiteConfig.timeout,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    
    result.stdout = output;
    result.exitCode = 0;
    result.passed = true;
    
    log(`${suiteConfig.name} completed successfully`, 'success');
    
  } catch (error) {
    result.exitCode = error.status || 1;
    result.stderr = error.stderr || error.message;
    result.stdout = error.stdout || '';
    result.passed = false;
    
    log(`${suiteConfig.name} failed with exit code ${result.exitCode}`, 'error');
    
    if (suiteConfig.required) {
      log(`Required test suite failed: ${suiteConfig.name}`, 'error');
    }
  }
  
  const endTime = Date.now();
  result.endTime = new Date(endTime);
  result.duration = endTime - startTime;
  
  testResults.suites[suiteKey] = result;
  
  return result;
}

function parseCoverageReport() {
  const coverageFile = './coverage/coverage-summary.json';
  
  if (fs.existsSync(coverageFile)) {
    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      
      testResults.coverage = {
        statements: coverage.total.statements.pct,
        branches: coverage.total.branches.pct,
        functions: coverage.total.functions.pct,
        lines: coverage.total.lines.pct,
      };
      
      log(`Coverage - Statements: ${coverage.total.statements.pct}%, Branches: ${coverage.total.branches.pct}%, Functions: ${coverage.total.functions.pct}%, Lines: ${coverage.total.lines.pct}%`, 'info');
      
    } catch (error) {
      log(`Failed to parse coverage report: ${error.message}`, 'warning');
    }
  }
}

function parseJestResults() {
  const jestResultsFile = './jest-results.json';
  
  if (fs.existsSync(jestResultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(jestResultsFile, 'utf8'));
      
      testResults.summary = {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
      };
      
    } catch (error) {
      log(`Failed to parse Jest results: ${error.message}`, 'warning');
    }
  }
}

function parsePlaywrightResults() {
  const playwrightResultsFile = './playwright-results.json';
  
  if (fs.existsSync(playwrightResultsFile)) {
    try {
      const results = JSON.parse(fs.readFileSync(playwrightResultsFile, 'utf8'));
      
      if (results.suites) {
        const e2eStats = results.suites.reduce((stats, suite) => {
          suite.specs.forEach(spec => {
            spec.tests.forEach(test => {
              stats.total++;
              if (test.results.some(r => r.status === 'passed')) {
                stats.passed++;
              } else if (test.results.some(r => r.status === 'failed')) {
                stats.failed++;
              } else {
                stats.skipped++;
              }
            });
          });
          return stats;
        }, { total: 0, passed: 0, failed: 0, skipped: 0 });
        
        // Merge with existing summary
        testResults.summary.total += e2eStats.total;
        testResults.summary.passed += e2eStats.passed;
        testResults.summary.failed += e2eStats.failed;
        testResults.summary.skipped += e2eStats.skipped;
      }
      
    } catch (error) {
      log(`Failed to parse Playwright results: ${error.message}`, 'warning');
    }
  }
}

function checkQualityGates() {
  const gates = testResults.qualityGates;
  gates.failures = [];
  
  // Check coverage
  if (testResults.coverage.statements < config.qualityGates.minCoverage) {
    gates.failures.push(`Statement coverage ${testResults.coverage.statements}% below minimum ${config.qualityGates.minCoverage}%`);
  }
  
  if (testResults.coverage.branches < config.qualityGates.minCoverage) {
    gates.failures.push(`Branch coverage ${testResults.coverage.branches}% below minimum ${config.qualityGates.minCoverage}%`);
  }
  
  // Check test failures
  if (testResults.summary.failed > config.qualityGates.maxFailures) {
    gates.failures.push(`${testResults.summary.failed} test failures exceed maximum ${config.qualityGates.maxFailures}`);
  }
  
  // Check required test suites
  Object.entries(testResults.suites).forEach(([key, result]) => {
    if (result.required && !result.passed) {
      gates.failures.push(`Required test suite failed: ${result.name}`);
    }
  });
  
  gates.passed = gates.failures.length === 0;
  
  if (gates.passed) {
    log('All quality gates passed!', 'success');
  } else {
    log('Quality gate failures:', 'error');
    gates.failures.forEach(failure => log(`  - ${failure}`, 'error'));
  }
}

function generateSummaryReport() {
  testResults.endTime = new Date();
  testResults.duration = testResults.endTime.getTime() - testResults.startTime.getTime();
  
  const summaryPath = path.join(config.reports.outputDir, config.reports.summaryFile);
  fs.writeFileSync(summaryPath, JSON.stringify(testResults, null, 2));
  
  log(`Test summary saved to: ${summaryPath}`, 'info');
}

function generateHtmlReport() {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .metric.success { border-color: #4caf50; }
        .metric.warning { border-color: #ff9800; }
        .metric.error { border-color: #f44336; }
        .suite { background: #fff; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd; }
        .suite-content { padding: 15px; }
        .passed { color: #4caf50; }
        .failed { color: #f44336; }
        .quality-gates { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .quality-gates.passed { border-color: #4caf50; }
        .quality-gates.failed { border-color: #f44336; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Test Report</h1>
        <p><strong>Execution Time:</strong> ${testResults.startTime.toISOString()}</p>
        <p><strong>Duration:</strong> ${Math.round(testResults.duration / 1000)}s</p>
        <p><strong>Quality Gates:</strong> <span class="${testResults.qualityGates.passed ? 'passed' : 'failed'}">${testResults.qualityGates.passed ? 'PASSED' : 'FAILED'}</span></p>
    </div>

    <div class="summary">
        <div class="metric ${testResults.summary.failed > 0 ? 'error' : 'success'}">
            <h3>Tests</h3>
            <p>${testResults.summary.passed}/${testResults.summary.total} passed</p>
        </div>
        <div class="metric ${testResults.coverage.statements >= config.qualityGates.minCoverage ? 'success' : 'warning'}">
            <h3>Coverage</h3>
            <p>${testResults.coverage.statements || 0}% statements</p>
        </div>
        <div class="metric">
            <h3>Suites</h3>
            <p>${Object.values(testResults.suites).filter(s => s.passed).length}/${Object.keys(testResults.suites).length} passed</p>
        </div>
    </div>

    <h2>Test Suites</h2>
    ${Object.entries(testResults.suites).map(([key, suite]) => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suite.name} <span class="${suite.passed ? 'passed' : 'failed'}">${suite.passed ? 'PASSED' : 'FAILED'}</span></h3>
                <p><strong>Duration:</strong> ${Math.round(suite.duration / 1000)}s | <strong>Exit Code:</strong> ${suite.exitCode}</p>
            </div>
            <div class="suite-content">
                <p><strong>Command:</strong> <code>${suite.command}</code></p>
                ${suite.stderr ? `<p><strong>Error Output:</strong></p><pre>${suite.stderr}</pre>` : ''}
            </div>
        </div>
    `).join('')}

    <div class="quality-gates ${testResults.qualityGates.passed ? 'passed' : 'failed'}">
        <h2>Quality Gates</h2>
        ${testResults.qualityGates.passed ? 
            '<p class="passed">✅ All quality gates passed!</p>' : 
            `<div>
                <p class="failed">❌ Quality gate failures:</p>
                <ul>
                    ${testResults.qualityGates.failures.map(failure => `<li>${failure}</li>`).join('')}
                </ul>
            </div>`
        }
    </div>

    <div class="quality-gates">
        <h2>Coverage Details</h2>
        <ul>
            <li>Statements: ${testResults.coverage.statements || 0}%</li>
            <li>Branches: ${testResults.coverage.branches || 0}%</li>
            <li>Functions: ${testResults.coverage.functions || 0}%</li>
            <li>Lines: ${testResults.coverage.lines || 0}%</li>
        </ul>
    </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(config.reports.outputDir, config.reports.htmlReport);
  fs.writeFileSync(htmlPath, htmlTemplate);
  
  log(`HTML report generated: ${htmlPath}`, 'success');
}

// Main execution function
async function main() {
  log('Starting comprehensive test execution...', 'info');
  log(`Test suites: ${Object.keys(config.testSuites).join(', ')}`, 'info');
  
  // Create reports directory
  createReportsDirectory();
  
  // Run test suites sequentially
  for (const [suiteKey, suiteConfig] of Object.entries(config.testSuites)) {
    await runTestSuite(suiteKey, suiteConfig);
  }
  
  // Parse test results
  parseCoverageReport();
  parseJestResults();
  parsePlaywrightResults();
  
  // Check quality gates
  checkQualityGates();
  
  // Generate reports
  generateSummaryReport();
  generateHtmlReport();
  
  // Final summary
  log(`Test execution completed in ${Math.round(testResults.duration / 1000)}s`, 'info');
  log(`Results: ${testResults.summary.passed}/${testResults.summary.total} tests passed`, testResults.summary.failed > 0 ? 'warning' : 'success');
  log(`Quality gates: ${testResults.qualityGates.passed ? 'PASSED' : 'FAILED'}`, testResults.qualityGates.passed ? 'success' : 'error');
  
  // Exit with appropriate code
  const hasRequiredFailures = Object.values(testResults.suites).some(suite => suite.required && !suite.passed);
  const exitCode = (hasRequiredFailures || !testResults.qualityGates.passed) ? 1 : 0;
  
  process.exit(exitCode);
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Comprehensive Test Execution Script

Usage: node run-comprehensive-tests.js [options]

Options:
  --help, -h        Show this help message
  --unit-only       Run only unit tests
  --e2e-only        Run only E2E tests
  --no-performance  Skip performance tests
  --fast            Run with reduced iterations for faster execution

Examples:
  node run-comprehensive-tests.js                    # Run all tests
  node run-comprehensive-tests.js --unit-only        # Unit tests only
  node run-comprehensive-tests.js --no-performance   # Skip performance tests
  `);
  process.exit(0);
}

// Modify config based on CLI arguments
if (args.includes('--unit-only')) {
  config.testSuites = { unit: config.testSuites.unit };
}

if (args.includes('--e2e-only')) {
  config.testSuites = { e2e: config.testSuites.e2e };
}

if (args.includes('--no-performance')) {
  delete config.testSuites.performance;
}

if (args.includes('--fast')) {
  // Reduce timeouts for faster execution
  Object.values(config.testSuites).forEach(suite => {
    suite.timeout = Math.min(suite.timeout, 120000); // Max 2 minutes
  });
}

// Run the tests
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});