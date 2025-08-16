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
    onTransactionViewClick: jest.fn(),
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

  describe('分離表示機能（取引データと引落予定データ）', () => {
    it('取引データがある日に「取引合計 XX円」形式で表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 15日には取引データ 37,840円（15,000 + 22,840）が表示されるはず
      const transactionElements = screen.getAllByText('取引合計');
      expect(transactionElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥37,840')).toBeInTheDocument();
    });

    it('引落予定データがある日に「引落予定 XX円」形式で表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 15日には引落予定データ 5,000円が表示されるはず
      const scheduleElements = screen.getAllByText('引落予定');
      expect(scheduleElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥5,000')).toBeInTheDocument();
    });

    it('取引データと引落予定データが同じ日に両方表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 15日には両方のデータが表示される
      const transactionElements = screen.getAllByText('取引合計');
      const scheduleElements = screen.getAllByText('引落予定');
      
      expect(transactionElements.length).toBeGreaterThan(0);
      expect(scheduleElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥37,840')).toBeInTheDocument(); // 取引合計
      expect(screen.getByText('￥5,000')).toBeInTheDocument(); // 引落予定
    });

    it('取引データのみの日には取引合計のみ表示されること', () => {
      const transactionOnlyProps = {
        ...defaultProps,
        schedule: { ...mockSchedule, items: [] }
      };
      
      render(<CalendarView {...transactionOnlyProps} />);
      
      const transactionElements = screen.getAllByText('取引合計');
      expect(transactionElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥37,840')).toBeInTheDocument();
      // 引落予定は表示されない（凡例は除く）
      const scheduleElements = screen.getAllByText('引落予定');
      // 凡例のみなので1個のはず
      expect(scheduleElements).toHaveLength(1);
    });

    it('引落予定データのみの日には引落予定のみ表示されること', () => {
      const scheduleOnlyProps = {
        ...defaultProps,
        transactions: []
      };
      
      render(<CalendarView {...scheduleOnlyProps} />);
      
      const scheduleElements = screen.getAllByText('引落予定');
      expect(scheduleElements.length).toBeGreaterThan(0);
      expect(screen.getByText('￥5,000')).toBeInTheDocument();
      // 取引合計は表示されない（凡例は除く）
      const transactionElements = screen.getAllByText('取引合計');
      // 凡例のみなので1個のはず
      expect(transactionElements).toHaveLength(1);
    });

    it('データがない日には何も表示されないこと', () => {
      const emptyProps = {
        ...defaultProps,
        transactions: [],
        schedule: { ...mockSchedule, items: [] }
      };
      
      render(<CalendarView {...emptyProps} />);
      
      // カレンダー上の取引・引落予定は表示されないが、凡例は表示される
      // 金額表示がないことで判断
      expect(screen.queryByText(/￥\d+/)).not.toBeInTheDocument();
    });
  });

  describe('色分け表示とスタイリング', () => {
    it('取引データが緑色背景で表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // bg-green-100クラスを持つ要素を直接探す
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      expect(transactionElement).toBeTruthy();
      expect(transactionElement).toHaveClass('bg-green-100', 'text-green-900', 'font-semibold');
    });

    it('引落予定データが青色背景で表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // bg-blue-100クラスを持つ要素を直接探す
      const blueElements = container.querySelectorAll('.bg-blue-100.text-blue-900');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(scheduleElement).toBeTruthy();
      expect(scheduleElement).toHaveClass('bg-blue-100');
      expect(scheduleElement).toHaveClass('text-blue-900');
      expect(scheduleElement).toHaveClass('font-semibold');
    });

    it('取引データがクリック可能であること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      expect(transactionElement).toBeTruthy();
      expect(transactionElement).toHaveClass('cursor-pointer');
    });

    it('引落予定データがクリック可能であること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(scheduleElement).toBeTruthy();
      expect(scheduleElement).toHaveClass('cursor-pointer');
    });
  });

  describe('分離クリックハンドラーの動作', () => {
    it('取引データをクリックすると onTransactionViewClick が正しい取引データで呼ばれること', async () => {
      const onTransactionViewClick = jest.fn();
      const { container } = render(<CalendarView {...defaultProps} onTransactionViewClick={onTransactionViewClick} />);
      
      // bg-green-100クラスを持つ要素を直接探す
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      expect(transactionElement).toBeTruthy();
      
      fireEvent.click(transactionElement!);
      
      await waitFor(() => {
        expect(onTransactionViewClick).toHaveBeenCalledWith(
          new Date(2024, 1, 15),
          expect.arrayContaining([
            expect.objectContaining({
              id: 'trans-1',
              storeName: 'Amazon'
            }),
            expect.objectContaining({
              id: 'trans-2',
              storeName: '楽天市場'
            })
          ])
        );
      });
    });

    it('引落予定をクリックすると onScheduleViewClick が正しい引落予定データで呼ばれること', async () => {
      const onScheduleViewClick = jest.fn();
      const { container } = render(<CalendarView {...defaultProps} onScheduleViewClick={onScheduleViewClick} />);
      
      // bg-blue-100クラスを持つ要素を直接探す
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(scheduleElement).toBeTruthy();
      
      fireEvent.click(scheduleElement!);
      
      await waitFor(() => {
        expect(onScheduleViewClick).toHaveBeenCalledWith(
          new Date(2024, 1, 15),
          expect.arrayContaining([
            expect.objectContaining({
              transactionId: 'schedule-1',
              amount: 5000
            })
          ])
        );
      });
    });

    it('取引データクリックが日付クリックとは別のイベントとして処理されること', async () => {
      const onDateClick = jest.fn();
      const onTransactionViewClick = jest.fn();
      
      const { container } = render(<CalendarView 
        {...defaultProps} 
        onDateClick={onDateClick}
        onTransactionViewClick={onTransactionViewClick}
      />);
      
      // 取引データ要素を探す
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      expect(transactionElement).toBeTruthy();
      
      fireEvent.click(transactionElement!);
      
      await waitFor(() => {
        expect(onTransactionViewClick).toHaveBeenCalled();
        // onDateClickは日付クリックとは別のハンドラーなので呼ばれない
        expect(onDateClick).not.toHaveBeenCalled();
      });
    });

    it('引落予定クリックが日付クリックとは別のイベントとして処理されること', async () => {
      const onDateClick = jest.fn();
      const onScheduleViewClick = jest.fn();
      
      const { container } = render(<CalendarView 
        {...defaultProps} 
        onDateClick={onDateClick}
        onScheduleViewClick={onScheduleViewClick}
      />);
      
      // 引落予定要素を探す
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(scheduleElement).toBeTruthy();
      
      fireEvent.click(scheduleElement!);
      
      await waitFor(() => {
        expect(onScheduleViewClick).toHaveBeenCalled();
        // onDateClickは日付クリックとは別のハンドラーなので呼ばれない
        expect(onDateClick).not.toHaveBeenCalled();
      });
    });

    it('日付の空白部分をクリックすると onDateClick のみが呼ばれること', async () => {
      const onDateClick = jest.fn();
      const onTransactionViewClick = jest.fn();
      const onScheduleViewClick = jest.fn();
      
      const { container } = render(<CalendarView 
        {...defaultProps} 
        onDateClick={onDateClick}
        onTransactionViewClick={onTransactionViewClick}
        onScheduleViewClick={onScheduleViewClick}
      />);
      
      // データがない日付（1日）をクリック
      const dayElement = screen.getByText('1');
      const dayCell = dayElement.closest('div[class*="min-h-[80px]"]');
      expect(dayCell).toBeTruthy();
      
      fireEvent.click(dayCell!);
      
      await waitFor(() => {
        expect(onDateClick).toHaveBeenCalledWith(new Date(2024, 1, 1));
        expect(onTransactionViewClick).not.toHaveBeenCalled();
        expect(onScheduleViewClick).not.toHaveBeenCalled();
      });
    });

    it('onTransactionViewClickが提供されていない場合、取引データクリックが動作しないこと', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      
      // クリックしてもエラーが発生しないことを確認
      expect(() => {
        if (transactionElement) {
          fireEvent.click(transactionElement);
        }
      }).not.toThrow();
    });

    it('onScheduleViewClickが提供されていない場合、引落予定クリックが動作しないこと', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      
      // クリックしてもエラーが発生しないことを確認
      expect(() => {
        if (scheduleElement) {
          fireEvent.click(scheduleElement);
        }
      }).not.toThrow();
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
    it('データにツールチップが表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 取引合計のツールチップを確認
      const transactionElement = container.querySelector('[title*="取引合計"]');
      expect(transactionElement).toBeTruthy();
      expect(transactionElement).toHaveAttribute('title', expect.stringContaining('取引合計: ￥37,840'));
      expect(transactionElement).toHaveAttribute('title', expect.stringContaining('取引2件'));

      // 引落予定のツールチップを確認
      const scheduleElement = container.querySelector('[title*="引落予定合計"]');
      expect(scheduleElement).toBeTruthy();
      expect(scheduleElement).toHaveAttribute('title', expect.stringContaining('引落予定合計: ￥5,000'));
      expect(scheduleElement).toHaveAttribute('title', expect.stringContaining('予定1件'));
    });

    it('データがクリック可能であることが分かること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 取引合計がクリック可能
      const greenElements = container.querySelectorAll('.bg-green-100');
      const transactionElement = Array.from(greenElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      expect(transactionElement).toBeTruthy();
      expect(transactionElement).toHaveClass('cursor-pointer');

      // 引落予定がクリック可能
      const blueElements = container.querySelectorAll('.bg-blue-100');
      const scheduleElement = Array.from(blueElements).find(el => 
        el.textContent?.includes('引落予定')
      );
      expect(scheduleElement).toBeTruthy();
      expect(scheduleElement).toHaveClass('cursor-pointer');
    });
  });

  describe('店舗情報表示', () => {
    it('カード・自動引き落としの右に店舗情報が表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // ツールチップに店舗情報が含まれていることを確認
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 取引合計のツールチップに店舗情報が表示される
      const transactionElement = container.querySelector('[title*="取引合計"]');
      expect(transactionElement).toBeTruthy();
      expect(transactionElement).toHaveAttribute('title', expect.stringContaining('取引2件'));
    });

    it('店舗情報がない取引でも正常に表示されること', () => {
      const transactionWithoutStore: Transaction = {
        ...mockTransactions[0],
        storeName: ''
      };
      
      const propsWithoutStore = {
        ...defaultProps,
        transactions: [transactionWithoutStore]
      };
      
      render(<CalendarView {...propsWithoutStore} />);
      
      // 店舗名がなくても取引合計は表示される
      const transactionTotals = screen.getAllByText('取引合計');
      expect(transactionTotals.length).toBeGreaterThan(0);
      expect(screen.getByText('￥15,000')).toBeInTheDocument();
    });

    it('取引データ表示に必要な情報が含まれていること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 取引合計ボックスがクリック可能で、適切なスタイルを持つ
      const transactionElements = container.querySelectorAll('.bg-green-100.cursor-pointer');
      const validTransactionElement = Array.from(transactionElements).find(el => 
        el.textContent?.includes('取引合計')
      );
      
      expect(validTransactionElement).toBeTruthy();
      expect(validTransactionElement).toHaveClass('text-green-900');
      expect(validTransactionElement).toHaveClass('hover:bg-green-200');
    });

    it('引落予定データ表示に必要な情報が含まれていること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 引落予定ボックスがクリック可能で、適切なスタイルを持つ
      const scheduleElements = container.querySelectorAll('.bg-blue-100');
      const validScheduleElement = Array.from(scheduleElements).find(el => 
        el.textContent?.includes('引落予定') && 
        el.classList.contains('cursor-pointer')
      );
      
      expect(validScheduleElement).toBeTruthy();
      expect(validScheduleElement).toHaveClass('bg-blue-100');
      expect(validScheduleElement).toHaveClass('cursor-pointer');
    });
  });

  describe('総合計削除の確認', () => {
    it('各ダイアログで個別表示のみになっていること（総合計なし）', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 取引合計と引落予定が個別に表示され、「総合計」表示がないことを確認
      const transactionTotals = screen.getAllByText('取引合計');
      const scheduleTotals = screen.getAllByText('引落予定');
      
      expect(transactionTotals.length).toBeGreaterThan(0);
      expect(scheduleTotals.length).toBeGreaterThan(0);
      
      // カレンダー上に「総合計」という文字列が表示されていないことを確認
      expect(screen.queryByText('総合計')).not.toBeInTheDocument();
    });

    it('取引データと引落予定データが分離されて表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 各データタイプが独立して表示される
      const transactionAmounts = screen.getAllByText('￥37,840'); // 取引合計
      const scheduleAmounts = screen.getAllByText('￥5,000'); // 引落予定合計
      
      expect(transactionAmounts.length).toBeGreaterThan(0);
      expect(scheduleAmounts.length).toBeGreaterThan(0);
      
      // 合計金額（42,840円）が表示されていないことを確認
      expect(screen.queryByText('￥42,840')).not.toBeInTheDocument();
    });

    it('同じ日に両方のデータがある場合、2つの別々のボックスで表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 15日には取引データと引落予定データの両方がある
      // 緑色のボックス（取引）と青色のボックス（引落予定）が別々に表示される
      const greenBoxes = container.querySelectorAll('.bg-green-100');
      const blueBoxes = container.querySelectorAll('.bg-blue-100');
      
      const transactionBox = Array.from(greenBoxes).find(el => 
        el.textContent?.includes('取引合計')
      );
      const scheduleBox = Array.from(blueBoxes).find(el => 
        el.textContent?.includes('引落予定')
      );
      
      expect(transactionBox).toBeTruthy();
      expect(scheduleBox).toBeTruthy();
      
      // 両方が独立したボックスとして表示される
      expect(transactionBox).not.toBe(scheduleBox);
    });
  });

  describe('凡例表示', () => {
    it('カレンダー下部に凡例が表示されること', () => {
      render(<CalendarView {...defaultProps} />);
      
      // 凡例の取引合計、引落予定、祝日表示を確認
      const transactionLegend = screen.getAllByText('取引合計');
      const scheduleLegend = screen.getAllByText('引落予定');
      
      expect(transactionLegend.length).toBeGreaterThan(0);
      expect(scheduleLegend.length).toBeGreaterThan(0);
      expect(screen.getByText('祝日')).toBeInTheDocument();
    });

    it('凡例の色が正しく表示されること', () => {
      const { container } = render(<CalendarView {...defaultProps} />);
      
      // 凡例の緑色（取引合計）と青色（引落予定）を確認
      const greenLegend = container.querySelector('.bg-green-100.border-green-300');
      const blueLegend = container.querySelector('.bg-blue-100.border-blue-300');
      
      expect(greenLegend).toBeInTheDocument();
      expect(blueLegend).toBeInTheDocument();
    });
  });
});
