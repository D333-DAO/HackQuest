import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const rooms = await base44.asServiceRole.entities.Room.list();
  const paths = await base44.asServiceRole.entities.LearningPath.list();

  // Category mapping: which room categories belong to which path titles
  const pathMappings = {
    'Starting Point: Linux Fundamentals': { categories: ['linux'], difficulties: ['easy'] },
    'Windows Exploitation Path': { categories: ['windows'], difficulties: ['easy', 'medium'] },
    'Web Application Hacking': { categories: ['web_hacking'], difficulties: ['easy', 'medium', 'hard'] },
    'Active Directory Attacks': { categories: ['windows'], difficulties: ['medium', 'hard'] },
    'OSCP Preparation Track': { categories: ['linux', 'windows', 'web_hacking'], difficulties: ['medium', 'hard'] },
    'Penetration Testing Fundamentals': { categories: ['linux', 'web_hacking', 'networking'], difficulties: ['easy'] },
    'Network Pentesting & Protocol Attacks': { categories: ['networking'], difficulties: ['easy', 'medium', 'hard'] },
    'Network Penetration Testing': { categories: ['networking'], difficulties: ['easy', 'medium'] },
    'Defensive Security & Blue Team': { categories: ['forensics'], difficulties: ['easy', 'medium', 'hard'] },
    'Burp Suite & Web App Hacking': { categories: ['web_hacking'], difficulties: ['easy', 'medium'] },
  };

  const results = [];

  for (const path of paths) {
    const mapping = pathMappings[path.title];
    if (!mapping) continue;

    const matchingRoomIds = rooms
      .filter(r => 
        mapping.categories.includes(r.category) && 
        mapping.difficulties.includes(r.difficulty)
      )
      .sort((a, b) => {
        const diffOrder = { easy: 0, medium: 1, hard: 2 };
        return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
      })
      .map(r => r.id);

    if (matchingRoomIds.length > 0) {
      await base44.asServiceRole.entities.LearningPath.update(path.id, { room_ids: matchingRoomIds });
      results.push({ path: path.title, roomCount: matchingRoomIds.length });
    }
  }

  return Response.json({ success: true, results });
});