import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { roomIds } = body; // optional: process specific room IDs only

  let rooms = await base44.asServiceRole.entities.Room.list();

  if (roomIds && roomIds.length > 0) {
    rooms = rooms.filter(r => roomIds.includes(r.id));
  }

  const results = [];

  for (const room of rooms) {
    const tasks = room.tasks || [];
    if (tasks.length === 0) continue;

    const alreadyHasMaterial = tasks.every(t => t.learning_material && t.learning_material.trim().length > 0);
    if (alreadyHasMaterial) {
      results.push({ id: room.id, title: room.title, status: 'skipped' });
      continue;
    }

    const updatedTasks = [];

    for (const task of tasks) {
      if (task.learning_material && task.learning_material.trim().length > 0) {
        updatedTasks.push(task);
        continue;
      }

      const prompt = `You are an expert cybersecurity instructor creating educational material for a hands-on CTF/pentesting room.

Room: "${room.title}" (${room.difficulty} difficulty, category: ${room.category})
Room Description: ${room.description}

Task: "${task.title}"
Task Description: ${task.description}
Questions in this task: ${task.questions?.map(q => q.question).join('; ')}

Write comprehensive learning material for this task in markdown format (300-500 words).
- Use ## for section headings
- Use **bold** for key terms and tool names
- Use \`backticks\` for commands and code
- Cover: core concepts, relevant tools, techniques, and approach guidance
- Be educational but do NOT give away the exact answers
- Reference real-world applicability

Output ONLY the markdown content, no JSON wrapper.`;

      const material = await base44.integrations.Core.InvokeLLM({ prompt });
      updatedTasks.push({ ...task, learning_material: material });
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }

    await base44.asServiceRole.entities.Room.update(room.id, { tasks: updatedTasks });
    results.push({ id: room.id, title: room.title, status: 'updated', tasksUpdated: updatedTasks.length });
  }

  return Response.json({ success: true, results });
});