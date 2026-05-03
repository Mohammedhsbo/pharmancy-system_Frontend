import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '@/utils/cn';

export function StatCard({ title, value, icon: Icon, trend, className }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={24} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={cn("font-medium", trend.isPositive ? "text-success" : "text-danger")}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
