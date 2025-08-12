# E2E Test Plan for Bank Schedule UI Improvement - Playwright MCP

## Overview
This document provides step-by-step E2E testing instructions using Playwright MCP tools to verify the complete implementation of the cross-table format bank payment schedule.

## Prerequisites
- Development server running on `http://localhost:3000`
- Test data loaded (banks, cards, transactions)
- Playwright MCP tools available

## Test Suite 1: Basic Cross-Table Display

### Test 1.1: Navigate to Schedule Page
```
Step 1: Navigate to application
- Use: mcp__playwright__browser_navigate
- URL: "http://localhost:3000/schedule"
- Expected: Page loads successfully

Step 2: Verify page structure
- Use: mcp__playwright__browser_snapshot
- Verify: Title shows "銀行別引落予定表"
- Verify: Month selector is visible
- Verify: Cross-table format is displayed (not accordion)
```

### Test 1.2: Verify Cross-Table Format
```
Step 1: Take initial snapshot
- Use: mcp__playwright__browser_snapshot
- Verify: Table has following columns:
  - 引落予定日
  - 曜日
  - 引落名
  - 締日
  - 引落日
  - Dynamic bank columns
  - 引落合計

Step 2: Verify dynamic bank columns
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const headers = document.querySelectorAll('th');
    const bankHeaders = Array.from(headers).filter(h => 
      h.textContent && !['引落予定日', '曜日', '引落名', '締日', '引落日', '引落合計'].includes(h.textContent.trim())
    );
    return bankHeaders.map(h => h.textContent);
  }
- Expected: Returns array of bank names
```

### Test 1.3: Verify Data Display
```
Step 1: Check payment rows
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const rows = document.querySelectorAll('tbody tr');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        date: cells[0]?.textContent?.trim(),
        dayOfWeek: cells[1]?.textContent?.trim(),
        paymentName: cells[2]?.textContent?.trim(),
        closingDay: cells[3]?.textContent?.trim(),
        paymentDay: cells[4]?.textContent?.trim()
      };
    });
  }
- Expected: Returns array of payment data with correct formatting

Step 2: Verify totals row
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const totalRow = document.querySelector('tfoot tr');
    const totalCells = totalRow?.querySelectorAll('td');
    return {
      label: totalCells?.[0]?.textContent?.trim(),
      totalAmount: totalCells?.[totalCells.length - 1]?.textContent?.trim()
    };
  }
- Expected: Returns { label: "合計", totalAmount: "¥X,XXX" }
```

## Test Suite 2: Transaction Detail Modal

### Test 2.1: Modal Opens on Amount Click
```
Step 1: Click on amount cell
- Use: mcp__playwright__browser_click
- Element: "金額セル"
- Ref: First amount cell with data
- Expected: Modal opens

Step 2: Verify modal content
- Use: mcp__playwright__browser_snapshot
- Verify: Modal title shows transaction details
- Verify: Payment date and bank name displayed
- Verify: Transaction list shown in table format
```

### Test 2.2: Modal Data Accuracy
```
Step 1: Verify modal header information
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return null;
    
    const paymentDate = modal.querySelector('[data-testid="payment-date"]')?.textContent;
    const bankName = modal.querySelector('[data-testid="bank-name"]')?.textContent;
    const totalAmount = modal.querySelector('[data-testid="total-amount"]')?.textContent;
    
    return { paymentDate, bankName, totalAmount };
  }
- Expected: Returns correct payment information

Step 2: Verify transaction table
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const modal = document.querySelector('[role="dialog"]');
    const rows = modal?.querySelectorAll('tbody tr');
    return Array.from(rows || []).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        date: cells[0]?.textContent?.trim(),
        store: cells[1]?.textContent?.trim(),
        usage: cells[2]?.textContent?.trim(),
        paymentType: cells[3]?.textContent?.trim(),
        amount: cells[4]?.textContent?.trim()
      };
    });
  }
- Expected: Returns transaction details array
```

### Test 2.3: Modal Close Functionality
```
Step 1: Close modal with close button
- Use: mcp__playwright__browser_click
- Element: "閉じるボタン"
- Ref: Modal close button
- Expected: Modal closes

Step 2: Verify modal is closed
- Use: mcp__playwright__browser_evaluate
- Function: () => document.querySelector('[role="dialog"]') === null
- Expected: Returns true
```

