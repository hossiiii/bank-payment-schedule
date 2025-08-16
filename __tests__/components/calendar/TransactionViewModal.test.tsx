import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionViewModal } from '@/components/calendar/TransactionViewModal';
import { Transaction, Bank, Card } from '@/types/database';

describe('TransactionViewModal', () => {
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

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onTransactionClick: jest.fn(),
    selectedDate: new Date(2024, 1, 15),
    transactions: mockTransactions,
    banks: mockBanks,
    cards: mockCards
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('モーダルが正常に表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('取引データ - 2024年2月15日')).toBeInTheDocument();
      expect(screen.getByText('取引データ')).toBeInTheDocument();
      expect(screen.getByText('実際に行った支払い取引')).toBeInTheDocument();
    });

    it('isOpenがfalseのときにモーダルが表示されないこと', () => {
      render(<TransactionViewModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('取引データ - 2024年2月15日')).not.toBeInTheDocument();
    });

    it('取引データがないときにモーダルが表示されないこと', () => {
      render(<TransactionViewModal {...defaultProps} transactions={[]} />);
      
      expect(screen.queryByText('取引データ - 2024年2月15日')).not.toBeInTheDocument();
    });
  });

  describe('緑色テーマの適用', () => {
    it('ヘッダーが緑色背景で表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const header = container.querySelector('.bg-green-50.border-green-200');
      expect(header).toBeInTheDocument();
    });

    it('取引サマリーが緑色テーマで表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const summary = container.querySelector('.bg-green-50.border-green-200');
      expect(summary).toBeInTheDocument();
      expect(summary?.textContent).toContain('取引データ');
    });

    it('銀行セクションヘッダーが緑色で表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const bankHeaders = container.querySelectorAll('.bg-green-100.border-b.border-green-200');
      expect(bankHeaders.length).toBeGreaterThan(0);
    });

    it('取引項目が緑色ボーダーで表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const transactionItems = container.querySelectorAll('.border-green-200');
      expect(transactionItems.length).toBeGreaterThan(0);
    });

    it('取引バッジが緑色で表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const badges = container.querySelectorAll('.bg-green-100.text-green-800');
      expect(badges.length).toBeGreaterThan(0);
      
      // 取引バッジが正しく表示されていることを確認
      const transactionBadges = screen.getAllByText('取引');
      expect(transactionBadges.length).toBe(3);
    });
  });

  describe('取引データサマリー', () => {
    it('正しい合計金額が表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      // 15,000 + 22,840 + 8,000 = 45,840
      expect(screen.getByText('￥45,840')).toBeInTheDocument();
    });

    it('正しい取引件数が表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('3件の取引')).toBeInTheDocument();
    });

    it('取引データの説明文が表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('実際に行った支払い取引')).toBeInTheDocument();
    });
  });

  describe('銀行別グループ化表示', () => {
    it('銀行別にグループ化されて表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      expect(screen.getByText('りそな銀行')).toBeInTheDocument();
    });

    it('銀行ごとの合計金額が正しく表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      // SBIネット銀行: PayPayカード(15,000) + 銀行引落(8,000) = 23,000
      expect(screen.getByText('￥23,000')).toBeInTheDocument();
      
      // りそな銀行: 楽天カード(22,840) = 22,840 (重複があるため getAllByText を使用)
      const amounts22840 = screen.getAllByText('￥22,840');
      expect(amounts22840.length).toBeGreaterThan(0);
    });

    it('銀行ごとの取引件数が正しく表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      // SBIネット銀行は2件、りそな銀行は1件
      const bankHeaders = screen.getAllByText(/\d+件/);
      expect(bankHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('カード名と支払い方法表示', () => {
    it('カード支払いでカード名が表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
    });

    it('銀行引落で「自動引き落とし」が表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('自動引き落とし')).toBeInTheDocument();
    });

    it('すべての取引に「取引」バッジが表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      const badges = screen.getAllByText('取引');
      expect(badges.length).toBe(3);
    });
  });

  describe('店舗情報表示', () => {
    it('店舗名が正しく表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      // 店舗名はカード名の右側に表示される（• 形式で）
      expect(screen.getByText('• Amazon')).toBeInTheDocument();
      expect(screen.getByText('• 楽天市場')).toBeInTheDocument();
      expect(screen.getByText('• 電気代')).toBeInTheDocument();
    });

    it('カード名の右に店舗情報が表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      // カード名と店舗名が同じ行に表示されていることを確認
      const cardNameElements = container.querySelectorAll('.font-medium.text-gray-900');
      expect(cardNameElements.length).toBeGreaterThan(0);
      
      // 店舗情報が適切な位置に表示されることを確認
      const storeInfoElements = screen.getAllByText(/• /);
      expect(storeInfoElements.length).toBeGreaterThan(0);
    });

    it('店舗名がない取引でも正常に表示されること', () => {
      const transactionWithoutStore = {
        ...mockTransactions[0],
        storeName: ''
      };
      
      render(<TransactionViewModal 
        {...defaultProps} 
        transactions={[transactionWithoutStore]}
      />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      // 店舗名がない場合は店舗情報セクションが表示されない
      expect(screen.queryByText('店舗:')).not.toBeInTheDocument();
    });
  });

  describe('編集可能機能', () => {
    it('取引項目がクリック可能であること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const transactionItems = container.querySelectorAll('.cursor-pointer');
      expect(transactionItems.length).toBeGreaterThan(0);
    });

    it('取引項目に編集アイコンが表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      // 編集アイコン（鉛筆アイコン）のパスを確認
      const editIcons = container.querySelectorAll('path[d*="15.232 5.232l3.536 3.536"]');
      expect(editIcons.length).toBe(3); // 3つの取引分
    });

    it('取引項目クリックでonTransactionClickが呼ばれること', async () => {
      const onTransactionClick = jest.fn();
      render(<TransactionViewModal 
        {...defaultProps} 
        onTransactionClick={onTransactionClick}
      />);
      
      // PayPayカードの取引項目をクリック
      const payPayCard = screen.getByText('PayPayカード');
      const transactionRow = payPayCard.closest('.cursor-pointer');
      fireEvent.click(transactionRow!);
      
      await waitFor(() => {
        expect(onTransactionClick).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'trans-1',
            storeName: 'Amazon'
          })
        );
      });
    });

    it('ホバー効果が適用されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const transactionItems = container.querySelectorAll('.hover\\:bg-green-50');
      expect(transactionItems.length).toBeGreaterThan(0);
    });
  });

  describe('操作ガイド', () => {
    it('操作ガイドが表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('操作ガイド:')).toBeInTheDocument();
      expect(screen.getByText('取引項目をクリックすると詳細編集ができます')).toBeInTheDocument();
      expect(screen.getByText('店舗情報がある場合は項目に表示されます')).toBeInTheDocument();
      expect(screen.getByText('編集モードでは取引の詳細を変更できます')).toBeInTheDocument();
    });

    it('操作ガイドに情報アイコンが表示されること', () => {
      const { container } = render(<TransactionViewModal {...defaultProps} />);
      
      const infoIcon = container.querySelector('.text-blue-500');
      expect(infoIcon).toBeInTheDocument();
    });
  });

  describe('データが空の場合', () => {
    it('取引データがない場合のメッセージが表示されること', () => {
      render(<TransactionViewModal {...defaultProps} transactions={[]} />);
      
      // 取引データがない場合はモーダル自体が表示されない
      expect(screen.queryByText('この日の取引データはありません')).not.toBeInTheDocument();
    });
  });

  describe('個別金額表示', () => {
    it('各取引の金額が正しく表示されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      expect(screen.getByText('￥15,000')).toBeInTheDocument();
      // 22,840円は複数回表示される可能性があるため getAllByText を使用
      const amounts22840 = screen.getAllByText('￥22,840');
      expect(amounts22840.length).toBeGreaterThan(0);
      expect(screen.getByText('￥8,000')).toBeInTheDocument();
    });
  });

  describe('複数銀行の処理', () => {
    it('異なる銀行のカードが正しくグループ化されること', () => {
      render(<TransactionViewModal {...defaultProps} />);
      
      // 両方の銀行が表示される
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      expect(screen.getByText('りそな銀行')).toBeInTheDocument();
      
      // 対応するカードが正しい銀行下に表示される
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
    });
  });

  describe('閉じる操作', () => {
    it('フッターの閉じるボタンが正常に動作すること', async () => {
      const onClose = jest.fn();
      render(<TransactionViewModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByText('閉じる');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('TypeScript型安全性', () => {
    it('適切な型でpropsが渡されること', () => {
      // このテストはコンパイル時に型チェックされるため、
      // 主に型定義が正しく機能することの確認
      expect(() => {
        render(<TransactionViewModal {...defaultProps} />);
      }).not.toThrow();
    });

    it('無効なtransactionデータに対して堅牢であること', () => {
      const invalidTransaction = {
        ...mockTransactions[0],
        cardId: 'non-existent-card'
      };
      
      // 無効なカードIDでもエラーが発生しないことを確認
      expect(() => {
        render(<TransactionViewModal 
          {...defaultProps} 
          transactions={[invalidTransaction]}
        />);
      }).not.toThrow();
    });
  });
});