import mongoose, { Schema, type Document } from 'mongoose';

// ─── Folder ─────────────────────────────────────────────────
export interface IFolder extends Document {
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
folderSchema.index({ parentId: 1 });
export const Folder = mongoose.model<IFolder>('Folder', folderSchema);

// ─── File ───────────────────────────────────────────────────
export interface IFile extends Document {
  originalName: string;
  mimeType: string;
  size: number;
  folderId: mongoose.Types.ObjectId | null;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  cloudinaryResourceType: string;
  cloudinaryVersion?: number;
  cloudinaryFormat?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryResourceType: { type: String, default: 'raw' },
    cloudinaryVersion: Number,
    cloudinaryFormat: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
fileSchema.index({ folderId: 1 });
export const FileRecord = mongoose.model<IFile>('File', fileSchema);

// ─── Project ────────────────────────────────────────────────
export interface IProject extends Document {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], default: 'planning' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);
export const Project = mongoose.model<IProject>('Project', projectSchema);

// ─── Project Task ───────────────────────────────────────────
export interface IProjectTask extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee: mongoose.Types.ObjectId | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<IProjectTask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);
taskSchema.index({ projectId: 1 });
export const ProjectTask = mongoose.model<IProjectTask>('ProjectTask', taskSchema);

// ─── Vault Entry ────────────────────────────────────────────
export interface IVaultEntry extends Document {
  name: string;
  category: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  url: string;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vaultSchema = new Schema<IVaultEntry>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    username: { type: String, default: '' },
    encryptedPassword: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    url: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
export const VaultEntry = mongoose.model<IVaultEntry>('VaultEntry', vaultSchema);

// ─── Audit Log ──────────────────────────────────────────────
export interface IAuditLog extends Document {
  action: string;
  userId: mongoose.Types.ObjectId;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

// ─── Sales / Purchases / Expenses (for analytics) ───────────
export interface ISalesRecord extends Document {
  date: Date;
  customer: string;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: Date;
}

const salesSchema = new Schema<ISalesRecord>(
  {
    date: { type: Date, required: true },
    customer: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
salesSchema.index({ date: -1 });
salesSchema.index({ customer: 1 });
export const SalesRecord = mongoose.model<ISalesRecord>('SalesRecord', salesSchema);

export interface IPurchaseRecord extends Document {
  date: Date;
  supplier: string;
  product: string;
  category: string;
  quantity: number;
  unitCost: number;
  total: number;
  createdAt: Date;
}

const purchaseSchema = new Schema<IPurchaseRecord>(
  {
    date: { type: Date, required: true },
    supplier: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
purchaseSchema.index({ date: -1 });
export const PurchaseRecord = mongoose.model<IPurchaseRecord>('PurchaseRecord', purchaseSchema);

export interface IExpenseRecord extends Document {
  date: Date;
  description: string;
  category: string;
  amount: number;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpenseRecord>(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
expenseSchema.index({ date: -1 });
export const ExpenseRecord = mongoose.model<IExpenseRecord>('ExpenseRecord', expenseSchema);
