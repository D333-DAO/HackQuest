import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentEmail, studentName, enrollments, courseProgress } = body;

    // Fetch all available learning paths and rooms for context
    const [allPaths, allRooms] = await Promise.all([
      base44.asServiceRole.entities.LearningPath.list(),
      base44.asServiceRole.entities.Room.list(),
    ]);

    // Build a summary of what the student has done
    const enrollmentSummary = (enrollments || []).map(e => ({
      course: e.course_title,
      enrolledOn: e.enrollment_date,
    }));

    const progressSummary = (courseProgress || []).map(p => ({
      module: p.module_title,
      status: p.status,
      completedOn: p.completion_date || null,
    }));

    const completedCount = progressSummary.filter(p => p.status === 'completed').length;
    const inProgressCount = progressSummary.filter(p => p.status === 'in_progress').length;

    const availablePathsList = allPaths.map(p => `- ${p.title} (${p.difficulty}, ${p.category}): ${p.description || ''}`).join('\n');
    const availableRoomsList = allRooms.slice(0, 30).map(r => `- ${r.title} (${r.difficulty}, ${r.category}): ${r.description || ''}`).join('\n');

    const prompt = `You are an intelligent course recommendation engine for a cybersecurity learning platform (similar to HackTheBox / TryHackMe).

Student Profile:
- Name: ${studentName || 'Student'}
- Enrolled Courses: ${enrollmentSummary.map(e => e.course).join(', ') || 'None yet'}
- Modules Completed: ${completedCount}
- Modules In Progress: ${inProgressCount}
- Module Details: ${progressSummary.map(p => `${p.module} (${p.status})`).join(', ') || 'None'}

Available Learning Paths on the platform:
${availablePathsList || 'None listed'}

Available Rooms/Labs on the platform:
${availableRoomsList || 'None listed'}

Based on this student's history and the available content, provide 3-5 highly personalized recommendations. Consider:
1. What topics they've been studying (infer from course/module names)
2. Natural next steps in their learning progression
3. Skill gaps they might want to fill
4. Difficulty progression (don't recommend advanced if they're still beginner)
5. Variety — mix paths and specific rooms/labs

Return a JSON object with:
{
  "summary": "2-3 sentence analysis of the student's current learning pattern and strengths",
  "recommendations": [
    {
      "type": "path" | "room" | "topic",
      "title": "Name of the recommendation",
      "reason": "Why this is recommended for this student specifically (1-2 sentences)",
      "priority": "high" | "medium" | "low",
      "category": "category label (e.g. web_hacking, linux, etc.)",
      "difficulty": "beginner" | "intermediate" | "advanced" | "easy" | "medium" | "hard"
    }
  ]
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                title: { type: 'string' },
                reason: { type: 'string' },
                priority: { type: 'string' },
                category: { type: 'string' },
                difficulty: { type: 'string' },
              },
            },
          },
        },
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});