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
    transactionTotal: 45840, // 取引合計: 15,000 + 22,840 + 8,000
    scheduleTotal: 5000, // 引落予定合計: 5,000
    transactionCount: 3,
    scheduleCount: 1,
    bankGroups: [],
    transactions: mockTransactions,
    scheduleItems: mockScheduleItems,
    hasData: true,
    hasTransactions: true,
    hasSchedule: true
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
      expect(screen.getByText('取引合計:')).toBeInTheDocument();
      expect(screen.getAllByText('￥45,840').length).toBeGreaterThan(0);
      expect(screen.getByText('引落予定合計:')).toBeInTheDocument();
      expect(screen.getAllByText('￥5,000').length).toBeGreaterThan(0);
      expect(screen.getByText('総合計:')).toBeInTheDocument();
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
      
      const sbiElements = screen.getAllByText('SBIネット銀行');
      const risonaElements = screen.getAllByText('りそな銀行');
      
      expect(sbiElements.length).toBeGreaterThan(0);
      expect(risonaElements.length).toBeGreaterThan(0);
    });

    it('銀行ごとの合計金額が正しく表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // SBIネット銀行: 取引データ PayPayカード(15,000円) + 銀行引落(8,000円) = 23,000円
      expect(screen.getAllByText('￥23,000').length).toBeGreaterThan(0);
      
      // りそな銀行: 楽天カード(22,840円) = 22,840円 (重複表示があるため getAllByText を使用)
      expect(screen.getAllByText('￥22,840').length).toBeGreaterThan(0);
      
      // SBIネット銀行の引落予定: 5,000円
      expect(screen.getAllByText('￥5,000').length).toBeGreaterThan(0);
    });

    it('取引データと引落予定データが分離表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // 取引データセクション
      expect(screen.getByText('取引データ (3件)')).toBeInTheDocument();
      expect(screen.getByText('実際に行った支払い取引:')).toBeInTheDocument();
      
      // 引落予定データセクション
      expect(screen.getByText('引落予定 (1件)')).toBeInTheDocument();
      expect(screen.getByText('予定されている引落し:')).toBeInTheDocument();
    });

    it('取引データに「取引」バッジが表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const transactionBadges = screen.getAllByText('取引');
      expect(transactionBadges.length).toBe(3); // 3つのトランザクション分
    });

    it('引落予定データに「予定」バッジが表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const scheduleBadges = screen.getAllByText('予定');
      expect(scheduleBadges.length).toBe(1); // 1つのスケジュール分
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
      
      // SBIネット銀行の取引データとスケジュールデータをそれぞれ確認
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getAllByText('自動銀行振替').length).toBeGreaterThan(0);
      
      // 両方のセクションにSBIネット銀行があることを確認
      const sbiElements = screen.getAllByText('SBIネット銀行');
      expect(sbiElements.length).toBeGreaterThan(0);
    });

    it('異なる銀行のカードが別々のグループに分かれること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // SBIにはPayPayカードがあり、りそなには楽天カードがある
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
      
      // 両方の銀行が表示されていることを確認
      const sbiElements = screen.getAllByText('SBIネット銀行');
      const risonaElements = screen.getAllByText('りそな銀行');
      
      expect(sbiElements.length).toBeGreaterThan(0);
      expect(risonaElements.length).toBeGreaterThan(0);
    });
  });

  describe('エッジケース', () => {
    it('データがない日の表示', () => {
      const emptyDayTotalData: DayTotalData = {
        date: '2024-02-20',
        totalAmount: 0,
        transactionTotal: 0,
        scheduleTotal: 0,
        transactionCount: 0,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [],
        scheduleItems: [],
        hasData: false,
        hasTransactions: false,
        hasSchedule: false
      };

      render(<DayTotalModal 
        {...defaultProps} 
        dayTotalData={emptyDayTotalData}
        selectedDate={new Date(2024, 1, 20)}
      />);
      
      expect(screen.getByText('この日にはデータがありません')).toBeInTheDocument();
    });

    it('取引データのみの日の表示', () => {
      const transactionOnlyData: DayTotalData = {
        date: '2024-02-25',
        totalAmount: 15000,
        transactionTotal: 15000,
        scheduleTotal: 0,
        transactionCount: 1,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [mockTransactions[0]!],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: false
      };

      render(<DayTotalModal 
        {...defaultProps} 
        dayTotalData={transactionOnlyData}
        selectedDate={new Date(2024, 1, 25)}
      />);
      
      expect(screen.getByText('取引データ (1件)')).toBeInTheDocument();
      expect(screen.queryByText('引落予定 (')).not.toBeInTheDocument();
      expect(screen.getByText('取引合計:')).toBeInTheDocument();
      expect(screen.queryByText('引落予定合計:')).not.toBeInTheDocument();
    });

    it('引落予定データのみの日の表示', () => {
      const scheduleOnlyData: DayTotalData = {
        date: '2024-02-28',
        totalAmount: 5000,
        transactionTotal: 0,
        scheduleTotal: 5000,
        transactionCount: 0,
        scheduleCount: 1,
        bankGroups: [],
        transactions: [],
        scheduleItems: mockScheduleItems,
        hasData: true,
        hasTransactions: false,
        hasSchedule: true
      };

      render(<DayTotalModal 
        {...defaultProps} 
        dayTotalData={scheduleOnlyData}
        selectedDate={new Date(2024, 1, 28)}
      />);
      
      expect(screen.getByText('引落予定 (1件)')).toBeInTheDocument();
      expect(screen.queryByText('取引データ (')).not.toBeInTheDocument();
      expect(screen.getByText('引落予定合計:')).toBeInTheDocument();
      expect(screen.queryByText('取引合計:')).not.toBeInTheDocument();
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
        transactionTotal: 1000,
        scheduleTotal: 0,
        transactionCount: 1,
        scheduleCount: 0,
        transactions: [transactionWithoutStore],
        scheduleItems: [],
        hasTransactions: true,
        hasSchedule: false
      };

      render(<DayTotalModal {...defaultProps} dayTotalData={modifiedDayTotalData} />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getAllByText('￥1,000').length).toBeGreaterThan(0);
    });
  });

  describe('新機能の色分け表示とクリック動作', () => {
    it('取引データセクションが緑色のボーダーで表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      const transactionSection = container.querySelector('.border-l-4.border-green-500');
      expect(transactionSection).toBeInTheDocument();
      expect(transactionSection?.textContent).toContain('取引データ');
    });

    it('引落予定セクションが青色のボーダーで表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      const scheduleSection = container.querySelector('.border-l-4.border-blue-500');
      expect(scheduleSection).toBeInTheDocument();
      expect(scheduleSection?.textContent).toContain('引落予定');
    });

    it('取引データのアイテムが緑色背景で表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      const transactionItems = container.querySelectorAll('.border-green-200');
      expect(transactionItems.length).toBeGreaterThan(0);
    });

    it('引落予定データのアイテムが青色背景で表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      const scheduleItems = container.querySelectorAll('.border-blue-200');
      expect(scheduleItems.length).toBeGreaterThan(0);
    });

    it('取引データアイテムのみがクリック可能であること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      // 取引データの矢印アイコンを確認
      const transactionArrows = container.querySelectorAll('svg[viewBox="0 0 24 24"] path[d="M9 5l7 7-7 7"]');
      expect(transactionArrows.length).toBe(3); // 3つのトランザクション分
      
      // 引落予定データにはクリック要素がないことを確認
      const scheduleElements = Array.from(container.querySelectorAll('.border-blue-200 .px-4.py-3'));
      scheduleElements.forEach(element => {
        const arrows = element.querySelectorAll('svg[viewBox="0 0 24 24"] path[d="M9 5l7 7-7 7"]');
        expect(arrows.length).toBe(0);
      });
    });

    it('スケジュールアイテムがクリックできないため矢印が表示されないこと', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // 「予定」バッジを持つ要素を探す
      const scheduleBadges = screen.getAllByText('予定');
      expect(scheduleBadges.length).toBe(1);
      
      // その親要素に矢印アイコンがないことを確認
      scheduleBadges.forEach(badge => {
        const parentElement = badge.closest('.px-4.py-3');
        if (parentElement) {
          const arrows = parentElement.querySelectorAll('svg[viewBox="0 0 24 24"] path[d="M9 5l7 7-7 7"]');
          expect(arrows.length).toBe(0);
        }
      });
    });
  });
});
