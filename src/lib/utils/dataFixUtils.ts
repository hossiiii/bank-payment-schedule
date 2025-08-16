import { Card, Transaction } from '@/types/database';
import { calculateCardPaymentDate } from './paymentCalc';

/**
 * Data fix utilities for handling weekend adjustment issues
 * 
 * These utilities help fix data issues caused by the previous default
 * adjustWeekend: true setting, particularly for month-end payments.
 */

export interface DataFixSummary {
  cardsFixed: number;
  transactionsRecalculated: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Analyzes cards that have adjustWeekend: true with month-end payments
 * and suggests fixes
 */
export function analyzeWeekendAdjustmentIssues(cards: Card[]): {
  problematicCards: Card[];
  summary: string[];
} {
  const problematicCards = cards.filter(card => 
    card.adjustWeekend && card.paymentDay === '月末'
  );

  const summary = [
    `全カード数: ${cards.length}`,
    `週末調整が有効なカード: ${cards.filter(c => c.adjustWeekend).length}`,
    `月末支払いのカード: ${cards.filter(c => c.paymentDay === '月末').length}`,
    `問題のあるカード（月末支払い + 週末調整有効）: ${problematicCards.length}`
  ];

  return { problematicCards, summary };
}

/**
 * Recommends fixes for cards with weekend adjustment issues
 */
export function recommendCardFixes(cards: Card[]): {
  cardId: string;
  cardName: string;
  currentSettings: {
    paymentDay: string;
    adjustWeekend: boolean;
  };
  recommendedSettings: {
    adjustWeekend: boolean;
  };
  reason: string;
}[] {
  return cards
    .filter(card => card.adjustWeekend && card.paymentDay === '月末')
    .map(card => ({
      cardId: card.id,
      cardName: card.name,
      currentSettings: {
        paymentDay: card.paymentDay,
        adjustWeekend: card.adjustWeekend
      },
      recommendedSettings: {
        adjustWeekend: false
      },
      reason: '月末支払いの場合、実際の月末日を維持するため週末調整を無効にすることを推奨'
    }));
}

/**
 * Creates updated card objects with recommended weekend adjustment settings
 */
export function createFixedCards(cards: Card[]): Map<string, Partial<Card>> {
  const fixes = new Map<string, Partial<Card>>();
  
  cards
    .filter(card => card.adjustWeekend && card.paymentDay === '月末')
    .forEach(card => {
      fixes.set(card.id, { adjustWeekend: false });
    });

  return fixes;
}

/**
 * Calculates which transactions would be affected by card setting changes
 */
export function calculateAffectedTransactions(
  transactions: Transaction[],
  cardUpdates: Map<string, Partial<Card>>,
  cards: Card[]
): {
  transactionId: string;
  cardId: string;
  currentPaymentDate: Date;
  newPaymentDate: Date;
  difference: number; // days
}[] {
  const affected: {
    transactionId: string;
    cardId: string;
    currentPaymentDate: Date;
    newPaymentDate: Date;
    difference: number;
  }[] = [];

  transactions
    .filter(tx => tx.paymentType === 'card' && tx.cardId && cardUpdates.has(tx.cardId))
    .forEach(tx => {
      if (!tx.cardId) return;

      const originalCard = cards.find(c => c.id === tx.cardId);
      if (!originalCard) return;

      const updates = cardUpdates.get(tx.cardId)!;
      const updatedCard = { ...originalCard, ...updates };

      const transactionDate = new Date(tx.date);
      const originalResult = calculateCardPaymentDate(transactionDate, originalCard);
      const newResult = calculateCardPaymentDate(transactionDate, updatedCard);

      const timeDiff = newResult.scheduledPayDate.getTime() - originalResult.scheduledPayDate.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff !== 0) {
        affected.push({
          transactionId: tx.id,
          cardId: tx.cardId,
          currentPaymentDate: originalResult.scheduledPayDate,
          newPaymentDate: newResult.scheduledPayDate,
          difference: daysDiff
        });
      }
    });

  return affected;
}

/**
 * Validates proposed fixes before applying them
 */
