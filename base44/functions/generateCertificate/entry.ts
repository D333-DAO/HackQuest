import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { quiz_title, score, attempt_date } = body;

    if (!quiz_title || score === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create PDF document (landscape)
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background gradient effect (subtle)
    doc.setFillColor(15, 25, 35);
    doc.rect(0, 0, width, height, 'F');

    // Decorative border
    doc.setDrawColor(163, 230, 53);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, width - 20, height - 20);

    doc.setLineWidth(0.3);
    doc.rect(12, 12, width - 24, height - 24);

    // Top decorative line
    doc.setDrawColor(163, 230, 53);
    doc.setLineWidth(1.5);
    doc.line(10, 35, width - 10, 35);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(163, 230, 53);
    doc.text('CERTIFICATE OF ACHIEVEMENT', width / 2, 50, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(200, 213, 219);
    doc.text('TryHackMe Security Training', width / 2, 60, { align: 'center' });

    // Decorative line
    doc.setDrawColor(163, 230, 53);
    doc.setLineWidth(0.5);
    doc.line(50, 68, width - 50, 68);

    // Main content section
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(225, 232, 240);

    doc.text('This is to certify that', width / 2, 85, { align: 'center' });

    // User name (prominent)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(163, 230, 53);
    doc.text(user.full_name || user.email, width / 2, 105, { align: 'center' });

    // Achievement text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(225, 232, 240);
    doc.text('has successfully completed the quiz:', width / 2, 125, { align: 'center' });

    // Quiz title (prominent)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(96, 165, 250);
    const maxWidth = width - 40;
    const quizTitleLines = doc.splitTextToSize(quiz_title, maxWidth);
    doc.text(quizTitleLines, width / 2, 140, { align: 'center' });

    // Score display
    const scoreY = quizTitleLines.length > 1 ? 160 : 150;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 213, 219);
    doc.text(`with a score of ${Math.round(score)}%`, width / 2, scoreY + 15, { align: 'center' });

    // Date
    const dateStr = attempt_date
      ? new Date(attempt_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Awarded on ${dateStr}`, width / 2, scoreY + 35, { align: 'center' });

    // Bottom decorative line
    doc.setDrawColor(163, 230, 53);
    doc.setLineWidth(0.5);
    doc.line(50, scoreY + 50, width - 50, scoreY + 50);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('TryHackMe | Cybersecurity Training Platform', width / 2, height - 15, { align: 'center' });

    // Generate filename
    const sanitizedTitle = quiz_title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `Certificate_${sanitizedTitle}_${user.email.split('@')[0]}.pdf`;

    // Get PDF as data URL
    const pdfData = doc.output('arraybuffer');

    return new Response(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});