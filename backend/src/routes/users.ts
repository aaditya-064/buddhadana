import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticate, authorize, auditLog } from '../middleware/auth.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

// GET /api/users
usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/users
usersRouter.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters.' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already registered.' });
      return;
    }
    const user = await User.create({ name, email, password, role: role || 'staff' });
    await auditLog('user_created', req, `Created user ${email}`);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
usersRouter.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user!._id.toString()) {
      res.status(400).json({ message: 'Cannot delete your own account.' });
      return;
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) { res.status(404).json({ message: 'User not found.' }); return; }
    await auditLog('user_deleted', req, `Deleted user ${user.email}`);
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
});
