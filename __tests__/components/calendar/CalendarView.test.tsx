import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Transaction, Bank, Card, MonthlySchedule } from '@/types/database';
// Removed unused imports

// Mock the swipe navigation hook
jest.mock('@/lib/hooks/useSwipeNavigation', () => ({
  useSwipeNavigation: () => ({
    handlers: {}
  })
}));

// Mock date utilities
jest.mock('@/lib/utils/dateUtils', () => ({
  ...jest.requireActual('@/lib/utils/dateUtils'),
  getCurrentJapanDate: () => new Date(2024, 1, 15), // February 15, 2024
  createCalendarGrid: jest.fn(() => [
    // Mock calendar grid for testing
    { date: new Date(2024, 1, 1), isCurrentMonth: true, isToday: false, isWeekend: false, isHoliday: false },
    { date: new Date(2024, 1, 15), isCurrentMonth: true, isToday: true, isWeekend: false, isHoliday: false },
    { date: new Date(2024, 1, 20), isCurrentMonth: true, isToday: false, isWeekend: false, isHoliday: false },
  ])
}));

describe('CalendarView', () => {
  const mockBanks: Bank[] = [
    {
      id: 'bank-1',
      name: 'SBIネット銀行',
      memo: 'メインバンク',
      createdAt: Date.now()
    },
    {
      id: 'bank-2', 
      name: 'りそな銀行',
      memo: 'サブバンク',
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
      memo: 'メインカード',
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
      memo: 'サブカード',
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
      memo: 'オンラインショッピング',
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
      memo: 'オンラインショッピング',
      createdAt: Date.now()
    }
  ];

  const mockSchedule: MonthlySchedule = {
    year: 2024,
    month: 2,
    items: [
      {
        transactionId: 'schedule-1',
        date: new Date(2024, 1, 15),
        amount: 5000,
        storeName: '自動引落',
        paymentType: 'bank',
        bankName: 'SBIネット銀行',
        // cardName: undefined, // Optional property should be omitted rather than undefined
        // memo: '電気代' // ScheduleItemにはmemoプロパティが存在しない
      }
    ],
    bankTotals: [],
    monthTotal: 5000,
    totalAmount: 5000,
    totalTransactions: 1
  };

  const defaultProps = {
    year: 2024,
    month: 2,
    transactions: mockTransactions,
    schedule: mockSchedule,
    banks: mockBanks,
    cards: mockCards,
    onDateClick: jest.fn(),
    onTransactionClick: jest.fn(),
    onDayTotalClick: jest.fn(),
    onMonthChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('カレンダーが正常にレンダリングされること', () => {
      render(<CalendarView {...defaultProps} />);
      
      expect(screen.getByText('2024年 2月')).toBeInTheDocument();
      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByText('月')).toBeInTheDocument();
    });

    it('週の表示ヘッダーが正しく表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });

  describe('日付表示とスタイリング', () => {
    it('今日の日付が適切にハイライトされること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // Mock data の今日は15日
      const todayElement = screen.getByText('15');
      // 今日の日付の親要素（カレンダーセル）がハイライトされていることを確認
      const parentCell = todayElement.closest('div[class*="min-h-[80px]"]');
      expect(parentCell).toHaveClass('bg-blue-100', 'font-semibold');
    });

    it('カレンダーの日付がクリック可能であること', async () => {
      const onDateClick = jest.fn();
      render(<CalendarView {...defaultProps} onDateClick={onDateClick} />);
      
      const dayElement = screen.getByText('1');
      fireEvent.click(dayElement.closest('div')!);
      
      await waitFor(() => {
        expect(onDateClick).toHaveBeenCalledWith(new Date(2024, 1, 1));
      });
    });
  });

  describe('引落予定表示機能', () => {
    it('引落予定がある日に「引落予定 XX円」形式で表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 15日には取引とスケジュールの合計42,840円が表示されるはず
      const paymentElements = screen.getAllByText('引落予定');
      expect(paymentElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥42,840')).toBeInTheDocument();
    });

    it('引落予定の合計金額が正確に計算されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // データ: 15,000 + 22,840 + 5,000 = 42,840円
      const totalElement = container.querySelector('[title*="引落予定合計: ￥42,840"]');
      expect(totalElement).toBeInTheDocument();
    });

    it('引落予定がない日には何も表示されないこと', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: [],
        schedule: { ...mockSchedule, items: [] }
      };
      
      render(<CalendarView {...emptyProps} />);
      
      // カレンダー上の引落予定は表示されないが、凡例の引落予定は表示される
      // 凡例のみであることを確認（金額表示がないことで判断）
      expect(screen.queryByText(/\d+円/)).not.toBeInTheDocument();
    });

    it('引落予定表示が青色背景と太文字でスタイリングされていること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // bg-blue-100クラスを持つ要素を直接探す
      const blueElements = container.querySelectorAll('.bg-blue-100');
      expect(blueElements.length).toBeGreaterThan(0);
      
      // 引落予定の文字列を含む要素を探す
      const paymentElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(paymentElement).toBeTruthy();
      expect(paymentElement).toHaveClass('bg-blue-100', 'text-blue-900', 'font-semibold');
    });
  });

  describe('DayTotalModal との連携', () => {
    it('引落予定をクリックすると onDayTotalClick が適切なデータで呼ばれること', async () => {
      const onDayTotalClick = jest.fn();
      const { container } = render(<CalendarView {...defaultProps} onDayTotalClick={onDayTotalClick} />);
      
      // bg-blue-100クラスを持つ要素を直接探す
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const paymentElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(paymentElement).toBeTruthy();
      
      fireEvent.click(paymentElement!);
      
      await waitFor(() => {
        expect(onDayTotalClick).toHaveBeenCalledWith(
          new Date(2024, 1, 15),
          expect.objectContaining({
            date: '2024-02-15',
            totalAmount: 42840,
            transactionCount: 2,
            scheduleCount: 1,
            hasData: true
          })
        );
      });
    });

    it('引落予定クリックが日付クリックとは別のイベントとして処理されること', async () => {
      const onDateClick = jest.fn();
      const onDayTotalClick = jest.fn();
      
      const { container } = render(<CalendarView 
        {...defaultProps} 
        onDateClick={onDateClick}
        onDayTotalClick={onDayTotalClick}
      />);
      
      // クリック可能な引落予定要素を探す（cursor-pointerクラス）
      const clickableElements = container.querySelectorAll('.cursor-pointer');
      const paymentElement = Array.from(clickableElements).find(el => 
        el.textContent?.includes('引落予定') && el.textContent?.includes('￥42,840')
      );
      expect(paymentElement).toBeTruthy();
      
      fireEvent.click(paymentElement!);
      
      await waitFor(() => {
        expect(onDayTotalClick).toHaveBeenCalled();
        // onDateClickは日付クリックとは別のハンドラーなので呼ばれない
        expect(onDateClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('データ処理とレンダリング', () => {
    it('複数の支払いタイプが正しく合計されること', () => {
      const mixedTransactions: Transaction[] = [
        {
          id: 'card-trans',
          amount: 10000,
          date: new Date(2024, 1, 15).getTime(),
          storeName: 'カード支払い',
          paymentType: 'card',
          cardId: 'card-1',
          scheduledPayDate: new Date(2024, 2, 27).getTime(),
          memo: '',
          createdAt: Date.now()
        },
        {
          id: 'bank-trans',
          amount: 5000,
          date: new Date(2024, 1, 15).getTime(),
          storeName: '銀行引落',
          paymentType: 'bank',
          bankId: 'bank-1',
          scheduledPayDate: new Date(2024, 1, 15).getTime(),
          memo: '',
          createdAt: Date.now()
        }
      ];

      const props = {
        ...defaultProps,
        transactions: mixedTransactions,
        schedule: { ...mockSchedule, items: [] }
      };

      render(<CalendarView {...props} />);
      
      expect(screen.getByText('￥15,000')).toBeInTheDocument();
    });

    it('月をまたいだデータが正しく処理されること', () => {
      const crossMonthTransactions: Transaction[] = [
        {
          id: 'march-trans',
          amount: 8000,
          date: new Date(2024, 2, 1).getTime(), // March 1st
          storeName: '3月の取引',
          paymentType: 'card',
          cardId: 'card-1',
          scheduledPayDate: new Date(2024, 3, 27).getTime(),
          memo: '',
          createdAt: Date.now()
        }
      ];

      const props = {
        ...defaultProps,
        transactions: crossMonthTransactions,
        schedule: { ...mockSchedule, items: [] }
      };

      render(<CalendarView {...props} />);
      
      // 2月表示なので3月のデータは表示されない
      expect(screen.queryByText('￥8,000')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('引落予定にツールチップが表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // title属性を持つ要素を直接探す
      const elementWithTitle = container.querySelector('[title*="引落予定合計"]');
      expect(elementWithTitle).toBeTruthy();
      expect(elementWithTitle).toHaveAttribute('title', expect.stringContaining('引落予定合計: ￥42,840'));
      expect(elementWithTitle).toHaveAttribute('title', expect.stringContaining('取引2件、予定1件'));
    });

    it('引落予定がクリック可能であることが分かること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // bg-blue-100クラスを持つ要素を直接探す
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const paymentElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(paymentElement).toBeTruthy();
      expect(paymentElement).toHaveClass('cursor-pointer');
    });
  });

  describe('凡例表示', () => {
    it('カレンダー下部に凡例が表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 凡例の引落予定と祝日表示を確認（複数あるため getAllByText を使用）
      const legendItems = screen.getAllByText('引落予定');
      expect(legendItems.length).toBeGreaterThan(0);
      
      expect(screen.getByText('祝日')).toBeInTheDocument();
    });
  });
});
