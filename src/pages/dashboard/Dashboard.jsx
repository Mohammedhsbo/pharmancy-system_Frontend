import { useEffect, useState } from 'react';
import { DollarSign, PackageSearch, Users, ShoppingCart } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { AlertsList } from '../../components/dashboard/AlertsList';
import { SalesOverviewChart } from '../../components/dashboard/SalesOverviewChart';
import { StockStatusCard } from '../../components/dashboard/StockStatusCard';
import { TopSellingList } from '../../components/dashboard/TopSellingList';
import { dashboardService } from '../../services/dashboardService';
import { CardGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/currency';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [salesOverview, setSalesOverview] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [stockStatus, setStockStatus] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, salesData, revenueData, stockData, topData, alertsData] =
        await Promise.allSettled([
          dashboardService.getSummary(),
          dashboardService.getSalesOverview(),
          dashboardService.getRevenue(),
          dashboardService.getStockStatus(),
          dashboardService.getTopSelling({ limit: 8 }),
          dashboardService.getAlerts(),
        ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (salesData.status === 'fulfilled') setSalesOverview(salesData.value || []);
      if (revenueData.status === 'fulfilled') setRevenue(revenueData.value || []);
      if (stockData.status === 'fulfilled') setStockStatus(stockData.value);
      if (topData.status === 'fulfilled') setTopSelling(topData.value || []);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value || []);

      const allFailed = [summaryData, salesData, revenueData, stockData, topData, alertsData]
        .every((result) => result.status === 'rejected');
      if (allFailed) {
        setError('Unable to load dashboard data. Please check your connection.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60 rounded-lg" />
        <CardGridSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summary?.sales?.todayTotal || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Today's Invoices"
          value={summary?.sales?.todayInvoices?.toLocaleString() || '0'}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Patients"
          value={summary?.patients?.totalActive?.toLocaleString() || '0'}
          icon={Users}
        />
        <StatCard
          title="Total Medicines"
          value={summary?.inventory?.totalMedicines?.toLocaleString() || '0'}
          icon={PackageSearch}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={Array.isArray(revenue) ? revenue : []} />
        </div>
        <div>
          <StockStatusCard data={stockStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesOverviewChart data={Array.isArray(salesOverview) ? salesOverview : []} />
        <TopSellingList data={Array.isArray(topSelling) ? topSelling : []} />
      </div>

      <AlertsList alerts={Array.isArray(alerts) ? alerts : []} />
    </div>
  );
}
