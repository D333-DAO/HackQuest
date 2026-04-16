import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const { data, event } = body;

    if (!data?.student_email) {
      return Response.json({ skipped: true, reason: 'No student email on record' });
    }

    const isNew = event?.type === 'create';
    const subject = isNew
      ? `You're enrolled in ${data.course_title || 'a new course'}!`
      : `Your enrollment in ${data.course_title || 'your course'} has been updated`;

    const body_html = isNew
      ? `
        <h2>Welcome, ${data.student_name || 'Student'}!</h2>
        <p>You have been successfully enrolled in <strong>${data.course_title || 'your course'}</strong>.</p>
        <p><strong>Enrollment Date:</strong> ${data.enrollment_date || 'N/A'}</p>
        <p>Log in to HackQuest to start learning. Good luck!</p>
        <br/>
        <p style="color:#888;font-size:12px;">This is an automated notification from HackQuest.</p>
      `
      : `
        <h2>Enrollment Update, ${data.student_name || 'Student'}!</h2>
        <p>Your enrollment record for <strong>${data.course_title || 'your course'}</strong> has been updated.</p>
        <p><strong>Enrollment Date:</strong> ${data.enrollment_date || 'N/A'}</p>
        <p>Log in to HackQuest to check your progress.</p>
        <br/>
        <p style="color:#888;font-size:12px;">This is an automated notification from HackQuest.</p>
      `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.student_email,
      subject,
      body: body_html,
      from_name: 'HackQuest',
    });

    return Response.json({ sent: true, to: data.student_email, subject });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});