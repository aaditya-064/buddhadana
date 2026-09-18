import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);

  if (err.name === 'ValidationError') {
    res.status(400).json({ message: 'Validation error.', errors: (err as any).errors });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid ID format.' });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ message: 'Duplicate entry.' });
    return;
  }

  res.status(500).json({ message: 'Internal server error.' });
}
