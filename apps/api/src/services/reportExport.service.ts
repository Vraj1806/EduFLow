import type { AttendanceReport } from '@eduflow/shared';
import PDFDocument from 'pdfkit';

/**
 * Report Export Service
 *
 * Serializes an attendance report into CSV (a UTF-8 string with a BOM so Excel
 * renders the header correctly) or PDF (via pdfkit, no browser dependency).
 * Both are pure functions of the report data, so they are trivially testable.
 */

function csvCell(value: string | number | null): string {
  const s = value === null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function attendanceReportToCsv(report: AttendanceReport): string {
  const header = ['Date', 'Student', 'Roll Number', 'Student ID', 'Status', 'Confidence'];
  const lines = [header.map(csvCell).join(',')];

  for (const row of report.rows) {
    lines.push(
      [
        new Date(row.date).toISOString().slice(0, 10),
        row.name,
        row.rollNumber,
        row.studentId,
        row.status,
        row.confidence === null ? '' : row.confidence.toFixed(3),
      ]
        .map(csvCell)
        .join(','),
    );
  }

  // Summary block after the data rows.
  lines.push('');
  lines.push(['Summary', '', '', '', '', ''].map(csvCell).join(','));
  lines.push(['Total students', report.summary.totalStudents].map(csvCell).join(','));
  lines.push(['Total sessions', report.summary.totalSessions].map(csvCell).join(','));
  lines.push(['Present', report.summary.present].map(csvCell).join(','));
  lines.push(['Absent', report.summary.absent].map(csvCell).join(','));
  lines.push(['Excused', report.summary.excused].map(csvCell).join(','));
  lines.push([
    'Attendance %',
    report.summary.percentage === null ? '' : report.summary.percentage.toFixed(1),
  ].map(csvCell).join(','));

  // BOM helps Excel detect UTF-8.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function attendanceReportToPdf(report: AttendanceReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', margin: 48 });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0B0F14').text('EduFlow — Attendance Report', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9).fillColor('#6B7280').text(`Generated ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(0.8);

    // Summary
    const summary = [
      ['Total students', String(report.summary.totalStudents)],
      ['Total sessions', String(report.summary.totalSessions)],
      ['Present', String(report.summary.present)],
      ['Absent', String(report.summary.absent)],
      ['Excused', String(report.summary.excused)],
      ['Attendance %', report.summary.percentage === null ? '—' : `${report.summary.percentage.toFixed(1)}%`],
    ];
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B0F14').text('Summary');
    doc.moveDown(0.3);
    for (const [label, value] of summary) {
      doc.font('Helvetica').fontSize(9).fillColor('#374151');
      doc.text(`${label}: ${value}`, { continued: false });
    }
    doc.moveDown(0.8);

    // Table
    const tableTop = doc.y;
    const colWidths = [70, 150, 60, 60, 60, 70];
    const headers = ['Date', 'Student', 'Roll No', 'Student ID', 'Status', 'Confidence'];
    const startX = 48;
    const rowHeight = 18;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    let x = startX;
    headers.forEach((header, i) => {
      doc.rect(x, tableTop, colWidths[i]!, 22).fill('#FF7A3D');
      doc.fillColor('#FFFFFF').text(header, x + 4, tableTop + 6, { width: colWidths[i]! - 8 });
      x += colWidths[i]!;
    });

    let y = tableTop + 22;
    const stripe = '#F6F7F8';

    for (const row of report.rows) {
      // Page break when running low on space.
      if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      const cells = [
        new Date(row.date).toISOString().slice(0, 10),
        row.name,
        row.rollNumber,
        row.studentId,
        row.status,
        row.confidence === null ? '—' : `${(row.confidence * 100).toFixed(0)}%`,
      ];

      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(stripe);
      x = startX;
      doc.font('Helvetica').fontSize(8.5).fillColor('#111827');
      cells.forEach((cell, i) => {
        doc.text(cell, x + 4, y + 5, { width: colWidths[i]! - 8 });
        x += colWidths[i]!;
      });

      y += rowHeight;
    }

    // Footer note when no data.
    if (report.rows.length === 0) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#6B7280').text('No attendance records match the selected filters.');
    }

    doc.end();
  });
}