## Test Suite 3: Filtering Functionality

### Test 3.1: Filter Panel Expansion
```
Step 1: Click filter toggle
- Use: mcp__playwright__browser_click
- Element: "フィルターボタン"
- Ref: Filter toggle button
- Expected: Filter panel expands

Step 2: Verify filter options
- Use: mcp__playwright__browser_snapshot
- Verify: Date range inputs visible
- Verify: Amount range inputs visible
- Verify: Search input visible
- Verify: Bank checkboxes visible
- Verify: Payment type checkboxes visible
```

### Test 3.2: Date Range Filtering
```
Step 1: Set start date
- Use: mcp__playwright__browser_type
- Element: "開始日入力"
- Ref: Start date input
- Text: "2025-09-01"

Step 2: Set end date
- Use: mcp__playwright__browser_type
- Element: "終了日入力" 
- Ref: End date input
- Text: "2025-09-15"

Step 3: Verify filtered results
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const rows = document.querySelectorAll('tbody tr');
    return Array.from(rows).map(row => 
      row.querySelector('td')?.textContent?.trim()
    ).filter(date => {
      if (!date) return false;
      const dateObj = new Date(date.replace(/\//g, '-'));
      return dateObj >= new Date('2025-09-01') && dateObj <= new Date('2025-09-15');
    });
  }
- Expected: Only returns dates within range
```

### Test 3.3: Search Text Filtering
```
Step 1: Enter search text
- Use: mcp__playwright__browser_type
- Element: "検索入力欄"
- Ref: Search input field
- Text: "Amazon"

Step 2: Verify search results
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const rows = document.querySelectorAll('tbody tr');
    return Array.from(rows).length;
  }
- Expected: Returns reduced number of rows

Step 3: Clear search
- Use: mcp__playwright__browser_click
- Element: "クリアボタン"
- Ref: Clear filters button

Step 4: Verify all data restored
- Use: mcp__playwright__browser_evaluate
- Function: () => document.querySelectorAll('tbody tr').length
- Expected: Returns original row count
```

### Test 3.4: Bank Selection Filtering
```
Step 1: Uncheck all banks except one
- Use: mcp__playwright__browser_click
- Element: "銀行チェックボックス"
- Ref: First bank checkbox
- Expected: Only transactions for that bank shown

Step 2: Verify filter applied
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const bankColumns = document.querySelectorAll('tbody tr td:nth-child(6)'); // Assuming 6th column is first bank
    return Array.from(bankColumns).filter(cell => 
      cell.textContent && cell.textContent.trim() !== '-'
    ).length;
  }
- Expected: Only selected bank has amounts
```

## Test Suite 4: Responsive Design

### Test 4.1: Desktop Layout
```
Step 1: Set desktop size
- Use: mcp__playwright__browser_resize
- Width: 1920
- Height: 1080

Step 2: Verify desktop layout
- Use: mcp__playwright__browser_snapshot
- Verify: Cross-table format displayed
- Verify: All columns visible
- Verify: No horizontal scrolling needed for content
```

### Test 4.2: Tablet Layout
```
Step 1: Set tablet size
- Use: mcp__playwright__browser_resize  
- Width: 768
- Height: 1024

Step 2: Verify tablet layout
- Use: mcp__playwright__browser_snapshot
- Verify: Cross-table format still displayed
- Verify: Horizontal scrolling available if needed
- Verify: Touch-friendly interface
```

### Test 4.3: Mobile Layout
```
Step 1: Set mobile size
- Use: mcp__playwright__browser_resize
- Width: 375
- Height: 667

Step 2: Verify mobile layout switches to cards
- Use: mcp__playwright__browser_snapshot
- Verify: Card format displayed instead of table
- Verify: Cards show same information as table rows
- Verify: Touch-friendly interaction
```

### Test 4.4: Mobile Card Interaction
```
Step 1: Click on mobile card
- Use: mcp__playwright__browser_click
- Element: "支払いカード"
- Ref: First payment card

Step 2: Verify modal opens on mobile
- Use: mcp__playwright__browser_snapshot
- Verify: Modal adapts to mobile screen
- Verify: All content accessible on mobile
```

## Test Suite 5: Sorting Functionality

