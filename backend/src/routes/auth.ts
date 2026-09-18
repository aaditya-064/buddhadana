import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { authenticate, auditLog } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await auditLog('login_failed', req, `Failed login attempt for ${email}`);
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await auditLog('login_failed', req, `Wrong password for ${email}`);
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await auditLog('login', req, `User ${user.email} logged in`);

    res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req, res) => {
  await auditLog('logout', req, `User ${req.user!.email} logged out`);
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req, res) => {
  const user = req.user!;
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt });
});
