import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ChartWrapper } from '../ui/ChartWrapper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency';

export function RevenueChart({ data }) {
  const chartData = Array.isArray(data)
    ? data.map((item) => ({
        name: item.name || item.label || String(item._id ?? 'Unknown'),
        revenue: Number(item.revenue ?? item.totalAmount ?? item.total ?? 0),
        count: Number(item.count ?? 0),
      }))
    : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <ChartWrapper>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="99%" height={320} minHeight={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                No revenue data available
              </div>
            )}
          </ChartWrapper>
        </div>
      </CardContent>
    </Card>
  );
}
