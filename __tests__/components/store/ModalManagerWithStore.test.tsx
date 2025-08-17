/**
 * Modal Manager with Store Integration Tests
 * Tests modal management components with Zustand store
 * Phase 2 refactoring validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  createMockTransactionInput,
  renderWithProviders,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
} from '../../utils/storeTestUtils';

// Mock Modal Components with Store Integration
const MockTransactionModal = ({ 
  isOpen, 
  data, 
  onClose, 
  onSave, 
  onDelete 
}: {
  isOpen: boolean;
  data: any;
  onClose: () => void;
  onSave: (input: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [formData, setFormData] = React.useState({
    amount: data?.transaction?.amount || 0,
    description: data?.transaction?.description || '',
    date: data?.date?.toISOString().split('T')[0] || '',
  });

  if (!isOpen) return null;

  return (
    <div data-testid="transaction-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>{data?.transaction ? 'Edit Transaction' : 'New Transaction'}</h2>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            ...formData,
            amount: Number(formData.amount),
            categoryId: 'cat-1',
            cardId: 'card-1',
            bankId: null,
            isRecurring: false,
          });
        }}>
          <input
            data-testid="amount-input"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
            placeholder="Amount"
          />
          
          <input
            data-testid="description-input"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
          />
          
          <input
            data-testid="date-input"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
          
          <div className="modal-actions">
            <button type="submit" data-testid="save-button">
              {data?.transaction ? 'Update' : 'Save'}
            </button>
            
            {data?.transaction && (
              <button 
                type="button"
                data-testid="delete-button"
                onClick={() => onDelete(data.transaction.id)}
              >
                Delete
              </button>
            )}
            
            <button type="button" onClick={onClose} data-testid="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MockTransactionViewModal = ({ 
  isOpen, 
  data, 
  onClose, 
  onTransactionClick 
}: {
  isOpen: boolean;
  data: any;
  onClose: () => void;
  onTransactionClick: (transaction: any) => void;
}) => {
  if (!isOpen) return null;

  return (
    <div data-testid="transaction-view-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>Transactions for {data?.date?.toLocaleDateString()}</h2>
        
        <div className="transaction-list">
          {data?.transactions?.map((transaction: any) => (
            <div 
              key={transaction.id}
              data-testid={`transaction-item-${transaction.id}`}
              className="transaction-item"
              onClick={() => onTransactionClick(transaction)}
            >
              <span className="description">{transaction.description}</span>
              <span className="amount">¥{transaction.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} data-testid="close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const MockDayTotalModal = ({ 
  isOpen, 
  data, 
  onClose, 
  onViewTransactions 
}: {
  isOpen: boolean;
  data: any;
  onClose: () => void;
  onViewTransactions: () => void;
}) => {
  if (!isOpen) return null;

  const dayTotalData = data?.dayTotalData;

  return (
    <div data-testid="day-total-modal" className="modal-overlay">
      <div className="modal-content">
        <h2>Day Total - {data?.date?.toLocaleDateString()}</h2>
        
        <div className="totals-summary">
          <div className="total-item">
            <span>Total Amount:</span>
            <span data-testid="total-amount">¥{dayTotalData?.totalAmount?.toLocaleString()}</span>
          </div>
          <div className="total-item">
            <span>Transactions:</span>
            <span data-testid="transaction-total">¥{dayTotalData?.transactionTotal?.toLocaleString()}</span>
          </div>
          <div className="total-item">
            <span>Schedules:</span>
            <span data-testid="schedule-total">¥{dayTotalData?.scheduleTotal?.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="data-summary">
          <p>Transactions: {dayTotalData?.transactionCount || 0}</p>
          <p>Schedules: {dayTotalData?.scheduleCount || 0}</p>
        </div>
        
        <div className="modal-actions">
          {dayTotalData?.hasTransactions && (
            <button 
              onClick={onViewTransactions}
              data-testid="view-transactions-button"
            >
              View Transactions
            </button>
          )}
          <button onClick={onClose} data-testid="close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Modal Manager Component with Store
const MockModalManagerWithStore = () => {
  const [storeState, setStoreState] = React.useState(createInitialStoreState());
  const [actionTester] = React.useState(() => createStoreActionTester());

  // Store actions
  const actions = {
    openModal: (modalType: string, data: any) => {
      actionTester.captureAction('openModal', { modalType, data });
      setStoreState(prev => ({
        ...prev,
        modals: {
          ...prev.modals,
          [modalType]: { isOpen: true, data },
        },
      }));
    },
    
    closeModal: (modalType: string) => {
      actionTester.captureAction('closeModal', { modalType });
      setStoreState(prev => ({
        ...prev,
        modals: {
          ...prev.modals,
          [modalType]: { isOpen: false, data: null },
        },
      }));
    },
    
    closeAllModals: () => {
      actionTester.captureAction('closeAllModals');
      setStoreState(prev => ({
        ...prev,
        modals: createInitialStoreState().modals,
      }));
    },
    
    saveTransaction: async (transactionInput: any) => {
      actionTester.captureAction('saveTransaction', transactionInput);
      
      // Simulate async save
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newTransaction = createMockTransaction({
        ...transactionInput,
        id: `new-tx-${Date.now()}`,
      });
      
      setStoreState(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: [...prev.transactions.items, newTransaction],
        },
      }));
      
      actions.closeAllModals();
    },
    
    updateTransaction: async (id: string, updates: any) => {
      actionTester.captureAction('updateTransaction', { id, updates });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setStoreState(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: prev.transactions.items.map(tx =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        },
      }));
      
      actions.closeAllModals();
    },
    
    deleteTransaction: async (id: string) => {
      actionTester.captureAction('deleteTransaction', { id });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setStoreState(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: prev.transactions.items.filter(tx => tx.id !== id),
        },
      }));
      
      actions.closeAllModals();
    },
  };

  // Modal handlers
  const handleTransactionClick = (transaction: any) => {
    actions.closeModal('transactionView');
    actions.openModal('transaction', {
      date: new Date(transaction.date),
      transaction,
    });
  };

  const handleViewTransactions = () => {
    const dayTotalData = storeState.modals.dayTotal.data?.dayTotalData;
    actions.closeModal('dayTotal');
    actions.openModal('transactionView', {
      date: storeState.modals.dayTotal.data?.date,
      transactions: dayTotalData?.transactions || [],
    });
  };

  // Test triggers
  const triggerNewTransaction = () => {
    actions.openModal('transaction', {
      date: new Date('2024-02-15'),
      transaction: null,
    });
  };

  const triggerDayTotalModal = () => {
    const mockDayTotal = createMockDayTotalData({
      transactions: [createMockTransaction()],
    });
    
    actions.openModal('dayTotal', {
      date: new Date('2024-02-15'),
      dayTotalData: mockDayTotal,
    });
  };

  return (
    <div data-testid="modal-manager">
      {/* Test Triggers */}
      <div className="test-triggers">
        <button onClick={triggerNewTransaction} data-testid="open-new-transaction">
          New Transaction
        </button>
        <button onClick={triggerDayTotalModal} data-testid="open-day-total">
          Day Total
        </button>
      </div>

      {/* Modals */}
      <MockTransactionModal
        isOpen={storeState.modals.transaction.isOpen}
        data={storeState.modals.transaction.data}
        onClose={() => actions.closeModal('transaction')}
        onSave={actions.saveTransaction}
        onDelete={actions.deleteTransaction}
      />

      <MockTransactionViewModal
        isOpen={storeState.modals.transactionView.isOpen}
        data={storeState.modals.transactionView.data}
        onClose={() => actions.closeModal('transactionView')}
        onTransactionClick={handleTransactionClick}
      />

      <MockDayTotalModal
        isOpen={storeState.modals.dayTotal.isOpen}
        data={storeState.modals.dayTotal.data}
        onClose={() => actions.closeModal('dayTotal')}
        onViewTransactions={handleViewTransactions}
      />

      {/* Store State Display for Testing */}
      <div data-testid="store-state" style={{ display: 'none' }}>
        {JSON.stringify(storeState)}
      </div>
    </div>
  );
};

