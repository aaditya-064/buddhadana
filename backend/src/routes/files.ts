import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { FileRecord, Folder } from '../models/index.js';
import { authenticate, auditLog } from '../middleware/auth.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10) }, // 50MB default
});

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-rar-compressed',
];

export const filesRouter = Router();
filesRouter.use(authenticate);

// GET /api/files
filesRouter.get('/', async (req, res, next) => {
  try {
    const folderId = req.query.folderId === 'null' || !req.query.folderId ? null : req.query.folderId;
    const files = await FileRecord.find({ folderId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) { next(err); }
});

// POST /api/files/upload
filesRouter.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided.' });
      return;
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      res.status(400).json({ message: 'File type is not supported.' });
      return;
    }

    // Validate folder if provided
    const folderId = req.body.folderId || null;
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder) {
        res.status(400).json({ message: 'Invalid folder.' });
        return;
      }
    }

    // Upload to Cloudinary
    const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
    const folder = folderId ? `buddha-dana/files/${folderId}` : 'buddha-dana/files';

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder,
          public_id: `${Date.now()}-${req.file!.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    // Save to MongoDB
    const fileRecord = await FileRecord.create({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      folderId: folderId || null,
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
      cloudinaryResourceType: resourceType,
      cloudinaryVersion: result.version,
      cloudinaryFormat: result.format,
      uploadedBy: req.user!._id,
    });

    await auditLog('file_uploaded', req, `Uploaded "${req.file.originalname}"`);
    res.status(201).json(fileRecord);
  } catch (err: any) {
    if (err.message?.includes('File size')) {
      res.status(400).json({ message: 'File exceeds the maximum allowed size.' });
      return;
    }
    next(err);
  }
});

// GET /api/files/:id/download
filesRouter.get('/:id/download', async (req, res, next) => {
  try {
    const file = await FileRecord.findById(req.params.id);
    if (!file) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }

    // Generate a signed URL for authorized access
    const url = cloudinary.url(file.cloudinaryPublicId, {
      resource_type: file.cloudinaryResourceType as any,
      sign_url: true,
      secure: true,
    });

    res.json({ url });
  } catch (err) { next(err); }
});

// PATCH /api/files/:id
filesRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'File name is required.' });
      return;
    }
    const file = await FileRecord.findByIdAndUpdate(req.params.id, { originalName: name.trim() }, { new: true });
    if (!file) { res.status(404).json({ message: 'File not found.' }); return; }
    await auditLog('file_renamed', req, `Renamed file to "${name}"`);
    res.json(file);
  } catch (err) { next(err); }
});

// DELETE /api/files/:id
filesRouter.delete('/:id', async (req, res, next) => {
  try {
    const file = await FileRecord.findById(req.params.id);
    if (!file) { res.status(404).json({ message: 'File not found.' }); return; }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
        resource_type: file.cloudinaryResourceType as any,
      });
    } catch (cloudErr) {
      console.error('[Cloudinary] Delete failed:', (cloudErr as Error).message);
      // Continue with MongoDB deletion but log the partial failure
    }

    await FileRecord.findByIdAndDelete(req.params.id);
    await auditLog('file_deleted', req, `Deleted file "${file.originalName}"`);
    res.json({ message: 'File deleted.' });
  } catch (err) { next(err); }
});
