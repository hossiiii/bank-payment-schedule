'use client';

import React, { memo, useCallback, useState } from 'react';
import { 
  useAppStore, 
  useStoreActions, 
  selectors,
  useModalStore,
  useTransactionStore,
  useIsLoading,
  useHasError 
} from '@/store';
import { useModalManagerAdapter } from '@/hooks/modal/useModalManagerAdapter';
import { logDebug } from '@/lib/utils/logger';

/**
 * Demo component showcasing the new store functionality
 * and migration from useModalManager to Zustand store
 */
const StoreDemo = memo(() => {
  const [demoMode, setDemoMode] = useState<'store' | 'adapter'>('store');
  
  // Example 1: Direct store usage
  const modalStates = useAppStore((state) => state.modalStates);
  const transactions = useAppStore(selectors.transaction.getTransactions);
  const isAnyLoading = useIsLoading();
  const hasAnyError = useHasError();
  
  const { modal, transaction } = useStoreActions();
  
  // Example 2: Adapter usage for backward compatibility
  const modalManager = useModalManagerAdapter({
    onTransactionSave: async (transactionInput) => {
      logDebug('Transaction saved via adapter', transactionInput, 'StoreDemo');
    },
    onTransactionDelete: async (transactionId) => {
      logDebug('Transaction deleted via adapter', transactionId, 'StoreDemo');
    },
  });
  
  // Example 3: Optimized store slices
  const modalStore = useModalStore();
  const transactionStore = useTransactionStore();
  
  const handleDirectStoreDemo = useCallback(() => {
    // Direct store usage
    modal.openTransactionModal(new Date());
  }, [modal]);
  
  const handleAdapterDemo = useCallback(() => {
    // Adapter usage - same API as useModalManager
    modalManager.openTransactionModal(new Date());
  }, [modalManager]);
  
  const handleFetchDemo = useCallback(async () => {
    try {
      await transaction.fetchTransactions();
      await transaction.fetchBanks();
      await transaction.fetchCards();
    } catch (error) {
      console.error('Demo fetch failed:', error);
    }
  }, [transaction]);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Zustand Store Demo</h1>
      
      {/* Mode Selection */}
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setDemoMode('store')}
            className={`px-4 py-2 rounded ${
              demoMode === 'store' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Direct Store Usage
          </button>
          <button
            onClick={() => setDemoMode('adapter')}
            className={`px-4 py-2 rounded ${
              demoMode === 'adapter' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Adapter (Backward Compatible)
          </button>
        </div>
      </div>
      
      {/* Status Display */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Store State</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium">Loading States</h3>
            <p>Any Loading: {isAnyLoading ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <h3 className="font-medium">Error States</h3>
            <p>Has Errors: {hasAnyError ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <h3 className="font-medium">Data Counts</h3>
            <p>Transactions: {transactions.length}</p>
          </div>
          <div>
            <h3 className="font-medium">Modal States</h3>
            <p>Open Modals: {Object.values(modalStates).filter(Boolean).length}</p>
          </div>
        </div>
      </div>
      
      {demoMode === 'store' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Direct Store Usage</h2>
          <p className="text-gray-600 text-sm">
            This demonstrates using the Zustand store directly with optimized selectors and actions.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleDirectStoreDemo}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Open Transaction Modal
            </button>
            
            <button
              onClick={handleFetchDemo}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Fetch Data
            </button>
            
            <button
              onClick={() => modal.closeAllModals()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close All Modals
            </button>
          </div>
          
          <div className="bg-white border p-4 rounded">
            <h3 className="font-medium mb-2">Store State</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify({
                modalStates,
                transactionCount: transactions.length,
                isLoading: isAnyLoading,
                hasError: hasAnyError,
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {demoMode === 'adapter' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Adapter Usage (Backward Compatible)</h2>
          <p className="text-gray-600 text-sm">
            This demonstrates using the adapter that provides the same API as useModalManager 
            while using the new store underneath.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={handleAdapterDemo}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Open Modal (Adapter)
            </button>
            
            <button
              onClick={() => modalManager.closeAllModals()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close All Modals (Adapter)
            </button>
          </div>
          
          <div className="bg-white border p-4 rounded">
            <h3 className="font-medium mb-2">Adapter State (Same as useModalManager)</h3>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify({
                modalStates: modalManager.modalStates,
                selectedData: modalManager.selectedData,
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Performance Comparison */}
      <div className="mt-8 bg-yellow-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">Performance Features</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ Global state management with Zustand</li>
          <li>✅ Optimized selectors to prevent unnecessary re-renders</li>
          <li>✅ Memoized components with React.memo</li>
          <li>✅ Cache management for expensive operations</li>
          <li>✅ Backward compatibility with existing useModalManager API</li>
          <li>✅ TypeScript support with strict typing</li>
          <li>✅ DevTools integration for debugging</li>
        </ul>
      </div>
      
      {/* Usage Examples */}
      <div className="mt-8 bg-blue-50 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">Usage Examples</h2>
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-medium">1. Direct Store Access:</h3>
            <code className="bg-white p-2 rounded block">
              const transactions = useAppStore(selectors.transaction.getTransactions);
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">2. Store Actions:</h3>
            <code className="bg-white p-2 rounded block">
              const {`{ modal, transaction }`} = useStoreActions();
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">3. Backward Compatible:</h3>
            <code className="bg-white p-2 rounded block">
              const modalManager = useModalManagerAdapter(config);
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">4. Optimized Hooks:</h3>
            <code className="bg-white p-2 rounded block">
              const isLoading = useIsLoading(&apos;transactions&apos;);
            </code>
          </div>
        </div>
      </div>
    </div>
  );
});

StoreDemo.displayName = 'StoreDemo';

export default StoreDemo;