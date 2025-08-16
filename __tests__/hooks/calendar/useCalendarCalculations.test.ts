import { renderHook } from '@testing-library/react';
import { useCalendarCalculations } from '@/lib/hooks/calendar/useCalendarCalculations';
import { Transaction, ScheduleItem } from '@/types/database';

/**
 * useCalendarCalculations基本機能テスト
 * フェーズ1リファクタリング後のカレンダー計算フック動作確認用
 */
describe('useCalendarCalculations - 基本機能テスト', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      date: new Date('2024-02-15').getTime(),
      amount: 15000,
      storeName: 'コンビニA',
      paymentType: 'card',
      cardId: 'card-1',
      usage: '食費',
      memo: 'テスト取引1',
      createdAt: new Date().getTime()
    },
    {
      id: 'trans-2',
      date: new Date('2024-02-15').getTime(),
      amount: 8000,
      storeName: '銀行取引',
      paymentType: 'bank',
      bankId: 'bank-1',
      usage: '水道代',
      memo: 'テスト取引2',
      createdAt: new Date().getTime()
    },
    {
      id: 'trans-3',
      date: new Date('2024-02-20').getTime(),
      amount: 25000,
      storeName: 'デパート',
      paymentType: 'card',
      cardId: 'card-2',
      usage: '衣料品',
      memo: 'テスト取引3',
      createdAt: new Date().getTime()
    }
  ];

  const mockScheduleItems: ScheduleItem[] = [
    {
      transactionId: 'schedule-1',
      date: new Date('2024-02-15'),
      amount: 5000,
      paymentType: 'bank',
      bankName: 'テスト銀行',
      storeName: 'ガス代',
      isScheduleEditable: true
    },
    {
      transactionId: 'schedule-2',
      date: new Date('2024-02-28'),
      amount: 12000,
      paymentType: 'card',
      bankName: 'カード銀行',
      storeName: '電気代',
      isScheduleEditable: true
    }
  ];

  describe('基本的な計算機能', () => {
    it('日別合計データが正しく計算されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, mockScheduleItems)
      );

      const totals = result.current.dayTotals;
      
      // 2024-02-15のデータを確認
      const feb15Data = totals.get('2024-02-15');
      expect(feb15Data).toBeDefined();
      expect(feb15Data?.totalAmount).toBe(28000); // 15000 + 8000 + 5000
      expect(feb15Data?.transactionTotal).toBe(23000); // 15000 + 8000
      expect(feb15Data?.cardTransactionTotal).toBe(15000); // カード取引のみ
      expect(feb15Data?.bankTransactionTotal).toBe(8000); // 銀行取引のみ
      expect(feb15Data?.scheduleTotal).toBe(5000); // 引落予定
      expect(feb15Data?.transactionCount).toBe(2);
      expect(feb15Data?.scheduleCount).toBe(1);
      expect(feb15Data?.hasData).toBe(true);
      expect(feb15Data?.hasTransactions).toBe(true);
      expect(feb15Data?.hasCardTransactions).toBe(true);
      expect(feb15Data?.hasBankTransactions).toBe(true);
      expect(feb15Data?.hasSchedule).toBe(true);
    });

    it('取引データのみの日が正しく計算されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, mockScheduleItems)
      );

      const totals = result.current.dayTotals;
      
      // 2024-02-20のデータを確認（取引のみ）
      const feb20Data = totals.get('2024-02-20');
      expect(feb20Data).toBeDefined();
      expect(feb20Data?.totalAmount).toBe(25000);
      expect(feb20Data?.transactionTotal).toBe(25000);
      expect(feb20Data?.cardTransactionTotal).toBe(25000);
      expect(feb20Data?.bankTransactionTotal).toBe(0);
      expect(feb20Data?.scheduleTotal).toBe(0);
      expect(feb20Data?.transactionCount).toBe(1);
      expect(feb20Data?.scheduleCount).toBe(0);
      expect(feb20Data?.hasData).toBe(true);
      expect(feb20Data?.hasTransactions).toBe(true);
      expect(feb20Data?.hasCardTransactions).toBe(true);
      expect(feb20Data?.hasBankTransactions).toBe(false);
      expect(feb20Data?.hasSchedule).toBe(false);
    });

    it('引落予定データのみの日が正しく計算されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, mockScheduleItems)
      );

      const totals = result.current.dayTotals;
      
      // 2024-02-28のデータを確認（引落予定のみ）
      const feb28Data = totals.get('2024-02-28');
      expect(feb28Data).toBeDefined();
      expect(feb28Data?.totalAmount).toBe(12000);
      expect(feb28Data?.transactionTotal).toBe(0);
      expect(feb28Data?.cardTransactionTotal).toBe(0);
      expect(feb28Data?.bankTransactionTotal).toBe(0);
      expect(feb28Data?.scheduleTotal).toBe(12000);
      expect(feb28Data?.transactionCount).toBe(0);
      expect(feb28Data?.scheduleCount).toBe(1);
      expect(feb28Data?.hasData).toBe(true);
      expect(feb28Data?.hasTransactions).toBe(false);
      expect(feb28Data?.hasCardTransactions).toBe(false);
      expect(feb28Data?.hasBankTransactions).toBe(false);
      expect(feb28Data?.hasSchedule).toBe(true);
    });
  });

  describe('月間合計計算', () => {
    it('月間合計が正しく計算されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, mockScheduleItems)
      );

      expect(result.current.monthTotal).toBe(65000); // 全ての取引+引落予定の合計
    });

    it('データがある日数が正しくカウントされること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, mockScheduleItems)
      );

      expect(result.current.dayCount).toBe(3); // 2/15, 2/20, 2/28
    });
  });

  describe('空データのケース', () => {
    it('取引も引落予定もない場合、適切な初期値が返されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations([], [])
      );

      expect(result.current.dayTotals.size).toBe(0);
      expect(result.current.monthTotal).toBe(0);
      expect(result.current.dayCount).toBe(0);
    });

    it('取引のみでスケジュールがない場合、正しく処理されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations(mockTransactions, [])
      );

      const totals = result.current.dayTotals;
      expect(totals.size).toBe(2); // 2/15と2/20のみ
      
      const feb15Data = totals.get('2024-02-15');
      expect(feb15Data?.hasSchedule).toBe(false);
      expect(feb15Data?.scheduleTotal).toBe(0);
      expect(feb15Data?.scheduleCount).toBe(0);
    });

    it('スケジュールのみで取引がない場合、正しく処理されること', () => {
      const { result } = renderHook(() => 
        useCalendarCalculations([], mockScheduleItems)
      );

      const totals = result.current.dayTotals;
      expect(totals.size).toBe(2); // 2/15と2/28のみ
      
      const feb15Data = totals.get('2024-02-15');
      expect(feb15Data?.hasTransactions).toBe(false);
      expect(feb15Data?.transactionTotal).toBe(0);
      expect(feb15Data?.transactionCount).toBe(0);
    });
  });

  describe('パフォーマンス', () => {
    it('大量のデータでも適切に処理されること', () => {
      const largeTransactions: Transaction[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `trans-${i}`,
        date: new Date('2024-02-01').getTime() + (i * 24 * 60 * 60 * 1000), // 日付を順次増加
        amount: 1000 + i,
        storeName: `店舗${i}`,
        paymentType: i % 2 === 0 ? 'card' : 'bank',
        cardId: i % 2 === 0 ? `card-${i}` : undefined,
        bankId: i % 2 === 1 ? `bank-${i}` : undefined,
        usage: 'テスト用途',
        memo: `テストメモ${i}`,
        createdAt: new Date().getTime()
      }));

      const startTime = performance.now();
      const { result } = renderHook(() => 
        useCalendarCalculations(largeTransactions, [])
      );
      const endTime = performance.now();

      expect(result.current.dayTotals.size).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内で処理完了
    });
  });
});