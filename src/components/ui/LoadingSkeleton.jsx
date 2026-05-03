import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/cn';

export function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn('space-y-3 p-6', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className={cn('h-10 flex-1 rounded', j === 0 && 'max-w-[200px]')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export function DetailSkeleton({ className }) {
  return (
    <div className={cn('space-y-6', className)}>
      <Skeleton className="h-8 w-48 rounded" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
