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
 * エラーハンドリングとバリデーションの包括的テスト
 * 
 * このテストファイルでは以下の項目をテストします：
 * 1. 入力値のバリデーション
 * 2. API エラーのハンドリング
 * 3. ネットワークエラーの処理
 * 4. 不正なデータの処理
 * 5. フォームの状態管理
 * 6. ユーザーフィードバック
 * 7. エラー回復機能
 */

describe('Error Handling and Validation Tests', () => {
  // テスト用のモックデータ
  const mockBanks: Bank[] = [
    {
      id: 'test-bank-1',
      name: 'テスト銀行',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const mockCards: Card[] = [
    {
      id: 'test-card-1',
      name: 'テストカード',
      bankId: 'test-bank-1',
      closingDay: 15,
      paymentDay: 10,
      paymentMonthShift: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const validScheduleItem: ScheduleItem = {
    transactionId: 'test-schedule-1',
    date: new Date('2024-01-15'),
    amount: 5000,
    paymentType: 'card',
    cardId: 'test-card-1',
    cardName: 'テストカード',
    bankName: 'テスト銀行',
    storeName: 'テスト店舗',
    usage: 'テスト用途'
  };

  describe('ScheduleEditModal バリデーションテスト', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSave: jest.fn(),
      onDelete: jest.fn(),
      scheduleItem: validScheduleItem,
      banks: mockBanks,
      cards: mockCards
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('金額バリデーション', () => {
      it('空の金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: '' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('文字列の金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: 'abc' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('負の金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: '-1000' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('0の金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: '0' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('非常に大きな金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        // 1兆円を超える金額
        fireEvent.change(amountInput, { target: { value: '10000000000000' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('小数点を含む金額でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: '1000.50' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('正常な金額は受け入れられること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(amountInput, { target: { value: '10000' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(defaultProps.onSave).toHaveBeenCalledWith('test-schedule-1', {
            amount: 10000,
            storeName: 'テスト店舗',
            usage: 'テスト用途'
          });
        });
        
        expect(screen.queryByText(/無効な金額です/)).not.toBeInTheDocument();
      });
    });

    describe('店舗名バリデーション', () => {
      it('長すぎる店舗名でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const saveButton = screen.getByText('更新');
        
        const longStoreName = 'あ'.repeat(256); // 256文字の店舗名
        fireEvent.change(storeInput, { target: { value: longStoreName } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な店舗名です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('特殊文字のみの店舗名でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(storeInput, { target: { value: '!@#$%^&*()' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な店舗名です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('空白のみの店舗名は受け入れられること（undefinedとして処理）', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(storeInput, { target: { value: '   ' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(defaultProps.onSave).toHaveBeenCalledWith('test-schedule-1', {
            amount: 5000,
            storeName: undefined,
            usage: 'テスト用途'
          });
        });
      });
    });

    describe('用途バリデーション', () => {
      it('長すぎる用途でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const usageInput = screen.getByDisplayValue('テスト用途');
        const saveButton = screen.getByText('更新');
        
        const longUsage = 'あ'.repeat(256); // 256文字の用途
        fireEvent.change(usageInput, { target: { value: longUsage } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な用途です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });

      it('HTMLタグを含む用途でエラーが表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const usageInput = screen.getByDisplayValue('テスト用途');
        const saveButton = screen.getByText('更新');
        
        fireEvent.change(usageInput, { target: { value: '<script>alert("test")</script>' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な用途です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });
    });

    describe('エラー状態の管理', () => {
      it('エラー発生後に正しい値を入力するとエラーがクリアされること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        
        // エラーを発生させる
        fireEvent.change(amountInput, { target: { value: 'invalid' } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
        });
        
        // 正しい値に修正
        fireEvent.change(amountInput, { target: { value: '8000' } });
        
        await waitFor(() => {
          expect(screen.queryByText(/無効な金額です/)).not.toBeInTheDocument();
        });
      });

      it('複数のフィールドでエラーが発生した場合、すべて表示されること', async () => {
        render(<ScheduleEditModal {...defaultProps} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const usageInput = screen.getByDisplayValue('テスト用途');
        const saveButton = screen.getByText('更新');
        
        // 複数のフィールドでエラーを発生させる
        fireEvent.change(amountInput, { target: { value: 'invalid' } });
        fireEvent.change(storeInput, { target: { value: 'あ'.repeat(256) } });
        fireEvent.change(usageInput, { target: { value: 'あ'.repeat(256) } });
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
          expect(screen.getByText(/無効な店舗名です/)).toBeInTheDocument();
          expect(screen.getByText(/無効な用途です/)).toBeInTheDocument();
        });
        
        expect(defaultProps.onSave).not.toHaveBeenCalled();
      });
    });

    describe('APIエラーのハンドリング', () => {
      it('保存時のネットワークエラーが適切に表示されること', async () => {
        const errorOnSave = jest.fn().mockRejectedValue(new Error('ネットワークエラー: サーバーに接続できません'));
        
        render(<ScheduleEditModal {...defaultProps} onSave={errorOnSave} />);
        
        const saveButton = screen.getByText('更新');
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText('ネットワークエラー: サーバーに接続できません')).toBeInTheDocument();
        });
        
        expect(errorOnSave).toHaveBeenCalled();
      });

      it('削除時のAPIエラーが適切に表示されること', async () => {
        const errorOnDelete = jest.fn().mockRejectedValue(new Error('権限エラー: 削除権限がありません'));
        
        render(<ScheduleEditModal {...defaultProps} onDelete={errorOnDelete} />);
        
        const deleteButton = screen.getByText('削除');
        fireEvent.click(deleteButton);
        
        await waitFor(() => {
          expect(screen.getByText('権限エラー: 削除権限がありません')).toBeInTheDocument();
        });
        
        expect(errorOnDelete).toHaveBeenCalled();
      });

      it('保存中にエラーが発生してもフォームの状態が保持されること', async () => {
        const errorOnSave = jest.fn().mockRejectedValue(new Error('保存エラー'));
        
        render(<ScheduleEditModal {...defaultProps} onSave={errorOnSave} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const saveButton = screen.getByText('更新');
        
        // フォームの値を変更
        fireEvent.change(amountInput, { target: { value: '10000' } });
        fireEvent.change(storeInput, { target: { value: '新しい店舗' } });
        
        // 保存実行（エラーが発生）
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText('保存エラー')).toBeInTheDocument();
        });
        
        // フォームの値が保持されていることを確認
        expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('新しい店舗')).toBeInTheDocument();
      });

      it('タイムアウトエラーが適切に処理されること', async () => {
        const timeoutError = jest.fn().mockRejectedValue(new Error('TIMEOUT: 処理がタイムアウトしました'));
        
        render(<ScheduleEditModal {...defaultProps} onSave={timeoutError} />);
        
        const saveButton = screen.getByText('更新');
        fireEvent.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText('TIMEOUT: 処理がタイムアウトしました')).toBeInTheDocument();
        });
      });
    });

    describe('ローディング状態のエラーハンドリング', () => {
      it('保存中にフォームが無効化されること', async () => {
        let resolvePromise: (value: any) => void;
        const slowSave = jest.fn(() => new Promise(resolve => {
          resolvePromise = resolve;
        }));
        
        render(<ScheduleEditModal {...defaultProps} onSave={slowSave} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const storeInput = screen.getByDisplayValue('テスト店舗');
        const usageInput = screen.getByDisplayValue('テスト用途');
        const saveButton = screen.getByText('更新');
        const deleteButton = screen.getByText('削除');
        
        // 保存開始
        fireEvent.click(saveButton);
        
        // フォーム要素が無効化されることを確認
        await waitFor(() => {
          expect(amountInput).toBeDisabled();
          expect(storeInput).toBeDisabled();
          expect(usageInput).toBeDisabled();
          expect(saveButton).toBeDisabled();
          expect(deleteButton).toBeDisabled();
        });
        
        // 保存完了
        resolvePromise!(undefined);
        
        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalled();
        });
      });

      it('削除中にフォームが無効化されること', async () => {
        let resolvePromise: (value: any) => void;
        const slowDelete = jest.fn(() => new Promise(resolve => {
          resolvePromise = resolve;
        }));
        
        render(<ScheduleEditModal {...defaultProps} onDelete={slowDelete} />);
        
        const amountInput = screen.getByDisplayValue('5000');
        const saveButton = screen.getByText('更新');
        const deleteButton = screen.getByText('削除');
        
        // 削除開始
        fireEvent.click(deleteButton);
        
        // フォーム要素が無効化されることを確認
        await waitFor(() => {
          expect(amountInput).toBeDisabled();
          expect(saveButton).toBeDisabled();
          expect(deleteButton).toBeDisabled();
        });
        
        // 削除完了
        resolvePromise!(undefined);
        
        await waitFor(() => {
          expect(defaultProps.onClose).toHaveBeenCalled();
        });
      });
    });
  });

  describe('ScheduleViewModal エラーハンドリング', () => {
    it('不正なカードIDを持つスケジュールアイテムが除外されること', () => {
      const invalidScheduleItems = [
        {
          transactionId: 'invalid-1',
          date: new Date('2024-01-15'),
          amount: 5000,
          paymentType: 'card' as const,
          cardId: 'non-existent-card',
          cardName: 'Invalid Card',
          bankName: 'Invalid Bank'
        },
        validScheduleItem
      ];
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        scheduleItems: invalidScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 有効なアイテムのみ表示される
      expect(screen.getByText('テストカード')).toBeInTheDocument();
      expect(screen.queryByText('Invalid Card')).not.toBeInTheDocument();
      
      // 件数と金額が正しく計算される
      expect(screen.getByText('1件の予定')).toBeInTheDocument();
      expect(screen.getByText('¥5,000')).toBeInTheDocument();
    });

    it('不正な銀行名を持つスケジュールアイテムが除外されること', () => {
      const invalidBankScheduleItems = [
        {
          transactionId: 'invalid-bank-1',
          date: new Date('2024-01-15'),
          amount: 3000,
          paymentType: 'bank' as const,
          bankName: 'Non-existent Bank'
        },
        {
          transactionId: 'valid-bank-1',
          date: new Date('2024-01-15'),
          amount: 2000,
          paymentType: 'bank' as const,
          bankName: 'テスト銀行'
        }
      ];
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        scheduleItems: invalidBankScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 有効なアイテムのみ表示される
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('自動銀行振替')).toBeInTheDocument();
      expect(screen.queryByText('Non-existent Bank')).not.toBeInTheDocument();
      
      // 件数と金額が正しく計算される
      expect(screen.getByText('1件の予定')).toBeInTheDocument();
      expect(screen.getByText('¥2,000')).toBeInTheDocument();
    });

    it('空のデータセットが適切に処理されること', () => {
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        scheduleItems: [],
        banks: [],
        cards: []
      };
      
      render(<ScheduleViewModal {...props} />);
      
      // 空のデータセットの場合、モーダル自体が表示されない
      expect(screen.queryByText('引落予定')).not.toBeInTheDocument();
    });

    it('onScheduleClickでエラーが発生しても他の機能に影響しないこと', async () => {
      const errorOnScheduleClick = jest.fn().mockImplementation(() => {
        throw new Error('Click handler error');
      });
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: errorOnScheduleClick,
        selectedDate: new Date('2024-01-15'),
        scheduleItems: [validScheduleItem],
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<ScheduleViewModal {...props} />);
      
      const scheduleItem = screen.getByText('テストカード').closest('.cursor-pointer');
      
      // エラーが発生してもクラッシュしないことを確認
      expect(() => {
        fireEvent.click(scheduleItem!);
      }).not.toThrow();
      
      // モーダルは正常に表示されたまま
      expect(screen.getByText('引落予定')).toBeInTheDocument();
    });
  });

  describe('DayTotalModal エラーハンドリング', () => {
    it('空の取引データとスケジュールデータが適切に処理されること', () => {
      const emptyDayTotalData: DayTotalData = {
        date: '2024-01-15',
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
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onTransactionClick: jest.fn(),
        onScheduleClick: jest.fn(),
        onViewTransactions: jest.fn(),
        onViewSchedules: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        dayTotalData: emptyDayTotalData,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<DayTotalModal {...props} />);
      
      expect(screen.getByText('この日にはデータがありません')).toBeInTheDocument();
      expect(screen.queryByText('取引データ')).not.toBeInTheDocument();
      expect(screen.queryByText('引落予定')).not.toBeInTheDocument();
    });

    it('不正なTransactionデータが除外されること', () => {
      const invalidTransactions: Transaction[] = [
        {
          id: 'invalid-trans-1',
          amount: -1000, // 負の金額
          date: Date.now(),
          storeName: '',
          paymentType: 'card',
          cardId: 'non-existent-card', // 存在しないカード
          scheduledPayDate: Date.now(),
          memo: '',
          createdAt: Date.now()
        },
        {
          id: 'valid-trans-1',
          amount: 5000,
          date: Date.now(),
          storeName: 'Valid Store',
          paymentType: 'card',
          cardId: 'test-card-1',
          scheduledPayDate: Date.now(),
          memo: '',
          createdAt: Date.now()
        }
      ];
      
      const mixedDayTotalData: DayTotalData = {
        date: '2024-01-15',
        totalAmount: 5000,
        transactionTotal: 5000,
        scheduleTotal: 0,
        transactionCount: 1,
        scheduleCount: 0,
        bankGroups: [],
        transactions: invalidTransactions,
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: false
      };
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onTransactionClick: jest.fn(),
        onScheduleClick: jest.fn(),
        onViewTransactions: jest.fn(),
        onViewSchedules: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        dayTotalData: mixedDayTotalData,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<DayTotalModal {...props} />);
      
      // 有効な取引のみ表示される
      expect(screen.getByText('Valid Store')).toBeInTheDocument();
      expect(screen.getByText('取引データ (1件)')).toBeInTheDocument();
    });

    it('onViewTransactionsでエラーが発生しても他の機能に影響しないこと', async () => {
      const errorOnViewTransactions = jest.fn().mockImplementation(() => {
        throw new Error('View transactions error');
      });
      
      const mockTransaction: Transaction = {
        id: 'trans-1',
        amount: 5000,
        date: Date.now(),
        storeName: 'Test Store',
        paymentType: 'card',
        cardId: 'test-card-1',
        scheduledPayDate: Date.now(),
        memo: '',
        createdAt: Date.now()
      };
      
      const dayTotalData: DayTotalData = {
        date: '2024-01-15',
        totalAmount: 5000,
        transactionTotal: 5000,
        scheduleTotal: 0,
        transactionCount: 1,
        scheduleCount: 0,
        bankGroups: [],
        transactions: [mockTransaction],
        scheduleItems: [],
        hasData: true,
        hasTransactions: true,
        hasSchedule: false
      };
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onTransactionClick: jest.fn(),
        onScheduleClick: jest.fn(),
        onViewTransactions: errorOnViewTransactions,
        onViewSchedules: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        dayTotalData,
        banks: mockBanks,
        cards: mockCards
      };
      
      render(<DayTotalModal {...props} />);
      
      const detailButton = screen.getByText('詳細表示');
      
      // エラーが発生してもクラッシュしないことを確認
      expect(() => {
        fireEvent.click(detailButton);
      }).not.toThrow();
      
      // モーダルは正常に表示されたまま
      expect(screen.getByText('取引データ')).toBeInTheDocument();
    });
  });

  describe('共通エラーハンドリング', () => {
    it('Dateオブジェクトの不正な値が適切に処理されること', () => {
      const invalidDateScheduleItem = {
        ...validScheduleItem,
        date: new Date('invalid-date') // 不正な日付
      };
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        scheduleItems: [invalidDateScheduleItem],
        banks: mockBanks,
        cards: mockCards
      };
      
      // エラーが発生しないことを確認
      expect(() => {
        render(<ScheduleViewModal {...props} />);
      }).not.toThrow();
    });

    it('undefinedやnullの値が適切に処理されること', () => {
      const scheduleItemWithNulls = {
        ...validScheduleItem,
        storeName: undefined,
        usage: undefined,
        memo: undefined
      };
      
      const editProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSave: jest.fn(),
        onDelete: jest.fn(),
        scheduleItem: scheduleItemWithNulls,
        banks: mockBanks,
        cards: mockCards
      };
      
      expect(() => {
        render(<ScheduleEditModal {...editProps} />);
      }).not.toThrow();
      
      // 空の値が適切に表示されることを確認
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('非常に大きなデータセットでメモリエラーが発生しないこと', () => {
      // 1000件の大量データを生成
      const largeScheduleItems = Array.from({ length: 1000 }, (_, index) => ({
        transactionId: `large-schedule-${index}`,
        date: new Date('2024-01-15'),
        amount: 1000,
        paymentType: 'card' as const,
        cardId: 'test-card-1',
        cardName: 'テストカード',
        bankName: 'テスト銀行',
        storeName: `店舗${index}`,
        usage: `用途${index}`
      }));
      
      const props = {
        isOpen: true,
        onClose: jest.fn(),
        onScheduleClick: jest.fn(),
        selectedDate: new Date('2024-01-15'),
        scheduleItems: largeScheduleItems,
        banks: mockBanks,
        cards: mockCards
      };
      
      expect(() => {
        render(<ScheduleViewModal {...props} />);
      }).not.toThrow();
      
      // メモリ使用量が適切であることを暗黙的に確認（エラーが発生しないこと）
      expect(screen.getByText('1000件の予定')).toBeInTheDocument();
    });
  });
});