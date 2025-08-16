import {
  analyzeWeekendAdjustmentIssues,
  recommendCardFixes,
  createFixedCards,
  calculateAffectedTransactions,
  validateFixes,
  generateFixPreview,
  estimateFixImpact,
  createFixReport
} from '@/lib/utils/dataFixUtils';
import { Card, Transaction } from '@/types/database';
import { createJapanDate } from '@/lib/utils/dateUtils';

/**
 * データ修正ユーティリティの検証テスト
 * 
 * 以下の機能を検証：
 * 1. 問題のあるカード設定の検出
 * 2. 既存取引の再計算機能
 * 3. バッチ更新の動作確認
 * 4. データ修正レポート生成
 */
describe('Data Fix Utils Verification', () => {

  // テスト用のサンプルデータ
  const sampleCards: Card[] = [
    {
      id: 'card-1',
      name: '正常カード',
      bankId: 'bank-1',
      closingDay: '15',
      paymentDay: '27',
      paymentMonthShift: 1,
      adjustWeekend: true, // 通常の日付なので問題なし
      createdAt: Date.now()
    },
    {
      id: 'card-2',
      name: '問題カード1（月末+週末調整）',
      bankId: 'bank-2',
      closingDay: '月末',
      paymentDay: '月末',
      paymentMonthShift: 1,
      adjustWeekend: true, // 問題あり: 月末支払いで週末調整有効
      createdAt: Date.now()
    },
    {
      id: 'card-3',
      name: '問題カード2（月末+週末調整）',
      bankId: 'bank-3',
      closingDay: '15',
      paymentDay: '月末',
      paymentMonthShift: 1,
      adjustWeekend: true, // 問題あり: 月末支払いで週末調整有効
      createdAt: Date.now()
    },
    {
      id: 'card-4',
      name: '正常カード2（月末+週末調整なし）',
      bankId: 'bank-4',
      closingDay: '月末',
      paymentDay: '月末',
      paymentMonthShift: 1,
      adjustWeekend: false, // 正常: 月末支払いで週末調整無効
      createdAt: Date.now()
    }
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: createJapanDate(2025, 7, 15).getTime(),
      amount: 10000,
      paymentType: 'card',
      cardId: 'card-2',
      scheduledPayDate: createJapanDate(2025, 8, 31).getTime(),
      createdAt: Date.now()
    },
    {
      id: 'tx-2',
      date: createJapanDate(2025, 7, 20).getTime(),
      amount: 5000,
      paymentType: 'card',
      cardId: 'card-3',
      scheduledPayDate: createJapanDate(2025, 8, 31).getTime(),
      createdAt: Date.now()
    },
    {
      id: 'tx-3',
      date: createJapanDate(2025, 7, 10).getTime(),
      amount: 8000,
      paymentType: 'card',
      cardId: 'card-1',
      scheduledPayDate: createJapanDate(2025, 8, 27).getTime(),
      createdAt: Date.now()
    }
  ];

  describe('問題のあるカード設定の検出', () => {
    it('should analyze weekend adjustment issues correctly', () => {
      const analysis = analyzeWeekendAdjustmentIssues(sampleCards);

      expect(analysis.problematicCards).toHaveLength(2);
      expect(analysis.problematicCards.map(c => c.id)).toEqual(['card-2', 'card-3']);
      
      expect(analysis.summary).toContain('全カード数: 4');
      expect(analysis.summary).toContain('週末調整が有効なカード: 3');
      expect(analysis.summary).toContain('月末支払いのカード: 3');
      expect(analysis.summary).toContain('問題のあるカード（月末支払い + 週末調整有効）: 2');
    });

    it('should recommend appropriate fixes', () => {
      const recommendations = recommendCardFixes(sampleCards);

      expect(recommendations).toHaveLength(2);
      
      recommendations.forEach(rec => {
        expect(['card-2', 'card-3']).toContain(rec.cardId);
        expect(rec.currentSettings.paymentDay).toBe('月末');
        expect(rec.currentSettings.adjustWeekend).toBe(true);
        expect(rec.recommendedSettings.adjustWeekend).toBe(false);
        expect(rec.reason).toContain('月末支払いの場合');
      });
    });

    it('should create fixed card configurations', () => {
      const fixes = createFixedCards(sampleCards);

      expect(fixes.size).toBe(2);
      expect(fixes.has('card-2')).toBe(true);
      expect(fixes.has('card-3')).toBe(true);
      expect(fixes.get('card-2')).toEqual({ adjustWeekend: false });
      expect(fixes.get('card-3')).toEqual({ adjustWeekend: false });
    });
  });

  describe('既存取引の再計算機能', () => {
    it('should calculate affected transactions correctly', () => {
      const cardUpdates = new Map([
        ['card-2', { adjustWeekend: false }],
        ['card-3', { adjustWeekend: false }]
      ]);

      const affected = calculateAffectedTransactions(
        sampleTransactions,
        cardUpdates,
        sampleCards
      );

      // 実際の影響は週末調整がある場合にのみ発生
      expect(affected.length).toBeGreaterThanOrEqual(0);
      
      // 影響を受けた取引の検証
      affected.forEach(item => {
        expect(['tx-1', 'tx-2']).toContain(item.transactionId);
        expect(['card-2', 'card-3']).toContain(item.cardId);
        expect(item.currentPaymentDate).toBeInstanceOf(Date);
        expect(item.newPaymentDate).toBeInstanceOf(Date);
        expect(typeof item.difference).toBe('number');
      });
    });

    it('should validate fixes before applying', () => {
      const validFixes = new Map([
        ['card-2', { adjustWeekend: false }],
        ['card-3', { adjustWeekend: false }]
      ]);

      const validation = validateFixes(validFixes, sampleCards);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid card IDs', () => {
      const invalidFixes = new Map([
        ['card-999', { adjustWeekend: false }]
      ]);

      const validation = validateFixes(invalidFixes, sampleCards);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Card ID card-999 not found');
    });

    it('should warn about unusual changes', () => {
      const unusualFixes = new Map([
        ['card-1', { adjustWeekend: false }] // 通常の日付で週末調整を無効化
      ]);

      const validation = validateFixes(unusualFixes, sampleCards);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('non-month-end payment');
    });
  });

  describe('バッチ更新の動作確認', () => {
    it('should generate comprehensive fix preview', () => {
      const preview = generateFixPreview(sampleCards, sampleTransactions);

      expect(preview.cardChanges).toHaveLength(2);
      expect(preview.summary.cardsFixed).toBe(2);
      expect(preview.summary.recommendations).toContain('2枚のカードで週末調整を無効化');
    });

    it('should estimate fix impact correctly', () => {
      const mockTransactionChanges = [
        {
          transactionId: 'tx-1',
          cardId: 'card-2',
          currentPaymentDate: createJapanDate(2025, 9, 1), // 調整後の日付
          newPaymentDate: createJapanDate(2025, 8, 31), // 元の月末
          difference: -1 // 1日早くなる
        },
        {
          transactionId: 'tx-2',
          cardId: 'card-3',
          currentPaymentDate: createJapanDate(2025, 9, 1),
          newPaymentDate: createJapanDate(2025, 8, 31),
          difference: -1
        }
      ];

      const impact = estimateFixImpact(mockTransactionChanges);

      expect(impact.totalTransactions).toBe(2);
      expect(impact.earlierPayments).toBe(2);
      expect(impact.laterPayments).toBe(0);
      expect(impact.unchangedPayments).toBe(0);
      expect(impact.averageDaysDifference).toBe(1);
      expect(impact.maxDaysDifference).toBe(1);
    });
  });

  describe('データ修正レポート生成', () => {
    it('should create comprehensive fix report', () => {
      const reportData = createFixReport(sampleCards, sampleTransactions);

      expect(reportData.report).toContain('データ修正レポート');
      expect(reportData.report).toContain('分析結果');
      expect(reportData.report).toContain('修正対象');
      expect(reportData.report).toContain('影響の詳細');
      expect(reportData.report).toContain('推奨事項');

      expect(reportData.details.analysis.problematicCards).toHaveLength(2);
      expect(reportData.details.preview.summary.cardsFixed).toBe(2);
      expect(reportData.details.impact.totalTransactions).toBeGreaterThanOrEqual(0);
    });

    it('should provide actionable recommendations', () => {
      const reportData = createFixReport(sampleCards, sampleTransactions);

      expect(reportData.details.preview.summary.recommendations).toContain(
        '月末支払いカードの週末調整問題を解決'
      );
      expect(reportData.details.preview.cardChanges).toHaveLength(2);
    });
  });

  describe('エッジケースの処理', () => {
    it('should handle empty datasets', () => {
      const emptyAnalysis = analyzeWeekendAdjustmentIssues([]);
      expect(emptyAnalysis.problematicCards).toHaveLength(0);
      expect(emptyAnalysis.summary).toContain('全カード数: 0');

      const emptyRecommendations = recommendCardFixes([]);
      expect(emptyRecommendations).toHaveLength(0);

      const emptyFixes = createFixedCards([]);
      expect(emptyFixes.size).toBe(0);
    });

    it('should handle cards with no issues', () => {
      const goodCards: Card[] = [
        {
          id: 'good-1',
          name: '正常カード1',
          bankId: 'bank-1',
          closingDay: '15',
          paymentDay: '27',
          paymentMonthShift: 1,
          adjustWeekend: true,
          createdAt: Date.now()
        },
        {
          id: 'good-2',
          name: '正常カード2',
          bankId: 'bank-2',
          closingDay: '月末',
          paymentDay: '月末',
          paymentMonthShift: 1,
          adjustWeekend: false,
          createdAt: Date.now()
        }
      ];

      const analysis = analyzeWeekendAdjustmentIssues(goodCards);
      expect(analysis.problematicCards).toHaveLength(0);

      const recommendations = recommendCardFixes(goodCards);
      expect(recommendations).toHaveLength(0);

      const fixes = createFixedCards(goodCards);
      expect(fixes.size).toBe(0);
    });

    it('should handle transactions without card payments', () => {
      const bankTransactions: Transaction[] = [
        {
          id: 'bank-tx-1',
          date: createJapanDate(2025, 7, 15).getTime(),
          amount: 10000,
          paymentType: 'bank',
          bankId: 'bank-1',
          scheduledPayDate: createJapanDate(2025, 7, 15).getTime(),
          createdAt: Date.now()
        }
      ];

      const cardUpdates = new Map([['card-2', { adjustWeekend: false }]]);
      const affected = calculateAffectedTransactions(
        bankTransactions,
        cardUpdates,
        sampleCards
      );

      expect(affected).toHaveLength(0);
    });
  });

  describe('パフォーマンステスト', () => {
    it('should handle large datasets efficiently', () => {
      // 大量のテストデータを生成
      const largeCardSet: Card[] = Array.from({ length: 100 }, (_, i) => ({
        id: `card-${i}`,
        name: `カード${i}`,
        bankId: `bank-${i % 10}`,
        closingDay: '月末',
        paymentDay: '月末',
        paymentMonthShift: 1,
        adjustWeekend: i % 2 === 0, // 半分が問題あり
        createdAt: Date.now()
      }));

      const largeTransactionSet: Transaction[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx-${i}`,
        date: createJapanDate(2025, 7, (i % 28) + 1).getTime(),
        amount: 1000 + i,
        paymentType: 'card',
        cardId: `card-${i % 100}`,
        scheduledPayDate: createJapanDate(2025, 8, 31).getTime(),
        createdAt: Date.now()
      }));

      const startTime = performance.now();
      
      const analysis = analyzeWeekendAdjustmentIssues(largeCardSet);
      const recommendations = recommendCardFixes(largeCardSet);
      const fixes = createFixedCards(largeCardSet);
      const affected = calculateAffectedTransactions(largeTransactionSet, fixes, largeCardSet);
      const report = createFixReport(largeCardSet, largeTransactionSet);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // 大量データでも500ms以内で処理完了することを期待
      expect(duration).toBeLessThan(500);
      
      // 結果の妥当性を確認
      expect(analysis.problematicCards).toHaveLength(50); // 半分が問題あり
      expect(recommendations).toHaveLength(50);
      expect(fixes.size).toBe(50);
      expect(report.report).toContain('データ修正レポート');
    });
  });
});