'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface NavigationProps {
  items: NavigationItem[];
  className?: string;
}

export function Navigation({ items, className }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-white border-t border-gray-200',
      'safe-area-pb', // For iOS safe area
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                'px-3 py-2 min-w-0 text-xs font-medium',
                'transition-colors duration-200 rounded-lg',
                'relative',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {/* Icon container */}
              <div className="relative mb-1">
                <div className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </div>
                
                {/* Badge */}
                {item.badge && (
                  <span className={cn(
                    'absolute -top-2 -right-2',
                    'min-w-4 h-4 px-1',
                    'bg-red-500 text-white text-xs font-bold',
                    'rounded-full flex items-center justify-center',
                    'border border-white'
                  )}>
                    {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              
              {/* Label */}
              <span className={cn(
                'text-xs truncate max-w-full',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Top navigation component for pages with back button
export interface TopNavigationProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
}

export function TopNavigation({ 
  title, 
  onBack, 
  rightAction, 
  showBackButton = false, 
  className 
}: TopNavigationProps) {
  return (
    <header className={cn(
      'sticky top-0 z-30',
      'bg-white border-b border-gray-200',
      'safe-area-pt', // For iOS safe area
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Back button or spacer */}
        <div className="flex items-center">
          {showBackButton ? (
            <button
              onClick={onBack}
              className={cn(
                'p-2 -ml-2 mr-2',
                'text-gray-600 hover:text-gray-900',
                'rounded-lg hover:bg-gray-100',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label="戻る"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <div className="w-9" /> // Spacer for centering title
          )}
        </div>

        {/* Center - Title */}
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>

        {/* Right side - Action or spacer */}
        <div className="flex items-center">
          {rightAction || <div className="w-9" />} {/* Spacer for centering title */}
        </div>
      </div>
    </header>
  );
}

// Breadcrumb navigation component
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="w-4 h-4 text-gray-400 mx-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          
          {item.href ? (
            <Link
              href={item.href}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-600 font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Pre-defined icon components for common navigation items
export const NavigationIcons = {
  Calendar: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Schedule: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Settings: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Bank: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Home: () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
};