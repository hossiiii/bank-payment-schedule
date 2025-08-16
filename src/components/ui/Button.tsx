'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      // Base styles
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'border border-transparent rounded-lg',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // Full width
      fullWidth && 'w-full'
    ];

    const variants = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus:ring-blue-500',
        'disabled:bg-blue-300'
      ],
      secondary: [
        'bg-gray-600 text-white',
        'hover:bg-gray-700 active:bg-gray-800',
        'focus:ring-gray-500',
        'disabled:bg-gray-300'
      ],
      outline: [
        'border-gray-300 text-gray-700 bg-white',
        'hover:bg-gray-50 active:bg-gray-100',
        'focus:ring-blue-500',
        'disabled:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200'
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-blue-500',
        'disabled:text-gray-300'
      ],
      destructive: [
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500',
        'disabled:bg-red-300'
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500',
        'disabled:bg-red-300'
      ],
      success: [
        'bg-green-600 text-white',
        'hover:bg-green-700 active:bg-green-800',
        'focus:ring-green-500',
        'disabled:bg-green-300'
      ]
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs h-6',
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12'
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="mr-2 -ml-1">{leftIcon}</span>
        )}

        {/* Button text */}
        {children}

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="ml-2 -mr-1">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

export { Button };