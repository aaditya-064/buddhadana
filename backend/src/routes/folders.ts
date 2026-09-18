import { Router } from 'express';
import { Folder } from '../models/index.js';
import { authenticate, authorize, auditLog } from '../middleware/auth.js';

export const foldersRouter = Router();
foldersRouter.use(authenticate);

// GET /api/folders
foldersRouter.get('/', async (req, res, next) => {
  try {
    const parentId = req.query.parentId === 'null' || !req.query.parentId ? null : req.query.parentId;
    const folders = await Folder.find({ parentId }).sort({ name: 1 });
    res.json(folders);
  } catch (err) { next(err); }
});

// POST /api/folders
foldersRouter.post('/', async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Folder name is required.' });
      return;
    }
    const folder = await Folder.create({
      name: name.trim(),
      parentId: parentId || null,
      createdBy: req.user!._id,
    });
    await auditLog('folder_created', req, `Created folder "${name}"`);
    res.status(201).json(folder);
  } catch (err) { next(err); }
});

// PATCH /api/folders/:id
foldersRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Folder name is required.' });
      return;
    }
    const folder = await Folder.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true });
    if (!folder) { res.status(404).json({ message: 'Folder not found.' }); return; }
    await auditLog('folder_renamed', req, `Renamed folder to "${name}"`);
    res.json(folder);
  } catch (err) { next(err); }
});

// DELETE /api/folders/:id
foldersRouter.delete('/:id', async (req, res, next) => {
  try {
    const folder = await Folder.findByIdAndDelete(req.params.id);
    if (!folder) { res.status(404).json({ message: 'Folder not found.' }); return; }
    // Also delete subfolders and files (cascade)
    await Folder.deleteMany({ parentId: req.params.id });
    const { FileRecord } = await import('../models/index.js');
    await FileRecord.deleteMany({ folderId: req.params.id });
    await auditLog('folder_deleted', req, `Deleted folder "${folder.name}"`);
    res.json({ message: 'Folder deleted.' });
  } catch (err) { next(err); }
});
