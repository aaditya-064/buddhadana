import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import type { Folder, FileRecord } from '../types';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  PageHeader,
  Button,
  Modal,
  ConfirmDialog,
} from '../components/ui';
import { updateBreadcrumbs } from '../components/Layout';
import {
  Folder as FolderIcon,
  FileText,
  Upload,
  Plus,
  Download,
  Trash2,
  Edit3,
  ChevronRight,
  Home,
  File,
  FileImage,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
} from 'lucide-react';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive;
  return FileText;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Files() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Root' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'file' | 'folder'; id: string; currentName: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [foldersData, filesData] = await Promise.all([
        api.getFolders(currentFolderId),
        api.getFiles(currentFolderId),
      ]);
      setFolders(foldersData);
      setFiles(filesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load files.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const crumbs = folderPath.map((p, i) => ({
      label: p.name,
      to: i < folderPath.length - 1 ? undefined : undefined,
    }));
    updateBreadcrumbs(crumbs);
  }, [folderPath]);

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setFolderPath([{ id: null, name: 'Root' }]);
    } else {
      const existingIndex = folderPath.findIndex((p) => p.id === folderId);
      if (existingIndex >= 0) {
        setFolderPath(folderPath.slice(0, existingIndex + 1));
      } else {
        setFolderPath([...folderPath, { id: folderId, name: folderName }]);
      }
      setCurrentFolderId(folderId);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await api.uploadFile(selectedFiles[i], currentFolderId);
      }
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'File upload failed. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await api.createFolder(newFolderName.trim(), currentFolderId);
      setShowNewFolderModal(false);
      setNewFolderName('');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create folder.';
      setError(message);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'file') {
        await api.deleteFile(deleteTarget.id);
      } else {
        await api.deleteFolder(deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setRenaming(true);
    try {
      if (renameTarget.type === 'file') {
        await api.renameFile(renameTarget.id, renameValue.trim());
      } else {
        await api.renameFolder(renameTarget.id, renameValue.trim());
      }
      setRenameTarget(null);
      setRenameValue('');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rename failed.';
      setError(message);
    } finally {
      setRenaming(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const url = await api.getFileDownloadUrl(fileId);
      window.open(url, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed.';
      setError(message);
    }
  };

  if (loading && !folders.length && !files.length) {
    return <LoadingState message="Loading files..." />;
  }

  return (
    <div>
      <PageHeader
        title="Files"
        description="Manage your documents and files"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowNewFolderModal(true)}>
              <Plus className="w-4 h-4" />
              New Folder
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.png,.jpg,.jpeg,.gif,.zip,.txt"
            />
          </div>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 mb-4 text-sm overflow-x-auto">
        {folderPath.map((crumb, i) => (
          <span key={crumb.id ?? 'root'} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            {i === 0 ? (
              <button
                onClick={() => navigateToFolder(null, 'Root')}
                className="flex items-center gap-1 text-gray-500 hover:text-primary-600"
              >
                <Home className="w-3.5 h-3.5" />
                Root
              </button>
            ) : i === folderPath.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.name}</span>
            ) : (
              <button
                onClick={() => navigateToFolder(crumb.id, crumb.name)}
                className="text-gray-500 hover:text-primary-600"
              >
                {crumb.name}
              </button>
            )}
          </span>
        ))}
      </nav>

      {loading ? (
        <LoadingState />
      ) : folders.length === 0 && files.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No files or folders"
          description="Upload files or create a folder to get started."
          action={
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder._id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <button
                onClick={() => navigateToFolder(folder._id, folder.name)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <FolderIcon className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">{folder.name}</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setRenameTarget({ type: 'folder', id: folder._id, currentName: folder.name }); setRenameValue(folder.name); }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: 'folder', id: folder._id, name: folder.name })}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Files */}
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div
                key={file._id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file._id)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setRenameTarget({ type: 'file', id: file._id, currentName: file.originalName }); setRenameValue(file.originalName); }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    title="Rename"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'file', id: file._id, name: file.originalName })}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Folder Modal */}
      <Modal isOpen={showNewFolderModal} onClose={() => setShowNewFolderModal(false)} title="New Folder">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Folder Name</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNewFolderModal(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} loading={creatingFolder}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={`Rename ${renameTarget?.type === 'folder' ? 'Folder' : 'File'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Name</label>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={handleRename} loading={renaming}>Rename</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'folder' ? 'Folder' : 'File'}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
