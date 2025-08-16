/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScheduleViewModal } from '@/components/calendar/ScheduleViewModal';
import { ScheduleItem, Bank, Card } from '@/types/database';

// Mock data
const mockBanks: Bank[] = [
  {
    id: 'bank1',
    name: '三菱UFJ銀行',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'bank2', 
    name: '三井住友銀行',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const mockCards: Card[] = [
  {
    id: 'card1',
    name: 'メインカード',
    bankId: 'bank1',
    closingDay: 15,
    paymentDay: 10,
    paymentMonthShift: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const mockScheduleItems: ScheduleItem[] = [
  {
    transactionId: 'trans1',
    date: new Date('2024-01-15'),
    amount: 5000,
    paymentType: 'card',
    cardId: 'card1',
    cardName: 'メインカード',
    bankName: '三菱UFJ銀行',
    storeName: 'テストショップ',
    usage: 'テスト用途'
  },
  {
    transactionId: 'trans2',
    date: new Date('2024-01-15'),
    amount: 3000,
    paymentType: 'bank',
    bankName: '三井住友銀行',
    storeName: '銀行テスト',
    usage: '銀行テスト用途'
  }
];

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onScheduleClick: jest.fn(),
  selectedDate: new Date('2024-01-15'),
  scheduleItems: mockScheduleItems,
  banks: mockBanks,
  cards: mockCards
};

describe('ScheduleViewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    expect(screen.getByText('引落予定 - 2024年1月15日(月)')).toBeInTheDocument();
    expect(screen.getByText('引落予定')).toBeInTheDocument();
    expect(screen.getByText('予定されている引落し')).toBeInTheDocument();
  });

  it('displays total amount and count correctly', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    expect(screen.getByText('¥8,000')).toBeInTheDocument(); // 5000 + 3000
    expect(screen.getByText('2件の予定')).toBeInTheDocument();
  });

  it('groups schedule items by bank correctly', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('三井住友銀行')).toBeInTheDocument();
  });

  it('displays schedule item details correctly', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    expect(screen.getByText('メインカード')).toBeInTheDocument();
    expect(screen.getByText('• テストショップ')).toBeInTheDocument();
    expect(screen.getByText('店舗: テストショップ')).toBeInTheDocument();
    expect(screen.getByText('用途: テスト用途')).toBeInTheDocument();
  });

  it('calls onScheduleClick when schedule item is clicked', async () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    const scheduleItems = screen.getAllByText('メインカード')[0].closest('div[class*="cursor-pointer"]');
    expect(scheduleItems).toBeInTheDocument();
    
    if (scheduleItems) {
      fireEvent.click(scheduleItems);
      await waitFor(() => {
        expect(mockProps.onScheduleClick).toHaveBeenCalledWith(mockScheduleItems[0]);
      });
    }
  });

  it('calls onClose when close button is clicked', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    const closeButton = screen.getByLabelText('閉じる');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    render(<ScheduleViewModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('引落予定 - 2024年1月15日(月)')).not.toBeInTheDocument();
  });

  it('does not render when scheduleItems is empty', () => {
    render(<ScheduleViewModal {...mockProps} scheduleItems={[]} />);
    
    expect(screen.queryByText('引落予定 - 2024年1月15日(月)')).not.toBeInTheDocument();
  });

  it('displays operation guide correctly', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    expect(screen.getByText('操作ガイド:')).toBeInTheDocument();
    expect(screen.getByText('引落予定項目をクリックすると詳細編集ができます')).toBeInTheDocument();
    expect(screen.getByText('店舗情報、用途、メモがある場合は項目に表示されます')).toBeInTheDocument();
    expect(screen.getByText('編集モードでは引落予定の詳細を変更できます')).toBeInTheDocument();
  });

  it('displays edit icons for schedule items', () => {
    render(<ScheduleViewModal {...mockProps} />);
    
    const editIcons = screen.getAllByRole('img', { hidden: true });
    const editIcon = editIcons.find(icon => 
      icon.parentElement?.classList.contains('text-blue-600')
    );
    expect(editIcon).toBeInTheDocument();
  });

  describe('青色テーマとデザイン統一性のテスト', () => {
    it('モーダルヘッダーが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const header = container.querySelector('.bg-blue-50.border-blue-200');
      expect(header).toBeInTheDocument();
    });

    it('引落予定サマリーボックスが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const summaryBox = container.querySelector('.bg-blue-50.border.border-blue-200');
      expect(summaryBox).toBeInTheDocument();
      expect(summaryBox?.textContent).toContain('引落予定');
    });

    it('銀行グループヘッダーが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const bankHeaders = container.querySelectorAll('.bg-blue-100.border-b.border-blue-200');
      expect(bankHeaders.length).toBeGreaterThan(0);
    });

    it('引落予定項目が青色ホバー効果を持つこと', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const scheduleItems = container.querySelectorAll('.hover\\:bg-blue-50.cursor-pointer');
      expect(scheduleItems.length).toBeGreaterThan(0);
    });

    it('「予定」バッジが青色で表示されること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const scheduleBadges = container.querySelectorAll('.bg-blue-100.text-blue-800');
      expect(scheduleBadges.length).toBeGreaterThan(0);
      
      // バッジのテキスト内容も確認
      const badgeTexts = Array.from(scheduleBadges).map(badge => badge.textContent);
      expect(badgeTexts.some(text => text?.includes('予定'))).toBe(true);
    });
  });

  describe('銀行別グループ化機能のテスト', () => {
    it('カード支払いが正しく銀行別にグループ化されること', () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // 三菱UFJ銀行のセクションに「メインカード」があることを確認
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.getByText('メインカード')).toBeInTheDocument();
      
      // 三井住友銀行のセクションに「自動銀行振替」があることを確認
      expect(screen.getByText('三井住友銀行')).toBeInTheDocument();
      expect(screen.getByText('自動銀行振替')).toBeInTheDocument();
    });

    it('銀行別の合計金額が正しく計算・表示されること', () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // 三菱UFJ銀行: 5,000円
      // 三井住友銀行: 3,000円
      expect(screen.getByText('¥5,000')).toBeInTheDocument();
      expect(screen.getByText('¥3,000')).toBeInTheDocument();
    });

    it('銀行別の件数が正しく表示されること', () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // 各銀行セクションに「1件」が表示されることを確認
      const countElements = screen.getAllByText('1件');
      expect(countElements.length).toBe(2); // 2つの銀行セクション分
    });

    it('銀行名がアルファベット順にソートされること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const bankHeaders = container.querySelectorAll('.bg-blue-100 h4');
      const bankNames = Array.from(bankHeaders).map(header => header.textContent);
      
      expect(bankNames).toEqual(['三井住友銀行', '三菱UFJ銀行']);
    });
  });

  describe('詳細情報表示機能のテスト', () => {
    it('店舗情報が複数箇所で表示されること', () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // カード名の横の表示
      expect(screen.getByText('• テストショップ')).toBeInTheDocument();
      
      // 詳細情報セクションの表示
      expect(screen.getByText('店舗: テストショップ')).toBeInTheDocument();
    });

    it('用途情報が表示されること', () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      expect(screen.getByText('用途: テスト用途')).toBeInTheDocument();
      expect(screen.getByText('用途: 銀行テスト用途')).toBeInTheDocument();
    });

    it('店舗情報がない場合は表示されないこと', () => {
      const itemsWithoutStore = [
        {
          transactionId: 'trans3',
          date: new Date('2024-01-15'),
          amount: 2000,
          paymentType: 'card' as const,
          cardId: 'card1',
          cardName: 'メインカード',
          bankName: '三菱UFJ銀行'
        }
      ];
      
      render(<ScheduleViewModal {...mockProps} scheduleItems={itemsWithoutStore} />);
      
      expect(screen.queryByText(/店舗:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/•/)).not.toBeInTheDocument();
    });

    it('用途情報がない場合は表示されないこと', () => {
      const itemsWithoutUsage = [
        {
          transactionId: 'trans3',
          date: new Date('2024-01-15'),
          amount: 2000,
          paymentType: 'card' as const,
          cardId: 'card1',
          cardName: 'メインカード',
          bankName: '三菱UFJ銀行',
          storeName: 'テストショップ'
        }
      ];
      
      render(<ScheduleViewModal {...mockProps} scheduleItems={itemsWithoutUsage} />);
      
      expect(screen.queryByText(/用途:/)).not.toBeInTheDocument();
    });
  });

  describe('編集可能性のテスト', () => {
    it('すべての引落予定項目が編集アイコンを持つこと', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      // 編集アイコンのSVGパスを確認
      const editIcons = container.querySelectorAll('svg path[d*="M15.232 5.232l3.536 3.536"]');
      expect(editIcons.length).toBe(2); // 2つのスケジュールアイテム分
    });

    it('引落予定項目クリック時にonScheduleClickが正しいデータで呼ばれること', async () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // 最初のスケジュールアイテムをクリック
      const firstScheduleItem = screen.getByText('メインカード').closest('.cursor-pointer');
      expect(firstScheduleItem).toBeInTheDocument();
      
      fireEvent.click(firstScheduleItem!);
      
      await waitFor(() => {
        expect(mockProps.onScheduleClick).toHaveBeenCalledWith(mockScheduleItems[0]);
      });
    });

    it('異なるスケジュールアイテムクリック時に正しいデータが渡されること', async () => {
      render(<ScheduleViewModal {...mockProps} />);
      
      // 2番目のスケジュールアイテム（自動銀行振替）をクリック
      const secondScheduleItem = screen.getByText('自動銀行振替').closest('.cursor-pointer');
      expect(secondScheduleItem).toBeInTheDocument();
      
      fireEvent.click(secondScheduleItem!);
      
      await waitFor(() => {
        expect(mockProps.onScheduleClick).toHaveBeenCalledWith(mockScheduleItems[1]);
      });
    });

    it('編集アイコンがホバー時に色が変わること', () => {
      const { container } = render(<ScheduleViewModal {...mockProps} />);
      
      const editIcons = container.querySelectorAll('.text-blue-600.group-hover\\:text-blue-700');
      expect(editIcons.length).toBeGreaterThan(0);
    });
  });

  describe('エラーケースとエッジケースのテスト', () => {
    it('カード情報が見つからない場合にスケジュールアイテムが表示されないこと', () => {
      const invalidScheduleItems = [
        {
          transactionId: 'trans-invalid',
          date: new Date('2024-01-15'),
          amount: 1000,
          paymentType: 'card' as const,
          cardId: 'invalid-card-id',
          cardName: 'Invalid Card',
          bankName: 'Invalid Bank'
        }
      ];
      
      render(<ScheduleViewModal {...mockProps} scheduleItems={invalidScheduleItems} />);
      
      expect(screen.queryByText('Invalid Card')).not.toBeInTheDocument();
    });

    it('銀行情報が見つからない場合にスケジュールアイテムが表示されないこと', () => {
      const invalidBankScheduleItems = [
        {
          transactionId: 'trans-invalid-bank',
          date: new Date('2024-01-15'),
          amount: 1000,
          paymentType: 'bank' as const,
          bankName: 'Invalid Bank Name'
        }
      ];
      
      render(<ScheduleViewModal {...mockProps} scheduleItems={invalidBankScheduleItems} />);
      
      expect(screen.queryByText('Invalid Bank Name')).not.toBeInTheDocument();
    });

    it('空のスケジュールリストの場合にエラーメッセージが表示されること', () => {
      render(<ScheduleViewModal {...mockProps} scheduleItems={[]} />);
      
      // 空の場合はモーダル自体が表示されない
      expect(screen.queryByText('引落予定 - 2024年1月15日(月)')).not.toBeInTheDocument();
    });

    it('大量のスケジュールアイテムが正しく処理されること', () => {
      const manyScheduleItems = Array.from({ length: 10 }, (_, index) => ({
        transactionId: `trans${index}`,
        date: new Date('2024-01-15'),
        amount: 1000 * (index + 1),
        paymentType: 'card' as const,
        cardId: 'card1',
        cardName: `カード${index + 1}`,
        bankName: '三菱UFJ銀行',
        storeName: `店舗${index + 1}`
      }));
      
      render(<ScheduleViewModal {...mockProps} scheduleItems={manyScheduleItems} />);
      
      // 総合計が正しく計算されることを確認
      const expectedTotal = manyScheduleItems.reduce((sum, item) => sum + item.amount, 0);
      expect(screen.getByText(`¥${expectedTotal.toLocaleString()}`)).toBeInTheDocument();
      
      // 総件数が正しく表示されることを確認
      expect(screen.getByText('10件の予定')).toBeInTheDocument();
    });
  });
});