import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataFixPanel } from '@/components/settings/DataFixPanel';
import { Card, Transaction } from '@/types/database';
import { createJapanDate } from '@/lib/utils/dateUtils';

/**
 * UI統合テスト - データ修正パネル
 * 
 * 以下のUI動作を検証：
 * 1. カード設定画面での週末調整オプション表示
 * 2. 取引作成時の支払い予定日プレビュー
 * 3. データ修正パネルの動作
 */
describe('UI Integration Tests - Data Fix Panel', () => {

  // テスト用のモックデータ
  const mockCards: Card[] = [
    {
      id: 'card-1',
      name: '正常カード',
      bankId: 'bank-1',
      closingDay: '15',
      paymentDay: '27',
      paymentMonthShift: 1,
      adjustWeekend: true,
      createdAt: Date.now()
    },
    {
      id: 'card-2',
      name: '問題カード（月末+週末調整）',
      bankId: 'bank-2',
      closingDay: '月末',
      paymentDay: '月末',
      paymentMonthShift: 1,
      adjustWeekend: true, // 問題あり
      createdAt: Date.now()
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: createJapanDate(2025, 7, 15).getTime(),
      amount: 10000,
      paymentType: 'card',
      cardId: 'card-2',
      scheduledPayDate: createJapanDate(2025, 8, 31).getTime(),
      createdAt: Date.now()
    }
  ];

  const mockHandlers = {
    onUpdateCards: jest.fn(),
    onRecalculateTransactions: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('データ修正パネルの基本表示', () => {
    it('should render data fix panel with problem detection', () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // Header elements
      expect(screen.getByText('データ修正ツール')).toBeInTheDocument();
      expect(screen.getByText('週末調整設定の問題を検出し、修正を提案します')).toBeInTheDocument();
      
      // Analysis button
      expect(screen.getByText('分析実行')).toBeInTheDocument();
    });

    it('should show problem status when issues are detected', async () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // 問題が検出されることを確認
      await waitFor(() => {
        expect(screen.getByText('修正が必要な問題が見つかりました')).toBeInTheDocument();
      });

      // まず分析を実行して修正ボタンを表示させる
      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // 修正ボタンが表示されることを確認
      await waitFor(() => {
        const buttons = screen.getAllByText('修正を実行');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display problematic cards', async () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('問題のあるカード')).toBeInTheDocument();
      });

      // 問題のあるカードが表示されることを確認
      expect(screen.getByText('問題カード（月末+週末調整）')).toBeInTheDocument();
      expect(screen.getByText('支払日: 月末 / 週末調整: 有効')).toBeInTheDocument();
      expect(screen.getByText('要修正')).toBeInTheDocument();
    });
  });

  describe('分析機能の動作', () => {
    it('should perform analysis when analyze button is clicked', async () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // 分析処理中の表示確認は困難なので、結果の確認に集中
      await waitFor(() => {
        expect(screen.getByText('修正が必要な問題が見つかりました')).toBeInTheDocument();
      });
    });

    it('should open analysis modal when analysis is performed', async () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // モーダルが開くことを確認
      await waitFor(() => {
        expect(screen.getByText('分析結果詳細')).toBeInTheDocument();
      });

      // モーダル内のコンテンツを確認
      expect(screen.getByText('修正概要')).toBeInTheDocument();
      expect(screen.getByText('カード設定の変更')).toBeInTheDocument();
    });
  });

  describe('修正機能の動作', () => {
    it('should open confirmation modal when fix button is clicked', async () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // 分析実行して修正ボタンを表示させる
      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // 修正ボタンが表示されるまで待機
      let fixButtons: HTMLElement[];
      await waitFor(() => {
        fixButtons = screen.getAllByText('修正を実行');
        expect(fixButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      // 最初の修正ボタンをクリック（メインパネルのボタン）
      fireEvent.click(fixButtons![0]);

      // 確認モーダルが開くことを確認
      await waitFor(() => {
        expect(screen.getByText('データ修正の実行')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/1枚のカード設定と/)).toBeInTheDocument();
      expect(screen.getByText(/この操作は取り消せません/)).toBeInTheDocument();
    });

    it('should call update handlers when fix is confirmed', async () => {
      mockHandlers.onUpdateCards.mockResolvedValue(undefined);
      mockHandlers.onRecalculateTransactions.mockResolvedValue(undefined);

      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // 分析実行して修正ボタンを表示させる
      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // 修正ボタンが表示されるまで待機してクリック
      let fixButtons: HTMLElement[];
      await waitFor(() => {
        fixButtons = screen.getAllByText('修正を実行');
        expect(fixButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      fireEvent.click(fixButtons![0]);

      // 確認モーダルで実行をクリック
      let confirmButton: HTMLElement;
      await waitFor(() => {
        confirmButton = screen.getByText('実行');
        expect(confirmButton).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(confirmButton!);

      // ハンドラーが呼ばれることを確認
      await waitFor(() => {
        expect(mockHandlers.onUpdateCards).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('エラーハンドリング', () => {
    it('should display error when update fails', async () => {
      mockHandlers.onUpdateCards.mockRejectedValue(new Error('Update failed'));

      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // 分析実行して修正ボタンを表示させる
      const analyzeButton = screen.getByText('分析実行');
      fireEvent.click(analyzeButton);

      // 修正ボタンが表示されるまで待機してクリック
      let fixButtons: HTMLElement[];
      await waitFor(() => {
        fixButtons = screen.getAllByText('修正を実行');
        expect(fixButtons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      fireEvent.click(fixButtons![0]);

      // 確認ボタンをクリック
      let confirmButton: HTMLElement;
      await waitFor(() => {
        confirmButton = screen.getByText('実行');
        expect(confirmButton).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(confirmButton!);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(/Update failed/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('空データの処理', () => {
    it('should handle empty card list', () => {
      render(
        <DataFixPanel
          cards={[]}
          transactions={[]}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // 分析ボタンが無効化されることを確認
      const analyzeButton = screen.getByText('分析実行');
      expect(analyzeButton).toBeDisabled();
    });

    it('should show no problems message when all cards are fine', async () => {
      const goodCards: Card[] = [
        {
          id: 'good-card',
          name: '正常カード',
          bankId: 'bank-1',
          closingDay: '15',
          paymentDay: '27',
          paymentMonthShift: 1,
          adjustWeekend: true,
          createdAt: Date.now()
        }
      ];

      render(
        <DataFixPanel
          cards={goodCards}
          transactions={[]}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('データに問題はありません')).toBeInTheDocument();
      });

      // 修正ボタンが表示されないことを確認
      expect(screen.queryByText('修正を実行')).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('should show loading state when isLoading is true', () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
          isLoading={true}
        />
      );

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      
      // 分析ボタンが無効化されることを確認
      const analyzeButton = screen.getByText('分析実行');
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      // ボタンがアクセシブルであることを確認
      const analyzeButton = screen.getByText('分析実行');
      expect(analyzeButton.tagName.toLowerCase()).toBe('button');

      // 見出しが適切に構造化されていることを確認
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('データ修正ツール');
    });

    it('should support keyboard navigation', () => {
      render(
        <DataFixPanel
          cards={mockCards}
          transactions={mockTransactions}
          onUpdateCards={mockHandlers.onUpdateCards}
          onRecalculateTransactions={mockHandlers.onRecalculateTransactions}
        />
      );

      const analyzeButton = screen.getByText('分析実行');
      
      // キーボードフォーカスが可能であることを確認
      analyzeButton.focus();
      expect(document.activeElement).toBe(analyzeButton);

      // Enterキーで実行できることを確認
      fireEvent.keyDown(analyzeButton, { key: 'Enter', code: 'Enter' });
      // 実際の動作確認は複雑なので、フォーカス確認のみ
    });
  });
});