import { Router } from 'express';
import crypto from 'crypto';
import { VaultEntry } from '../models/index.js';
import { authenticate, authorize, auditLog } from '../middleware/auth.js';

const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!.slice(0, 32), 'utf-8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
}

function decrypt(encrypted: string, iv: string, authTag: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!.slice(0, 32), 'utf-8');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export const vaultRouter = Router();
vaultRouter.use(authenticate);

// GET /api/vault
vaultRouter.get('/', async (req, res, next) => {
  try {
    const entries = await VaultEntry.find().sort({ createdAt: -1 });
    // Never return encrypted password to frontend
    const safe = entries.map((e) => ({
      _id: e._id,
      name: e.name,
      category: e.category,
      username: e.username,
      url: e.url,
      notes: e.notes,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
    res.json(safe);
  } catch (err) { next(err); }
});

// POST /api/vault
vaultRouter.post('/', async (req, res, next) => {
  try {
    const { name, category, username, password, url, notes } = req.body;
    if (!name || !password) {
      res.status(400).json({ message: 'Name and password are required.' });
      return;
    }
    const { encrypted, iv, authTag } = encrypt(password);
    const entry = await VaultEntry.create({
      name: name.trim(),
      category: category || '',
      username: username || '',
      encryptedPassword: encrypted,
      iv,
      authTag,
      url: url || '',
      notes: notes || '',
      createdBy: req.user!._id,
    });
    await auditLog('vault_entry_created', req, `Created vault entry "${name}"`);
    res.status(201).json({
      _id: entry._id,
      name: entry.name,
      category: entry.category,
      username: entry.username,
      url: entry.url,
      notes: entry.notes,
      createdAt: entry.createdAt,
    });
  } catch (err) { next(err); }
});

// GET /api/vault/:id/reveal
vaultRouter.get('/:id/reveal', authorize('admin'), async (req, res, next) => {
  try {
    const entry = await VaultEntry.findById(req.params.id);
    if (!entry) { res.status(404).json({ message: 'Entry not found.' }); return; }
    const password = decrypt(entry.encryptedPassword, entry.iv, entry.authTag);
    await auditLog('vault_access', req, `Revealed password for "${entry.name}"`);
    res.json({ password });
  } catch (err) { next(err); }
});

// DELETE /api/vault/:id
vaultRouter.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const entry = await VaultEntry.findByIdAndDelete(req.params.id);
    if (!entry) { res.status(404).json({ message: 'Entry not found.' }); return; }
    await auditLog('vault_entry_deleted', req, `Deleted vault entry "${entry.name}"`);
    res.json({ message: 'Entry deleted.' });
  } catch (err) { next(err); }
});
