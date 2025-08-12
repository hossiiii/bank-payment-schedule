/**
 * Browser console debugging script for bank withdrawal functionality
 * 
 * Instructions:
 * 1. Open http://localhost:3001 in your browser
 * 2. Open browser developer tools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Follow the instructions that appear in console
 */

console.log("🔧 Bank Payment Schedule Debug Helper");
console.log("=====================================");

// Helper function to check IndexedDB
async function checkIndexedDB() {
    console.log("🔍 Checking IndexedDB...");
    
    return new Promise((resolve) => {
        const request = indexedDB.open('bank-payment-schedule');
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            console.log("✅ Database opened:", db.name, "version:", db.version);
            console.log("📊 Object stores:", Array.from(db.objectStoreNames));
            
            // Check banks
            const transaction = db.transaction(['banks'], 'readonly');
            const bankStore = transaction.objectStore('banks');
            const bankRequest = bankStore.getAll();
            
            bankRequest.onsuccess = function() {
                const banks = bankRequest.result;
                console.log("🏦 Banks in database:", banks.length);
                banks.forEach(bank => {
                    console.log("  -", bank.name, "(ID:", bank.id + ")");
                });
                
                // Check transactions
                const txnTransaction = db.transaction(['transactions'], 'readonly');
                const txnStore = txnTransaction.objectStore('transactions');
                const txnRequest = txnStore.getAll();
                
                txnRequest.onsuccess = function() {
                    const transactions = txnRequest.result;
                    console.log("💳 Transactions in database:", transactions.length);
                    transactions.forEach(txn => {
                        console.log("  -", txn.storeName || 'No store', 
                                  "¥" + txn.amount, 
                                  txn.paymentType,
                                  txn.bankId ? "(Bank ID: " + txn.bankId + ")" : "");
                    });
                    resolve({ banks, transactions });
                };
            };
        };
        
        request.onerror = function() {
            console.error("❌ Failed to open database");
            resolve({ banks: [], transactions: [] });
        };
    });
}

// Helper function to simulate the test steps
function simulateTestSteps() {
    console.log("\n🎯 Manual Test Steps:");
    console.log("1. Go to: " + window.location.origin + "/settings");
    console.log("2. Click '銀行を追加' button");
    console.log("3. Enter 'テスト銀行' and save");
    console.log("4. Go back to: " + window.location.origin);
    console.log("5. Click today's date");
    console.log("6. Select '銀行引落' and 'テスト銀行'");
    console.log("7. Enter amount 1000 and store 'テスト店舗'");
    console.log("8. Save transaction");
    console.log("9. Go to: " + window.location.origin + "/schedule");
    console.log("10. Check if bank name shows as 'テスト銀行' (not 'Unknown Bank')");
}

// Helper function to check current page functionality
function checkCurrentPage() {
    const path = window.location.pathname;
    console.log("\n🌐 Current page:", path);
    
    if (path === '/settings') {
        console.log("📋 Settings page - looking for bank controls...");
        const addBankBtn = document.querySelector('button');
        if (addBankBtn) {
            console.log("✅ Found button (possibly 'Add Bank'):", addBankBtn.textContent);
        } else {
            console.log("⚠️ No buttons found on page");
        }
    } else if (path === '/') {
        console.log("📅 Main page - looking for calendar...");
        const calendar = document.querySelector('[class*="calendar"], [class*="Calendar"]');
        if (calendar) {
            console.log("✅ Found calendar element");
        } else {
            console.log("⚠️ Calendar element not found");
        }
    } else if (path === '/schedule') {
        console.log("📊 Schedule page - looking for bank data...");
        const bankElements = document.querySelectorAll('[class*="bank"], [class*="Bank"]');
        console.log("🏦 Found", bankElements.length, "bank-related elements");
        
        // Look for "Unknown Bank" text
        const unknownBankElements = Array.from(document.querySelectorAll('*'))
            .filter(el => el.textContent && el.textContent.includes('Unknown Bank'));
        if (unknownBankElements.length > 0) {
            console.log("⚠️ Found 'Unknown Bank' text on page!");
            unknownBankElements.forEach(el => console.log("  -", el.textContent.trim()));
        } else {
            console.log("✅ No 'Unknown Bank' text found");
        }
        
        // Look for test bank
        const testBankElements = Array.from(document.querySelectorAll('*'))
            .filter(el => el.textContent && el.textContent.includes('テスト銀行'));
        if (testBankElements.length > 0) {
            console.log("✅ Found 'テスト銀行' text on page!");
            testBankElements.forEach(el => console.log("  -", el.textContent.trim()));
        }
    }
}

// Main debug function
async function runDebug() {
    console.log("🚀 Starting debug check...\n");
    
    // Check database
    const { banks, transactions } = await checkIndexedDB();
    
    // Check current page
    checkCurrentPage();
    
    // Show test steps
    simulateTestSteps();
    
    // Summary
    console.log("\n📋 Debug Summary:");
    console.log("- Banks in DB:", banks.length);
    console.log("- Transactions in DB:", transactions.length);
    console.log("- Current page:", window.location.pathname);
    
    if (banks.length === 0) {
        console.log("⚠️ No banks found - start by adding a bank in /settings");
    }
    
    if (transactions.length === 0) {
        console.log("⚠️ No transactions found - add a transaction from the calendar");
    }
    
    console.log("\n🔍 To continue debugging:");
    console.log("1. Run: checkIndexedDB() - to refresh database check");
    console.log("2. Run: checkCurrentPage() - to check current page elements");
    console.log("3. Watch for console warnings when performing actions");
    
    return { banks, transactions };
}

// Expose helper functions globally for manual use
window.debugHelper = {
    checkIndexedDB,
    checkCurrentPage,
    simulateTestSteps,
    runDebug
};

// Auto-run the debug
runDebug().then(() => {
    console.log("\n✨ Debug complete! Use window.debugHelper for more checks.");
});