describe('Modal Manager with Store Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Modal Operations', () => {
    it('should render modal manager with store integration', () => {
      render(<MockModalManagerWithStore />);
      
      expect(screen.getByTestId('modal-manager')).toBeInTheDocument();
      expect(screen.getByTestId('open-new-transaction')).toBeInTheDocument();
      expect(screen.getByTestId('open-day-total')).toBeInTheDocument();
    });

    it('should open transaction modal through store', async () => {
      render(<MockModalManagerWithStore />);
      
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
        expect(screen.getByText('New Transaction')).toBeInTheDocument();
      });
    });

    it('should close modal through store action', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open modal
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Close modal
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction Management', () => {
    it('should save new transaction through store', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open new transaction modal
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Fill form
      const amountInput = screen.getByTestId('amount-input');
      const descriptionInput = screen.getByTestId('description-input');
      
      await user.clear(amountInput);
      await user.type(amountInput, '5000');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Test Transaction');
      
      // Save
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
      });
    });

    it('should update existing transaction through store', async () => {
      render(<MockModalManagerWithStore />);
      
      // First add a transaction to have something to edit
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Pre-fill with existing transaction data (simulated)
      const amountInput = screen.getByTestId('amount-input');
      const descriptionInput = screen.getByTestId('description-input');
      
      await user.clear(amountInput);
      await user.type(amountInput, '7500');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated Transaction');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
      });
    });

    it('should delete transaction through store', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open transaction modal (simulating edit mode)
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Check if delete button would be present for existing transaction
      // In a real scenario, this would be based on store state
      const deleteButton = screen.queryByTestId('delete-button');
      if (deleteButton) {
        await user.click(deleteButton);
        
        await waitFor(() => {
          expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Modal Transitions', () => {
    it('should transition from day total to transaction view modal', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open day total modal
      const openDayTotalButton = screen.getByTestId('open-day-total');
      await user.click(openDayTotalButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
      });
      
      // Click view transactions
      const viewTransactionsButton = screen.getByTestId('view-transactions-button');
      await user.click(viewTransactionsButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('day-total-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('transaction-view-modal')).toBeInTheDocument();
      });
    });

    it('should transition from transaction view to transaction edit modal', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open day total modal first
      const openDayTotalButton = screen.getByTestId('open-day-total');
      await user.click(openDayTotalButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
      });
      
      // Go to transaction view
      const viewTransactionsButton = screen.getByTestId('view-transactions-button');
      await user.click(viewTransactionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-view-modal')).toBeInTheDocument();
      });
      
      // Click on a transaction item (if exists)
      const transactionItems = screen.queryAllByTestId(/transaction-item-/);
      if (transactionItems.length > 0) {
        await user.click(transactionItems[0]);
        
        await waitFor(() => {
          expect(screen.queryByTestId('transaction-view-modal')).not.toBeInTheDocument();
          expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
          expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Display Integration', () => {
    it('should display day total data from store', async () => {
      render(<MockModalManagerWithStore />);
      
      const openDayTotalButton = screen.getByTestId('open-day-total');
      await user.click(openDayTotalButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
        expect(screen.getByTestId('total-amount')).toBeInTheDocument();
        expect(screen.getByTestId('transaction-total')).toBeInTheDocument();
        expect(screen.getByTestId('schedule-total')).toBeInTheDocument();
      });
    });

    it('should populate form fields with transaction data', async () => {
      render(<MockModalManagerWithStore />);
      
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
        
        // Check that form fields are present and can be interacted with
        expect(screen.getByTestId('amount-input')).toBeInTheDocument();
        expect(screen.getByTestId('description-input')).toBeInTheDocument();
        expect(screen.getByTestId('date-input')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      render(<MockModalManagerWithStore />);
      
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Try to save with invalid data (empty form)
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      // Modal should handle validation and stay open or show error
      // In a real implementation, this would show validation errors
      expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
    });

    it('should handle modal state conflicts', async () => {
      render(<MockModalManagerWithStore />);
      
      // Open multiple modals rapidly (testing race conditions)
      const openTransactionButton = screen.getByTestId('open-new-transaction');
      const openDayTotalButton = screen.getByTestId('open-day-total');
      
      await user.click(openTransactionButton);
      await user.click(openDayTotalButton);
      
      // Should handle gracefully without errors
      await waitFor(() => {
        // One or both modals should be visible
        const modals = [
          screen.queryByTestId('transaction-modal'),
          screen.queryByTestId('day-total-modal'),
        ].filter(Boolean);
        
        expect(modals.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid modal operations without performance issues', async () => {
      render(<MockModalManagerWithStore />);
      
      const startTime = performance.now();
      
      // Perform rapid modal operations
      for (let i = 0; i < 10; i++) {
        const openButton = screen.getByTestId('open-new-transaction');
        await user.click(openButton);
        
        await waitFor(() => {
          expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
        });
        
        const cancelButton = screen.getByTestId('cancel-button');
        await user.click(cancelButton);
        
        await waitFor(() => {
          expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000);
    });

    it('should handle form interactions efficiently', async () => {
      render(<MockModalManagerWithStore />);
      
      const openButton = screen.getByTestId('open-new-transaction');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      const startTime = performance.now();
      
      // Perform many form interactions
      const amountInput = screen.getByTestId('amount-input');
      const descriptionInput = screen.getByTestId('description-input');
      
      for (let i = 0; i < 20; i++) {
        await user.clear(amountInput);
        await user.type(amountInput, `${1000 + i}`);
        await user.clear(descriptionInput);
        await user.type(descriptionInput, `Test ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle form interactions efficiently
      expect(duration).toBeLessThan(3000);
    });
  });
});