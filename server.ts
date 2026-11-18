import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { helpDeskRepo, SUPPORT_AGENTS } from './server/repository.ts';
import type {
  CreateTicketPayload,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UpdateTicketPayload,
} from './src/types/helpdesk.ts';

const VALID_CATEGORIES: TicketCategory[] = ['Hardware', 'Software', 'Network', 'Account'];
const VALID_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES: TicketStatus[] = ['Pending', 'In Progress', 'Resolved'];

async function startServer() {
  await helpDeskRepo.init();

  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/agents', (_req: Request, res: Response) => {
    res.json({ agents: SUPPORT_AGENTS });
  });

  app.get('/api/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await helpDeskRepo.getStats();
      res.json(stats);
    } catch (err) {
      console.error('GET /api/stats error:', err);
      res.status(500).json({ error: 'Failed to compute dashboard metrics.' });
    }
  });

  app.get('/api/tickets', async (req: Request, res: Response) => {
    try {
      const tickets = await helpDeskRepo.listTickets({
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        priority: typeof req.query.priority === 'string' ? req.query.priority : undefined,
        assigneeId:
          typeof req.query.assigneeId === 'string' ? req.query.assigneeId : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      });
      res.json({ tickets });
    } catch (err) {
      console.error('GET /api/tickets error:', err);
      res.status(500).json({ error: 'Failed to load tickets.' });
    }
  });

  app.get('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const ticket = await helpDeskRepo.getTicketById(req.params.id);
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      res.json({ ticket });
    } catch (err) {
      console.error('GET /api/tickets/:id error:', err);
      res.status(500).json({ error: 'Failed to retrieve ticket.' });
    }
  });

  app.post('/api/tickets', async (req: Request, res: Response) => {
    try {
      const body = req.body as Partial<CreateTicketPayload>;
      if (!body.subject || body.subject.trim().length < 4) {
        res.status(400).json({ error: 'Subject must be at least 4 characters.' });
        return;
      }
      if (!body.description || body.description.trim().length < 10) {
        res.status(400).json({ error: 'Description must be at least 10 characters.' });
        return;
      }
      if (!body.requesterName || body.requesterName.trim().length < 2) {
        res.status(400).json({ error: 'Requester name is required.' });
        return;
      }
      if (!body.requesterEmail || !body.requesterEmail.includes('@')) {
        res.status(400).json({ error: 'A valid requester email is required.' });
        return;
      }
      if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
        res.status(400).json({ error: 'Valid ticket category is required.' });
        return;
      }
      if (!body.priority || !VALID_PRIORITIES.includes(body.priority)) {
        res.status(400).json({ error: 'Valid ticket priority is required.' });
        return;
      }

      const created = await helpDeskRepo.createTicket({
        subject: body.subject,
        description: body.description,
        category: body.category,
        priority: body.priority,
        requesterName: body.requesterName,
        requesterEmail: body.requesterEmail,
        department: body.department || 'General',
        assetTag: body.assetTag,
        autoAssign: body.autoAssign ?? true,
      });

      res.status(201).json({ ticket: created });
    } catch (err) {
      console.error('POST /api/tickets error:', err);
      res.status(500).json({ error: 'Failed to create support ticket.' });
    }
  });

  app.patch('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const patch = req.body as UpdateTicketPayload;

      if (patch.status && !VALID_STATUSES.includes(patch.status)) {
        res.status(400).json({ error: 'Invalid ticket status.' });
        return;
      }
      if (patch.priority && !VALID_PRIORITIES.includes(patch.priority)) {
        res.status(400).json({ error: 'Invalid ticket priority.' });
        return;
      }
      if (patch.category && !VALID_CATEGORIES.includes(patch.category)) {
        res.status(400).json({ error: 'Invalid ticket category.' });
        return;
      }

      const updated = await helpDeskRepo.updateTicket(req.params.id, patch);
      if (!updated) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      res.json({ ticket: updated });
    } catch (err) {
      console.error('PATCH /api/tickets/:id error:', err);
      res.status(500).json({ error: 'Failed to update ticket.' });
    }
  });

  app.post('/api/tickets/:id/notes', async (req: Request, res: Response) => {
    try {
      const { authorName, authorRole, content } = req.body as {
        authorName?: string;
        authorRole?: 'Agent' | 'Requester';
        content?: string;
      };

      if (!content || content.trim().length < 2) {
        res.status(400).json({ error: 'Note content cannot be empty.' });
        return;
      }

      const role = authorRole === 'Requester' ? 'Requester' : 'Agent';
      const updated = await helpDeskRepo.addTicketNote(
        req.params.id,
        authorName || 'Support Engineer',
        role,
        content
      );

      if (!updated) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      res.status(201).json({ ticket: updated });
    } catch (err) {
      console.error('POST /api/tickets/:id/notes error:', err);
      res.status(500).json({ error: 'Failed to add worklog note.' });
    }
  });

  app.delete('/api/tickets/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await helpDeskRepo.deleteTicket(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Ticket not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/tickets/:id error:', err);
      res.status(500).json({ error: 'Failed to delete ticket.' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Deskline Help Desk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
