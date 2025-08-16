import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BaseModal, BaseModalFooter } from '@/components/calendar/BaseModal';

describe('BaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'テストモーダル',
    children: <div>テストコンテンツ</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // モーダル用のbody styleリセット
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // テスト後にbody styleをクリーンアップ
    document.body.style.overflow = 'unset';
  });

  describe('基本レンダリング', () => {
    it('モーダルが正常に表示されること', () => {
      render(<BaseModal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('テストモーダル')).toBeInTheDocument();
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
    });

    it('isOpenがfalseのときにモーダルが表示されないこと', () => {
      render(<BaseModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('テストモーダル')).not.toBeInTheDocument();
    });

    it('タイトルが正しく表示されること', () => {
      render(<BaseModal {...defaultProps} title="カスタムタイトル" />);
      
      const titleElement = screen.getByText('カスタムタイトル');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveAttribute('id', 'modal-title');
    });

    it('子要素が正しく表示されること', () => {
      const customContent = (
        <div>
          <p>カスタムコンテンツ</p>
          <button>テストボタン</button>
        </div>
      );
      
      render(<BaseModal {...defaultProps} children={customContent} />);
      
      expect(screen.getByText('カスタムコンテンツ')).toBeInTheDocument();
      expect(screen.getByText('テストボタン')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されていること', () => {
      render(<BaseModal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('閉じるボタンにaria-labelが設定されていること', () => {
      render(<BaseModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('閉じる');
      expect(closeButton).toBeInTheDocument();
    });

    it('フォーカス管理が適切に行われること', () => {
      render(<BaseModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('閉じる');
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('モーダルサイズ', () => {
    it('デフォルトサイズ（md）が適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} />);
      
      const modalContent = container.querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('smallサイズが適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} size="sm" />);
      
      const modalContent = container.querySelector('.max-w-sm');
      expect(modalContent).toBeInTheDocument();
    });

    it('largeサイズが適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} size="lg" />);
      
      const modalContent = container.querySelector('.max-w-lg');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('カスタムスタイリング', () => {
    it('カスタムclassNameが適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} className="custom-modal" />);
      
      const modalContent = container.querySelector('.custom-modal');
      expect(modalContent).toBeInTheDocument();
    });

    it('カスタムheaderClassNameが適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} headerClassName="custom-header" />);
      
      const headerElement = container.querySelector('.custom-header');
      expect(headerElement).toBeInTheDocument();
    });

    it('カスタムbodyClassNameが適用されること', () => {
      const { container } = render(<BaseModal {...defaultProps} bodyClassName="custom-body" />);
      
      const bodyElement = container.querySelector('.custom-body');
      expect(bodyElement).toBeInTheDocument();
    });
  });

  describe('閉じる操作', () => {
    it('Escキーでモーダルが閉じること', async () => {
      const onClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('バックドロップクリックでモーダルが閉じること', async () => {
      const onClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={onClose} />);
      
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('モーダル内のコンテンツクリックでは閉じないこと', async () => {
      const onClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={onClose} />);
      
      const content = screen.getByText('テストコンテンツ');
      fireEvent.click(content);
      
      // 少し待ってもonCloseが呼ばれないことを確認
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('閉じるボタンでモーダルが閉じること', async () => {
      const onClose = jest.fn();
      render(<BaseModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('ボディスクロール制御', () => {
    it('モーダルが開いているときにボディのスクロールが無効化されること', () => {
      render(<BaseModal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('モーダルが閉じられるときにボディのスクロールが復元されること', () => {
      const { unmount } = render(<BaseModal {...defaultProps} />);
      
      unmount();
      
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('フッター表示', () => {
    it('footerChildrenが提供されたときにフッターが表示されること', () => {
      const footerContent = <button>フッターボタン</button>;
      
      render(<BaseModal {...defaultProps} footerChildren={footerContent} />);
      
      expect(screen.getByText('フッターボタン')).toBeInTheDocument();
    });

    it('footerChildrenが提供されないときにフッターが表示されないこと', () => {
      const { container } = render(<BaseModal {...defaultProps} />);
      
      const footer = container.querySelector('.border-t.border-gray-200.bg-gray-50');
      expect(footer).not.toBeInTheDocument();
    });
  });
});

describe('BaseModalFooter', () => {
  const defaultFooterProps = {
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('デフォルトの閉じるボタンが表示されること', () => {
      render(<BaseModalFooter {...defaultFooterProps} />);
      
      expect(screen.getByText('閉じる')).toBeInTheDocument();
    });

    it('プライマリアクションが表示されること', () => {
      const primaryAction = {
        label: '保存',
        onClick: jest.fn(),
        variant: 'primary' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('セカンダリアクションが表示されること', () => {
      const secondaryAction = {
        label: 'キャンセル',
        onClick: jest.fn(),
        variant: 'secondary' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} secondaryAction={secondaryAction} />);
      
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });
  });

  describe('ボタンスタイリング', () => {
    it('プライマリボタンが正しいスタイルを持つこと', () => {
      const primaryAction = {
        label: '保存',
        onClick: jest.fn(),
        variant: 'primary' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      const button = screen.getByText('保存');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('dangerボタンが正しいスタイルを持つこと', () => {
      const primaryAction = {
        label: '削除',
        onClick: jest.fn(),
        variant: 'danger' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      const button = screen.getByText('削除');
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });

    it('disabledボタンが正しいスタイルを持つこと', () => {
      const primaryAction = {
        label: '保存',
        onClick: jest.fn(),
        variant: 'primary' as const,
        disabled: true
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      const button = screen.getByText('保存');
      expect(button).toHaveClass('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
      expect(button).toBeDisabled();
    });
  });

  describe('ボタンクリック動作', () => {
    it('プライマリアクションクリックが正常に動作すること', async () => {
      const onClick = jest.fn();
      const primaryAction = {
        label: '保存',
        onClick,
        variant: 'primary' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      const button = screen.getByText('保存');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('セカンダリアクションクリックが正常に動作すること', async () => {
      const onClick = jest.fn();
      const secondaryAction = {
        label: 'キャンセル',
        onClick,
        variant: 'secondary' as const
      };
      
      render(<BaseModalFooter {...defaultFooterProps} secondaryAction={secondaryAction} />);
      
      const button = screen.getByText('キャンセル');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onClick).toHaveBeenCalled();
      });
    });

    it('デフォルトの閉じるボタンクリックが正常に動作すること', async () => {
      const onClose = jest.fn();
      
      render(<BaseModalFooter onClose={onClose} />);
      
      const button = screen.getByText('閉じる');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('disabledボタンがクリックされないこと', async () => {
      const onClick = jest.fn();
      const primaryAction = {
        label: '保存',
        onClick,
        variant: 'primary' as const,
        disabled: true
      };
      
      render(<BaseModalFooter {...defaultFooterProps} primaryAction={primaryAction} />);
      
      const button = screen.getByText('保存');
      fireEvent.click(button);
      
      // disabled状態ではonClickが呼ばれない
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('複数ボタン組み合わせ', () => {
    it('プライマリとセカンダリの両方のアクションが表示されること', () => {
      const primaryAction = {
        label: '保存',
        onClick: jest.fn(),
        variant: 'primary' as const
      };
      
      const secondaryAction = {
        label: 'キャンセル',
        onClick: jest.fn(),
        variant: 'secondary' as const
      };
      
      render(<BaseModalFooter 
        {...defaultFooterProps} 
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />);
      
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
      // デフォルトの閉じるボタンは表示されない
      expect(screen.queryByText('閉じる')).not.toBeInTheDocument();
    });

    it('ボタンが正しい順序で表示されること', () => {
      const primaryAction = {
        label: '保存',
        onClick: jest.fn(),
        variant: 'primary' as const
      };
      
      const secondaryAction = {
        label: 'キャンセル',
        onClick: jest.fn(),
        variant: 'secondary' as const
      };
      
      const { container } = render(<BaseModalFooter 
        {...defaultFooterProps} 
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />);
      
      const buttons = container.querySelectorAll('button');
      expect(buttons[0]).toHaveTextContent('キャンセル'); // セカンダリが先
      expect(buttons[1]).toHaveTextContent('保存'); // プライマリが後
    });
  });
});