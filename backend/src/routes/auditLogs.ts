import { Router } from 'express';
import { AuditLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

export const auditLogsRouter = Router();
auditLogsRouter.use(authenticate);

// GET /api/audit-logs
auditLogsRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      AuditLog.countDocuments(),
    ]);

    res.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) { next(err); }
});
