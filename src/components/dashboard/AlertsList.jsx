import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

const alertConfig = {
  low_stock: {
    label: 'Low Stock',
    variant: 'warning',
    icon: AlertTriangle,
    className: 'bg-warning/10 text-warning',
  },
  expired: {
    label: 'Expired',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-danger/10 text-danger',
  },
  expiring_soon: {
    label: 'Expiring',
    variant: 'warning',
    icon: Clock,
    className: 'bg-warning/10 text-warning',
  },
};

export function AlertsList({ alerts = [] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {alerts.map((alert, idx) => {
            const config = alertConfig[alert.type] || alertConfig.expiring_soon;
            const Icon = config.icon;
            const title = alert.medicine?.name || alert.title || 'Inventory alert';
            const description = alert.message || alert.description || '';

            return (
              <div key={alert.medicine?._id || `${alert.type}-${idx}`} className="flex items-start gap-4 p-4 rounded-xl bg-background border border-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.className}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{description}</p>
                </div>
                <Badge variant={config.variant}>
                  {config.label}
                </Badge>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No active alerts.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
