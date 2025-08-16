/**
 * @jest-environment jsdom
 */

import {
  DayTotalData,
  BankGroup,
  DayTransactionItem,
  ScheduleEditFormData,
  ScheduleEditHandlers,
  ScheduleBankGroup,
  ScheduleDisplayItem,
  ScheduleModalState,
  ModalStates,
  ModalHandlers,
  CalendarModalContext,
  CalendarError,
  CalendarOperationResult
} from '@/types/calendar';
import { Transaction, ScheduleItem, Bank, Card } from '@/types/database';

describe('Calendar Schedule Integration Type Tests', () => {
  // Mock data for testing
  const mockTransaction: Transaction = {
    id: 'trans-1',
    amount: 5000,
    date: Date.now(),
    storeName: 'Test Store',
    paymentType: 'card',
    cardId: 'card-1',
    scheduledPayDate: Date.now(),
    memo: 'Test memo',
    createdAt: Date.now()
  };

  const mockScheduleItem: ScheduleItem = {
    transactionId: 'schedule-1',
    date: new Date('2024-01-15'),
    amount: 3000,
    paymentType: 'card',
    cardId: 'card-1',
    cardName: 'Test Card',
    bankName: 'Test Bank',
    storeName: 'Schedule Store',
    usage: 'Test Usage'
  };

  const mockBank: Bank = {
    id: 'bank-1',
    name: 'Test Bank',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockCard: Card = {
    id: 'card-1',
    name: 'Test Card',
    bankId: 'bank-1',
    closingDay: 15,
    paymentDay: 10,
    paymentMonthShift: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  describe('DayTotalData 型の検証', () => {
    it('DayTotalData型が正しい構造を持つこと', () => {
      const dayTotalData: DayTotalData = {
        date: '2024-01-15',
        totalAmount: 8000,
        transactionCount: 1,
        scheduleCount: 1,
        transactionTotal: 5000,
        scheduleTotal: 3000,
        bankGroups: [],
        transactions: [mockTransaction],
        scheduleItems: [mockScheduleItem],
        hasData: true,
        hasTransactions: true,
        hasSchedule: true
      };

      expect(dayTotalData.date).toBe('2024-01-15');
      expect(dayTotalData.totalAmount).toBe(8000);
      expect(dayTotalData.transactionTotal).toBe(5000);
      expect(dayTotalData.scheduleTotal).toBe(3000);
      expect(dayTotalData.transactionCount).toBe(1);
      expect(dayTotalData.scheduleCount).toBe(1);
      expect(dayTotalData.hasData).toBe(true);
      expect(dayTotalData.hasTransactions).toBe(true);
      expect(dayTotalData.hasSchedule).toBe(true);
      expect(dayTotalData.transactions).toHaveLength(1);
      expect(dayTotalData.scheduleItems).toHaveLength(1);
    });

    it('空のDayTotalDataが正しく構築されること', () => {
      const emptyDayTotalData: DayTotalData = {
        date: '2024-01-16',
        totalAmount: 0,
        transactionCount: 0,
        scheduleCount: 0,
        transactionTotal: 0,
        scheduleTotal: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: false,
        hasTransactions: false,
        hasSchedule: false
      };

      expect(emptyDayTotalData.hasData).toBe(false);
      expect(emptyDayTotalData.hasTransactions).toBe(false);
      expect(emptyDayTotalData.hasSchedule).toBe(false);
      expect(emptyDayTotalData.transactions).toHaveLength(0);
      expect(emptyDayTotalData.scheduleItems).toHaveLength(0);
    });
  });

  describe('DayTransactionItem 型の検証', () => {
    it('取引データのDayTransactionItemが正しく構築されること', () => {
      const transactionItem: DayTransactionItem = {
        id: 'trans-1',
        type: 'transaction',
        amount: 5000,
        storeName: 'Test Store',
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        transaction: mockTransaction
      };

      expect(transactionItem.type).toBe('transaction');
      expect(transactionItem.transaction).toBeDefined();
      expect(transactionItem.scheduleItem).toBeUndefined();
      expect(transactionItem.amount).toBe(5000);
      expect(transactionItem.paymentType).toBe('card');
    });

    it('引落予定データのDayTransactionItemが正しく構築されること', () => {
      const scheduleTransactionItem: DayTransactionItem = {
        id: 'schedule-1',
        type: 'schedule',
        amount: 3000,
        storeName: 'Schedule Store',
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        scheduleItem: mockScheduleItem
      };

      expect(scheduleTransactionItem.type).toBe('schedule');
      expect(scheduleTransactionItem.scheduleItem).toBeDefined();
      expect(scheduleTransactionItem.transaction).toBeUndefined();
      expect(scheduleTransactionItem.amount).toBe(3000);
      expect(scheduleTransactionItem.paymentType).toBe('card');
    });
  });

  describe('BankGroup 型の検証', () => {
    it('BankGroupが正しく構築されること', () => {
      const transactionItem: DayTransactionItem = {
        id: 'trans-1',
        type: 'transaction',
        amount: 5000,
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        transaction: mockTransaction
      };

      const scheduleItem: DayTransactionItem = {
        id: 'schedule-1',
        type: 'schedule',
        amount: 3000,
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        scheduleItem: mockScheduleItem
      };

      const bankGroup: BankGroup = {
        bankId: 'bank-1',
        bankName: 'Test Bank',
        totalAmount: 8000,
        transactionCount: 2,
        items: [transactionItem, scheduleItem]
      };

      expect(bankGroup.bankId).toBe('bank-1');
      expect(bankGroup.bankName).toBe('Test Bank');
      expect(bankGroup.totalAmount).toBe(8000);
      expect(bankGroup.transactionCount).toBe(2);
      expect(bankGroup.items).toHaveLength(2);
      expect(bankGroup.items[0]?.type).toBe('transaction');
      expect(bankGroup.items[1]?.type).toBe('schedule');
    });
  });

  describe('ScheduleEditFormData 型の検証', () => {
    it('完全なScheduleEditFormDataが正しく構築されること', () => {
      const formData: ScheduleEditFormData = {
        amount: 5000,
        storeName: 'Test Store',
        usage: 'Test Usage',
        memo: 'Test Memo'
      };

      expect(formData.amount).toBe(5000);
      expect(formData.storeName).toBe('Test Store');
      expect(formData.usage).toBe('Test Usage');
      expect(formData.memo).toBe('Test Memo');
    });

    it('必須フィールドのみのScheduleEditFormDataが正しく構築されること', () => {
      const minimalFormData: ScheduleEditFormData = {
        amount: 3000
      };

      expect(minimalFormData.amount).toBe(3000);
      expect(minimalFormData.storeName).toBeUndefined();
      expect(minimalFormData.usage).toBeUndefined();
      expect(minimalFormData.memo).toBeUndefined();
    });
  });

  describe('ScheduleEditHandlers 型の検証', () => {
    it('ScheduleEditHandlersが正しく構築されること', () => {
      const handlers: ScheduleEditHandlers = {
        onScheduleClick: jest.fn(),
        onScheduleEdit: jest.fn(),
        onScheduleDelete: jest.fn()
      };

      expect(typeof handlers.onScheduleClick).toBe('function');
      expect(typeof handlers.onScheduleEdit).toBe('function');
      expect(typeof handlers.onScheduleDelete).toBe('function');
    });

    it('onScheduleDeleteが省略可能であること', () => {
      const handlersWithoutDelete: ScheduleEditHandlers = {
        onScheduleClick: jest.fn(),
        onScheduleEdit: jest.fn()
      };

      expect(typeof handlersWithoutDelete.onScheduleClick).toBe('function');
      expect(typeof handlersWithoutDelete.onScheduleEdit).toBe('function');
      expect(handlersWithoutDelete.onScheduleDelete).toBeUndefined();
    });
  });

  describe('ScheduleBankGroup と ScheduleDisplayItem 型の検証', () => {
    it('ScheduleDisplayItemが正しく構築されること', () => {
      const displayItem: ScheduleDisplayItem = {
        id: 'schedule-1',
        amount: 3000,
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        storeName: 'Test Store',
        usage: 'Test Usage',
        memo: 'Test Memo',
        scheduleItem: mockScheduleItem
      };

      expect(displayItem.id).toBe('schedule-1');
      expect(displayItem.amount).toBe(3000);
      expect(displayItem.paymentType).toBe('card');
      expect(displayItem.bankName).toBe('Test Bank');
      expect(displayItem.cardName).toBe('Test Card');
      expect(displayItem.storeName).toBe('Test Store');
      expect(displayItem.usage).toBe('Test Usage');
      expect(displayItem.memo).toBe('Test Memo');
      expect(displayItem.scheduleItem).toBe(mockScheduleItem);
    });

    it('ScheduleBankGroupが正しく構築されること', () => {
      const displayItem: ScheduleDisplayItem = {
        id: 'schedule-1',
        amount: 3000,
        paymentType: 'card',
        bankName: 'Test Bank',
        cardName: 'Test Card',
        scheduleItem: mockScheduleItem
      };

      const scheduleBankGroup: ScheduleBankGroup = {
        bankId: 'bank-1',
        bankName: 'Test Bank',
        totalAmount: 3000,
        scheduleCount: 1,
        items: [displayItem]
      };

      expect(scheduleBankGroup.bankId).toBe('bank-1');
      expect(scheduleBankGroup.bankName).toBe('Test Bank');
      expect(scheduleBankGroup.totalAmount).toBe(3000);
      expect(scheduleBankGroup.scheduleCount).toBe(1);
      expect(scheduleBankGroup.items).toHaveLength(1);
      expect(scheduleBankGroup.items[0]).toBe(displayItem);
    });
  });

  describe('ScheduleModalState 型の検証', () => {
    it('ScheduleModalStateが正しく構築されること', () => {
      const modalState: ScheduleModalState = {
        view: {
          isOpen: true,
          scheduleItems: [mockScheduleItem],
          selectedDate: new Date('2024-01-15')
        },
        edit: {
          isOpen: false,
          scheduleItem: null
        }
      };

      expect(modalState.view.isOpen).toBe(true);
      expect(modalState.view.scheduleItems).toHaveLength(1);
      expect(modalState.view.selectedDate).toEqual(new Date('2024-01-15'));
      expect(modalState.edit.isOpen).toBe(false);
      expect(modalState.edit.scheduleItem).toBeNull();
    });
  });

  describe('ModalStates と ModalHandlers 型の検証', () => {
    it('ModalStatesが正しく構築されること', () => {
      const modalStates: ModalStates = {
        transactionView: false,
        scheduleView: true,
        transactionEdit: false,
        scheduleEdit: false,
        dayTotal: false
      };

      expect(modalStates.transactionView).toBe(false);
      expect(modalStates.scheduleView).toBe(true);
      expect(modalStates.transactionEdit).toBe(false);
      expect(modalStates.scheduleEdit).toBe(false);
      expect(modalStates.dayTotal).toBe(false);
    });

    it('ModalHandlersが正しく構築されること', () => {
      const modalHandlers: ModalHandlers = {
        openTransactionView: jest.fn(),
        openScheduleView: jest.fn(),
        openTransactionEdit: jest.fn(),
        openScheduleEdit: jest.fn(),
        openDayTotal: jest.fn(),
        closeAll: jest.fn()
      };

      expect(typeof modalHandlers.openTransactionView).toBe('function');
      expect(typeof modalHandlers.openScheduleView).toBe('function');
      expect(typeof modalHandlers.openTransactionEdit).toBe('function');
      expect(typeof modalHandlers.openScheduleEdit).toBe('function');
      expect(typeof modalHandlers.openDayTotal).toBe('function');
      expect(typeof modalHandlers.closeAll).toBe('function');
    });
  });

  describe('CalendarModalContext 型の検証', () => {
    it('CalendarModalContextが正しく構築されること', () => {
      const mockDayTotalData: DayTotalData = {
        date: '2024-01-15',
        totalAmount: 8000,
        transactionCount: 1,
        scheduleCount: 1,
        transactionTotal: 5000,
        scheduleTotal: 3000,
        bankGroups: [],
        transactions: [mockTransaction],
        scheduleItems: [mockScheduleItem],
        hasData: true,
        hasTransactions: true,
        hasSchedule: true
      };

      const modalContext: CalendarModalContext = {
        modalStates: {
          transactionView: false,
          scheduleView: true,
          transactionEdit: false,
          scheduleEdit: false,
          dayTotal: false
        },
        selectedDate: new Date('2024-01-15'),
        selectedTransactions: [mockTransaction],
        selectedScheduleItems: [mockScheduleItem],
        selectedTransaction: mockTransaction,
        selectedScheduleItem: mockScheduleItem,
        selectedDayTotalData: mockDayTotalData,
        handlers: {
          openTransactionView: jest.fn(),
          openScheduleView: jest.fn(),
          openTransactionEdit: jest.fn(),
          openScheduleEdit: jest.fn(),
          openDayTotal: jest.fn(),
          closeAll: jest.fn()
        },
        banks: [mockBank],
        cards: [mockCard],
        onTransactionSave: jest.fn(),
        onTransactionDelete: jest.fn(),
        onScheduleSave: jest.fn(),
        onScheduleDelete: jest.fn()
      };

      expect(modalContext.modalStates.scheduleView).toBe(true);
      expect(modalContext.selectedDate).toEqual(new Date('2024-01-15'));
      expect(modalContext.selectedTransactions).toHaveLength(1);
      expect(modalContext.selectedScheduleItems).toHaveLength(1);
      expect(modalContext.selectedTransaction).toBe(mockTransaction);
      expect(modalContext.selectedScheduleItem).toBe(mockScheduleItem);
      expect(modalContext.selectedDayTotalData).toBe(mockDayTotalData);
      expect(modalContext.banks).toHaveLength(1);
      expect(modalContext.cards).toHaveLength(1);
      expect(typeof modalContext.handlers.openScheduleView).toBe('function');
      expect(typeof modalContext.onScheduleSave).toBe('function');
      expect(typeof modalContext.onScheduleDelete).toBe('function');
    });
  });

  describe('CalendarError 型の検証', () => {
    it('バリデーションエラーが正しく構築されること', () => {
      const validationError: CalendarError = {
        type: 'validation',
        message: '金額は必須です',
        field: 'amount'
      };

      expect(validationError.type).toBe('validation');
      expect(validationError.message).toBe('金額は必須です');
      expect(validationError.field).toBe('amount');
      expect(validationError.details).toBeUndefined();
    });

    it('ネットワークエラーが正しく構築されること', () => {
      const networkError: CalendarError = {
        type: 'network',
        message: 'サーバーに接続できません',
        details: { status: 500, statusText: 'Internal Server Error' }
      };

      expect(networkError.type).toBe('network');
      expect(networkError.message).toBe('サーバーに接続できません');
      expect(networkError.field).toBeUndefined();
      expect(networkError.details).toEqual({ status: 500, statusText: 'Internal Server Error' });
    });

    it('すべてのエラータイプが有効であること', () => {
      const errorTypes: CalendarError['type'][] = ['validation', 'network', 'permission', 'unknown'];
      
      errorTypes.forEach(type => {
        const error: CalendarError = {
          type,
          message: `${type} error`
        };
        expect(error.type).toBe(type);
      });
    });
  });

  describe('CalendarOperationResult 型の検証', () => {
    it('成功時のCalendarOperationResultが正しく構築されること', () => {
      const successResult: CalendarOperationResult<ScheduleItem> = {
        success: true,
        data: mockScheduleItem
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe(mockScheduleItem);
      expect(successResult.error).toBeUndefined();
    });

    it('失敗時のCalendarOperationResultが正しく構築されること', () => {
      const errorResult: CalendarOperationResult = {
        success: false,
        error: {
          type: 'validation',
          message: 'データが不正です',
          field: 'amount'
        }
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.data).toBeUndefined();
      expect(errorResult.error).toBeDefined();
      expect(errorResult.error?.type).toBe('validation');
      expect(errorResult.error?.message).toBe('データが不正です');
    });

    it('データなしの成功結果が正しく構築されること', () => {
      const voidResult: CalendarOperationResult<void> = {
        success: true
      };

      expect(voidResult.success).toBe(true);
      expect(voidResult.data).toBeUndefined();
      expect(voidResult.error).toBeUndefined();
    });
  });

  describe('型の互換性テスト', () => {
    it('ScheduleItemからScheduleDisplayItemへの変換が正しく行われること', () => {
      const scheduleDisplayItem: ScheduleDisplayItem = {
        id: mockScheduleItem.transactionId,
        amount: mockScheduleItem.amount,
        paymentType: mockScheduleItem.paymentType,
        bankName: mockScheduleItem.bankName,
        cardName: mockScheduleItem.cardName || '自動銀行振替',
        storeName: mockScheduleItem.storeName,
        usage: mockScheduleItem.usage,
        scheduleItem: mockScheduleItem
      };

      expect(scheduleDisplayItem.id).toBe(mockScheduleItem.transactionId);
      expect(scheduleDisplayItem.amount).toBe(mockScheduleItem.amount);
      expect(scheduleDisplayItem.paymentType).toBe(mockScheduleItem.paymentType);
      expect(scheduleDisplayItem.scheduleItem).toBe(mockScheduleItem);
    });

    it('TransactionからDayTransactionItemへの変換が正しく行われること', () => {
      const dayTransactionItem: DayTransactionItem = {
        id: mockTransaction.id,
        type: 'transaction',
        amount: mockTransaction.amount,
        storeName: mockTransaction.storeName,
        paymentType: mockTransaction.paymentType,
        transaction: mockTransaction
      };

      expect(dayTransactionItem.id).toBe(mockTransaction.id);
      expect(dayTransactionItem.type).toBe('transaction');
      expect(dayTransactionItem.amount).toBe(mockTransaction.amount);
      expect(dayTransactionItem.transaction).toBe(mockTransaction);
    });

    it('ScheduleItemからDayTransactionItemへの変換が正しく行われること', () => {
      const dayTransactionItem: DayTransactionItem = {
        id: mockScheduleItem.transactionId,
        type: 'schedule',
        amount: mockScheduleItem.amount,
        storeName: mockScheduleItem.storeName,
        paymentType: mockScheduleItem.paymentType,
        scheduleItem: mockScheduleItem
      };

      expect(dayTransactionItem.id).toBe(mockScheduleItem.transactionId);
      expect(dayTransactionItem.type).toBe('schedule');
      expect(dayTransactionItem.amount).toBe(mockScheduleItem.amount);
      expect(dayTransactionItem.scheduleItem).toBe(mockScheduleItem);
    });
  });

  describe('オプショナルフィールドのテスト', () => {
    it('ScheduleDisplayItemのオプショナルフィールドが正しく動作すること', () => {
      const minimalDisplayItem: ScheduleDisplayItem = {
        id: 'schedule-1',
        amount: 3000,
        paymentType: 'bank',
        bankName: 'Test Bank',
        cardName: '自動銀行振替',
        scheduleItem: mockScheduleItem
      };

      expect(minimalDisplayItem.storeName).toBeUndefined();
      expect(minimalDisplayItem.usage).toBeUndefined();
      expect(minimalDisplayItem.memo).toBeUndefined();
    });

    it('DayTransactionItemのオプショナルフィールドが正しく動作すること', () => {
      const minimalTransactionItem: DayTransactionItem = {
        id: 'trans-1',
        type: 'transaction',
        amount: 5000,
        paymentType: 'card'
      };

      expect(minimalTransactionItem.storeName).toBeUndefined();
      expect(minimalTransactionItem.bankName).toBeUndefined();
      expect(minimalTransactionItem.cardName).toBeUndefined();
      expect(minimalTransactionItem.transaction).toBeUndefined();
      expect(minimalTransactionItem.scheduleItem).toBeUndefined();
    });
  });
});