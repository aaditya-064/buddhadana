import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Workflow } from '../types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  ConfigRequiredState,
  PageHeader,
  Badge,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import { Workflow as WorkflowIcon, Search } from 'lucide-react';

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    updateBreadcrumbs([{ label: 'Workflows' }]);
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 503 || axiosErr?.response?.data?.message?.includes('not configured')) {
        setNotConfigured(true);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load workflows.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingState message="Loading workflows..." />;
  if (notConfigured) return <ConfigRequiredState service="N8N" />;
  if (error) return <ErrorState message={error} onRetry={fetchWorkflows} />;

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="n8n automation workflows"
      />

      {/* Search */}
      {workflows.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      )}

      {filteredWorkflows.length === 0 && !searchQuery ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows found"
          description="No n8n workflows are currently available. Create workflows in your n8n instance."
        />
      ) : filteredWorkflows.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No matching workflows"
          description={`No workflows match "${searchQuery}".`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow) => (
            <Link
              key={workflow.id}
              to={`/workflows/${workflow.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate flex-1">
                  {workflow.name}
                </h3>
                <Badge variant={workflow.active ? 'success' : 'default'}>
                  {workflow.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{workflow.nodes} nodes</span>
                {workflow.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    {workflow.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Updated {new Date(workflow.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
