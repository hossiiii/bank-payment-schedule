import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // Primary variant
  });

  it('should render different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-600');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');
  });

  it('should render different sizes correctly', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-6');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<Button isLoading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('should not show loading state when not loading', () => {
    render(<Button isLoading={false}>Not Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });

  it('should render with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    render(
      <Button leftIcon={<LeftIcon />}>
        With Left Icon
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('With Left Icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    render(
      <Button rightIcon={<RightIcon />}>
        With Right Icon
      </Button>
    );
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Right Icon')).toBeInTheDocument();
  });

  it('should render with both left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    render(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Both Icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should hide icons when loading', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    render(
      <Button isLoading leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Loading with Icons
      </Button>
    );
    
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('should render full width when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('should not render full width by default', () => {
    render(<Button>Not Full Width</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('w-full');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Ref Button');
  });

  it('should pass through additional props', () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom Label">
        Additional Props
      </Button>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom Label');
  });

  it('should have correct type attribute', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

    rerender(<Button type="reset">Reset</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');

    rerender(<Button>Default</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('should be disabled when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should maintain accessibility when disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('cursor-not-allowed');
  });
});