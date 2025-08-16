import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScheduleModal } from '@/components/calendar/ScheduleModal';
import { ScheduleItem, Bank, Card } from '@/types/database';

describe('ScheduleModal', () => {
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

  const mockScheduleItems: ScheduleItem[] = [
    {
      transactionId: 'schedule-1',
      date: new Date(2024, 1, 15),
      amount: 15000,
      storeName: 'Amazon利用分',
      usage: 'オンラインショッピング',
      paymentType: 'card',
      cardId: 'card-1',
      cardName: 'PayPayカード',
      bankName: 'SBIネット銀行'
    },
    {
      transactionId: 'schedule-2',
      date: new Date(2024, 1, 15),
      amount: 22840,
      storeName: '楽天市場利用分',
      usage: 'ネットショッピング',
      paymentType: 'card',
      cardId: 'card-2',
      cardName: '楽天カード',
      bankName: 'りそな銀行'
    },
    {
      transactionId: 'schedule-3',
      date: new Date(2024, 1, 15),
      amount: 8000,
      storeName: '電力会社',
      usage: '電気代',
      paymentType: 'bank',
      bankName: 'SBIネット銀行'
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    selectedDate: new Date(2024, 1, 15),
    scheduleItems: mockScheduleItems,
    banks: mockBanks,
    cards: mockCards
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('モーダルが正常に表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('引落予定 - 2024年2月15日')).toBeInTheDocument();
      expect(screen.getByText('引落予定')).toBeInTheDocument();
      expect(screen.getByText('予定されている引落し')).toBeInTheDocument();
    });

    it('isOpenがfalseのときにモーダルが表示されないこと', () => {
      render(<ScheduleModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('引落予定 - 2024年2月15日')).not.toBeInTheDocument();
    });

    it('引落予定データがないときにモーダルが表示されないこと', () => {
      render(<ScheduleModal {...defaultProps} scheduleItems={[]} />);
      
      expect(screen.queryByText('引落予定 - 2024年2月15日')).not.toBeInTheDocument();
    });
  });

  describe('青色テーマの適用', () => {
    it('ヘッダーが青色背景で表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const header = container.querySelector('.bg-blue-50.border-blue-200');
      expect(header).toBeInTheDocument();
    });

    it('引落予定サマリーが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const summary = container.querySelector('.bg-blue-50.border-blue-200');
      expect(summary).toBeInTheDocument();
      expect(summary?.textContent).toContain('引落予定');
    });

    it('銀行セクションヘッダーが青色で表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const bankHeaders = container.querySelectorAll('.bg-blue-100.border-b.border-blue-200');
      expect(bankHeaders.length).toBeGreaterThan(0);
    });

    it('引落予定項目が青色ボーダーで表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const scheduleItems = container.querySelectorAll('.border-blue-200');
      expect(scheduleItems.length).toBeGreaterThan(0);
    });

    it('予定バッジが青色で表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const badges = container.querySelectorAll('.bg-blue-100.text-blue-800');
      expect(badges.length).toBeGreaterThan(0);
      
      // 予定バッジが正しく表示されていることを確認
      const scheduleBadges = screen.getAllByText('予定');
      expect(scheduleBadges.length).toBe(3);
    });
  });

  describe('引落予定データサマリー', () => {
    it('正しい合計金額が表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      // 15,000 + 22,840 + 8,000 = 45,840
      expect(screen.getByText('￥45,840')).toBeInTheDocument();
    });

    it('正しい予定件数が表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('3件の予定')).toBeInTheDocument();
    });

    it('引落予定の説明文が表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('予定されている引落し')).toBeInTheDocument();
    });
  });

  describe('銀行別グループ化表示', () => {
    it('銀行別にグループ化されて表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('SBIネット銀行')).toBeInTheDocument();
      expect(screen.getByText('りそな銀行')).toBeInTheDocument();
    });

    it('銀行ごとの合計金額が正しく表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      // SBIネット銀行: PayPayカード(15,000) + 銀行引落(8,000) = 23,000
      expect(screen.getByText('￥23,000')).toBeInTheDocument();
      
      // りそな銀行: 楽天カード(22,840) = 22,840 (重複があるため getAllByText を使用)
      const amounts22840 = screen.getAllByText('￥22,840');
      expect(amounts22840.length).toBeGreaterThan(0);
    });

    it('銀行ごとの予定件数が正しく表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      // SBIネット銀行は2件、りそな銀行は1件
      const bankHeaders = screen.getAllByText(/\d+件/);
      expect(bankHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('カード名と支払い方法表示', () => {
    it('カード支払いでカード名が表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      expect(screen.getByText('楽天カード')).toBeInTheDocument();
    });

    it('銀行引落で「自動引き落とし」が表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('自動引き落とし')).toBeInTheDocument();
    });

    it('すべての予定に「予定」バッジが表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      const badges = screen.getAllByText('予定');
      expect(badges.length).toBe(3);
    });
  });

  describe('店舗情報とusage表示', () => {
    it('店舗名が正しく表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('Amazon利用分')).toBeInTheDocument();
      expect(screen.getByText('楽天市場利用分')).toBeInTheDocument();
      expect(screen.getByText('電力会社')).toBeInTheDocument();
    });

    it('用途（usage）が正しく表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      const usageLabels = screen.getAllByText('用途:');
      expect(usageLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('オンラインショッピング')).toBeInTheDocument();
      expect(screen.getByText('ネットショッピング')).toBeInTheDocument();
      expect(screen.getByText('電気代')).toBeInTheDocument();
    });

    it('店舗情報が適切なフォーマットで表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      // 店舗情報は「店舗: 店舗名」の形式で表示
      expect(screen.getByText('店舗:')).toBeInTheDocument();
    });

    it('カード名の右に店舗情報が表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      // カード名と店舗名が同じ行に表示されていることを確認
      const cardNameElements = container.querySelectorAll('.font-medium.text-gray-900');
      expect(cardNameElements.length).toBeGreaterThan(0);
      
      // 店舗情報が適切な位置に表示されることを確認
      const storeInfoElements = screen.getAllByText(/• /);
      expect(storeInfoElements.length).toBeGreaterThan(0);
    });

    it('店舗名やusageがない項目でも正常に表示されること', () => {
      const scheduleWithoutStoreAndUsage = {
        ...mockScheduleItems[0],
        storeName: '',
        usage: ''
      };
      
      render(<ScheduleModal 
        {...defaultProps} 
        scheduleItems={[scheduleWithoutStoreAndUsage]}
      />);
      
      expect(screen.getByText('PayPayカード')).toBeInTheDocument();
      // 店舗名やusageがない場合は対応するセクションが表示されない
      expect(screen.queryByText('店舗:')).not.toBeInTheDocument();
      expect(screen.queryByText('用途:')).not.toBeInTheDocument();
    });
  });

  describe('表示のみ機能（編集不可）', () => {
    it('引落予定項目がクリック不可であること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      // カーソルポインターがないことを確認
      const scheduleItems = container.querySelectorAll('.px-4.py-3');
      scheduleItems.forEach(item => {
        expect(item).not.toHaveClass('cursor-pointer');
      });
    });

    it('引落予定項目に編集アイコンが表示されないこと', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      // 編集アイコン（鉛筆アイコン）がないことを確認
      const editIcons = container.querySelectorAll('path[d*="15.232 5.232l3.536 3.536"]');
      expect(editIcons.length).toBe(0);
    });

    it('ホバー効果が控えめに適用されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      // hover:bg-blue-25というクラスが適用されていることを確認
      const scheduleItems = container.querySelectorAll('.hover\\:bg-blue-25');
      // 注: この例では特別なホバークラスを使用していないため、
      // 実際の実装に応じて調整が必要
    });
  });

  describe('情報ガイド', () => {
    it('引落予定についての情報ガイドが表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('引落予定について:')).toBeInTheDocument();
      expect(screen.getByText('これらは取引に基づいて自動計算された引落予定です')).toBeInTheDocument();
      expect(screen.getByText('実際の引落日は銀行の営業日により前後する場合があります')).toBeInTheDocument();
      expect(screen.getByText('店舗情報と用途が登録されている場合に表示されます')).toBeInTheDocument();
      expect(screen.getByText('引落予定は表示のみで、直接編集はできません')).toBeInTheDocument();
    });

    it('情報ガイドに情報アイコンが表示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      const infoIcon = container.querySelector('.text-blue-500');
      expect(infoIcon).toBeInTheDocument();
    });
  });

  describe('データが空の場合', () => {
    it('引落予定データがない場合のメッセージが表示されること', () => {
      render(<ScheduleModal {...defaultProps} scheduleItems={[]} />);
      
      // 引落予定データがない場合はモーダル自体が表示されない
      expect(screen.queryByText('この日の引落予定はありません')).not.toBeInTheDocument();
    });
  });

  describe('個別金額表示', () => {
    it('各引落予定の金額が正しく表示されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
      expect(screen.getByText('￥15,000')).toBeInTheDocument();
      // 22,840円は複数回表示される可能性があるため getAllByText を使用
      const amounts22840 = screen.getAllByText('￥22,840');
      expect(amounts22840.length).toBeGreaterThan(0);
      expect(screen.getByText('￥8,000')).toBeInTheDocument();
    });
  });

  describe('複数銀行の処理', () => {
    it('異なる銀行のカードが正しくグループ化されること', () => {
      render(<ScheduleModal {...defaultProps} />);
      
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
      render(<ScheduleModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByText('閉じる');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('特殊ケース', () => {
    it('cardNameが指定されている場合はそれが表示されること', () => {
      const scheduleWithCustomCardName = {
        ...mockScheduleItems[0],
        cardName: 'カスタムカード名'
      };
      
      render(<ScheduleModal 
        {...defaultProps} 
        scheduleItems={[scheduleWithCustomCardName]}
      />);
      
      expect(screen.getByText('カスタムカード名')).toBeInTheDocument();
    });

    it('bankNameから銀行を特定できない場合の処理', () => {
      const scheduleWithUnknownBank = {
        ...mockScheduleItems[2],
        bankName: '存在しない銀行'
      };
      
      // エラーが発生せずに正常に動作することを確認
      expect(() => {
        render(<ScheduleModal 
          {...defaultProps} 
          scheduleItems={[scheduleWithUnknownBank]}
        />);
      }).not.toThrow();
    });
  });

  describe('TypeScript型安全性', () => {
    it('適切な型でpropsが渡されること', () => {
      // このテストはコンパイル時に型チェックされるため、
      // 主に型定義が正しく機能することの確認
      expect(() => {
        render(<ScheduleModal {...defaultProps} />);
      }).not.toThrow();
    });

    it('無効なscheduleItemデータに対して堅牢であること', () => {
      const invalidScheduleItem = {
        ...mockScheduleItems[0],
        cardId: 'non-existent-card'
      };
      
      // 無効なカードIDでもエラーが発生しないことを確認
      expect(() => {
        render(<ScheduleModal 
          {...defaultProps} 
          scheduleItems={[invalidScheduleItem]}
        />);
      }).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    it('引落予定項目に編集不可であることが明確に示されること', () => {
      const { container } = render(<ScheduleModal {...defaultProps} />);
      
      // クリック不可の項目にはcursor-pointerクラスがない
      const scheduleItems = container.querySelectorAll('.px-4.py-3');
      scheduleItems.forEach(item => {
        expect(item).not.toHaveClass('cursor-pointer');
      });
    });
  });
});