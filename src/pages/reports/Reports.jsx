import { useState, useCallback } from 'react';
import { Filter, BarChart3, Activity, PieChart as PieChartIcon, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ChartWrapper } from '../../components/ui/ChartWrapper';
import { reportService } from '../../services/reportService';
import { formatCurrency } from '../../utils/currency';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report', icon: Activity },
  { id: 'profit', label: 'Profit Analysis', icon: PieChartIcon },
  { id: 'inventory', label: 'Inventory Status', icon: BarChart3 },
  { id: 'patients', label: 'Patient Report', icon: Users },
];

const COLORS = ['#7c3aed', '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#f97316'];

const formatLabel = (key) =>
  String(key)
    .replace(/^_id$/, 'name')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isCurrencyKey = (key) => {
  const normalized = key.toLowerCase();
  const moneyTerms = ['revenue', 'profit', 'amount', 'cost', 'price', 'value', 'tax', 'discount', 'refunded', 'spent'];
  const countTerms = ['count', 'quantity', 'items', 'patients', 'invoices', 'medicines', 'margin'];
  return moneyTerms.some((term) => normalized.includes(term)) && !countTerms.some((term) => normalized.includes(term));
};

const formatCellValue = (key, value) => {
  if (value == null || value === '') return '-';
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value._id) return value._id;
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('margin')) return `${value.toFixed(2)}%`;
    return isCurrencyKey(key) ? formatCurrency(value) : value.toLocaleString();
  }
  return String(value);
};

const tableRows = (rows) => (Array.isArray(rows) ? rows : []).map((row) => {
  const next = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    if (key === '__v') return;
    next[key === '_id' ? 'name' : key] = value;
  });
  return next;
});

function SummaryGrid({ summary }) {
  if (!summary || Object.keys(summary).length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Object.entries(summary).filter(([key]) => key !== '_id').map(([key, value]) => (
        <div key={key} className="bg-background rounded-lg border border-white/5 p-4">
          <p className="text-xs text-gray-500 uppercase mb-1">{formatLabel(key)}</p>
          <p className="text-xl font-bold text-white">{formatCellValue(key, value)}</p>
        </div>
      ))}
    </div>
  );
}

