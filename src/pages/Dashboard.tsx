import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { AnalyticsSummary, Project, FileRecord } from '../types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
  StatCard,
} from '../components/ui';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  TrendingUp,
  FolderOpen,
  KanbanSquare,
  Users,
  ArrowRight,
} from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, projectsData, filesData] = await Promise.allSettled([
        api.getAnalyticsSummary(),
        api.getProjects(),
        api.getFiles(),
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (projectsData.status === 'fulfilled') setRecentProjects(projectsData.value.slice(0, 5));
      if (filesData.status === 'fulfilled') setRecentFiles(filesData.value.slice(0, 5));

      // If all failed, show error
      if (summaryData.status === 'rejected' && projectsData.status === 'rejected' && filesData.status === 'rejected') {
        setError('Unable to connect to the server. Please check your connection and try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error && !summary && !recentProjects.length) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(value);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your business metrics" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue"
          value={summary ? formatCurrency(summary.revenue) : '—'}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Purchases"
          value={summary ? formatCurrency(summary.totalPurchases) : '—'}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          label="Expenses"
          value={summary ? formatCurrency(summary.totalExpenses) : '—'}
          icon={Receipt}
          color="red"
        />
        <StatCard
          label="Net Profit"
          value={summary ? formatCurrency(summary.netProfit) : '—'}
          icon={TrendingUp}
          color={summary && summary.netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Customers"
          value={summary?.totalCustomers ?? 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Products"
          value={summary?.totalProducts ?? 0}
          icon={ShoppingCart}
          color="amber"
        />
        <StatCard
          label="Projects"
          value={recentProjects.length}
          icon={KanbanSquare}
          color="primary"
        />
        <StatCard
          label="Files"
          value={recentFiles.length}
          icon={FolderOpen}
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState title="No projects yet" description="Projects will appear here once created." />
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{project.status}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600">{project.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Files */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Files</h2>
            <Link to="/files" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentFiles.length === 0 ? (
            <EmptyState title="No files yet" description="Uploaded files will appear here." />
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file._id} className="flex items-center justify-between p-3 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
