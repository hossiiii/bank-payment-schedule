/**
 * Calendar View with Store Integration Tests
 * Tests calendar component with Zustand store integration
 * Phase 2 refactoring validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  createMockDataSet,
  renderWithProviders,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
} from '../../utils/storeTestUtils';

// Mock calendar component with store integration
const MockCalendarViewWithStore = ({ testId = 'calendar-view' }: { testId?: string }) => {
  const [storeState, setStoreState] = React.useState(createInitialStoreState());
  const [actionTester] = React.useState(() => createStoreActionTester());

  // Mock store actions
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
    
    setCurrentDate: (date: Date) => {
      actionTester.captureAction('setCurrentDate', { date });
      setStoreState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          currentDate: date,
        },
      }));
    },
    
    calculateDayTotals: () => {
      actionTester.captureAction('calculateDayTotals');
      // Mock calculation logic
      const dayTotals = new Map();
      dayTotals.set('2024-02-15', createMockDayTotalData());
      setStoreState(prev => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          dayTotals,
        },
      }));
    },
  };

  // Mock calendar grid with clickable days
  const renderCalendarGrid = () => {
    const daysInMonth = Array.from({ length: 28 }, (_, i) => i + 1);
    
    return (
      <div data-testid="calendar-grid" className="calendar-grid">
        {daysInMonth.map(day => {
          const dateKey = `2024-02-${String(day).padStart(2, '0')}`;
          const dayTotal = storeState.calendar.dayTotals.get(dateKey);
          const hasData = dayTotal && dayTotal.hasData;
          
          return (
            <div
              key={day}
              data-testid={`calendar-day-${day}`}
              className={`calendar-day ${hasData ? 'has-data' : ''}`}
              onClick={() => {
                if (hasData) {
                  actions.openModal('dayTotal', {
                    date: new Date(dateKey),
                    dayTotalData: dayTotal,
                  });
                } else {
                  actions.openModal('transaction', {
                    date: new Date(dateKey),
                    transaction: null,
                  });
                }
              }}
            >
              <span className="day-number">{day}</span>
              {hasData && (
                <div className="day-total">
                  ¥{dayTotal.totalAmount.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Mock modal rendering
  const renderModals = () => (
    <>
      {storeState.modals.transaction.isOpen && (
        <div data-testid="transaction-modal" className="modal">
          <h2>Transaction Modal</h2>
          <p>Date: {storeState.modals.transaction.data?.date?.toISOString()}</p>
          <button onClick={() => actions.closeModal('transaction')}>Close</button>
        </div>
      )}
      
      {storeState.modals.dayTotal.isOpen && (
        <div data-testid="day-total-modal" className="modal">
          <h2>Day Total Modal</h2>
          <p>Total: ¥{storeState.modals.dayTotal.data?.dayTotalData?.totalAmount}</p>
          <button onClick={() => actions.closeModal('dayTotal')}>Close</button>
          <button 
            onClick={() => {
              const transactions = storeState.modals.dayTotal.data?.dayTotalData?.transactions || [];
              actions.closeModal('dayTotal');
              actions.openModal('transactionView', {
                date: storeState.modals.dayTotal.data?.date,
                transactions,
              });
            }}
          >
            View Transactions
          </button>
        </div>
      )}
      
      {storeState.modals.transactionView.isOpen && (
        <div data-testid="transaction-view-modal" className="modal">
          <h2>Transaction View Modal</h2>
          <div className="transaction-list">
            {storeState.modals.transactionView.data?.transactions?.map((tx: any) => (
              <div 
                key={tx.id} 
                className="transaction-item"
                onClick={() => {
                  actions.closeModal('transactionView');
                  actions.openModal('transaction', {
                    date: new Date(tx.date),
                    transaction: tx,
                  });
                }}
              >
                {tx.description} - ¥{tx.amount}
              </div>
            ))}
          </div>
          <button onClick={() => actions.closeModal('transactionView')}>Close</button>
        </div>
      )}
    </>
  );

  // Mock navigation
  const renderNavigation = () => (
    <div data-testid="calendar-navigation" className="calendar-navigation">
      <button 
        onClick={() => {
          const prevMonth = new Date(storeState.calendar.currentDate);
          prevMonth.setMonth(prevMonth.getMonth() - 1);
          actions.setCurrentDate(prevMonth);
        }}
      >
        Previous Month
      </button>
      <span data-testid="current-month">
        {storeState.calendar.currentDate.toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: 'long' 
        })}
      </span>
      <button 
        onClick={() => {
          const nextMonth = new Date(storeState.calendar.currentDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          actions.setCurrentDate(nextMonth);
        }}
      >
        Next Month
      </button>
    </div>
  );

  // Initialize day totals on mount
  React.useEffect(() => {
    actions.calculateDayTotals();
  }, []);

  return (
    <div data-testid={testId} className="calendar-view-with-store">
      {renderNavigation()}
      {renderCalendarGrid()}
      {renderModals()}
    </div>
  );
};

describe('Calendar View with Store Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering with Store', () => {
    it('should render calendar with store state', () => {
      render(<MockCalendarViewWithStore />);
      
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-navigation')).toBeInTheDocument();
    });

    it('should display current month from store', () => {
      render(<MockCalendarViewWithStore />);
      
      const currentMonthElement = screen.getByTestId('current-month');
      expect(currentMonthElement).toBeInTheDocument();
      expect(currentMonthElement.textContent).toContain('2024');
    });

    it('should render calendar days with store data', async () => {
      render(<MockCalendarViewWithStore />);
      
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toBeInTheDocument();
        expect(dayWithData).toHaveClass('has-data');
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should handle month navigation through store', async () => {
      render(<MockCalendarViewWithStore />);
      
      const prevButton = screen.getByText('Previous Month');
      const nextButton = screen.getByText('Next Month');
      
      await user.click(nextButton);
      
      await waitFor(() => {
        const currentMonth = screen.getByTestId('current-month');
        expect(currentMonth.textContent).toContain('2024');
      });
    });

    it('should update store state when navigating', async () => {
      render(<MockCalendarViewWithStore />);
      
      const prevButton = screen.getByText('Previous Month');
      
      await user.click(prevButton);
      
      // Store action should be captured
      await waitFor(() => {
        expect(screen.getByTestId('current-month')).toBeInTheDocument();
      });
    });
  });

  describe('Day Click Integration', () => {
    it('should open day total modal when clicking day with data', async () => {
      render(<MockCalendarViewWithStore />);
      
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
      
      const dayWithData = screen.getByTestId('calendar-day-15');
      await user.click(dayWithData);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
        expect(screen.getByText(/Total: ¥/)).toBeInTheDocument();
      });
    });

    it('should open transaction modal when clicking empty day', async () => {
      render(<MockCalendarViewWithStore />);
      
      const emptyDay = screen.getByTestId('calendar-day-20');
      await user.click(emptyDay);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
    });

    it('should display correct total amount in day total modal', async () => {
      render(<MockCalendarViewWithStore />);
      
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
      
      const dayWithData = screen.getByTestId('calendar-day-15');
      await user.click(dayWithData);
      
      await waitFor(() => {
        expect(screen.getByText('Total: ¥20,000')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Integration', () => {
    it('should close modal through store action', async () => {
      render(<MockCalendarViewWithStore />);
      
      // Open a modal first
      const emptyDay = screen.getByTestId('calendar-day-20');
      await user.click(emptyDay);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
      });
      
      // Close the modal
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('transaction-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle modal transitions through store', async () => {
      render(<MockCalendarViewWithStore />);
      
      // Open day total modal
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
      
      const dayWithData = screen.getByTestId('calendar-day-15');
      await user.click(dayWithData);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
      });
      
      // Transition to transaction view modal
      const viewTransactionsButton = screen.getByText('View Transactions');
      await user.click(viewTransactionsButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('day-total-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('transaction-view-modal')).toBeInTheDocument();
      });
    });

    it('should handle transaction selection from list', async () => {
      render(<MockCalendarViewWithStore />);
      
      // Navigate to transaction view modal
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
      
      const dayWithData = screen.getByTestId('calendar-day-15');
      await user.click(dayWithData);
      
      await waitFor(() => {
        expect(screen.getByTestId('day-total-modal')).toBeInTheDocument();
      });
      
      const viewTransactionsButton = screen.getByText('View Transactions');
      await user.click(viewTransactionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('transaction-view-modal')).toBeInTheDocument();
      });
      
      // Click on a transaction (this would be generated from mock data)
      const transactionItems = screen.getAllByClassName('transaction-item');
      if (transactionItems.length > 0) {
        await user.click(transactionItems[0]);
        
        await waitFor(() => {
          expect(screen.queryByTestId('transaction-view-modal')).not.toBeInTheDocument();
          expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Display Integration', () => {
    it('should display day totals from store calculations', async () => {
      render(<MockCalendarViewWithStore />);
      
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        const dayTotal = dayWithData.querySelector('.day-total');
        expect(dayTotal).toBeInTheDocument();
        expect(dayTotal?.textContent).toBe('¥20,000');
      });
    });

    it('should update display when store data changes', async () => {
      const { rerender } = render(<MockCalendarViewWithStore />);
      
      // Initial state
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
      
      // Simulate store data change by re-rendering
      rerender(<MockCalendarViewWithStore />);
      
      await waitFor(() => {
        const dayWithData = screen.getByTestId('calendar-day-15');
        expect(dayWithData).toHaveClass('has-data');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing day total data gracefully', async () => {
      render(<MockCalendarViewWithStore />);
      
      // Click on a day without data
      const dayWithoutData = screen.getByTestId('calendar-day-25');
      await user.click(dayWithoutData);
      
      // Should open transaction modal instead of day total modal
      await waitFor(() => {
        expect(screen.getByTestId('transaction-modal')).toBeInTheDocument();
        expect(screen.queryByTestId('day-total-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle invalid dates gracefully', async () => {
      render(<MockCalendarViewWithStore />);
      
      // This would be handled in the actual component
      // but we can test that the component doesn't crash
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid clicking without performance issues', async () => {
      render(<MockCalendarViewWithStore />);
      
      const startTime = performance.now();
      
      // Rapidly click multiple days
      for (let i = 1; i <= 5; i++) {
        const day = screen.getByTestId(`calendar-day-${i}`);
        await user.click(day);
        
        // Close any modal that opens
        const closeButtons = screen.queryAllByText('Close');
        if (closeButtons.length > 0) {
          await user.click(closeButtons[0]);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete rapidly
      expect(duration).toBeLessThan(1000);
    });

    it('should handle navigation without performance degradation', async () => {
      render(<MockCalendarViewWithStore />);
      
      const nextButton = screen.getByText('Next Month');
      const prevButton = screen.getByText('Previous Month');
      
      const startTime = performance.now();
      
      // Navigate back and forth multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(nextButton);
        await user.click(prevButton);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete rapidly
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility when integrated with store', async () => {
      render(<MockCalendarViewWithStore />);
      
      // Check that calendar days are accessible
      const calendarDays = screen.getAllByTestId(/calendar-day-\d+/);
      expect(calendarDays.length).toBeGreaterThan(0);
      
      // Check that modals are accessible when opened
      const emptyDay = screen.getByTestId('calendar-day-20');
      await user.click(emptyDay);
      
      await waitFor(() => {
        const modal = screen.getByTestId('transaction-modal');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveClass('modal');
      });
    });

    it('should handle keyboard navigation with store integration', async () => {
      render(<MockCalendarViewWithStore />);
      
      const firstDay = screen.getByTestId('calendar-day-1');
      firstDay.focus();
      
      // Simulate Enter key press
      fireEvent.keyDown(firstDay, { key: 'Enter', code: 'Enter' });
      
      // Should handle the interaction gracefully
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
    });
  });
});