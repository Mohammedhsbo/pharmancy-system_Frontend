
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '../../utils/currency';
import { TrendingUp } from 'lucide-react';

export function TopSellingList({ data = [] }) {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Top Selling
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safeData.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">No data available</p>
        ) : (
          <div className="space-y-3">
            {safeData.slice(0, 8).map((item, index) => (
              <div
                key={item._id || index}
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.medicine?.name || item.name || item.medicineName || 'Unknown Medicine'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.medicine?.sku ? `SKU: ${item.medicine.sku}` : (item.category?.name || (typeof item.category === 'string' ? item.category : ''))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{Number(item.totalQuantity || item.quantity || 0)} sold</p>
                  {item.totalRevenue != null && (
                    <p className="text-xs text-primary">{formatCurrency(item.totalRevenue)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}