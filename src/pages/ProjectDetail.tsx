import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import type { Project, ProjectTask } from '../types';
import {
  LoadingState,
  ErrorState,
  NotFoundState,
  PageHeader,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
} from 'lucide-react';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'active': return 'success';
    case 'completed': case 'done': return 'info';
    case 'on-hold': return 'warning';
    case 'cancelled': return 'error';
    case 'in-progress': return 'warning';
    default: return 'default';
  }
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '', status: '' as Project['status'], priority: '' as Project['priority'] });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchProject = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [projectData, tasksData] = await Promise.all([
        api.getProject(projectId),
        api.getProjectTasks(projectId),
      ]);
      setProject(projectData);
      setTasks(tasksData);
      updateBreadcrumbs([
        { label: 'Projects', to: '/projects' },
        { label: projectData.name },
      ]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setNotFound(true);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load project.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const handleEdit = () => {
    if (!project) return;
    setEditData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      const updated = await api.updateProject(projectId, {
        name: editData.name.trim(),
        description: editData.description.trim(),
        status: editData.status as Project['status'],
        priority: editData.priority as Project['priority'],
      });
      setProject(updated);
      setShowEditModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update project.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await api.deleteProject(projectId);
      navigate('/projects');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete project.';
      setError(message);
      setDeleting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!projectId || !newTask.title.trim()) return;
    setCreatingTask(true);
    try {
      const task = await api.createProjectTask(projectId, {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        status: 'todo',
      });
      setTasks([...tasks, task]);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create task.';
      setError(message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTask = async (task: ProjectTask) => {
    if (!projectId) return;
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const updated = await api.updateProjectTask(projectId, task._id, { status: nextStatus });
      setTasks(tasks.map((t) => (t._id === task._id ? updated : t)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task.';
      setError(message);
    }
  };

  if (loading) return <LoadingState message="Loading project..." />;
  if (notFound) return <NotFoundState resource="Project" />;
  if (error && !project) return <ErrorState message={error} onRetry={fetchProject} />;
  if (!project) return <NotFoundState resource="Project" />;

  const completedTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.description}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleEdit}>
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Priority</p>
          <span className="text-sm font-medium capitalize">{project.priority}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Start</p>
          <span className="text-sm font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Progress</p>
          <span className="text-sm font-medium">{project.progress}%</span>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Tasks</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedTasks} of {tasks.length} completed
            </p>
          </div>
          <Button size="sm" onClick={() => setShowTaskModal(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No tasks yet. Add a task to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div key={task._id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => handleToggleTask(task)}
                  className="shrink-0"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : task.status === 'in-progress' ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  )}
                </div>
                <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as Project['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value as Project['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} loading={creatingTask}>Add Task</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? All tasks and related data will be permanently removed.`}
        loading={deleting}
      />
    </div>
  );
}
