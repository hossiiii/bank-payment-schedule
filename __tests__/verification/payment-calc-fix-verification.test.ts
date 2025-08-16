import {
  calculateCardPaymentDate,
  calculateBankPaymentDate,
  validateCardConfiguration
} from '@/lib/utils/paymentCalc';
import { Card } from '@/types/database';
import { createJapanDate, isNonBusinessDay } from '@/lib/utils/dateUtils';

/**
 * 修正後の動作検証テスト
 * 
 * 以下の修正内容を検証：
 * 1. adjustWeekendのデフォルト値がfalseに変更
 * 2. UI改善（カード設定、取引作成画面）
 * 3. データ修正ユーティリティの追加
 * 4. 週末調整の影響表示強化
 */
describe('Payment Calculation Fix Verification', () => {
  
  describe('基本計算ロジックの検証', () => {
    /**
     * 検証項目1: 基本計算ロジック
     * - カード設定: 10日締め、月末支払い、翌月払い、adjustWeekend: false
     * - 取引日: 2025/7/1
     * - 期待結果: 2025/8/31
     */
    it('should calculate correct payment date for specified test case', () => {
      const testCard: Card = {
        id: 'test-card-basic',
        name: '基本検証カード',
        bankId: 'test-bank',
        closingDay: '10',
        paymentDay: '月末',
        paymentMonthShift: 1, // 翌月払い
        adjustWeekend: false,
        createdAt: Date.now()
      };

      const transactionDate = createJapanDate(2025, 7, 1);
      const result = calculateCardPaymentDate(transactionDate, testCard);

      // 期待結果: 2025年8月31日
      expect(result.scheduledPayDate.getFullYear()).toBe(2025);
      expect(result.scheduledPayDate.getMonth()).toBe(7); // August (0-indexed)
      expect(result.scheduledPayDate.getDate()).toBe(31);
      expect(result.paymentCycle.isAdjusted).toBe(false);
    });

    it('should verify calculation logic with multiple closing days', () => {
      const testCases = [
        {
          closingDay: '5',
          transactionDate: createJapanDate(2025, 7, 3), // Before closing
          expectedMonth: 7, // August
        },
        {
          closingDay: '5',
          transactionDate: createJapanDate(2025, 7, 7), // After closing
          expectedMonth: 8, // September
        },
        {
          closingDay: '月末',
          transactionDate: createJapanDate(2025, 7, 15),
          expectedMonth: 7, // August (before month-end)
        }
      ];

      testCases.forEach(({ closingDay, transactionDate, expectedMonth }) => {
        const card: Card = {
          id: 'test-card',
          name: 'テストカード',
          bankId: 'test-bank',
          closingDay,
          paymentDay: '月末',
          paymentMonthShift: 1,
          adjustWeekend: false,
          createdAt: Date.now()
        };

        const result = calculateCardPaymentDate(transactionDate, card);
        expect(result.scheduledPayDate.getMonth()).toBe(expectedMonth);
      });
    });
  });

  describe('週末調整オプションの動作確認', () => {
    /**
     * 検証項目2: 週末調整オプション
     * - adjustWeekend: true の場合: 2025/8/31 → 2025/9/1
     * - adjustWeekend: false の場合: 2025/8/31（そのまま）
     */
    it('should verify weekend adjustment behavior', () => {
      const baseCard: Card = {
        id: 'weekend-test-card',
        name: '週末調整検証カード',
        bankId: 'test-bank',
        closingDay: '10',
        paymentDay: '月末',
        paymentMonthShift: 1,
        adjustWeekend: false, // Initially false
        createdAt: Date.now()
      };

      const transactionDate = createJapanDate(2025, 7, 1);

      // adjustWeekend: false の場合
      const resultNoAdjust = calculateCardPaymentDate(transactionDate, baseCard);
      expect(resultNoAdjust.scheduledPayDate.getDate()).toBe(31); // 8/31のまま
      expect(resultNoAdjust.paymentCycle.isAdjusted).toBe(false);

      // adjustWeekend: true の場合
      const adjustCard = { ...baseCard, adjustWeekend: true };
      const resultWithAdjust = calculateCardPaymentDate(transactionDate, adjustCard);
      
      // 2025年8月31日が週末かどうかチェック
      const august31 = createJapanDate(2025, 8, 31);
      if (isNonBusinessDay(august31)) {
        // 週末調整により、次の平日（9月1日以降）に調整される
        expect(resultWithAdjust.scheduledPayDate.getMonth()).toBe(8); // September (0-indexed)
        expect(resultWithAdjust.scheduledPayDate.getDate()).toBeGreaterThanOrEqual(1);
        expect(resultWithAdjust.paymentCycle.isAdjusted).toBe(true);
      } else {
        expect(resultWithAdjust.scheduledPayDate.getDate()).toBe(31);
        expect(resultWithAdjust.paymentCycle.isAdjusted).toBe(false);
      }
    });

    it('should test weekend adjustment with known weekend dates', () => {
      // 2025年1月4日は土曜日
      const saturdayCard: Card = {
        id: 'saturday-test',
        name: '土曜日テスト',
        bankId: 'test-bank',
        closingDay: '25',
        paymentDay: '4',
        paymentMonthShift: 1,
        adjustWeekend: true,
        createdAt: Date.now()
      };

      const transactionDate = createJapanDate(2024, 12, 20);
      const result = calculateCardPaymentDate(transactionDate, saturdayCard);

      // 1月4日（土曜日）から次の平日に調整されているはず
      expect(result.scheduledPayDate.getDate()).toBeGreaterThan(4);
      expect(result.paymentCycle.isAdjusted).toBe(true);
    });
  });

  describe('銀行引落の週末調整', () => {
    it('should verify bank payment weekend adjustment', () => {
      const saturday = createJapanDate(2025, 1, 4); // 土曜日

      // adjustWeekend: false
      const resultNoAdjust = calculateBankPaymentDate(saturday, false);
      expect(resultNoAdjust.scheduledPayDate.getTime()).toBe(saturday.getTime());
      expect(resultNoAdjust.paymentCycle.isAdjusted).toBe(false);

      // adjustWeekend: true
      const resultWithAdjust = calculateBankPaymentDate(saturday, true);
      expect(resultWithAdjust.scheduledPayDate.getDate()).toBeGreaterThan(4);
      expect(resultWithAdjust.paymentCycle.isAdjusted).toBe(true);
    });
  });

  describe('エッジケーステスト', () => {
    it('should handle month-end dates across different months', () => {
      const testCases = [
        { year: 2024, month: 2, expectedDay: 29 }, // Leap year February
        { year: 2025, month: 2, expectedDay: 28 }, // Non-leap year February
        { year: 2025, month: 4, expectedDay: 30 }, // April (30 days)
        { year: 2025, month: 12, expectedDay: 31 }, // December (31 days)
      ];

      testCases.forEach(({ year, month, expectedDay }) => {
        const card: Card = {
          id: 'month-end-test',
          name: '月末テスト',
          bankId: 'test-bank',
          closingDay: '15',
          paymentDay: '月末',
          paymentMonthShift: 1,
          adjustWeekend: false,
          createdAt: Date.now()
        };

        const transactionDate = createJapanDate(year, month, 10);
        const result = calculateCardPaymentDate(transactionDate, card);
        
        // Next month's last day
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        
        expect(result.scheduledPayDate.getFullYear()).toBe(nextYear);
        expect(result.scheduledPayDate.getMonth()).toBe(nextMonth === 12 ? 11 : nextMonth - 1);
        
        // February edge case check
        if (nextMonth === 2) {
          expect(result.scheduledPayDate.getDate()).toBe(expectedDay);
        }
      });
    });

    it('should handle year boundary transitions', () => {
      const card: Card = {
        id: 'year-boundary-test',
        name: '年境界テスト',
        bankId: 'test-bank',
        closingDay: '15',
        paymentDay: '25',
        paymentMonthShift: 1,
        adjustWeekend: false,
        createdAt: Date.now()
      };

      // December transaction should result in January payment
      const decemberTransaction = createJapanDate(2024, 12, 20);
      const result = calculateCardPaymentDate(decemberTransaction, card);

      expect(result.scheduledPayDate.getFullYear()).toBe(2025);
      expect(result.scheduledPayDate.getMonth()).toBe(1); // February (0-indexed, 1-month shift applied)
      expect(result.scheduledPayDate.getDate()).toBe(25);
    });
  });

  describe('カード設定の妥当性検証', () => {
    it('should validate weekend adjustment recommendations', () => {
      // 月末支払い + adjustWeekend: true は推奨されない
      const monthEndCard: Card = {
        id: 'month-end-card',
        name: '月末カード',
        bankId: 'test-bank',
        closingDay: '15',
        paymentDay: '月末',
        paymentMonthShift: 1,
        adjustWeekend: true, // This should trigger a suggestion
        createdAt: Date.now()
      };

      const validation = validateCardConfiguration(monthEndCard);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions.some(s => s.includes('月末支払い'))).toBe(true);
    });

    it('should recommend weekend adjustment for regular dates', () => {
      const regularCard: Card = {
        id: 'regular-card',
        name: '通常カード',
        bankId: 'test-bank',
        closingDay: '15',
        paymentDay: '27',
        paymentMonthShift: 1,
        adjustWeekend: false, // This should trigger a suggestion
        createdAt: Date.now()
      };

      const validation = validateCardConfiguration(regularCard);
      expect(validation.suggestions.length).toBeGreaterThan(0);
      expect(validation.suggestions.some(s => s.includes('週末調整'))).toBe(true);
    });
  });

  describe('パフォーマンステスト', () => {
    it('should calculate payment dates efficiently for large datasets', () => {
      const card: Card = {
        id: 'performance-test',
        name: 'パフォーマンステスト',
        bankId: 'test-bank',
        closingDay: '15',
        paymentDay: '27',
        paymentMonthShift: 1,
        adjustWeekend: true,
        createdAt: Date.now()
      };

      const startTime = performance.now();
      
      // 1000件の計算を実行
      for (let i = 0; i < 1000; i++) {
        const randomDate = createJapanDate(
          2024,
          Math.floor(Math.random() * 12) + 1,
          Math.floor(Math.random() * 28) + 1
        );
        calculateCardPaymentDate(randomDate, card);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000件の計算が100ms以内で完了することを期待
      expect(duration).toBeLessThan(100);
    });
  });

  describe('決定論的テスト', () => {
    it('should produce consistent results for same inputs', () => {
      const card: Card = {
        id: 'deterministic-test',
        name: '決定論的テスト',
        bankId: 'test-bank',
        closingDay: '15',
        paymentDay: '月末',
        paymentMonthShift: 1,
        adjustWeekend: false,
        createdAt: Date.now()
      };

      const transactionDate = createJapanDate(2025, 6, 10);
      
      // 同じ入力で複数回実行
      const results = Array.from({ length: 10 }, () => 
        calculateCardPaymentDate(transactionDate, card)
      );

      // すべての結果が同じであることを確認
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.scheduledPayDate.getTime()).toBe(firstResult.scheduledPayDate.getTime());
        expect(result.paymentCycle.isAdjusted).toBe(firstResult.paymentCycle.isAdjusted);
      });
    });
  });
});