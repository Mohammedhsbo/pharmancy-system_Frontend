
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export function StockStatusCard({ data }) {
  if (!data) return null;

  const getSafeCount = (val) => {
    if (typeof val === 'number') return val;
    if (Array.isArray(val)) return val.length;
    if (val && typeof val === 'object') return val.count || val.total || Object.keys(val).length;
    return Number(val) || 0;
  };

  const counts = data.counts || {};
  const overview = data.overview || {};
  const totalMedicines = getSafeCount(overview.uniqueMedicines);
  const lowStockCount = getSafeCount(counts.lowStock ?? data.lowStock);
  const expiredCount = getSafeCount(counts.expired ?? data.expired);
  const expiringSoonCount = getSafeCount(counts.expiringSoon ?? data.expiringSoon);
  const healthyCount = Math.max(totalMedicines - lowStockCount - expiredCount, 0);

  const items = [
    { label: 'Healthy', value: healthyCount, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Expiring Soon', value: expiringSoonCount, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Expired', value: expiredCount, icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stock Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-3 flex items-center gap-3`}>
              <item.icon size={20} className={item.color} />
              <div>
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
