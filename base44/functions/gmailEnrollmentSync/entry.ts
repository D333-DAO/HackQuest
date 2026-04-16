import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function decodeBase64(str) {
  // URL-safe base64 decode
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

function getEmailBody(message) {
  const payload = message.payload;
  if (!payload) return '';

  // Try plain text part first, then html
  const findPart = (parts, mimeType) => {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === mimeType && part.body?.data) return part.body.data;
      if (part.parts) {
        const found = findPart(part.parts, mimeType);
        if (found) return found;
      }
    }
    return null;
  };

  const textData = findPart(payload.parts, 'text/plain') || 
                   (payload.mimeType === 'text/plain' ? payload.body?.data : null);
  
  if (textData) return decodeBase64(textData);

  const htmlData = findPart(payload.parts, 'text/html') ||
                   (payload.mimeType === 'text/html' ? payload.body?.data : null);
  
  if (htmlData) {
    // Strip HTML tags for plain text extraction
    return decodeBase64(htmlData).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}

function getHeader(message, name) {
  const headers = message.payload?.headers || [];
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

async function parseEnrollmentWithAI(base44, emailBody, emailSubject, emailFrom, emailDate) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are parsing an email alert for a course enrollment. Extract the following fields from the email content below.

Email Subject: ${emailSubject}
Email From: ${emailFrom}
Email Date: ${emailDate}
Email Body:
${emailBody.slice(0, 3000)}

Extract:
- student_name: Full name of the enrolled student (string, or null if not found)
- course_title: Title of the course they enrolled in (string, or null if not found)
- enrollment_date: Date of enrollment in YYYY-MM-DD format (string, use email date if not explicitly stated, or null)
- student_email: Student's email address if present (string, or null)

Return ONLY valid JSON with these four fields. If a field cannot be determined, set it to null.`,
    response_json_schema: {
      type: "object",
      properties: {
        student_name: { type: "string" },
        course_title: { type: "string" },
        enrollment_date: { type: "string" },
        student_email: { type: "string" }
      }
    }
  });
  return result;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const messageIds = body.data?.new_message_ids ?? [];
    if (messageIds.length === 0) {
      return Response.json({ message: 'No new messages to process' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const results = [];

    for (const messageId of messageIds) {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) continue;

      const message = await res.json();

      const subject = getHeader(message, 'subject');
      const from = getHeader(message, 'from');
      const date = getHeader(message, 'date');
      const body_text = getEmailBody(message);
      const snippet = message.snippet || '';

      // Use AI to extract enrollment info
      const parsed = await parseEnrollmentWithAI(base44, body_text, subject, from, date);

      if (!parsed.student_name && !parsed.course_title) {
        // Skip emails that don't look like enrollment alerts
        results.push({ messageId, status: 'skipped', reason: 'No enrollment data found' });
        continue;
      }

      // Save to CourseEnrollment entity
      const enrollment = await base44.asServiceRole.entities.CourseEnrollment.create({
        student_name: parsed.student_name || 'Unknown Student',
        course_title: parsed.course_title || 'Unknown Course',
        enrollment_date: parsed.enrollment_date || new Date().toISOString().split('T')[0],
        student_email: parsed.student_email || null,
        source_email_id: messageId,
        raw_snippet: snippet.slice(0, 300)
      });

      results.push({ messageId, status: 'saved', enrollmentId: enrollment.id });
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});