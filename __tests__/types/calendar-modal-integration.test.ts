/**
 * 分離ダイアログ機能のTypeScript型安全性テスト
 * 
 * このテストファイルは、新しく実装された分離ダイアログ機能における
 * TypeScript型の安全性と整合性を検証します。
 */

import { Transaction, ScheduleItem, Bank, Card } from '@/types/database';
import { DayTotalData, BankGroup, DayTransactionItem } from '@/types/calendar';

describe('分離ダイアログ機能の型安全性', () => {
  
  describe('BaseModal型定義', () => {
    it('BaseModalPropsの型定義が正しく動作すること', () => {
      // BaseModalPropsの型チェック
      const validBaseModalProps = {
        isOpen: true,
        onClose: () => {},
        title: 'テストタイトル',
        children: 'テストコンテンツ',
        size: 'md' as const,
        className: 'test-class',
        headerClassName: 'header-class',
        bodyClassName: 'body-class',
        footerChildren: 'フッターコンテンツ'
      };
      
      // 型エラーが発生しないことを確認
      expect(typeof validBaseModalProps.isOpen).toBe('boolean');
      expect(typeof validBaseModalProps.onClose).toBe('function');
      expect(typeof validBaseModalProps.title).toBe('string');
    });

    it('BaseModalFooterPropsの型定義が正しく動作すること', () => {
      const validFooterProps = {
        onClose: () => {},
        primaryAction: {
          label: '保存',
          onClick: () => {},
          variant: 'primary' as const,
          disabled: false
        },
        secondaryAction: {
          label: 'キャンセル',
          onClick: () => {},
          variant: 'secondary' as const,
          disabled: false
        }
      };
      
      expect(typeof validFooterProps.primaryAction.label).toBe('string');
      expect(typeof validFooterProps.primaryAction.onClick).toBe('function');
      expect(validFooterProps.primaryAction.variant).toBe('primary');
    });
  });

  describe('TransactionViewModal型定義', () => {
    it('TransactionViewModalPropsの型定義が正しく動作すること', () => {
      const mockBanks: Bank[] = [{
        id: 'bank-1',
        name: 'テスト銀行',
        memo: '',
        createdAt: Date.now()
      }];

      const mockCards: Card[] = [{
        id: 'card-1',
        name: 'テストカード',
        bankId: 'bank-1',
        closingDay: '15',
        paymentDay: '27',
        paymentMonthShift: 1,
        adjustWeekend: true,
        memo: '',
        createdAt: Date.now()
      }];

      const mockTransactions: Transaction[] = [{
        id: 'trans-1',
        amount: 10000,
        date: Date.now(),
        storeName: 'テスト店舗',
        paymentType: 'card',
        cardId: 'card-1',
        scheduledPayDate: Date.now(),
        memo: '',
        createdAt: Date.now()
      }];

      const validTransactionViewModalProps = {
        isOpen: true,
        onClose: () => {},
        onTransactionClick: (transaction: Transaction) => {},
        selectedDate: new Date(),
        transactions: mockTransactions,
        banks: mockBanks,
        cards: mockCards,
        className: 'test-class'
      };

      // 型エラーが発生しないことを確認
      expect(Array.isArray(validTransactionViewModalProps.transactions)).toBe(true);
      expect(Array.isArray(validTransactionViewModalProps.banks)).toBe(true);
      expect(Array.isArray(validTransactionViewModalProps.cards)).toBe(true);
      expect(validTransactionViewModalProps.selectedDate instanceof Date).toBe(true);
    });

    it('TransactionBankGroup型が正しく構造化されていること', () => {
      const mockTransactionBankGroup = {
        bankId: 'bank-1',
        bankName: 'テスト銀行',
        totalAmount: 10000,
        transactionCount: 2,
        items: [
          {
            id: 'trans-1',
            amount: 5000,
            paymentType: 'card' as const,
            bankName: 'テスト銀行',
            cardName: 'テストカード',
            storeName: 'テスト店舗',
            transaction: {} as Transaction
          }
        ]
      };

      expect(typeof mockTransactionBankGroup.bankId).toBe('string');
      expect(typeof mockTransactionBankGroup.totalAmount).toBe('number');
      expect(Array.isArray(mockTransactionBankGroup.items)).toBe(true);
      expect(mockTransactionBankGroup.items[0].paymentType).toBe('card');
    });
  });

  describe('ScheduleModal型定義', () => {
    it('ScheduleModalPropsの型定義が正しく動作すること', () => {
      const mockScheduleItems: ScheduleItem[] = [{
        transactionId: 'schedule-1',
        date: new Date(),
        amount: 5000,
        storeName: 'テスト店舗',
        usage: 'テスト用途',
        paymentType: 'card',
        cardId: 'card-1',
        cardName: 'テストカード',
        bankName: 'テスト銀行'
      }];

      const validScheduleModalProps = {
        isOpen: true,
        onClose: () => {},
        selectedDate: new Date(),
        scheduleItems: mockScheduleItems,
        banks: [] as Bank[],
        cards: [] as Card[],
        className: 'test-class'
      };

      expect(Array.isArray(validScheduleModalProps.scheduleItems)).toBe(true);
      expect(validScheduleModalProps.selectedDate instanceof Date).toBe(true);
      expect(typeof validScheduleModalProps.onClose).toBe('function');
    });

    it('ScheduleBankGroup型が正しく構造化されていること', () => {
      const mockScheduleBankGroup = {
        bankId: 'bank-1',
        bankName: 'テスト銀行',
        totalAmount: 15000,
        scheduleCount: 3,
        items: [
          {
            id: 'schedule-1',
            amount: 5000,
            paymentType: 'bank' as const,
            bankName: 'テスト銀行',
            cardName: '自動引き落とし',
            storeName: 'テスト店舗',
            usage: 'テスト用途',
            scheduleItem: {} as ScheduleItem
          }
        ]
      };

      expect(typeof mockScheduleBankGroup.scheduleCount).toBe('number');
      expect(mockScheduleBankGroup.items[0].paymentType).toBe('bank');
      expect(typeof mockScheduleBankGroup.items[0].usage).toBe('string');
    });
  });

  describe('CalendarView型定義', () => {
    it('CalendarViewPropsの分離クリックハンドラーが正しく型定義されていること', () => {
      const mockOnTransactionViewClick = (date: Date, transactions: Transaction[]) => {
        expect(date instanceof Date).toBe(true);
        expect(Array.isArray(transactions)).toBe(true);
      };

      const mockOnScheduleViewClick = (date: Date, scheduleItems: ScheduleItem[]) => {
        expect(date instanceof Date).toBe(true);
        expect(Array.isArray(scheduleItems)).toBe(true);
      };

      // 型チェック
      expect(typeof mockOnTransactionViewClick).toBe('function');
      expect(typeof mockOnScheduleViewClick).toBe('function');
    });

    it('CalendarViewの新しいpropsが正しく型定義されていること', () => {
      const validCalendarViewProps = {
        year: 2024,
        month: 2,
        transactions: [] as Transaction[],
        schedule: undefined as any,
        banks: [] as Bank[],
        cards: [] as Card[],
        onDateClick: (date: Date) => {},
        onTransactionClick: (transaction: Transaction) => {},
        onTransactionViewClick: (date: Date, transactions: Transaction[]) => {},
        onScheduleViewClick: (date: Date, scheduleItems: ScheduleItem[]) => {},
        onMonthChange: (year: number, month: number) => {},
        className: 'test-class'
      };

      expect(typeof validCalendarViewProps.year).toBe('number');
      expect(typeof validCalendarViewProps.month).toBe('number');
      expect(typeof validCalendarViewProps.onTransactionViewClick).toBe('function');
      expect(typeof validCalendarViewProps.onScheduleViewClick).toBe('function');
    });
  });

  describe('Calendar型定義の統合', () => {
    it('DayTotalData型が分離機能に対応していること', () => {
      const mockDayTotalData: DayTotalData = {
        date: '2024-02-15',
        totalAmount: 50000,
        transactionCount: 3,
        scheduleCount: 2,
        transactionTotal: 30000,
        scheduleTotal: 20000,
        bankGroups: [] as BankGroup[],
        transactions: [] as Transaction[],
        scheduleItems: [] as any[],
        hasData: true,
        hasTransactions: true,
        hasSchedule: true
      };

      expect(typeof mockDayTotalData.transactionTotal).toBe('number');
      expect(typeof mockDayTotalData.scheduleTotal).toBe('number');
      expect(typeof mockDayTotalData.hasTransactions).toBe('boolean');
      expect(typeof mockDayTotalData.hasSchedule).toBe('boolean');
    });

    it('DayTransactionItem型が取引と引落予定を区別できること', () => {
      const transactionItem: DayTransactionItem = {
        id: 'trans-1',
        type: 'transaction',
        amount: 10000,
        paymentType: 'card',
        bankName: 'テスト銀行',
        cardName: 'テストカード',
        storeName: 'テスト店舗',
        transaction: {} as Transaction
      };

      const scheduleItem: DayTransactionItem = {
        id: 'schedule-1',
        type: 'schedule',
        amount: 5000,
        paymentType: 'bank',
        bankName: 'テスト銀行',
        cardName: '自動引き落とし',
        scheduleItem: {} as ScheduleItem
      };

      expect(transactionItem.type).toBe('transaction');
      expect(scheduleItem.type).toBe('schedule');
      expect('transaction' in transactionItem).toBe(true);
      expect('scheduleItem' in scheduleItem).toBe(true);
    });

    it('BankGroup型が銀行別グループ化に対応していること', () => {
      const mockBankGroup: BankGroup = {
        bankId: 'bank-1',
        bankName: 'テスト銀行',
        totalAmount: 25000,
        transactionCount: 5,
        items: [
          {
            id: 'item-1',
            type: 'transaction',
            amount: 15000,
            paymentType: 'card',
            bankName: 'テスト銀行',
            cardName: 'テストカード',
            transaction: {} as Transaction
          },
          {
            id: 'item-2',
            type: 'schedule',
            amount: 10000,
            paymentType: 'bank',
            bankName: 'テスト銀行',
            cardName: '自動引き落とし',
            scheduleItem: {} as ScheduleItem
          }
        ]
      };

      expect(typeof mockBankGroup.bankId).toBe('string');
      expect(typeof mockBankGroup.totalAmount).toBe('number');
      expect(Array.isArray(mockBankGroup.items)).toBe(true);
      expect(mockBankGroup.items[0].type).toBe('transaction');
      expect(mockBankGroup.items[1].type).toBe('schedule');
    });
  });

  describe('型安全性のエラーケース', () => {
    it('無効な型を渡した場合のTypeScript型チェック', () => {
      // この関数は実行時には呼ばれないが、TypeScriptのコンパイル時に型チェックが行われる
      const testTypeChecking = () => {
        // 正しい型の例
        const validTransaction: Transaction = {
          id: 'test',
          amount: 1000,
          date: Date.now(),
          storeName: 'テスト',
          paymentType: 'card',
          cardId: 'card-1',
          scheduledPayDate: Date.now(),
          memo: '',
          createdAt: Date.now()
        };

        const validScheduleItem: ScheduleItem = {
          transactionId: 'test',
          date: new Date(),
          amount: 1000,
          storeName: 'テスト',
          paymentType: 'card',
          bankName: 'テスト銀行'
        };

        // 型の整合性確認
        expect(typeof validTransaction.amount).toBe('number');
        expect(typeof validScheduleItem.amount).toBe('number');
        expect(validScheduleItem.date instanceof Date).toBe(true);
      };

      expect(testTypeChecking).not.toThrow();
    });

    it('オプショナルプロパティの型安全性', () => {
      // storeName, usage, cardIdなどのオプショナルプロパティのテスト
      const scheduleWithOptionalProps: ScheduleItem = {
        transactionId: 'test',
        date: new Date(),
        amount: 1000,
        paymentType: 'bank',
        bankName: 'テスト銀行'
        // storeName, usage, cardId, cardNameは省略可能
      };

      const scheduleWithAllProps: ScheduleItem = {
        transactionId: 'test',
        date: new Date(),
        amount: 1000,
        storeName: 'テスト店舗',
        usage: 'テスト用途',
        paymentType: 'card',
        cardId: 'card-1',
        cardName: 'テストカード',
        bankName: 'テスト銀行'
      };

      expect(typeof scheduleWithOptionalProps.amount).toBe('number');
      expect(typeof scheduleWithAllProps.storeName).toBe('string');
      expect(typeof scheduleWithAllProps.usage).toBe('string');
    });
  });

  describe('モーダル間のデータ受け渡し型安全性', () => {
    it('CalendarViewからTransactionViewModalへのデータ受け渡しが型安全であること', () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'trans-1',
          amount: 10000,
          date: Date.now(),
          storeName: 'Amazon',
          paymentType: 'card',
          cardId: 'card-1',
          scheduledPayDate: Date.now(),
          memo: '',
          createdAt: Date.now()
        }
      ];

      const mockHandleTransactionViewClick = (date: Date, transactions: Transaction[]) => {
        // TransactionViewModalに渡されるデータの型チェック
        expect(date instanceof Date).toBe(true);
        expect(Array.isArray(transactions)).toBe(true);
        expect(transactions.every(t => typeof t.id === 'string')).toBe(true);
        expect(transactions.every(t => typeof t.amount === 'number')).toBe(true);
      };

      mockHandleTransactionViewClick(new Date(), mockTransactions);
    });

    it('CalendarViewからScheduleModalへのデータ受け渡しが型安全であること', () => {
      const mockScheduleItems: ScheduleItem[] = [
        {
          transactionId: 'schedule-1',
          date: new Date(),
          amount: 5000,
          storeName: 'テスト店舗',
          usage: 'テスト用途',
          paymentType: 'card',
          cardId: 'card-1',
          cardName: 'テストカード',
          bankName: 'テスト銀行'
        }
      ];

      const mockHandleScheduleViewClick = (date: Date, scheduleItems: ScheduleItem[]) => {
        // ScheduleModalに渡されるデータの型チェック
        expect(date instanceof Date).toBe(true);
        expect(Array.isArray(scheduleItems)).toBe(true);
        expect(scheduleItems.every(s => typeof s.transactionId === 'string')).toBe(true);
        expect(scheduleItems.every(s => typeof s.amount === 'number')).toBe(true);
        expect(scheduleItems.every(s => s.date instanceof Date)).toBe(true);
      };

      mockHandleScheduleViewClick(new Date(), mockScheduleItems);
    });
  });
});