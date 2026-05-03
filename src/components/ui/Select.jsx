import React from 'react';
import { cn } from '@/utils/cn';

export const Select = React.forwardRef(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-background border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer',
            error && 'border-danger/50 focus:ring-danger',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
