import { Router } from 'express';
import { Project, ProjectTask } from '../models/index.js';
import { authenticate, auditLog } from '../middleware/auth.js';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

// GET /api/projects
projectsRouter.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find().populate('owner', 'name email').sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { next(err); }
});

// GET /api/projects/:id
projectsRouter.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email').populate('members', 'name email');
    if (!project) { res.status(404).json({ message: 'Project not found.' }); return; }
    res.json(project);
  } catch (err) { next(err); }
});

// POST /api/projects
projectsRouter.post('/', async (req, res, next) => {
  try {
    const { name, description, status, priority, startDate, endDate, progress } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Project name is required.' });
      return;
    }
    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      status: status || 'planning',
      priority: priority || 'medium',
      owner: req.user!._id,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      progress: progress || 0,
    });
    await auditLog('project_created', req, `Created project "${name}"`);
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id
projectsRouter.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'status', 'priority', 'startDate', 'endDate', 'progress', 'members'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!project) { res.status(404).json({ message: 'Project not found.' }); return; }
    await auditLog('project_updated', req, `Updated project "${project.name}"`);
    res.json(project);
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id
projectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) { res.status(404).json({ message: 'Project not found.' }); return; }
    await ProjectTask.deleteMany({ projectId: req.params.id });
    await auditLog('project_deleted', req, `Deleted project "${project.name}"`);
    res.json({ message: 'Project deleted.' });
  } catch (err) { next(err); }
});

// GET /api/projects/:id/tasks
projectsRouter.get('/:id/tasks', async (req, res, next) => {
  try {
    const tasks = await ProjectTask.find({ projectId: req.params.id }).populate('assignee', 'name email').sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

// POST /api/projects/:id/tasks
projectsRouter.post('/:id/tasks', async (req, res, next) => {
  try {
    const { title, description, status, assignee, dueDate } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ message: 'Task title is required.' });
      return;
    }
    const task = await ProjectTask.create({
      projectId: req.params.id,
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      assignee: assignee || null,
      dueDate: dueDate || null,
    });
    await auditLog('task_created', req, `Created task "${title}" in project ${req.params.id}`);
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id/tasks/:taskId
projectsRouter.patch('/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'status', 'assignee', 'dueDate'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, projectId: req.params.id },
      updates,
      { new: true }
    );
    if (!task) { res.status(404).json({ message: 'Task not found.' }); return; }
    res.json(task);
  } catch (err) { next(err); }
});
