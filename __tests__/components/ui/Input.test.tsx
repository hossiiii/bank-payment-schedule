import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('h-10'); // Default medium size
  });

  it('should render with label', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Test Label');
  });

  it('should render different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');

    rerender(<Input type="password" />);
    expect(screen.getByLabelText('パスワードを表示')).toBeInTheDocument(); // Password toggle button
  });

  it('should handle password visibility toggle', async () => {
    const user = userEvent.setup();
    render(<Input type="password" value="secret" onChange={() => {}} />);
    
    const input = screen.getByDisplayValue('secret');
    const toggleButton = screen.getByLabelText('パスワードを表示');
    
    expect(input).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-8');

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-10');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });

  it('should render different variants', () => {
    const { rerender } = render(<Input variant="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-white');

    rerender(<Input variant="filled" />);
    expect(screen.getByRole('textbox')).toHaveClass('bg-gray-50');
  });

  it('should display error state', () => {
    render(<Input error="This is an error" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(screen.getByText('This is an error')).toHaveClass('text-red-600');
  });

  it('should display helper text', () => {
    render(<Input helperText="This is helper text" />);
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toHaveClass('text-gray-600');
  });

  it('should prioritize error over helper text', () => {
    render(<Input error="Error message" helperText="Helper text" />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('should render with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    render(<Input leftIcon={<LeftIcon />} />);
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    render(<Input rightIcon={<RightIcon />} />);
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test input');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test input');
  });

  it('should be disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(<Input disabled onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50');
  });

  it('should be disabled when isLoading is true', () => {
    render(<Input isLoading />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(screen.getByRole('textbox').closest('div')).toContainHTML('animate-spin'); // Loading spinner
  });

  it('should show loading spinner', () => {
    render(<Input isLoading />);
    
    // Find the loading spinner
    const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render full width', () => {
    render(<Input fullWidth />);
    
    const container = screen.getByRole('textbox').closest('div');
    expect(container).toHaveClass('w-full');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should handle placeholder', () => {
    render(<Input placeholder="Enter text here" />);
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('should have correct padding with icons', () => {
    const { rerender } = render(<Input leftIcon={<span>←</span>} />);
    expect(screen.getByRole('textbox')).toHaveClass('pl-10'); // Medium size with left icon

    rerender(<Input rightIcon={<span>→</span>} />);
    expect(screen.getByRole('textbox')).toHaveClass('pr-10'); // Medium size with right icon

    rerender(<Input leftIcon={<span>←</span>} rightIcon={<span>→</span>} />);
    expect(screen.getByRole('textbox')).toHaveClass('px-10'); // Both icons
  });

  it('should disable password toggle when input is disabled', () => {
    render(<Input type="password" disabled />);
    
    const toggleButton = screen.getByLabelText('パスワードを表示');
    expect(toggleButton).toBeDisabled();
    expect(toggleButton).toHaveClass('opacity-50');
  });

  it('should not show password toggle by default', () => {
    render(<Input type="text" />);
    
    expect(screen.queryByLabelText('パスワードを表示')).not.toBeInTheDocument();
  });

  it('should maintain focus management', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    expect(input).toHaveFocus();
  });

  it('should support controlled input', () => {
    const { rerender } = render(<Input value="controlled" onChange={() => {}} />);
    expect(screen.getByDisplayValue('controlled')).toBeInTheDocument();

    rerender(<Input value="updated" onChange={() => {}} />);
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });

  it('should support uncontrolled input', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'uncontrolled');
    
    expect(input).toHaveValue('uncontrolled');
  });

  it('should have proper aria attributes for errors', () => {
    render(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should pass through additional props', () => {
    render(
      <Input 
        data-testid="custom-input" 
        aria-describedby="custom-description"
        maxLength={10}
      />
    );
    
    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('aria-describedby', 'custom-description');
    expect(input).toHaveAttribute('maxLength', '10');
  });
});