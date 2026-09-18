import { useState, useEffect } from 'react';
import api from '../services/api';
import type { VaultEntry } from '../types';
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
  Shield,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function Vault() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', category: '', username: '', password: '', url: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    updateBreadcrumbs([{ label: 'Vault' }]);
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVaultEntries();
      setEntries(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load vault entries.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleCreate = async () => {
    if (!newEntry.name.trim()) return;
    setCreating(true);
    try {
      await api.createVaultEntry({
        name: newEntry.name.trim(),
        category: newEntry.category.trim(),
        username: newEntry.username.trim(),
        password: newEntry.password,
        url: newEntry.url.trim(),
        notes: newEntry.notes.trim(),
      });
      setShowCreateModal(false);
      setNewEntry({ name: '', category: '', username: '', password: '', url: '', notes: '' });
      await fetchEntries();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create entry.';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleReveal = async (id: string) => {
    if (revealedPasswords[id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setRevealing(id);
    try {
      const { password } = await api.revealVaultPassword(id);
      setRevealedPasswords((prev) => ({ ...prev, [id]: password }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reveal password.';
      setError(message);
    } finally {
      setRevealing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteVaultEntry(deleteTarget._id);
      setDeleteTarget(null);
      await fetchEntries();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete entry.';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  if (loading) return <LoadingState message="Loading vault..." />;

  return (
    <div>
      <PageHeader
        title="Vault"
        description="Securely manage credentials and sensitive information"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Vault is empty"
          description="Add credentials and sensitive information to your secure vault."
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div key={entry._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{entry.name}</h3>
                    {entry.category && (
                      <span className="text-xs text-gray-500">{entry.category}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(entry)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {entry.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Username</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-900 font-mono">{entry.username}</span>
                      <button
                        onClick={() => handleCopy(entry.username, `user-${entry._id}`)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Copy"
                      >
                        <Copy className={`w-3 h-3 ${copiedField === `user-${entry._id}` ? 'text-green-500' : 'text-gray-400'}`} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Password</span>
                  <div className="flex items-center gap-1">
                    {revealedPasswords[entry._id] ? (
                      <span className="text-sm text-gray-900 font-mono">{revealedPasswords[entry._id]}</span>
                    ) : (
                      <span className="text-sm text-gray-900 font-mono">••••••••</span>
                    )}
                    <button
                      onClick={() => handleReveal(entry._id)}
                      disabled={revealing === entry._id}
                      className="p-1 rounded hover:bg-gray-100"
                      title={revealedPasswords[entry._id] ? 'Hide' : 'Reveal'}
                    >
                      {revealing === entry._id ? (
                        <span className="w-3 h-3 inline-block animate-spin">⟳</span>
                      ) : revealedPasswords[entry._id] ? (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Eye className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                    {revealedPasswords[entry._id] && (
                      <button
                        onClick={() => handleCopy(revealedPasswords[entry._id], `pass-${entry._id}`)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Copy"
                      >
                        <Copy className={`w-3 h-3 ${copiedField === `pass-${entry._id}` ? 'text-green-500' : 'text-gray-400'}`} />
                      </button>
                    )}
                  </div>
                </div>

                {entry.url && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">URL</span>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {entry.notes && (
                <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-2">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Vault Entry">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={newEntry.name}
              onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
              placeholder="e.g., AWS Console"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={newEntry.category}
              onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
              placeholder="e.g., Cloud, Database, API"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={newEntry.username}
              onChange={(e) => setNewEntry({ ...newEntry, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={newEntry.password}
              onChange={(e) => setNewEntry({ ...newEntry, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={newEntry.url}
              onChange={(e) => setNewEntry({ ...newEntry, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Add Entry</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vault Entry"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
