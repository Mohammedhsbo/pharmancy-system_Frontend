import React from 'react';
import { PackageSearch } from 'lucide-react';
import { cn } from '@/utils/cn';

export function EmptyState({
  icon: Icon = PackageSearch,
  title = 'No data found',
  description,
  action,
  className,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
