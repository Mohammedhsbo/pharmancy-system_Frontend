import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export function ErrorState({ message = 'Something went wrong', onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-danger" />
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-1">Error</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw size={14} />
          Retry
        </Button>
      )}
    </div>
  );
}