function DataTable({ rows, emptyMessage = 'No rows available.' }) {
  const data = tableRows(rows);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>;
  }

  const columns = Object.keys(data[0]).filter((key) => !key.startsWith('_'));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
          <tr>
            {columns.map((key) => (
              <th key={key} className="px-6 py-3">{formatLabel(key)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.slice(0, 50).map((row, index) => (
            <tr key={row._id || row.id || index} className="hover:bg-white/5">
              {columns.map((key) => (
                <td key={key} className="px-6 py-3">
                  {formatCellValue(key, row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarReportChart({ data, xKey = 'label', bars }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <ChartWrapper>
      <ResponsiveContainer width="99%" height={320} minHeight={320}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
          />
          {bars.map((bar, index) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function PieReportChart({ data, valueFormatter = (value) => Number(value).toLocaleString() }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <ChartWrapper>
      <ResponsiveContainer width="99%" height={320} minHeight={320}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => valueFormatter(value)}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '8px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function ReportCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const serviceMap = {
        sales: reportService.getSalesReport,
        profit: reportService.getProfitReport,
        inventory: reportService.getInventoryReport,
        patients: reportService.getPatientReport,
      };

      const data = await serviceMap[reportType](params);
      setReportData(data);
    } catch (err) {
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate]);

  const renderSalesReport = () => {
    const dailyBreakdown = (reportData.dailyBreakdown || []).map((item) => ({
      label: item._id,
      revenue: Number(item.revenue || 0),
      refunded: Number(item.refunded || 0),
      invoices: Number(item.invoices || 0),
    }));
    const paymentBreakdown = (reportData.paymentBreakdown || []).map((item) => ({
      name: formatLabel(item._id || 'unknown'),
      value: Number(item.total || 0),
      count: item.count,
    }));

    return (
      <div className="space-y-6">
        <SummaryGrid summary={reportData.summary} />
        <ReportCard title="Sales Over Time">
          <BarReportChart data={dailyBreakdown} bars={[{ key: 'revenue', name: 'Revenue' }, { key: 'refunded', name: 'Refunded' }]} />
        </ReportCard>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportCard title="Top Items">
            <DataTable rows={reportData.topItems} emptyMessage="No sold items found for this period." />
          </ReportCard>
          <ReportCard title="Payment Methods">
            {paymentBreakdown.length > 0 ? <PieReportChart data={paymentBreakdown} valueFormatter={formatCurrency} /> : <p className="text-sm text-gray-500 text-center py-8">No payment data found.</p>}
          </ReportCard>
        </div>
      </div>
    );
  };

  const renderProfitReport = () => {
    const profitByCategory = (reportData.profitByCategory || []).map((item) => ({
      ...item,
      name: item._id || 'Uncategorized',
      profit: Number(item.profit || 0),
      revenue: Number(item.revenue || 0),
      cost: Number(item.cost || 0),
    }));

    return (
      <div className="space-y-6">
        <SummaryGrid summary={reportData.summary} />
        <ReportCard title="Profit By Category">
          <BarReportChart data={profitByCategory} xKey="name" bars={[{ key: 'profit', name: 'Profit' }, { key: 'cost', name: 'Cost' }]} />
        </ReportCard>
        <ReportCard title="Category Details">
          <DataTable rows={profitByCategory} emptyMessage="No category profit data found." />
        </ReportCard>
      </div>
    );
  };

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <SummaryGrid summary={reportData.summary} />
      <ReportCard title="Inventory Items">
        <DataTable rows={reportData.data} emptyMessage="No inventory records match this filter." />
        {reportData.meta && (
          <p className="text-xs text-gray-500 mt-4">
            Page {reportData.meta.page} of {reportData.meta.totalPages || 1} - {reportData.meta.totalDocs || 0} records
          </p>
        )}
      </ReportCard>
    </div>
  );

  const renderPatientReport = () => {
    const prescriptionStats = Object.entries(reportData.prescriptionStats || {}).map(([name, value]) => ({
      name: formatLabel(name),
      value: Number(value || 0),
    }));
    const summary = {
      totalPatients: Number(reportData.totalPatients || 0),
      topPatientCount: Array.isArray(reportData.topPatients) ? reportData.topPatients.length : 0,
      prescriptionStatuses: prescriptionStats.length,
    };

    return (
      <div className="space-y-6">
        <SummaryGrid summary={summary} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportCard title="Top Patients">
            <DataTable rows={reportData.topPatients} emptyMessage="No patient sales found for this period." />
          </ReportCard>
          <ReportCard title="Prescription Status">
            {prescriptionStats.length > 0 ? <PieReportChart data={prescriptionStats} /> : <p className="text-sm text-gray-500 text-center py-8">No prescription status data found.</p>}
          </ReportCard>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    if (error) return <ErrorState message={error} onRetry={fetchReport} />;

    if (!reportData) {
      return (
        <EmptyState
          icon={Activity}
          title="Generate a Report"
          description="Configure filters and generate a report to view results."
        />
      );
    }

    const renderers = {
      sales: renderSalesReport,
      profit: renderProfitReport,
      inventory: renderInventoryReport,
      patients: renderPatientReport,
    };

    return renderers[reportType]();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter size={18} className="text-primary" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Report Type</label>
              <div className="space-y-2">
                {REPORT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => { setReportType(type.id); setReportData(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      reportType === type.id
                        ? 'bg-primary/10 border-primary/30 text-white'
                        : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <type.icon size={18} className={reportType === type.id ? 'text-primary' : ''} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-sm font-medium text-gray-400">Date Range</label>
              <Input label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <Input label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>

            <Button className="w-full" onClick={fetchReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {renderReport()}
        </div>
      </div>
    </div>
  );
}
