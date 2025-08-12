'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasError = Boolean(error);

    const containerStyles = [
      fullWidth && 'w-full'
    ];

    const wrapperStyles = [
      'relative flex items-center',
      fullWidth && 'w-full'
    ];

    const baseInputStyles = [
      // Base styles
      'block w-full rounded-lg border transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
      
      // Placeholder styling
      'placeholder:text-gray-400',
      
      // Size-specific padding (adjusted for icons)
      leftIcon || rightIcon ? 'text-left' : ''
    ];

    const variants_styles = {
      default: [
        hasError
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        'bg-white'
      ],
      filled: [
        hasError
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500',
        'bg-gray-50 focus:bg-white'
      ]
    };

    const sizes = {
      sm: {
        input: 'h-8 text-sm',
        padding: leftIcon || rightIcon 
          ? (leftIcon && rightIcon ? 'px-8' : leftIcon ? 'pl-8 pr-3' : 'pl-3 pr-8')
          : 'px-3',
        icon: 'w-4 h-4'
      },
      md: {
        input: 'h-10 text-sm',
        padding: leftIcon || rightIcon 
          ? (leftIcon && rightIcon ? 'px-10' : leftIcon ? 'pl-10 pr-3' : 'pl-3 pr-10')
          : 'px-3',
        icon: 'w-5 h-5'
      },
      lg: {
        input: 'h-12 text-base',
        padding: leftIcon || rightIcon 
          ? (leftIcon && rightIcon ? 'px-12' : leftIcon ? 'pl-12 pr-4' : 'pl-4 pr-12')
          : 'px-4',
        icon: 'w-6 h-6'
      }
    };

    const iconPositioning = {
      sm: {
        left: 'left-2.5',
        right: 'right-2.5'
      },
      md: {
        left: 'left-3',
        right: 'right-3'
      },
      lg: {
        left: 'left-4',
        right: 'right-4'
      }
    };

    return (
      <div className={cn(containerStyles)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className={cn(wrapperStyles)}>
          {/* Left icon */}
          {leftIcon && (
            <div className={cn(
              'absolute z-10 flex items-center pointer-events-none text-gray-400',
              iconPositioning[size].left
            )}>
              <div className={sizes[size].icon}>
                {leftIcon}
              </div>
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              baseInputStyles,
              variants_styles[variant],
              sizes[size].input,
              sizes[size].padding,
              className
            )}
            disabled={disabled || isLoading}
            placeholder={placeholder}
            {...props}
          />

          {/* Right icon or password toggle */}
          {(rightIcon || isPassword) && (
            <div className={cn(
              'absolute z-10 flex items-center',
              iconPositioning[size].right
            )}>
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'text-gray-400 hover:text-gray-600 transition-colors',
                    sizes[size].icon,
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={disabled}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              ) : rightIcon ? (
                <div className={cn(
                  'text-gray-400 pointer-events-none',
                  sizes[size].icon
                )}>
                  {rightIcon}
                </div>
              ) : null}
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className={cn(
              'absolute flex items-center',
              iconPositioning[size].right
            )}>
              <svg
                className={cn(
                  'animate-spin text-gray-400',
                  sizes[size].icon
                )}
                fill="none"
                viewBox="0 0 24 24"
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
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {(error || helperText) && (
          <div className="mt-1 text-sm">
            {error ? (
              <span className="text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </span>
            ) : (
              <span className="text-gray-600">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

export { Input };