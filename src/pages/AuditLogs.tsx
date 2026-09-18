import { useState, useEffect } from 'react';
import api from '../services/api';
import type { AuditLogEntry } from '../types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
  Badge,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

function actionVariant(action: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  if (action.includes('login') || action.includes('auth')) return 'info';
  if (action.includes('create') || action.includes('upload')) return 'success';
  if (action.includes('delete') || action.includes('remove')) return 'error';
  if (action.includes('update') || action.includes('edit')) return 'warning';
  return 'default';
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    updateBreadcrumbs([{ label: 'Audit Logs' }]);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs(page, 50);
      setLogs(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  if (loading && logs.length === 0) return <LoadingState message="Loading audit logs..." />;

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description={`Track system activity and security events • ${total} total entries`}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit logs"
          description="Activity logs will appear here as actions are performed in the system."
        />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const userName = typeof log.userId === 'object' ? log.userId.name : log.userId;
                  return (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{userName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono hidden lg:table-cell">
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
