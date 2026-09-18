import { Router } from 'express';
import axios from 'axios';
import { authenticate, auditLog } from '../middleware/auth.js';
import { isN8nConfigured } from '../config/env.js';

export const workflowsRouter = Router();
workflowsRouter.use(authenticate);

function getN8nClient() {
  if (!isN8nConfigured()) {
    throw new Error('N8N_NOT_CONFIGURED');
  }
  return axios.create({
    baseURL: `${process.env.N8N_BASE_URL}/api/v1`,
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY },
    timeout: 30000,
  });
}

// GET /api/workflows
workflowsRouter.get('/', async (req, res, next) => {
  try {
    const client = getN8nClient();
    const { data } = await client.get('/workflows');
    const workflows = (data.data || data).map((w: any) => ({
      id: w.id,
      name: w.name,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      tags: (w.tags || []).map((t: any) => t.name || t),
      nodes: w.nodes?.length || 0,
    }));
    res.json(workflows);
  } catch (err: any) {
    if (err.message === 'N8N_NOT_CONFIGURED') {
      res.status(503).json({ message: 'N8N integration is not configured.' });
      return;
    }
    if (err.response?.status) {
      res.status(err.response.status).json({ message: 'Failed to fetch workflows from n8n.' });
      return;
    }
    next(err);
  }
});

// GET /api/workflows/:id
workflowsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = getN8nClient();
    const { data } = await client.get(`/workflows/${req.params.id}`);
    res.json({
      id: data.id,
      name: data.name,
      active: data.active,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      tags: (data.tags || []).map((t: any) => t.name || t),
      nodes: data.nodes?.length || 0,
      nodes_detail: (data.nodes || []).map((n: any) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        position: n.position,
      })),
      settings: data.settings || {},
    });
  } catch (err: any) {
    if (err.message === 'N8N_NOT_CONFIGURED') {
      res.status(503).json({ message: 'N8N integration is not configured.' });
      return;
    }
    if (err.response?.status === 404) {
      res.status(404).json({ message: 'Workflow not found.' });
      return;
    }
    next(err);
  }
});

// POST /api/workflows/:id/execute
workflowsRouter.post('/:id/execute', async (req, res, next) => {
  try {
    const client = getN8nClient();
    // n8n activation/execution via webhook or API
    const { data } = await client.post(`/workflows/${req.params.id}/activate`);
    await auditLog('workflow_executed', req, `Executed workflow ${req.params.id}`);
    res.json({ id: req.params.id, workflowId: req.params.id, status: 'success', startedAt: new Date().toISOString(), stoppedAt: new Date().toISOString(), data: data || {} });
  } catch (err: any) {
    if (err.message === 'N8N_NOT_CONFIGURED') {
      res.status(503).json({ message: 'N8N integration is not configured.' });
      return;
    }
    // Return execution failure rather than pretending success
    res.json({ id: req.params.id, workflowId: req.params.id, status: 'error', startedAt: new Date().toISOString(), stoppedAt: new Date().toISOString(), data: { error: err.message } });
  }
});

// GET /api/workflows/:id/executions
workflowsRouter.get('/:id/executions', async (req, res, next) => {
  try {
    const client = getN8nClient();
    const { data } = await client.get('/executions', { params: { workflowId: req.params.id, limit: 10 } });
    const executions = (data.data || data || []).map((e: any) => ({
      id: e.id,
      workflowId: req.params.id,
      status: e.finished ? (e.status === 'error' ? 'error' : 'success') : 'running',
      startedAt: e.startedAt,
      stoppedAt: e.stoppedAt,
      data: e.data || {},
    }));
    res.json(executions);
  } catch (err: any) {
    if (err.message === 'N8N_NOT_CONFIGURED') {
      res.status(503).json({ message: 'N8N integration is not configured.' });
      return;
    }
    res.json([]); // Return empty if executions endpoint unavailable
  }
});
