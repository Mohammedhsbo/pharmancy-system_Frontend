
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ChartWrapper } from '../ui/ChartWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency';

export function SalesOverviewChart({ data = [] }) {
  const chartData = Array.isArray(data)
    ? data.map((item) => ({
        label: item.label || item.name || String(item._id ?? ''),
        total: Number(item.total ?? item.totalSales ?? item.netSales ?? item.revenue ?? 0),
        invoices: Number(item.invoiceCount ?? item.invoices ?? 0),
      }))
    : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartWrapper>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="99%" height={320} minHeight={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              No sales data available
            </div>
          )}
        </ChartWrapper>
      </CardContent>
    </Card>
  );
}
