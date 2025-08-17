'use client';

import React, { memo, useState, useCallback } from 'react';
import { 
  useAppStore, 
  useStoreActions, 
  selectors, 
  derivedSelectors 
} from '@/store';

/**
 * Development component for debugging store state and actions
 * Only visible in development mode
 */
const StoreDebugPanel = memo(() => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'state' | 'actions' | 'performance'>('state');
  
  // Get store state
  const modalStates = useAppStore((state) => state.modalStates);
  const selectedData = useAppStore((state) => state.selectedData);
  const transactions = useAppStore(selectors.transaction.getTransactions);
  const banks = useAppStore(selectors.transaction.getBanks);
  const cards = useAppStore(selectors.transaction.getCards);
  const schedules = useAppStore((state) => state.schedules);
  const loadingStates = useAppStore((state) => state.loading);
  const errorStates = useAppStore((state) => state.errors);
  
  // Get derived state
  const transactionStats = useAppStore(derivedSelectors.getTransactionStats);
  const currentMonthSummary = useAppStore(derivedSelectors.getCurrentMonthSummary);
  const loadingStatus = useAppStore(derivedSelectors.getLoadingStatus);
  
  const { modal, transaction, schedule, ui } = useStoreActions();
  
  // Test actions
  const handleClearCache = useCallback(() => {
    transaction.clearTransactionCache();
    schedule.clearScheduleCache();
  }, [transaction, schedule]);
  
  const handleClearErrors = useCallback(() => {
    ui.clearErrors();
  }, [ui]);
  
  const handleTestModal = useCallback(() => {
    modal.openTransactionModal(new Date());
  }, [modal]);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700"
          title="Open Store Debug Panel"
        >
          🛠️
        </button>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white p-2 flex justify-between items-center">
            <h3 className="font-semibold">Store Debug Panel</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white hover:bg-purple-700 rounded px-1"
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['state', 'actions', 'performance'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-3 overflow-y-auto max-h-80 text-xs">
            {activeTab === 'state' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700">Modal States</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(modalStates, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Loading States</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(loadingStates, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Data Counts</h4>
                  <div className="bg-gray-100 p-2 rounded">
                    <div>Transactions: {transactions.length}</div>
                    <div>Banks: {banks.length}</div>
                    <div>Cards: {cards.length}</div>
                    <div>Schedules: {Object.keys(schedules).length}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Transaction Stats</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(transactionStats, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {activeTab === 'actions' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700">Test Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleTestModal}
                      className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                    >
                      Open Test Modal
                    </button>
                    
                    <button
                      onClick={handleClearCache}
                      className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                    >
                      Clear All Cache
                    </button>
                    
                    <button
                      onClick={handleClearErrors}
                      className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                    >
                      Clear All Errors
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Error States</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(errorStates, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {activeTab === 'performance' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700">Loading Status</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(loadingStatus, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Current Month Summary</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(currentMonthSummary, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700">Cache Info</h4>
                  <div className="bg-gray-100 p-2 rounded text-xs">
                    <div>This would show cache hit rates and sizes</div>
                    <div>Performance metrics would go here</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

StoreDebugPanel.displayName = 'StoreDebugPanel';

export default StoreDebugPanel;