### Test 5.1: Date Sorting
```
Step 1: Click date sort button
- Use: mcp__playwright__browser_click
- Element: "引落日ソートボタン"
- Ref: Date sort button

Step 2: Verify ascending sort
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const dates = Array.from(document.querySelectorAll('tbody tr td:first-child'))
      .map(cell => cell.textContent?.trim())
      .filter(Boolean);
    const sortedDates = [...dates].sort();
    return JSON.stringify(dates) === JSON.stringify(sortedDates);
  }
- Expected: Returns true

Step 3: Click again for descending sort
- Use: mcp__playwright__browser_click
- Element: "引落日ソートボタン"
- Ref: Date sort button

Step 4: Verify descending sort
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const dates = Array.from(document.querySelectorAll('tbody tr td:first-child'))
      .map(cell => cell.textContent?.trim())
      .filter(Boolean);
    const sortedDates = [...dates].sort().reverse();
    return JSON.stringify(dates) === JSON.stringify(sortedDates);
  }
- Expected: Returns true
```

### Test 5.2: Amount Sorting
```
Step 1: Click amount sort button
- Use: mcp__playwright__browser_click
- Element: "金額ソートボタン"
- Ref: Amount sort button

Step 2: Verify amount sorting
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const amounts = Array.from(document.querySelectorAll('tbody tr td:last-child'))
      .map(cell => {
        const text = cell.textContent?.trim() || '';
        return parseInt(text.replace(/[^\d]/g, '')) || 0;
      });
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    return JSON.stringify(amounts) === JSON.stringify(sortedAmounts);
  }
- Expected: Returns true
```

## Test Suite 6: Export Functionality

### Test 6.1: CSV Export
```
Step 1: Click CSV export button
- Use: mcp__playwright__browser_click
- Element: "CSV出力ボタン"
- Ref: CSV export button

Step 2: Verify download initiated
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    // Check if download was triggered (this is browser-dependent)
    return true; // Manual verification required
  }
- Expected: CSV file download starts
```

### Test 6.2: Print Functionality  
```
Step 1: Click print button
- Use: mcp__playwright__browser_click
- Element: "印刷ボタン"
- Ref: Print button

Step 2: Verify print dialog
- Expected: Browser print dialog opens (manual verification)
```

## Test Suite 7: Error Handling

### Test 7.1: No Data State
```
Step 1: Navigate to month with no data
- Use: mcp__playwright__browser_navigate
- URL: "http://localhost:3000/schedule?year=2030&month=1"

Step 2: Verify empty state message
- Use: mcp__playwright__browser_snapshot
- Verify: "引落予定がありません" message displayed
- Verify: Navigation buttons available
```

### Test 7.2: Console Error Check
```
Step 1: Check for console errors
- Use: mcp__playwright__browser_console_messages
- Expected: No error messages in console

Step 2: Verify no network errors
- Use: mcp__playwright__browser_network_requests
- Expected: All requests successful (200 status)
```

## Test Suite 8: Performance Testing

### Test 8.1: Large Dataset Performance
```
Step 1: Load page with large dataset
- Use: mcp__playwright__browser_navigate
- URL: "http://localhost:3000/schedule?testData=large"

Step 2: Measure load time
- Use: mcp__playwright__browser_evaluate
- Function: () => performance.now()
- Expected: Page loads within reasonable time (< 2 seconds)

Step 3: Test scrolling performance
- Use: mcp__playwright__browser_evaluate
- Function: () => {
    const table = document.querySelector('table');
    table?.scrollTo(0, 1000);
    return performance.now();
  }
- Expected: Smooth scrolling performance
```

## Success Criteria Verification

After completing all test suites, verify:

- ✅ Cross-table format displays correctly (日付×銀行マトリックス)
- ✅ Dynamic bank columns generate based on data
- ✅ Amount cells are clickable and show transaction details
- ✅ Filtering works for all criteria (date, amount, search, bank, payment type)
- ✅ Mobile responsive design switches to card format
- ✅ Sorting functionality works for all sortable columns
- ✅ Export (CSV) and print functionality work
- ✅ No console errors or network issues
- ✅ Performance is acceptable for large datasets
- ✅ Error states are handled gracefully

## Notes for Manual Verification

Some aspects require manual verification:
1. File downloads (CSV export)
2. Print dialog functionality
3. Touch interactions on actual mobile devices
4. Accessibility with screen readers
5. Keyboard navigation flow

## Cleanup

After testing:
1. Clear test data if applicable
2. Reset browser state
3. Document any issues found
4. Update test cases based on findings