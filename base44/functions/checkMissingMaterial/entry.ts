import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rooms = await base44.asServiceRole.entities.Room.list();
  const missing = [];
  const done = [];

  for (const room of rooms) {
    const tasks = room.tasks || [];
    const hasMaterial = tasks.length > 0 && tasks.every(t => t.learning_material && t.learning_material.trim().length > 0);
    if (hasMaterial) {
      done.push(room.id);
    } else {
      missing.push({ id: room.id, title: room.title, taskCount: tasks.length });
    }
  }

  return Response.json({ missing, done, missingIds: missing.map(r => r.id) });
});