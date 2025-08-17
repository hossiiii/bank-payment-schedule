import {
  DayTransactionItem,
  BankGroup,
  PaymentItem,
  DayTotalData,
  CalendarDayDisplay,
  CalendarTotalsResult
} from '@/types/calendar';
import { Transaction, ScheduleItem } from '@/types/database';

describe('Calendar Types', () => {
  describe('DayTransactionItem', () => {
    it('トランザクションタイプのアイテムが正しく構築されること', () => {
      const transaction: Transaction = {
        id: 'trans-1',
        amount: 15000,
        date: Date.now(),
        storeName: 'Amazon',
        paymentType: 'card',
        cardId: 'card-1',
        scheduledPayDate: Date.now(),
        memo: '',
        createdAt: Date.now()
      };

      const item: DayTransactionItem = {
        id: 'trans-1',
        type: 'transaction',
        amount: 15000,
        paymentType: 'card',
        bankName: 'SBIネット銀行',
        cardName: 'PayPayカード',
        transaction,
        storeName: 'Amazon'
      };

      expect(item.id).toBe('trans-1');
      expect(item.type).toBe('transaction');
      expect(item.amount).toBe(15000);
      expect(item.paymentType).toBe('card');
      expect(item.bankName).toBe('SBIネット銀行');
      expect(item.cardName).toBe('PayPayカード');
      expect(item.transaction).toBe(transaction);
      expect(item.storeName).toBe('Amazon');
    });

    it('スケジュールタイプのアイテムが正しく構築されること', () => {
      const scheduleItem: ScheduleItem = {
        transactionId: 'schedule-1',
        date: new Date(),
        amount: 5000,
        storeName: 'ガス代',
        paymentType: 'bank',
        bankName: 'SBIネット銀行'
        // memo: '' // ScheduleItemにはmemoプロパティが存在しない
      };

      const item: DayTransactionItem = {
        id: 'schedule-1',
        type: 'schedule',
        amount: 5000,
        paymentType: 'bank',
        bankName: 'SBIネット銀行',
        cardName: '自動銀行振替',
        scheduleItem,
        storeName: 'ガス代'
      };

      expect(item.id).toBe('schedule-1');
      expect(item.type).toBe('schedule');
      expect(item.amount).toBe(5000);
      expect(item.paymentType).toBe('bank');
      expect(item.bankName).toBe('SBIネット銀行');
      expect(item.cardName).toBe('自動銀行振替');
      expect(item.scheduleItem).toBe(scheduleItem);
      expect(item.storeName).toBe('ガス代');
    });

    it('オプショナルプロパティが未定義でも構築できること', () => {
      const item: DayTransactionItem = {
        id: 'trans-2',
        type: 'transaction',
        amount: 10000,
        paymentType: 'bank',
        bankName: 'りそな銀行'
      };

      expect(item.id).toBe('trans-2');
      expect(item.type).toBe('transaction');
      expect(item.amount).toBe(10000);
      expect(item.paymentType).toBe('bank');
      expect(item.bankName).toBe('りそな銀行');
      expect(item.cardName).toBeUndefined();
      expect(item.storeName).toBeUndefined();
      expect(item.transaction).toBeUndefined();
      expect(item.scheduleItem).toBeUndefined();
    });
  });

  describe('BankGroup', () => {
    it('銀行グループが正しく構築されること', () => {
      const items: DayTransactionItem[] = [
        {
          id: 'trans-1',
          type: 'transaction',
          amount: 15000,
          paymentType: 'card',
          bankName: 'SBIネット銀行',
          cardName: 'PayPayカード'
        },
        {
          id: 'trans-2',
          type: 'transaction',
          amount: 8000,
          paymentType: 'bank',
          bankName: 'SBIネット銀行',
          cardName: '自動銀行振替'
        }
      ];

      const bankGroup: BankGroup = {
        bankId: 'bank-1',
        bankName: 'SBIネット銀行',
        totalAmount: 23000,
        transactionCount: 2,
        items
      };

      expect(bankGroup.bankId).toBe('bank-1');
      expect(bankGroup.bankName).toBe('SBIネット銀行');
      expect(bankGroup.totalAmount).toBe(23000);
      expect(bankGroup.transactionCount).toBe(2);
      expect(bankGroup.items).toHaveLength(2);
      expect(bankGroup.items[0]?.amount).toBe(15000);
      expect(bankGroup.items[1]?.amount).toBe(8000);
    });

    it('空のアイテムリストでも構築できること', () => {
      const bankGroup: BankGroup = {
        bankId: 'bank-2',
        bankName: 'りそな銀行',
        totalAmount: 0,
        transactionCount: 0,
        items: []
      };

      expect(bankGroup.bankId).toBe('bank-2');
      expect(bankGroup.bankName).toBe('りそな銀行');
      expect(bankGroup.totalAmount).toBe(0);
      expect(bankGroup.transactionCount).toBe(0);
      expect(bankGroup.items).toHaveLength(0);
    });
  });

  describe('PaymentItem', () => {
    it('カード支払いのPaymentItemが正しく構築されること', () => {
      const paymentItem: PaymentItem = {
        type: 'payment',
        bankName: 'SBIネット銀行',
        cardName: 'PayPayカード',
        paymentType: 'card',
        amount: 15000,
        storeName: 'Amazon'
      };

      expect(paymentItem.type).toBe('payment');
      expect(paymentItem.bankName).toBe('SBIネット銀行');
      expect(paymentItem.cardName).toBe('PayPayカード');
      expect(paymentItem.paymentType).toBe('card');
      expect(paymentItem.amount).toBe(15000);
      expect(paymentItem.storeName).toBe('Amazon');
    });

    it('銀行引落のPaymentItemが正しく構築されること', () => {
      const paymentItem: PaymentItem = {
        type: 'payment',
        bankName: 'りそな銀行',
        paymentType: 'bank',
        amount: 5000
      };

      expect(paymentItem.type).toBe('payment');
      expect(paymentItem.bankName).toBe('りそな銀行');
      expect(paymentItem.paymentType).toBe('bank');
      expect(paymentItem.amount).toBe(5000);
      expect(paymentItem.cardName).toBeUndefined();
      expect(paymentItem.storeName).toBeUndefined();
    });
  });

  describe('DayTotalData', () => {
    it('完全なDayTotalDataが正しく構築されること（分離データ対応）', () => {
      const transactions: Transaction[] = [
        {
          id: 'trans-1',
          amount: 15000,
          date: Date.now(),
          storeName: 'Amazon',
          paymentType: 'card',
          cardId: 'card-1',
          scheduledPayDate: Date.now(),
          memo: '',
          createdAt: Date.now()
        }
      ];

      const scheduleItems: ScheduleItem[] = [
        {
          transactionId: 'schedule-1',
          date: new Date(),
          amount: 5000,
          storeName: 'ガス代',
          paymentType: 'bank',
          bankName: 'SBIネット銀行'
          // memo: '' // ScheduleItemにはmemoプロパティが存在しない
        }
      ];

      const bankGroups: BankGroup[] = [
        {
          bankId: 'bank-1',
          bankName: 'SBIネット銀行',
          totalAmount: 20000,
          transactionCount: 2,
          items: []
        }
      ];

      const dayTotalData: DayTotalData = {
        date: '2024-02-15',
        totalAmount: 20000, // 総合計
        transactionTotal: 15000, // 取引合計
        cardTransactionTotal: 15000, // カード払い合計
        bankTransactionTotal: 0, // 銀行引落合計
        scheduleTotal: 5000, // 引落予定合計
        transactionCount: 1,
        scheduleCount: 1,
        bankGroups,
        transactions,
        scheduleItems,
        hasData: true,
        hasTransactions: true, // 取引データあり
        hasCardTransactions: true, // カード払いデータあり
        hasBankTransactions: false, // 銀行引落データなし
        hasSchedule: true // 引落予定データあり
      };

      expect(dayTotalData.date).toBe('2024-02-15');
      expect(dayTotalData.totalAmount).toBe(20000);
      expect(dayTotalData.transactionTotal).toBe(15000);
      expect(dayTotalData.scheduleTotal).toBe(5000);
      expect(dayTotalData.transactionCount).toBe(1);
      expect(dayTotalData.scheduleCount).toBe(1);
      expect(dayTotalData.hasTransactions).toBe(true);
      expect(dayTotalData.hasSchedule).toBe(true);
      expect(dayTotalData.bankGroups).toHaveLength(1);
      expect(dayTotalData.transactions).toHaveLength(1);
      expect(dayTotalData.scheduleItems).toHaveLength(1);
      expect(dayTotalData.hasData).toBe(true);
    });

    it('空のDayTotalDataが正しく構築されること', () => {
      const dayTotalData: DayTotalData = {
        date: '2024-02-20',
        totalAmount: 0,
        transactionTotal: 0,
        cardTransactionTotal: 0,
        bankTransactionTotal: 0,
        scheduleTotal: 0,
        transactionCount: 0,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: false,
        hasTransactions: false,
        hasCardTransactions: false,
        hasBankTransactions: false,
        hasSchedule: false
      };

      expect(dayTotalData.date).toBe('2024-02-20');
      expect(dayTotalData.totalAmount).toBe(0);
      expect(dayTotalData.transactionTotal).toBe(0);
      expect(dayTotalData.scheduleTotal).toBe(0);
      expect(dayTotalData.transactionCount).toBe(0);
      expect(dayTotalData.scheduleCount).toBe(0);
      expect(dayTotalData.hasTransactions).toBe(false);
      expect(dayTotalData.hasSchedule).toBe(false);
      expect(dayTotalData.bankGroups).toHaveLength(0);
      expect(dayTotalData.transactions).toHaveLength(0);
      expect(dayTotalData.scheduleItems).toHaveLength(0);
      expect(dayTotalData.hasData).toBe(false);
    });

    it('取引データのみの場合のDayTotalDataが正しく構築されること', () => {
      const dayTotalData: DayTotalData = {
        date: '2024-02-25',
        totalAmount: 12000,
        transactionTotal: 12000,
        scheduleTotal: 0,
        transactionCount: 2,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: false
      };

      expect(dayTotalData.hasTransactions).toBe(true);
      expect(dayTotalData.hasSchedule).toBe(false);
      expect(dayTotalData.transactionTotal).toBe(12000);
      expect(dayTotalData.scheduleTotal).toBe(0);
      expect(dayTotalData.totalAmount).toBe(12000);
    });

    it('引落予定データのみの場合のDayTotalDataが正しく構築されること', () => {
      const dayTotalData: DayTotalData = {
        date: '2024-02-28',
        totalAmount: 8000,
        transactionTotal: 0,
        scheduleTotal: 8000,
        transactionCount: 0,
        scheduleCount: 2,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: false,
        hasSchedule: true
      };

      expect(dayTotalData.hasTransactions).toBe(false);
      expect(dayTotalData.hasSchedule).toBe(true);
      expect(dayTotalData.transactionTotal).toBe(0);
      expect(dayTotalData.scheduleTotal).toBe(8000);
      expect(dayTotalData.totalAmount).toBe(8000);
    });
  });

  describe('CalendarDayDisplay', () => {
    it('表示設定が正しく構築されること', () => {
      const displayConfig: CalendarDayDisplay = {
        showIndividualItems: true,
        maxItemsVisible: 3,
        showTotalWhenMultiple: false
      };

      expect(displayConfig.showIndividualItems).toBe(true);
      expect(displayConfig.maxItemsVisible).toBe(3);
      expect(displayConfig.showTotalWhenMultiple).toBe(false);
    });

    it('異なる表示設定が正しく構築されること', () => {
      const displayConfig: CalendarDayDisplay = {
        showIndividualItems: false,
        maxItemsVisible: 5,
        showTotalWhenMultiple: true
      };

      expect(displayConfig.showIndividualItems).toBe(false);
      expect(displayConfig.maxItemsVisible).toBe(5);
      expect(displayConfig.showTotalWhenMultiple).toBe(true);
    });
  });

  describe('CalendarTotalsResult', () => {
    it('カレンダー合計結果が正しく構築されること', () => {
      const totals = new Map<string, DayTotalData>();
      totals.set('2024-02-15', {
        date: '2024-02-15',
        totalAmount: 20000,
        transactionCount: 2,
        scheduleCount: 1,
        transactionTotal: 15000,
        scheduleTotal: 5000,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: true
      });
      totals.set('2024-02-20', {
        date: '2024-02-20',
        totalAmount: 15000,
        transactionCount: 1,
        scheduleCount: 0,
        transactionTotal: 15000,
        scheduleTotal: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: false
      });

      const result: CalendarTotalsResult = {
        totals,
        monthTotal: 35000,
        dayCount: 2
      };

      expect(result.totals.size).toBe(2);
      expect(result.totals.get('2024-02-15')?.totalAmount).toBe(20000);
      expect(result.totals.get('2024-02-20')?.totalAmount).toBe(15000);
      expect(result.monthTotal).toBe(35000);
      expect(result.dayCount).toBe(2);
    });

    it('空の合計結果が正しく構築されること', () => {
      const result: CalendarTotalsResult = {
        totals: new Map(),
        monthTotal: 0,
        dayCount: 0
      };

      expect(result.totals.size).toBe(0);
      expect(result.monthTotal).toBe(0);
      expect(result.dayCount).toBe(0);
    });
  });

  describe('型の整合性テスト', () => {
    it('DayTransactionItemのpaymentTypeがPaymentItemと一致すること', () => {
      const cardPayment: DayTransactionItem = {
        id: 'test',
        type: 'transaction',
        amount: 1000,
        paymentType: 'card',
        bankName: 'テスト銀行'
      };

      const bankPayment: PaymentItem = {
        type: 'payment',
        bankName: 'テスト銀行',
        paymentType: 'bank',
        amount: 1000
      };

      // paymentTypeの値が一致していることを確認
      expect(['card', 'bank']).toContain(cardPayment.paymentType);
      expect(['card', 'bank']).toContain(bankPayment.paymentType);
    });

    it('日付文字列形式が一貫していること', () => {
      const dayTotalData: DayTotalData = {
        date: '2024-02-15',
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

      // ISO日付形式（YYYY-MM-DD）であることを確認
      expect(dayTotalData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});