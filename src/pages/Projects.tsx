import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Project } from '../types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
  Button,
  Badge,
  Modal,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import { Plus, KanbanSquare } from 'lucide-react';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active': return 'success';
    case 'completed': return 'info';
    case 'on-hold': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState<{ name: string; description: string; priority: 'low' | 'medium' | 'high' | 'critical' }>({ name: '', description: '', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    updateBreadcrumbs([{ label: 'Projects' }]);
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      await api.createProject({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        priority: newProject.priority,
        status: 'planning',
        progress: 0,
      });
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', priority: 'medium' });
      await fetchProjects();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create project.';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingState message="Loading projects..." />;
  if (error) return <ErrorState message={error} onRetry={fetchProjects} />;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage and track your projects"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate flex-1">
                  {project.name}
                </h3>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                <span className="text-xs text-gray-500">{project.progress}% complete</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(project.progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                {project.endDate && <span>Due {new Date(project.endDate).toLocaleDateString()}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="Enter project name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Brief project description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <select
              value={newProject.priority}
              onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
