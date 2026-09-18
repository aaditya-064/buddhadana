// ─── User & Auth ─────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Files & Folders ────────────────────────────────────────
export interface Folder {
  _id: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecord {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  cloudinaryResourceType: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Projects ───────────────────────────────────────────────
export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string | User;
  members: (string | User)[];
  startDate: string;
  endDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee: string | User | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ──────────────────────────────────────────────
export interface AnalyticsSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
}

export interface AnalyticsDataPoint {
  period: string;
  sales: number;
  purchases: number;
  expenses: number;
  revenue: number;
}

// ─── Data Import ────────────────────────────────────────────
export interface ImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
  qualityScore: number;
}

// ─── Vault ──────────────────────────────────────────────────
export interface VaultEntry {
  _id: string;
  name: string;
  category: string;
  username: string;
  url: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── n8n Workflows ──────────────────────────────────────────
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  nodes: number;
}

export interface WorkflowDetail extends Workflow {
  nodes_detail: WorkflowNode[];
  settings: Record<string, unknown>;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
  startedAt: string;
  stoppedAt: string | null;
  data: Record<string, unknown>;
}

// ─── Audit Log ──────────────────────────────────────────────
export interface AuditLogEntry {
  _id: string;
  action: string;
  userId: string | User;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ─── API Response ───────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}
