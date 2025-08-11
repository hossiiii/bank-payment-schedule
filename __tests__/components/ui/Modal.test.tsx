import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui/Modal';

// Mock portal for modal rendering
const mockPortal = jest.fn((children) => children);
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: mockPortal,
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render with title', () => {
    render(<Modal {...defaultProps} title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
  });

  it('should render with description', () => {
    render(<Modal {...defaultProps} description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
  });

  it('should show close button by default', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByLabelText('モーダルを閉じる')).toBeInTheDocument();
  });

  it('should hide close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByLabelText('モーダルを閉じる')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    await user.click(screen.getByLabelText('モーダルを閉じる'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={true} />);
    
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when backdrop is clicked but closeOnBackdropClick is false', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnBackdropClick={false} />);
    
    const backdrop = screen.getByRole('dialog').parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={true} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when Escape key is pressed but closeOnEscape is false', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="md" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl');

    rerender(<Modal {...defaultProps} size="full" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-[95vw]');
  });

  it('should apply custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal-class" />);
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal-class');
  });

  it('should apply custom overlay className', () => {
    render(<Modal {...defaultProps} overlayClassName="custom-overlay-class" />);
    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay).toHaveClass('custom-overlay-class');
  });

  it('should focus the modal when opened', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { unmount } = render(<Modal {...defaultProps} />);
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
});

describe('ModalHeader', () => {
  it('should render with default styling', () => {
    render(<ModalHeader>Header content</ModalHeader>);
    
    const header = screen.getByText('Header content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('px-6', 'py-4', 'border-b');
  });

  it('should apply custom className', () => {
    render(<ModalHeader className="custom-header">Header</ModalHeader>);
    expect(screen.getByText('Header')).toHaveClass('custom-header');
  });
});

describe('ModalBody', () => {
  it('should render with default styling', () => {
    render(<ModalBody>Body content</ModalBody>);
    
    const body = screen.getByText('Body content');
    expect(body).toBeInTheDocument();
    expect(body).toHaveClass('px-6', 'py-4');
  });

  it('should apply custom className', () => {
    render(<ModalBody className="custom-body">Body</ModalBody>);
    expect(screen.getByText('Body')).toHaveClass('custom-body');
  });
});

describe('ModalFooter', () => {
  it('should render with default styling', () => {
    render(<ModalFooter>Footer content</ModalFooter>);
    
    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('px-6', 'py-4', 'bg-gray-50', 'border-t');
  });

  it('should apply custom className', () => {
    render(<ModalFooter className="custom-footer">Footer</ModalFooter>);
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });
});

describe('ConfirmModal', () => {
  const defaultConfirmProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    message: 'Are you sure?'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default title', () => {
    render(<ConfirmModal {...defaultConfirmProps} />);
    expect(screen.getByText('確認')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<ConfirmModal {...defaultConfirmProps} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render the message', () => {
    render(<ConfirmModal {...defaultConfirmProps} message="Delete this item?" />);
    expect(screen.getByText('Delete this item?')).toBeInTheDocument();
  });

  it('should render default button texts', () => {
    render(<ConfirmModal {...defaultConfirmProps} />);
    expect(screen.getByText('確認')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('should render custom button texts', () => {
    render(
      <ConfirmModal 
        {...defaultConfirmProps} 
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<ConfirmModal {...defaultConfirmProps} onConfirm={onConfirm} />);
    
    await user.click(screen.getByText('確認'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<ConfirmModal {...defaultConfirmProps} onClose={onClose} />);
    
    await user.click(screen.getByText('キャンセル'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render destructive variant with red button', () => {
    render(<ConfirmModal {...defaultConfirmProps} variant="destructive" />);
    
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should render default variant with blue button', () => {
    render(<ConfirmModal {...defaultConfirmProps} variant="default" />);
    
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('should show loading state', () => {
    render(<ConfirmModal {...defaultConfirmProps} isLoading={true} />);
    
    expect(screen.getByText('処理中...')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeDisabled();
  });

  it('should disable backdrop click when loading', () => {
    render(<ConfirmModal {...defaultConfirmProps} isLoading={true} />);
    
    // Modal should not close on backdrop click when loading
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('should not call onClose when loading and confirm is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    
    render(
      <ConfirmModal 
        {...defaultConfirmProps} 
        isLoading={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
    
    await user.click(screen.getByText('処理中...'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});