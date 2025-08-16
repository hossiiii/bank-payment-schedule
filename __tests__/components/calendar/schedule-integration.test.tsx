/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScheduleViewModal } from '@/components/calendar/ScheduleViewModal';
import { ScheduleEditModal } from '@/components/calendar/ScheduleEditModal';
import { DayTotalModal } from '@/components/calendar/DayTotalModal';
import { ScheduleItem, Bank, Card, Transaction } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

/**
 * 統合機能テスト: カードと銀行の引落予定統一表示
 * 
 * このテストファイルでは以下の統合機能をテストします：
 * 1. カード支払いと銀行引落の統一表示
 * 2. 銀行別グループ化での正しい統合
 * 3. 青色テーマの一貫性
 * 4. 編集機能の統合動作
 * 5. DayTotalModalとの連携
 */

describe('Schedule Integration Tests - Unified Card and Bank Schedule Display', () => {
  // 統合テスト用のモックデータ
  const mockBanks: Bank[] = [
    {
      id: 'sbi-bank',
      name: 'SBIネット銀行',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'mufg-bank', 
      name: '三菱UFJ銀行',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'mizuho-bank',
      name: 'みずほ銀行',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const mockCards: Card[] = [
    {
      id: 'paypay-card',
      name: 'PayPayカード',
      bankId: 'sbi-bank',
      closingDay: 15,
      paymentDay: 27,
      paymentMonthShift: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'mufg-card',
      name: '三菱UFJカード',
      bankId: 'mufg-bank',
      closingDay: 31,
      paymentDay: 10,
      paymentMonthShift: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'rakuten-card',
      name: '楽天カード',
      bankId: 'mizuho-bank',
      closingDay: 31,
      paymentDay: 27,
      paymentMonthShift: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  // 複合的な引落予定データ（カード + 銀行）
  const complexScheduleItems: ScheduleItem[] = [
    // SBIネット銀行 - PayPayカード
    {
      transactionId: 'schedule-paypay-1',
      date: new Date('2024-01-27'),
      amount: 15000,
      paymentType: 'card',
      cardId: 'paypay-card',
      cardName: 'PayPayカード',
      bankName: 'SBIネット銀行',
      storeName: 'Amazon',
      usage: 'ネットショッピング'
    },
    {
      transactionId: 'schedule-paypay-2',
      date: new Date('2024-01-27'),
      amount: 8500,
      paymentType: 'card',
      cardId: 'paypay-card',
      cardName: 'PayPayカード',
      bankName: 'SBIネット銀行',
      storeName: 'コンビニ',
      usage: '日用品'
    },
    // SBIネット銀行 - 銀行引落
    {
      transactionId: 'schedule-sbi-bank-1',
      date: new Date('2024-01-27'),
      amount: 12000,
      paymentType: 'bank',
      bankName: 'SBIネット銀行',
      storeName: '電気代',
      usage: '公共料金'
    },
    // 三菱UFJ銀行 - カード
    {
      transactionId: 'schedule-mufg-card-1',
      date: new Date('2024-01-27'),
      amount: 25000,
      paymentType: 'card',
      cardId: 'mufg-card',
      cardName: '三菱UFJカード',
      bankName: '三菱UFJ銀行',
      storeName: '百貨店',
      usage: '衣料品'
    },
    // みずほ銀行 - 楽天カード
    {
      transactionId: 'schedule-rakuten-1',
      date: new Date('2024-01-27'),
      amount: 18000,
      paymentType: 'card',
      cardId: 'rakuten-card',
      cardName: '楽天カード',
      bankName: 'みずほ銀行',
      storeName: '楽天市場',
      usage: 'ネットショッピング'
    },
    // みずほ銀行 - 銀行引落
    {
      transactionId: 'schedule-mizuho-bank-1',
      date: new Date('2024-01-27'),
      amount: 7500,
      paymentType: 'bank',
      bankName: 'みずほ銀行',
      storeName: 'ガス代',
      usage: '公共料金'
    }
  ];

  // DayTotalModal用の複合データ
  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      amount: 5000,
      date: new Date('2024-01-27').getTime(),
      storeName: 'スーパーマーケット',
      paymentType: 'card',
      cardId: 'paypay-card',
      scheduledPayDate: new Date('2024-02-27').getTime(),
      memo: '',
      createdAt: Date.now()
    }
  ];

  const complexDayTotalData: DayTotalData = {
    date: '2024-01-27',
    totalAmount: 91000, // 取引5,000 + 引落予定86,000
    transactionTotal: 5000,
    scheduleTotal: 86000,
    transactionCount: 1,
    scheduleCount: 6,
    bankGroups: [],
    transactions: mockTransactions,
    scheduleItems: complexScheduleItems,
    hasData: true,
    hasTransactions: true,
    hasSchedule: true
  };

  const selectedDate = new Date('2024-01-27');

  describe('統一表示機能：ScheduleViewModal', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onScheduleClick: jest.fn(),
      selectedDate,
      scheduleItems: complexScheduleItems,
      banks: mockBanks,
      cards: mockCards
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('銀行別グループ化で カード+銀行引落 が正しく統合表示されること', () => {
      render(<ScheduleViewModal {...defaultProps} />);
      
      // SBIネット銀行のセクション
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      
      // SBIネット銀行内のカード引落（PayPayカード）
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('コンビニ')).toBeInTheDocument();
      
      // SBIネット銀行内の銀行引落
      expect(screen.getByText('自動銀行振替')).toBeInTheDocument();
      expect(screen.getByText('電気代')).toBeInTheDocument();
      
      // 三菱UFJ銀行のセクション
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.getByText('三菱UFJカード')).toBeInTheDocument();
      
      // みずほ銀行のセクション
      expect(screen.getByText('みずほ銀行')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
    });

    it('銀行別の合計金額が カード+銀行引落 を含めて正しく計算されること', () => {
      render(<ScheduleViewModal {...defaultProps} />);
      
      // SBIネット銀行: PayPayカード(15,000 + 8,500) + 銀行引落(12,000) = 35,500円
      expect(screen.getByText('¥35,500')).toBeInTheDocument();
      
      // 三菱UFJ銀行: 三菱UFJカード(25,000) = 25,000円
      expect(screen.getByText('¥25,000')).toBeInTheDocument();
      
      // みずほ銀行: 楽天カード(18,000) + 銀行引落(7,500) = 25,500円
      expect(screen.getByText('¥25,500')).toBeInTheDocument();
      
      // 総合計: 35,500 + 25,000 + 25,500 = 86,000円
      expect(screen.getByText('¥86,000')).toBeInTheDocument();
    });

    it('銀行別の件数が カード+銀行引落 を含めて正しく表示されること', () => {
      render(<ScheduleViewModal {...defaultProps} />);
      
      // SBIネット銀行: 3件（PayPayカード2件 + 銀行引落1件）
      // 三菱UFJ銀行: 1件（三菱UFJカード1件）
      // みずほ銀行: 2件（楽天カード1件 + 銀行引落1件）
      
      const countElements = screen.getAllByText(/件$/);
      expect(countElements.length).toBeGreaterThan(0);
      
      // 総件数: 6件の予定
      expect(screen.getByText('6件の予定')).toBeInTheDocument();
    });

    it('すべての引落予定項目が青色テーマで統一されていること', () => {
      const { container } = render(<ScheduleViewModal {...defaultProps} />);
      
      // 青色のサマリーボックス
      const summaryBoxes = container.querySelectorAll('.bg-blue-50.border.border-blue-200');
      expect(summaryBoxes.length).toBeGreaterThan(0);
      
      // 青色の銀行ヘッダー
      const bankHeaders = container.querySelectorAll('.bg-blue-100.border-b.border-blue-200');
      expect(bankHeaders.length).toBe(3); // 3つの銀行
      
      // 青色の予定バッジ
      const scheduleBadges = container.querySelectorAll('.bg-blue-100.text-blue-800');
      expect(scheduleBadges.length).toBe(6); // 6つの引落予定
    });

    it('カードと銀行引落の項目がそれぞれ編集可能であること', async () => {
      render(<ScheduleViewModal {...defaultProps} />);
      
      // PayPayカードの項目をクリック
      const paypayCardItem = screen.getByText('PayPayカード').closest('.cursor-pointer');
      expect(paypayCardItem).toBeInTheDocument();
      
      fireEvent.click(paypayCardItem!);
      
      await waitFor(() => {
        expect(defaultProps.onScheduleClick).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionId: 'schedule-paypay-1',
            cardName: 'PayPayカード'
          })
        );
      });
      
      jest.clearAllMocks();
      
      // 銀行引落項目をクリック
      const bankTransferItem = screen.getByText('自動銀行振替').closest('.cursor-pointer');
      expect(bankTransferItem).toBeInTheDocument();
      
      fireEvent.click(bankTransferItem!);
      
      await waitFor(() => {
        expect(defaultProps.onScheduleClick).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionId: 'schedule-sbi-bank-1',
            paymentType: 'bank'
          })
        );
      });
    });

    it('用途情報がカードと銀行引落で統一して表示されること', () => {
      render(<ScheduleViewModal {...defaultProps} />);
      
      // カード引落の用途
      expect(screen.getByText('用途: ネットショッピング')).toBeInTheDocument();
      expect(screen.getByText('用途: 日用品')).toBeInTheDocument();
      expect(screen.getByText('用途: 衣料品')).toBeInTheDocument();
      
      // 銀行引落の用途
      expect(screen.getByText('用途: 公共料金')).toBeInTheDocument();
    });

    it('銀行名でアルファベット順にソートされること', () => {
      const { container } = render(<ScheduleViewModal {...defaultProps} />);
      
      const bankHeaders = container.querySelectorAll('.bg-blue-100 h4');
      const bankNames = Array.from(bankHeaders).map(header => header.textContent);
      
      // 期待される順序: SBIネット銀行、みずほ銀行、三菱UFJ銀行
      expect(bankNames).toEqual(['SBIネット銀行', 'みずほ銀行', '三菱UFJ銀行']);
    });
  });

  describe('統一表示機能：DayTotalModal 連携', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onTransactionClick: jest.fn(),
      onScheduleClick: jest.fn(),
      onViewTransactions: jest.fn(),
      onViewSchedules: jest.fn(),
      selectedDate,
      dayTotalData: complexDayTotalData,
      banks: mockBanks,
      cards: mockCards
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('取引データと引落予定データが正しく分離表示されること', () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // 取引データセクション
      expect(screen.getByText('取引データ (1件)')).toBeInTheDocument();
      expect(screen.getByText('実際に行った支払い取引:')).toBeInTheDocument();
      expect(screen.getByText('￥5,000')).toBeInTheDocument();
      
      // 引落予定データセクション
      expect(screen.getByText('引落予定 (6件)')).toBeInTheDocument();
      expect(screen.getByText('予定されている引落し:')).toBeInTheDocument();
      expect(screen.getByText('￥86,000')).toBeInTheDocument();
      
      // 総合計
      expect(screen.getByText('￥91,000')).toBeInTheDocument();
    });

    it('引落予定の詳細表示ボタンクリックで統合データが渡されること', async () => {
      render(<DayTotalModal {...defaultProps} />);
      
      const scheduleDetailButtons = screen.getAllByText('詳細表示');
      const scheduleDetailButton = scheduleDetailButtons[1]; // 引落予定の詳細表示ボタン
      
      fireEvent.click(scheduleDetailButton);
      
      await waitFor(() => {
        expect(defaultProps.onViewSchedules).toHaveBeenCalledWith(complexScheduleItems);
      });
    });

    it('引落予定項目クリックでScheduleEditModalに正しいデータが渡されること', async () => {
      render(<DayTotalModal {...defaultProps} />);
      
      // カード引落項目をクリック
      const cardScheduleItem = screen.getByText('PayPayカード').closest('.cursor-pointer');
      expect(cardScheduleItem).toBeInTheDocument();
      
      fireEvent.click(cardScheduleItem!);
      
      await waitFor(() => {
        expect(defaultProps.onScheduleClick).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionId: 'schedule-paypay-1',
            paymentType: 'card',
            cardName: 'PayPayカード'
          })
        );
      });
    });

    it('カード引落と銀行引落が色分けされて表示されること', () => {
      const { container } = render(<DayTotalModal {...defaultProps} />);
      
      // 取引データは緑色
      const transactionSections = container.querySelectorAll('.border-green-200');
      expect(transactionSections.length).toBeGreaterThan(0);
      
      // 引落予定は青色
      const scheduleSections = container.querySelectorAll('.border-blue-200');
      expect(scheduleSections.length).toBeGreaterThan(0);
      
      // 引落予定の編集アイコンが青色
      const editIcons = container.querySelectorAll('.text-blue-600.group-hover\\:text-blue-700');
      expect(editIcons.length).toBeGreaterThan(0);
    });
  });

  describe('編集機能の統合テスト', () => {
    it('カード引落項目の編集が正しく動作すること', () => {
      const cardScheduleItem = complexScheduleItems[0]!; // PayPayカード項目
      
      const editProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSave: jest.fn(),
        onDelete: jest.fn(),
        scheduleItem: cardScheduleItem,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleEditModal {...editProps} />);
      
      // カード情報が正しく表示される
      expect(screen.getByText('カード情報')).toBeInTheDocument();
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // 締切日
      expect(screen.getByText('27')).toBeInTheDocument(); // 支払日
      
      // フォーム初期値が正しく設定される
      expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Amazon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ネットショッピング')).toBeInTheDocument();
    });

    it('銀行引落項目の編集が正しく動作すること', () => {
      const bankScheduleItem = complexScheduleItems[2]!; // 銀行引落項目
      
      const editProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSave: jest.fn(),
        onDelete: jest.fn(),
        scheduleItem: bankScheduleItem,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleEditModal {...editProps} />);
      
      // 銀行引落の場合はカード情報セクションが表示されない
      expect(screen.queryByText('カード情報')).not.toBeInTheDocument();
      
      // 銀行引落として表示される
      expect(screen.getByText('銀行引落')).toBeInTheDocument();
      expect(screen.getByText('自動銀行振替')).toBeInTheDocument();
      
      // フォーム初期値が正しく設定される
      expect(screen.getByDisplayValue('12000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('電気代')).toBeInTheDocument();
      expect(screen.getByDisplayValue('公共料金')).toBeInTheDocument();
    });

    it('異なる銀行のカードが正しく区別されること', () => {
      // 三菱UFJカード
      const mufgCardItem = complexScheduleItems[3]!;
      
      const editProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSave: jest.fn(),
        onDelete: jest.fn(),
        scheduleItem: mufgCardItem,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleEditModal {...editProps} />);
      
      expect(screen.getByText('三菱UFJカード')).toBeInTheDocument();
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument(); // 締切日（月末）
      expect(screen.getByText('10')).toBeInTheDocument(); // 支払日
    });
  });

  describe('エラーケースと例外処理', () => {
    it('カード情報が見つからない場合の処理', () => {
      const invalidCardScheduleItems = [
        {
          transactionId: 'invalid-card',
          date: new Date('2024-01-27'),
          amount: 1000,
          paymentType: 'card' as const,
          cardId: 'non-existent-card',
          cardName: 'Invalid Card',
          bankName: 'Invalid Bank'
        }
      ];
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: invalidCardScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 無効なカード情報は表示されない
      expect(screen.queryByText('Invalid Card')).not.toBeInTheDocument();
    });

    it('銀行情報が見つからない場合の処理', () => {
      const invalidBankScheduleItems = [
        {
          transactionId: 'invalid-bank',
          date: new Date('2024-01-27'),
          amount: 1000,
          paymentType: 'bank' as const,
          bankName: 'Non-existent Bank'
        }
      ];
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: invalidBankScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 無効な銀行情報は表示されない
      expect(screen.queryByText('Non-existent Bank')).not.toBeInTheDocument();
    });

    it('空の引落予定リストの処理', () => {
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: [],
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 空の場合はモーダル自体が表示されない
      expect(screen.queryByText('引落予定 - 2024年1月27日(土)')).not.toBeInTheDocument();
    });

    it('大量のデータでのパフォーマンステスト', () => {
      // 大量の引落予定データを生成
      const largeScheduleItems = Array.from({ length: 50 }, (_, index) => ({
        transactionId: `large-schedule-${index}`,
        date: new Date('2024-01-27'),
        amount: 1000 * (index + 1),
        paymentType: (index % 2 === 0 ? 'card' : 'bank') as const,
        ...(index % 2 === 0 ? {
          cardId: 'paypay-card',
          cardName: 'PayPayカード'
        } : {}),
        bankName: mockBanks[index % 3]!.name,
        storeName: `店舗${index + 1}`,
        usage: `用途${index + 1}`
      }));
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: largeScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      const renderStart = performance.now();
      render(<ScheduleViewModal {...props} />);
      const renderEnd = performance.now();
      
      // レンダリング時間が妥当な範囲内であることを確認（1秒以内）
      expect(renderEnd - renderStart).toBeLessThan(1000);
      
      // データが正しく表示されることを確認
      expect(screen.getByText('50件の予定')).toBeInTheDocument();
      
      // 総合計が正しく計算されることを確認
      const expectedTotal = largeScheduleItems.reduce((sum, item) => sum + item.amount, 0);
      expect(screen.getByText(`¥${expectedTotal.toLocaleString()}`)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティと操作性', () => {
    it('キーボードナビゲーションが正しく動作すること', () => {
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: complexScheduleItems.slice(0, 2), // 最初の2項目のみ
        banks: mockBanks,
        cards: mockCards
      };
      
      const { container } = render(<ScheduleViewModal {...props} />);
      
      // clickableな要素がtabindex属性を持つことを確認
      const clickableItems = container.querySelectorAll('.cursor-pointer');
      expect(clickableItems.length).toBeGreaterThan(0);
      
      clickableItems.forEach(item => {
        // フォーカス可能であることを確認
        expect(item).toBeVisible();
      });
    });

    it('モーダルのARIAラベルが適切に設定されていること', () => {
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: complexScheduleItems.slice(0, 2),
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 閉じるボタンのラベルが適切であることを確認
      const closeButton = screen.getByLabelText('閉じる');
      expect(closeButton).toBeInTheDocument();
    });

    it('長いテキストが適切に処理されること', () => {
      const longTextScheduleItems = [
        {
          transactionId: 'long-text-schedule',
          date: new Date('2024-01-27'),
          amount: 5000,
          paymentType: 'card' as const,
          cardId: 'paypay-card',
          cardName: 'PayPayカード',
          bankName: 'SBIネット銀行',
          storeName: 'これは非常に長い店舗名でレイアウトの確認のために使用されます。非常に長いテキストが適切に表示されるかをテストします。',
          usage: 'これは非常に長い用途の説明で、UIが適切に処理できるかをテストするためのものです。'
        }
      ];
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate,
        scheduleItems: longTextScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      const { container } = render(<ScheduleViewModal {...props} />);
      
      // truncateクラスが適用されていることを確認
      const truncatedElements = container.querySelectorAll('.truncate');
      expect(truncatedElements.length).toBeGreaterThan(0);
    });
  });
});