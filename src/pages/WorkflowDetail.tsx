import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { WorkflowDetail, WorkflowExecution } from '../types';
import {
  LoadingState,
  ErrorState,
  NotFoundState,
  PageHeader,
  Button,
  Badge,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export default function WorkflowDetail() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    if (!workflowId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [workflowData, executionsData] = await Promise.allSettled([
        api.getWorkflow(workflowId),
        api.getWorkflowExecutions(workflowId),
      ]);

      if (workflowData.status === 'fulfilled') {
        setWorkflow(workflowData.value);
        updateBreadcrumbs([
          { label: 'Workflows', to: '/workflows' },
          { label: workflowData.value.name },
        ]);
      } else {
        const err = workflowData.reason as { response?: { status?: number } };
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load workflow.');
        }
      }

      if (executionsData.status === 'fulfilled') {
        setExecutions(executionsData.value);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workflow.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const handleExecute = async () => {
    if (!workflowId) return;
    setExecuting(true);
    setExecutionResult(null);
    try {
      const result = await api.executeWorkflow(workflowId);
      setExecutionResult(result.status === 'success' ? 'success' : 'error');
      // Refresh executions
      const updatedExecutions = await api.getWorkflowExecutions(workflowId);
      setExecutions(updatedExecutions);
    } catch (err: unknown) {
      setExecutionResult('error');
      const message = err instanceof Error ? err.message : 'Workflow execution failed.';
      setError(message);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <LoadingState message="Loading workflow..." />;
  if (notFound) return <NotFoundState resource="Workflow" />;
  if (error && !workflow) return <ErrorState message={error} onRetry={fetchWorkflow} />;
  if (!workflow) return <NotFoundState resource="Workflow" />;

  return (
    <div>
      <Link
        to="/workflows"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workflows
      </Link>

      <PageHeader
        title={workflow.name}
        description={`Workflow with ${workflow.nodes_detail?.length ?? workflow.nodes} nodes`}
        action={
          <Button onClick={handleExecute} loading={executing} disabled={!workflow.active}>
            {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {executing ? 'Executing...' : 'Execute'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {executionResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          executionResult === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {executionResult === 'success' ? '✓ Workflow executed successfully.' : '✗ Workflow execution failed.'}
        </div>
      )}

      {/* Workflow Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <Badge variant={workflow.active ? 'success' : 'default'}>
            {workflow.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Nodes</p>
          <span className="text-sm font-medium">{workflow.nodes_detail?.length ?? workflow.nodes}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <span className="text-sm font-medium">{new Date(workflow.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Updated</p>
          <span className="text-sm font-medium">{new Date(workflow.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tags */}
      {workflow.tags && workflow.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {workflow.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nodes */}
      {workflow.nodes_detail && workflow.nodes_detail.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Nodes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {workflow.nodes_detail.map((node) => (
              <div key={node.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{node.name}</p>
                  <p className="text-xs text-gray-500">{node.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Executions</h2>
        </div>
        {executions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No executions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {executions.slice(0, 10).map((exec) => (
              <div key={exec.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {exec.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {exec.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  {exec.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {exec.status === 'waiting' && <Clock className="w-4 h-4 text-amber-500" />}
                  <div>
                    <p className="text-sm text-gray-900 capitalize">{exec.status}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(exec.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {exec.stoppedAt && (
                  <span className="text-xs text-gray-400">
                    Duration: {((new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
