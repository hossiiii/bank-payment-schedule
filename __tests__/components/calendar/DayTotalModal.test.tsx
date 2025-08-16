import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayTotalModal } from '@/components/calendar/DayTotalModal';
import { Transaction, Bank, Card, ScheduleItem } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

describe('DayTotalModal', () => {
  const mockBanks: Bank[] = [
    {
      id: 'bank-1',
      name: 'SBIネット銀行',
      memo: '',
      createdAt: Date.now()
    },
    {
      id: 'bank-2',
      name: 'りそな銀行', 
      memo: '',
      createdAt: Date.now()
    }
  ];

  const mockCards: Card[] = [
    {
      id: 'card-1',
      name: 'PayPayカード',
      bankId: 'bank-1',
      closingDay: '15',
      paymentDay: '27',
      paymentMonthShift: 1,
      adjustWeekend: true,
      memo: '',
      createdAt: Date.now()
    },
    {
      id: 'card-2',
      name: '楽天カード',
      bankId: 'bank-2',
      closingDay: '月末',
      paymentDay: '27',
      paymentMonthShift: 1,
      adjustWeekend: true,
      memo: '',
      createdAt: Date.now()
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      amount: 15000,
      date: new Date(2024, 1, 15).getTime(),
      storeName: 'Amazon',
      paymentType: 'card',
      cardId: 'card-1',
      scheduledPayDate: new Date(2024, 2, 27).getTime(),
      memo: '',
      createdAt: Date.now()
    },
    {
      id: 'trans-2',
      amount: 22840,
      date: new Date(2024, 1, 15).getTime(),
      storeName: '楽天市場',
      paymentType: 'card',
      cardId: 'card-2',
      scheduledPayDate: new Date(2024, 2, 27).getTime(),
      memo: '',
      createdAt: Date.now()
    },
    {
      id: 'trans-3',
      amount: 8000,
      date: new Date(2024, 1, 15).getTime(),
      storeName: '電気代',
      paymentType: 'bank',
      bankId: 'bank-1',
      scheduledPayDate: new Date(2024, 1, 15).getTime(),
      memo: '',
      createdAt: Date.now()
    }
  ];

  const mockScheduleItems: ScheduleItem[] = [
    {
      transactionId: 'schedule-1',
      date: new Date(2024, 1, 15),
      amount: 5000,
      storeName: 'ガス代',
      paymentType: 'bank',
      bankName: 'SBIネット銀行',
      // memo: '毎月のガス代' // ScheduleItemにはmemoプロパティが存在しない
    }
  ];

  const mockDayTotalData: DayTotalData = {
    date: '2024-02-15',
    totalAmount: 50840,
    transactionCount: 3,
    scheduleCount: 1,
    bankGroups: [],
    transactions: mockTransactions,
    scheduleItems: mockScheduleItems,
    hasData: true
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onTransactionClick: jest.fn(),
    selectedDate: new Date(2024, 1, 15),
    dayTotalData: mockDayTotalData,
    banks: mockBanks,
    cards: mockCards
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('モーダルが正常に表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // 日付表示は複数の要素に分かれている可能性があるので、部分的に確認
      expect(screen.getByText('2024年2月15日')).toBeInTheDocument();
      expect(screen.getByText('引落予定合計:')).toBeInTheDocument();
      expect(screen.getByText('￥50,840')).toBeInTheDocument();
    });

    it('isOpenがfalseのときにモーダルが表示されないこと', () => {
      render(<DayTotalModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('2024年2月15日')).not.toBeInTheDocument();
    });

    it('閉じるボタンが正常に動作すること', async () => {
      const onClose = jest.fn();
      render(<DayTotalModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('背景クリックでモーダルが閉じること', async () => {
      const onClose = jest.fn();
      render(<DayTotalModal {...defaultProps} onClose={onClose} />);
      
      // モーダル背景要素を取得
      const backdrop = document.querySelector('.fixed.inset-0.z-50');
      fireEvent.click(backdrop!);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('銀行別グループ化表示', () => {
    it('銀行別にグループ化して表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      expect(screen.getByText('りそな銀行')).toBeInTheDocument();
    });

    it('銀行ごとの合計金額が正しく表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // SBIネット銀行: PayPayカード(15,000円) + 銀行引落(8,000円) + スケジュール(5,000円) = 28,000円
      expect(screen.getAllByText('￥28,000').length).toBeGreaterThan(0);
      
      // りそな銀行: 楽天カード(22,840円) = 22,840円 (重複表示があるため getAllByText を使用)
      expect(screen.getAllByText('￥22,840').length).toBeGreaterThan(0);
    });
  });

  describe('カード名と支払い方法表示', () => {
    it('カード支払いの場合カード名が表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
    });

    it('銀行引落の場合「自動銀行振替」が表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const autoTransferElements = screen.getAllByText('自動銀行振替');
      expect(autoTransferElements.length).toBeGreaterThan(0);
    });

    it('スケジュールアイテムに「予定」バッジが表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('予定')).toBeInTheDocument();
    });
  });

  describe('取引項目の表示', () => {
    it('店舗名が正しく表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('楽天市場')).toBeInTheDocument();
      expect(screen.getByText('電気代')).toBeInTheDocument();
      expect(screen.getByText('ガス代')).toBeInTheDocument();
    });

    it('個別金額が正しく表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // 重複を避けるため、AllByTextを使用
      const amounts = screen.getAllByText('￥15,000');
      expect(amounts.length).toBeGreaterThan(0);
      
      expect(screen.getAllByText('￥22,840').length).toBeGreaterThan(0);
      expect(screen.getAllByText('￥8,000').length).toBeGreaterThan(0);
      expect(screen.getAllByText('￥5,000').length).toBeGreaterThan(0);
    });

    it('クリック可能な取引に矢印アイコンが表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      // トランザクションのみクリック可能で、矢印アイコンが表示される
      const arrows = container.querySelectorAll('svg[viewBox="0 0 24 24"] path[d="M9 5l7 7-7 7"]');
      expect(arrows.length).toBe(3); // トランザクション3件分
    });
  });

  describe('ユーザーインタラクション', () => {
    it('トランザクションクリックで onTransactionClick が呼ばれること', async () => {
      const onTransactionClick = jest.fn();
      render(<DayTotalModal {...defaultProps} onTransactionClick={onTransactionClick} />);
      
      const transactionElement = screen.getByText('Amazon').closest('div')!;
      fireEvent.click(transactionElement);
      
      await waitFor(() => {
        expect(onTransactionClick).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'trans-1',
            storeName: 'Amazon'
          })
        );
      });
    });

    it('スケジュールアイテムはクリックできないこと', () => {
      const onTransactionClick = jest.fn();
      render(<DayTotalModal {...defaultProps} onTransactionClick={onTransactionClick} />);
      
      const scheduleElement = screen.getByText('ガス代').closest('div')!;
      fireEvent.click(scheduleElement);
      
      // スケジュールアイテムはクリックできないので onTransactionClick は呼ばれない
      expect(onTransactionClick).not.toHaveBeenCalled();
    });

    it('フッターの閉じるボタンが正常に動作すること', async () => {
      const onClose = jest.fn();
      render(<DayTotalModal {...defaultProps} onClose={onClose} />);
      
      const footerCloseButton = screen.getByText('閉じる');
      fireEvent.click(footerCloseButton);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('グループ化ロジックのテスト', () => {
    it('同じ銀行のカードと銀行引落が正しくグループ化されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // SBIネット銀行のグループに PayPayカードと自動銀行振替があることを確認
      const sbiSection = screen.getByText('SBIネット銀行').closest('div')!;
      
      // PayPayカードと自動銀行振替が同じグループにあるか確認
      expect(sbiSection.textContent).toContain('PayPayカード');
      expect(sbiSection.textContent).toContain('自動銀行振替');
    });

    it('異なる銀行のカードが別々のグループに分かれること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const sbiSection = screen.getByText('SBIネット銀行').closest('div')!;
      const risonaSection = screen.getByText('りそな銀行').closest('div')!;
      
      // SBIにはPayPayカードがあり、りそなには楽天カードがある
      expect(sbiSection.textContent).toContain('PayPayカード');
      expect(sbiSection.textContent).not.toContain('楽天カード');
      
      expect(risonaSection.textContent).toContain('楽天カード');
      expect(risonaSection.textContent).not.toContain('PayPayカード');
    });
  });

  describe('エッジケース', () => {
    it('引落予定がない日の表示', () => {
      const emptyDayTotalData: DayTotalData = {
        date: '2024-02-20',
        totalAmount: 0,
        transactionCount: 0,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: false
      };

      render(<DayTotalModal 
        {...defaultProps} 
        dayTotalData={emptyDayTotalData}
        selectedDate={new Date(2024, 1, 20)}
      />);
      
      expect(screen.getByText('この日の引落予定はありません')).toBeInTheDocument();
    });

    it('店舗名がない取引の表示', () => {
      const transactionWithoutStore: Transaction = {
        id: 'trans-no-store',
        amount: 1000,
        date: new Date(2024, 1, 15).getTime(),
        storeName: '',
        paymentType: 'card',
        cardId: 'card-1',
        scheduledPayDate: new Date(2024, 2, 27).getTime(),
        memo: '',
        createdAt: Date.now()
      };

      const modifiedDayTotalData: DayTotalData = {
        ...mockDayTotalData,
        totalAmount: 1000,
        transactionCount: 1,
        scheduleCount: 0,
        transactions: [transactionWithoutStore],
        scheduleItems: []
      };

      render(<DayTotalModal {...defaultProps} dayTotalData={modifiedDayTotalData} />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getAllByText('￥1,000').length).toBeGreaterThan(0);
    });
  });
});
