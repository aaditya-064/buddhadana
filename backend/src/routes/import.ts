import { Router } from 'express';
import multer from 'multer';
import { authenticate, auditLog } from '../middleware/auth.js';
import { SalesRecord, PurchaseRecord, ExpenseRecord } from '../models/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const importRouter = Router();
importRouter.use(authenticate);

// POST /api/import
importRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided.' });
      return;
    }

    const importType = req.body.type;
    if (!importType) {
      res.status(400).json({ message: 'Import type is required.' });
      return;
    }

    let rows: any[] = [];
    const ext = req.file.originalname.toLowerCase().split('.').pop();

    // Parse file
    if (ext === 'json') {
      const content = req.file.buffer.toString('utf-8');
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } else if (ext === 'csv') {
      const { parse } = await import('csv-parse/sync');
      const content = req.file.buffer.toString('utf-8');
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      res.status(400).json({ message: 'Unsupported file format. Use XLSX, CSV, or JSON.' });
      return;
    }

    // Process import
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (importType === 'sales') {
          if (!row.date || !row.customer || !row.product) {
            invalid++;
            errors.push(`Row ${i + 1}: Missing required fields (date, customer, product)`);
            continue;
          }
          await SalesRecord.create({
            date: new Date(row.date),
            customer: String(row.customer).trim(),
            product: String(row.product).trim(),
            category: String(row.category || '').trim(),
            quantity: Number(row.quantity) || 0,
            unitPrice: Number(row.unitPrice || row.unit_price || row.price) || 0,
            total: Number(row.total || row.amount) || 0,
          });
          imported++;
        } else if (importType === 'purchases') {
          if (!row.date || !row.supplier || !row.product) {
            invalid++;
            errors.push(`Row ${i + 1}: Missing required fields (date, supplier, product)`);
            continue;
          }
          await PurchaseRecord.create({
            date: new Date(row.date),
            supplier: String(row.supplier).trim(),
            product: String(row.product).trim(),
            category: String(row.category || '').trim(),
            quantity: Number(row.quantity) || 0,
            unitCost: Number(row.unitCost || row.unit_cost || row.cost) || 0,
            total: Number(row.total || row.amount) || 0,
          });
          imported++;
        } else if (importType === 'expenses') {
          if (!row.date || !row.description) {
            invalid++;
            errors.push(`Row ${i + 1}: Missing required fields (date, description)`);
            continue;
          }
          await ExpenseRecord.create({
            date: new Date(row.date),
            description: String(row.description).trim(),
            category: String(row.category || '').trim(),
            amount: Number(row.amount || row.total) || 0,
          });
          imported++;
        } else {
          res.status(400).json({ message: `Unsupported import type: ${importType}` });
          return;
        }
      } catch (err: any) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          invalid++;
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    }

    const totalRows = rows.length;
    const qualityScore = totalRows > 0 ? Math.round((imported / totalRows) * 100) : 0;

    await auditLog('data_imported', req, `Imported ${imported} ${importType} records from ${req.file.originalname}`);

    res.json({ totalRows, imported, duplicates, invalid, errors: errors.slice(0, 50), qualityScore });
  } catch (err) { next(err); }
});
