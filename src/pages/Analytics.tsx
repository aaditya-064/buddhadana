import { useState, useEffect } from 'react';
import api from '../services/api';
import type { AnalyticsSummary, AnalyticsDataPoint } from '../types';
import {
  LoadingState,
  ErrorState,
  PageHeader,
  StatCard,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export default function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    updateBreadcrumbs([{ label: 'Analytics' }]);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, timelineData] = await Promise.allSettled([
        api.getAnalyticsSummary(dateFrom || undefined, dateTo || undefined),
        api.getAnalyticsTimeline(dateFrom || undefined, dateTo || undefined, 'month'),
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value);

      if (summaryData.status === 'rejected' && timelineData.status === 'rejected') {
        setError('Failed to load analytics data. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(value);

  if (loading) return <LoadingState message="Loading analytics..." />;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Business performance metrics and trends"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="From"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="To"
              />
            </div>
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue"
          value={summary ? formatCurrency(summary.revenue) : '—'}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Total Sales"
          value={summary ? formatCurrency(summary.totalSales) : '—'}
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          label="Total Purchases"
          value={summary ? formatCurrency(summary.totalPurchases) : '—'}
          icon={ShoppingCart}
          color="amber"
        />
        <StatCard
          label="Net Profit"
          value={summary ? formatCurrency(summary.netProfit) : '—'}
          icon={summary && summary.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={summary && summary.netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Expenses"
          value={summary ? formatCurrency(summary.totalExpenses) : '—'}
          icon={Receipt}
          color="red"
        />
        <StatCard
          label="Gross Profit"
          value={summary ? formatCurrency(summary.grossProfit) : '—'}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          label="Customers"
          value={summary?.totalCustomers ?? 0}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="Products"
          value={summary?.totalProducts ?? 0}
          icon={BarChart3}
          color="amber"
        />
      </div>

      {/* Charts */}
      {timeline.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Sales vs Purchases */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Sales vs Purchases</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="purchases" fill="#f97316" radius={[4, 4, 0, 0]} name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Revenue Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No data available</h3>
          <p className="text-sm text-gray-500">
            Import sales, purchase, and expense data to see analytics charts.
          </p>
        </div>
      )}
    </div>
  );
}
