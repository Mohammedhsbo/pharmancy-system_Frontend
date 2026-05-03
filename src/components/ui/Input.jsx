import React from 'react';
import { cn } from '@/utils/cn';

export const Input = React.forwardRef(
  ({ className, label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-background border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              Icon && 'pl-10',
              error && 'border-danger/50 focus:ring-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
