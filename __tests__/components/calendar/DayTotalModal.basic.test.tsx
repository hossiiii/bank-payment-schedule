import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayTotalModal } from '@/components/calendar/DayTotalModal';
import { DayTotalData } from '@/types/calendar';
import { Transaction, ScheduleItem } from '@/types/database';

/**
 * DayTotalModal基本機能テスト
 * フェーズ1リファクタリング後の基本動作確認用
 */
describe('DayTotalModal - 基本機能テスト', () => {
  const mockTransaction: Transaction = {
    id: 'trans-1',
    date: new Date('2024-02-15').getTime(),
    amount: 15000,
    storeName: 'コンビニA',
    paymentType: 'card',
    cardId: 'card-1',
    usage: '食費',
    memo: 'テスト取引',
    createdAt: new Date().getTime()
  };

  const mockScheduleItem: ScheduleItem = {
    transactionId: 'schedule-1',
    date: new Date('2024-02-15'),
    amount: 5000,
    paymentType: 'bank',
    bankName: 'テスト銀行',
    storeName: 'ガス代',
    isScheduleEditable: true
  };

  const mockDayTotalData: DayTotalData = {
    date: '2024-02-15',
    totalAmount: 20000,
    transactionTotal: 15000,
    cardTransactionTotal: 15000,
    bankTransactionTotal: 0,
    scheduleTotal: 5000,
    transactionCount: 1,
    scheduleCount: 1,
    bankGroups: [],
    transactions: [mockTransaction],
    scheduleItems: [mockScheduleItem],
    hasData: true,
    hasTransactions: true,
    hasCardTransactions: true,
    hasBankTransactions: false,
    hasSchedule: true
  };

  const mockBanks = [
    { id: 'bank-1', name: 'テスト銀行', createdAt: new Date().getTime() }
  ];

  const mockCards = [
    { id: 'card-1', name: 'テストカード', createdAt: new Date().getTime() }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onViewTransactions: jest.fn(),
    onViewSchedules: jest.fn(),
    dayTotalData: mockDayTotalData,
    selectedDate: new Date('2024-02-15'),
    banks: mockBanks,
    cards: mockCards
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('モーダルが正常に表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('2月15日 の詳細')).toBeInTheDocument();
    });

    it('取引データと引落予定データが両方表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('取引データ (1件)')).toBeInTheDocument();
      expect(screen.getByText('引落予定 (1件)')).toBeInTheDocument();
    });

    it('合計金額が正しく表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('取引合計:')).toBeInTheDocument();
      expect(screen.getByText('￥15,000')).toBeInTheDocument();
      expect(screen.getByText('引落予定合計:')).toBeInTheDocument();
      expect(screen.getByText('￥5,000')).toBeInTheDocument();
    });
  });

  describe('データなしケース', () => {
    it('データがない場合、適切なメッセージが表示されること', () => {
      const emptyData: DayTotalData = {
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

      render(<DayTotalModal {...defaultProps} dayTotalData={emptyData} banks={mockBanks} cards={mockCards} />);
      
      expect(screen.getByText('この日にはデータがありません')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('閉じるボタンが動作すること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('詳細表示ボタンが動作すること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const detailButtons = screen.getAllByText('詳細表示');
      expect(detailButtons).toHaveLength(2); // 取引と引落予定の詳細表示ボタン
      
      // 取引データの詳細表示をクリック
      fireEvent.click(detailButtons[0]);
      expect(defaultProps.onViewTransactions).toHaveBeenCalledWith([mockTransaction]);
      
      // 引落予定の詳細表示をクリック
      fireEvent.click(detailButtons[1]);
      expect(defaultProps.onViewSchedules).toHaveBeenCalledWith([mockScheduleItem]);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されていること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('Escキーでモーダルが閉じること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});