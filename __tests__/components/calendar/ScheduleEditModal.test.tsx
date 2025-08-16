/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScheduleEditModal } from '@/components/calendar/ScheduleEditModal';
import { ScheduleItem, Bank, Card } from '@/types/database';

// Mock data
const mockBanks: Bank[] = [
  {
    id: 'bank1',
    name: '三菱UFJ銀行',
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

const mockScheduleItem: ScheduleItem = {
  transactionId: 'trans1',
  date: new Date('2024-01-15'),
  amount: 5000,
  paymentType: 'card',
  cardId: 'card1',
  cardName: 'メインカード',
  bankName: '三菱UFJ銀行',
  storeName: 'テストショップ',
  usage: 'テスト用途'
};

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  onDelete: jest.fn(),
  scheduleItem: mockScheduleItem,
  banks: mockBanks,
  cards: mockCards
};

describe('ScheduleEditModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    expect(screen.getByText('引落予定を編集')).toBeInTheDocument();
    expect(screen.getByText('引落予定詳細')).toBeInTheDocument();
  });

  it('displays schedule item information correctly', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    expect(screen.getByText('引落日')).toBeInTheDocument();
    expect(screen.getByText('2024年1月15日(月)')).toBeInTheDocument();
    expect(screen.getByText('支払い方法')).toBeInTheDocument();
    expect(screen.getByText('カード払い')).toBeInTheDocument();
    expect(screen.getByText('銀行')).toBeInTheDocument();
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('カード/口座')).toBeInTheDocument();
    expect(screen.getByText('メインカード')).toBeInTheDocument();
  });

  it('initializes form with schedule item data', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テストショップ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テスト用途')).toBeInTheDocument();
    // memoフィールドは実装されていないため、空文字で初期化される
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('updates form data when input changes', async () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    const amountInput = screen.getByDisplayValue('5000');
    fireEvent.change(amountInput, { target: { value: '6000' } });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('6000')).toBeInTheDocument();
    });
  });

  it('validates amount input', async () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    const amountInput = screen.getByDisplayValue('5000');
    const saveButton = screen.getByText('更新');
    
    fireEvent.change(amountInput, { target: { value: 'invalid' } });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
    });
  });

  it('calls onSave with correct data when save button is clicked', async () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    const amountInput = screen.getByDisplayValue('5000');
    const storeInput = screen.getByDisplayValue('テストショップ');
    const saveButton = screen.getByText('更新');
    
    fireEvent.change(amountInput, { target: { value: '6000' } });
    fireEvent.change(storeInput, { target: { value: '新しいショップ' } });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith('trans1', {
        amount: 6000,
        storeName: '新しいショップ',
        usage: 'テスト用途'
        // memo フィールドは現在の実装では保存されない
      });
    });
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockProps.onDelete).toHaveBeenCalledWith('trans1');
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    const closeButton = screen.getByLabelText('閉じる');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays card information when available', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    expect(screen.getByText('カード情報')).toBeInTheDocument();
    expect(screen.getByText('カード名:')).toBeInTheDocument();
    expect(screen.getByText('メインカード')).toBeInTheDocument();
    expect(screen.getByText('引落銀行:')).toBeInTheDocument();
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('締切日:')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('支払日:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ScheduleEditModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('引落予定を編集')).not.toBeInTheDocument();
  });

  it('displays operation guide correctly', () => {
    render(<ScheduleEditModal {...mockProps} />);
    
    expect(screen.getByText('編集について:')).toBeInTheDocument();
    expect(screen.getByText('金額以外の項目は任意です')).toBeInTheDocument();
    expect(screen.getByText('引落日、支払い方法、銀行/カード情報は変更できません')).toBeInTheDocument();
    expect(screen.getByText('削除すると引落予定から完全に削除されます')).toBeInTheDocument();
  });

  it('does not render delete button when onDelete is not provided', () => {
    const propsWithoutDelete = { ...mockProps, onDelete: undefined };
    render(<ScheduleEditModal {...propsWithoutDelete} />);
    
    expect(screen.queryByText('削除')).not.toBeInTheDocument();
  });

  it('handles bank payment type correctly', () => {
    const bankScheduleItem: ScheduleItem = {
      ...mockScheduleItem,
      paymentType: 'bank',
      cardId: undefined,
      cardName: undefined
    };
    
    render(<ScheduleEditModal {...mockProps} scheduleItem={bankScheduleItem} />);
    
    expect(screen.getByText('銀行引落')).toBeInTheDocument();
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('自動銀行振替')).toBeInTheDocument();
    expect(screen.queryByText('カード情報')).not.toBeInTheDocument();
  });

  describe('青色テーマとデザイン統一性のテスト', () => {
    it('モーダルヘッダーが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleEditModal {...mockProps} />);
      
      const header = container.querySelector('.bg-blue-50.border-blue-200');
      expect(header).toBeInTheDocument();
    });

    it('引落予定詳細サマリーが青色テーマで表示されること', () => {
      const { container } = render(<ScheduleEditModal {...mockProps} />);
      
      const summaryBox = container.querySelector('.bg-blue-50.border.border-blue-200');
      expect(summaryBox).toBeInTheDocument();
      expect(summaryBox?.textContent).toContain('引落予定詳細');
    });

    it('「予定」バッジが青色で表示されること', () => {
      const { container } = render(<ScheduleEditModal {...mockProps} />);
      
      const scheduleBadge = container.querySelector('.bg-blue-100.text-blue-800');
      expect(scheduleBadge).toBeInTheDocument();
      expect(scheduleBadge?.textContent).toContain('予定');
    });

    it('フォーカス時に青色ボーダーが表示されること', () => {
      const { container } = render(<ScheduleEditModal {...mockProps} />);
      
      const inputs = container.querySelectorAll('input[class*="focus:ring-blue-500"]');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('バリデーション機能のテスト', () => {
    it('金額が空の場合にエラーが表示されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const amountInput = screen.getByDisplayValue('5000');
      const saveButton = screen.getByText('更新');
      
      fireEvent.change(amountInput, { target: { value: '' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
      });
    });

    it('金額が負の値の場合にエラーが表示されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const amountInput = screen.getByDisplayValue('5000');
      const saveButton = screen.getByText('更新');
      
      fireEvent.change(amountInput, { target: { value: '-1000' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
      });
    });

    it('店舗名が長すぎる場合にエラーが表示されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const storeInput = screen.getByDisplayValue('テストショップ');
      const saveButton = screen.getByText('更新');
      
      const longStoreName = 'a'.repeat(256); // 長すぎる店舗名
      fireEvent.change(storeInput, { target: { value: longStoreName } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/無効な店舗名です/)).toBeInTheDocument();
      });
    });

    it('用途が長すぎる場合にエラーが表示されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const usageInput = screen.getByDisplayValue('テスト用途');
      const saveButton = screen.getByText('更新');
      
      const longUsage = 'a'.repeat(256); // 長すぎる用途
      fireEvent.change(usageInput, { target: { value: longUsage } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/無効な用途です/)).toBeInTheDocument();
      });
    });

    it('入力変更時にエラーがクリアされること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const amountInput = screen.getByDisplayValue('5000');
      const saveButton = screen.getByText('更新');
      
      // まずエラーを発生させる
      fireEvent.change(amountInput, { target: { value: 'invalid' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/無効な金額です/)).toBeInTheDocument();
      });
      
      // 正しい値に変更
      fireEvent.change(amountInput, { target: { value: '6000' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/無効な金額です/)).not.toBeInTheDocument();
      });
    });
  });

  describe('ローディング状態のテスト', () => {
    it('isLoadingがtrueの場合にフォームが無効化されること', () => {
      render(<ScheduleEditModal {...mockProps} isLoading={true} />);
      
      const amountInput = screen.getByDisplayValue('5000');
      const storeInput = screen.getByDisplayValue('テストショップ');
      const usageInput = screen.getByDisplayValue('テスト用途');
      const saveButton = screen.getByText('更新');
      const deleteButton = screen.getByText('削除');
      
      expect(amountInput).toBeDisabled();
      expect(storeInput).toBeDisabled();
      expect(usageInput).toBeDisabled();
      expect(saveButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('保存中に他のボタンが無効化されること', async () => {
      const slowOnSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ScheduleEditModal {...mockProps} onSave={slowOnSave} />);
      
      const saveButton = screen.getByText('更新');
      const deleteButton = screen.getByText('削除');
      
      fireEvent.click(saveButton);
      
      // 保存中はボタンが無効化される
      expect(saveButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      
      await waitFor(() => {
        expect(slowOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('エラーハンドリングのテスト', () => {
    it('保存エラー時にエラーメッセージが表示されること', async () => {
      const errorOnSave = jest.fn().mockRejectedValue(new Error('保存に失敗しました'));
      render(<ScheduleEditModal {...mockProps} onSave={errorOnSave} />);
      
      const saveButton = screen.getByText('更新');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('保存に失敗しました')).toBeInTheDocument();
      });
    });

    it('削除エラー時にエラーメッセージが表示されること', async () => {
      const errorOnDelete = jest.fn().mockRejectedValue(new Error('削除に失敗しました'));
      render(<ScheduleEditModal {...mockProps} onDelete={errorOnDelete} />);
      
      const deleteButton = screen.getByText('削除');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('削除に失敗しました')).toBeInTheDocument();
      });
    });

    it('scheduleItemがnullの場合にモーダルが表示されないこと', () => {
      render(<ScheduleEditModal {...mockProps} scheduleItem={null} />);
      
      expect(screen.queryByText('引落予定を編集')).not.toBeInTheDocument();
    });
  });

  describe('フォーム操作のテスト', () => {
    it('空文字の店舗名と用途が正しく処理されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const storeInput = screen.getByDisplayValue('テストショップ');
      const usageInput = screen.getByDisplayValue('テスト用途');
      const saveButton = screen.getByText('更新');
      
      fireEvent.change(storeInput, { target: { value: '' } });
      fireEvent.change(usageInput, { target: { value: '' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith('trans1', {
          amount: 5000,
          storeName: undefined,
          usage: undefined
        });
      });
    });

    it('スペースのみの入力が正しく処理されること', async () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      const storeInput = screen.getByDisplayValue('テストショップ');
      const usageInput = screen.getByDisplayValue('テスト用途');
      const saveButton = screen.getByText('更新');
      
      fireEvent.change(storeInput, { target: { value: '   ' } });
      fireEvent.change(usageInput, { target: { value: '   ' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith('trans1', {
          amount: 5000,
          storeName: undefined,
          usage: undefined
        });
      });
    });

    it('金額フィールドに円マークが表示されること', () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      expect(screen.getByText('円')).toBeInTheDocument();
    });

    it('必須フィールドにアスタリスクが表示されること', () => {
      render(<ScheduleEditModal {...mockProps} />);
      
      expect(screen.getByText('金額 *')).toBeInTheDocument();
    });
  });
});