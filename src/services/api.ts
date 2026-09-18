import axios, { type AxiosError, type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  User,
  Folder,
  FileRecord,
  Project,
  ProjectTask,
  AnalyticsSummary,
  AnalyticsDataPoint,
  ImportResult,
  VaultEntry,
  Workflow,
  WorkflowDetail,
  WorkflowExecution,
  AuditLogEntry,
  PaginatedResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('bdu_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message: string }>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('bdu_token');
          localStorage.removeItem('bdu_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ─── Auth ──────────────────────────────────────────────
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', credentials);
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/me');
    return data;
  }

  // ─── Users ─────────────────────────────────────────────
  async getUsers(): Promise<User[]> {
    const { data } = await this.client.get<User[]>('/users');
    return data;
  }

  async createUser(user: { name: string; email: string; password: string; role: string }): Promise<User> {
    const { data } = await this.client.post<User>('/users', user);
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // ─── Folders ───────────────────────────────────────────
  async getFolders(parentId: string | null = null): Promise<Folder[]> {
    const params = parentId ? { parentId } : {};
    const { data } = await this.client.get<Folder[]>('/folders', { params });
    return data;
  }

  async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    const { data } = await this.client.post<Folder>('/folders', { name, parentId });
    return data;
  }

  async renameFolder(id: string, name: string): Promise<Folder> {
    const { data } = await this.client.patch<Folder>(`/folders/${id}`, { name });
    return data;
  }

  async deleteFolder(id: string): Promise<void> {
    await this.client.delete(`/folders/${id}`);
  }

  // ─── Files ─────────────────────────────────────────────
  async getFiles(folderId: string | null = null): Promise<FileRecord[]> {
    const params = folderId ? { folderId } : {};
    const { data } = await this.client.get<FileRecord[]>('/files', { params });
    return data;
  }

  async uploadFile(file: File, folderId: string | null = null): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    const { data } = await this.client.post<FileRecord>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  }

  async getFileDownloadUrl(id: string): Promise<string> {
    const { data } = await this.client.get<{ url: string }>(`/files/${id}/download`);
    return data.url;
  }

  async renameFile(id: string, name: string): Promise<FileRecord> {
    const { data } = await this.client.patch<FileRecord>(`/files/${id}`, { name });
    return data;
  }

  async deleteFile(id: string): Promise<void> {
    await this.client.delete(`/files/${id}`);
  }

  // ─── Projects ──────────────────────────────────────────
  async getProjects(): Promise<Project[]> {
    const { data } = await this.client.get<Project[]>('/projects');
    return data;
  }

  async getProject(id: string): Promise<Project> {
    const { data } = await this.client.get<Project>(`/projects/${id}`);
    return data;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const { data } = await this.client.post<Project>('/projects', project);
    return data;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data } = await this.client.patch<Project>(`/projects/${id}`, updates);
    return data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const { data } = await this.client.get<ProjectTask[]>(`/projects/${projectId}/tasks`);
    return data;
  }

  async createProjectTask(projectId: string, task: Partial<ProjectTask>): Promise<ProjectTask> {
    const { data } = await this.client.post<ProjectTask>(`/projects/${projectId}/tasks`, task);
    return data;
  }

  async updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    const { data } = await this.client.patch<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, updates);
    return data;
  }

  // ─── Analytics ─────────────────────────────────────────
  async getAnalyticsSummary(dateFrom?: string, dateTo?: string): Promise<AnalyticsSummary> {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const { data } = await this.client.get<AnalyticsSummary>('/analytics/summary', { params });
    return data;
  }

  async getAnalyticsTimeline(dateFrom?: string, dateTo?: string, groupBy?: string): Promise<AnalyticsDataPoint[]> {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (groupBy) params.groupBy = groupBy;
    const { data } = await this.client.get<AnalyticsDataPoint[]>('/analytics/timeline', { params });
    return data;
  }

  // ─── Data Import ───────────────────────────────────────
  async importData(file: File, type: string): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const { data } = await this.client.post<ImportResult>('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  }

  // ─── Vault ─────────────────────────────────────────────
  async getVaultEntries(): Promise<VaultEntry[]> {
    const { data } = await this.client.get<VaultEntry[]>('/vault');
    return data;
  }

  async createVaultEntry(entry: Partial<VaultEntry> & { password: string }): Promise<VaultEntry> {
    const { data } = await this.client.post<VaultEntry>('/vault', entry);
    return data;
  }

  async revealVaultPassword(id: string): Promise<{ password: string }> {
    const { data } = await this.client.get<{ password: string }>(`/vault/${id}/reveal`);
    return data;
  }

  async deleteVaultEntry(id: string): Promise<void> {
    await this.client.delete(`/vault/${id}`);
  }

  // ─── Workflows (n8n) ──────────────────────────────────
  async getWorkflows(): Promise<Workflow[]> {
    const { data } = await this.client.get<Workflow[]>('/workflows');
    return data;
  }

  async getWorkflow(id: string): Promise<WorkflowDetail> {
    const { data } = await this.client.get<WorkflowDetail>(`/workflows/${id}`);
    return data;
  }

  async executeWorkflow(id: string): Promise<WorkflowExecution> {
    const { data } = await this.client.post<WorkflowExecution>(`/workflows/${id}/execute`);
    return data;
  }

  async getWorkflowExecutions(id: string): Promise<WorkflowExecution[]> {
    const { data } = await this.client.get<WorkflowExecution[]>(`/workflows/${id}/executions`);
    return data;
  }

  // ─── Audit Logs ────────────────────────────────────────
  async getAuditLogs(page = 1, pageSize = 50): Promise<PaginatedResponse<AuditLogEntry>> {
    const { data } = await this.client.get<PaginatedResponse<AuditLogEntry>>('/audit-logs', {
      params: { page, pageSize },
    });
    return data;
  }
}

export const api = new ApiService();
export default api;
