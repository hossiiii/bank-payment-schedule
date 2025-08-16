'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Modal, 
  ModalBody, 
  ModalFooter, 
  ConfirmModal 
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { Card, Transaction } from '@/types/database';
import { 
  createFixReport,
  generateFixPreview,
  validateFixes,
  createFixedCards,
  calculateAffectedTransactions
} from '@/lib/utils/dataFixUtils';
import { formatJapaneseDate } from '@/lib/utils/dateUtils';

export interface DataFixPanelProps {
  cards: Card[];
  transactions: Transaction[];
  onUpdateCards: (cardUpdates: Map<string, Partial<Card>>) => Promise<void>;
  onRecalculateTransactions: (transactionUpdates: Map<string, { scheduledPayDate: number }>) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function DataFixPanel({
  cards,
  transactions,
  onUpdateCards,
  onRecalculateTransactions,
  isLoading = false,
  className
}: DataFixPanelProps) {
  // Modal states
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  // Analysis results
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof createFixReport> | null>(null);
  const [previewResult, setPreviewResult] = useState<ReturnType<typeof generateFixPreview> | null>(null);
  
  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Calculate initial analysis
  useEffect(() => {
    if (cards.length > 0) {
      try {
        const result = createFixReport(cards, transactions);
        setAnalysisResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
      }
    }
  }, [cards, transactions]);

  // Handle analysis
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = createFixReport(cards, transactions);
      const preview = generateFixPreview(cards, transactions);
      
      setAnalysisResult(result);
      setPreviewResult(preview);
      setIsAnalysisModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle apply fixes
  const handleApplyFixes = async () => {
    if (!previewResult) return;
    
    setIsApplying(true);
    setError(null);
    
    try {
      // Create card updates
      const cardUpdates = createFixedCards(cards);
      
      // Validate fixes before applying
      const validation = validateFixes(cardUpdates, cards);
      if (!validation.isValid) {
        throw new Error(`修正の検証に失敗しました: ${validation.errors.join(', ')}`);
      }
      
      // Apply card updates first
      if (cardUpdates.size > 0) {
        await onUpdateCards(cardUpdates);
      }
      
      // Calculate transaction updates
      const transactionChanges = calculateAffectedTransactions(transactions, cardUpdates, cards);
      
      if (transactionChanges.length > 0) {
        const transactionUpdates = new Map<string, { scheduledPayDate: number }>();
        transactionChanges.forEach(change => {
          transactionUpdates.set(change.transactionId, {
            scheduledPayDate: change.newPaymentDate.getTime()
          });
        });
        
        await onRecalculateTransactions(transactionUpdates);
      }
      
      setIsConfirmModalOpen(false);
      setIsAnalysisModalOpen(false);
      
      // Refresh analysis
      const newResult = createFixReport(cards, transactions);
      setAnalysisResult(newResult);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '修正の適用中にエラーが発生しました');
    } finally {
      setIsApplying(false);
    }
  };

  const hasProblems = analysisResult?.details.analysis.problematicCards.length > 0;
  const needsFix = hasProblems && previewResult?.summary.cardsFixed > 0;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            データ修正ツール
          </h3>
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={isLoading || isAnalyzing || cards.length === 0}
            isLoading={isAnalyzing}
          >
            分析実行
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          週末調整設定の問題を検出し、修正を提案します
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Status display */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : !analysisResult ? (
          <div className="text-center py-8">
            <p className="text-gray-500">分析結果がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className={cn(
              'p-4 rounded-lg border',
              hasProblems 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            )}>
              <div className="flex items-start">
                <div className={cn(
                  'flex-shrink-0 mt-1',
                  hasProblems ? 'text-yellow-500' : 'text-green-500'
                )}>
                  {hasProblems ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h4 className={cn(
                    'text-sm font-medium',
                    hasProblems ? 'text-yellow-800' : 'text-green-800'
                  )}>
                    {hasProblems ? '修正が必要な問題が見つかりました' : 'データに問題はありません'}
                  </h4>
                  <div className={cn(
                    'text-sm mt-1',
                    hasProblems ? 'text-yellow-700' : 'text-green-700'
                  )}>
                    {analysisResult.details.analysis.summary.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Problematic cards */}
            {hasProblems && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">問題のあるカード</h4>
                <div className="space-y-2">
                  {analysisResult.details.analysis.problematicCards.map(card => (
                    <div key={card.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{card.name}</p>
                          <p className="text-xs text-gray-600">
                            支払日: {card.paymentDay} / 週末調整: {card.adjustWeekend ? '有効' : '無効'}
                          </p>
                        </div>
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          要修正
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            {needsFix && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={isLoading || isApplying}
                >
                  修正を実行
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Details Modal */}
      {isAnalysisModalOpen && analysisResult && previewResult && (
        <Modal
          isOpen={true}
          onClose={() => setIsAnalysisModalOpen(false)}
          title="分析結果詳細"
          size="lg"
        >
          <ModalBody>
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">修正概要</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <ul className="text-sm text-blue-800 space-y-1">
                    {previewResult.summary.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card changes */}
              {previewResult.cardChanges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">カード設定の変更</h4>
                  <div className="space-y-2">
                    {previewResult.cardChanges.map(change => (
                      <div key={change.cardId} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{change.cardName}</p>
                        <p className="text-xs text-gray-600 mt-1">{change.reason}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span className="text-red-600">
                            現在: 週末調整 {change.currentSettings.adjustWeekend ? '有効' : '無効'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600">
                            変更後: 週末調整 {change.recommendedSettings.adjustWeekend ? '有効' : '無効'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction impact */}
              {previewResult.transactionChanges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    影響を受ける取引 ({previewResult.transactionChanges.length}件)
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {previewResult.transactionChanges.slice(0, 10).map(change => (
                      <div key={change.transactionId} className="bg-gray-50 rounded p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">取引ID: {change.transactionId.slice(0, 8)}...</span>
                          <span className={cn(
                            'px-2 py-1 rounded',
                            change.difference > 0 
                              ? 'bg-red-100 text-red-700' 
                              : change.difference < 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          )}>
                            {change.difference > 0 ? '+' : ''}{change.difference}日
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-gray-600">
                          <span>{formatJapaneseDate(change.currentPaymentDate)}</span>
                          <span>→</span>
                          <span>{formatJapaneseDate(change.newPaymentDate)}</span>
                        </div>
                      </div>
                    ))}
                    {previewResult.transactionChanges.length > 10 && (
                      <p className="text-xs text-gray-500 text-center">
                        ...他 {previewResult.transactionChanges.length - 10} 件
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsAnalysisModalOpen(false)}
            >
              閉じる
            </Button>
            {needsFix && (
              <Button
                variant="primary"
                onClick={() => {
                  setIsAnalysisModalOpen(false);
                  setIsConfirmModalOpen(true);
                }}
              >
                修正を実行
              </Button>
            )}
          </ModalFooter>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleApplyFixes}
        title="データ修正の実行"
        message={`
          ${previewResult?.summary.cardsFixed || 0}枚のカード設定と
          ${previewResult?.summary.transactionsRecalculated || 0}件の取引データを修正します。
          
          この操作は取り消せません。実行してもよろしいですか？
        `}
        confirmText="実行"
        cancelText="キャンセル"
        variant="primary"
        isLoading={isApplying}
      />
    </div>
  );
}