export function validateFixes(
  cardFixes: Map<string, Partial<Card>>,
  cards: Card[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that all card IDs exist
  for (const cardId of cardFixes.keys()) {
    if (!cards.find(c => c.id === cardId)) {
      errors.push(`Card ID ${cardId} not found`);
    }
  }

  // Check for any unusual changes
  cardFixes.forEach((updates, cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (updates.adjustWeekend === false && card.paymentDay !== '月末') {
      warnings.push(
        `Card ${card.name}: Disabling weekend adjustment for non-month-end payment (${card.paymentDay})`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates a preview of all changes that would be made
 */
export function generateFixPreview(
  cards: Card[],
  transactions: Transaction[]
): {
  cardChanges: ReturnType<typeof recommendCardFixes>;
  transactionChanges: ReturnType<typeof calculateAffectedTransactions>;
  summary: DataFixSummary;
} {
  const recommendations = recommendCardFixes(cards);
  const cardUpdates = createFixedCards(cards);
  const transactionChanges = calculateAffectedTransactions(transactions, cardUpdates, cards);

  const summary: DataFixSummary = {
    cardsFixed: recommendations.length,
    transactionsRecalculated: transactionChanges.length,
    issues: [],
    recommendations: [
      `${recommendations.length}枚のカードで週末調整を無効化`,
      `${transactionChanges.length}件の取引で支払い予定日を再計算`,
      '月末支払いカードの週末調整問題を解決'
    ]
  };

  return {
    cardChanges: recommendations,
    transactionChanges,
    summary
  };
}

/**
 * Estimates the impact of the fixes
 */
export function estimateFixImpact(
  transactionChanges: ReturnType<typeof calculateAffectedTransactions>
): {
  totalTransactions: number;
  earlierPayments: number;
  laterPayments: number;
  unchangedPayments: number;
  averageDaysDifference: number;
  maxDaysDifference: number;
} {
  const totalTransactions = transactionChanges.length;
  const earlierPayments = transactionChanges.filter(t => t.difference < 0).length;
  const laterPayments = transactionChanges.filter(t => t.difference > 0).length;
  const unchangedPayments = transactionChanges.filter(t => t.difference === 0).length;

  const allDifferences = transactionChanges.map(t => Math.abs(t.difference));
  const averageDaysDifference = allDifferences.length > 0 
    ? allDifferences.reduce((sum, diff) => sum + diff, 0) / allDifferences.length 
    : 0;
  const maxDaysDifference = allDifferences.length > 0 ? Math.max(...allDifferences) : 0;

  return {
    totalTransactions,
    earlierPayments,
    laterPayments,
    unchangedPayments,
    averageDaysDifference: Math.round(averageDaysDifference * 100) / 100,
    maxDaysDifference
  };
}

/**
 * Creates a human-readable report of the fixes
 */
export function createFixReport(
  cards: Card[],
  transactions: Transaction[]
): {
  report: string;
  details: {
    analysis: ReturnType<typeof analyzeWeekendAdjustmentIssues>;
    preview: ReturnType<typeof generateFixPreview>;
    impact: ReturnType<typeof estimateFixImpact>;
  };
} {
  const analysis = analyzeWeekendAdjustmentIssues(cards);
  const preview = generateFixPreview(cards, transactions);
  const impact = estimateFixImpact(preview.transactionChanges);

  const report = `
データ修正レポート
=================

## 分析結果
${analysis.summary.join('\n')}

## 修正対象
- 修正対象カード: ${preview.summary.cardsFixed}枚
- 影響を受ける取引: ${preview.summary.transactionsRecalculated}件

## 影響の詳細
- 支払日が早くなる取引: ${impact.earlierPayments}件
- 支払日が遅くなる取引: ${impact.laterPayments}件  
- 変更なしの取引: ${impact.unchangedPayments}件
- 平均変更日数: ${impact.averageDaysDifference}日
- 最大変更日数: ${impact.maxDaysDifference}日

## 推奨事項
${preview.summary.recommendations.join('\n')}
  `.trim();

  return {
    report,
    details: {
      analysis,
      preview,
      impact
    }
  };
}