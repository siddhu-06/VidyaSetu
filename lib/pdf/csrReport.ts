import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { formatDateTime } from '@/lib/utils/date';
import type { CSRReportData } from '@/types';

interface AutoTableDocument extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export function buildCSRReportDocument(report: CSRReportData): jsPDF {
  const document = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });
  const tableDocument = document as AutoTableDocument;

  document.setFillColor(8, 47, 73);
  document.rect(0, 0, document.internal.pageSize.getWidth(), 120, 'F');
  document.setTextColor(255, 255, 255);
  document.setFontSize(24);
  document.text(report.ngoName, 40, 50);
  document.setFontSize(13);
  document.text(`CSR Progress Report for ${report.donorName}`, 40, 75);
  document.text(`Generated ${formatDateTime(report.generatedAt)}`, 40, 95);

  document.setTextColor(17, 24, 39);
  document.setFontSize(16);
  document.text(`Reporting Window: ${report.reportingWindow}`, 40, 150);

  autoTable(document, {
    startY: 170,
    head: [['Metric', 'Value']],
    body: [
      ['Active students', String(report.stats.activeStudents)],
      ['Active mentors', String(report.stats.activeMentors)],
      ['Sessions this week', String(report.stats.sessionsThisWeek)],
      ['High risk students', String(report.stats.highRiskStudents)],
      ['Parent SMS responses', String(report.stats.parentResponses)],
      ['Average attendance', `${report.stats.averageAttendance}%`],
    ],
    headStyles: {
      fillColor: [22, 101, 52],
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
    },
  });

  autoTable(document, {
    startY: (tableDocument.lastAutoTable?.finalY ?? 210) + 24,
    head: [['Locality', 'Grade', 'Risk cases', 'Students tracked']],
    body: report.heatmap.map((cell) => [
      cell.locality,
      cell.grade,
      String(cell.riskCount),
      String(cell.totalStudents),
    ]),
    headStyles: {
      fillColor: [180, 83, 9],
    },
    styles: {
      fontSize: 10,
      cellPadding: 7,
    },
  });

  document.addPage();
  document.setFontSize(18);
  document.text('Volunteer Momentum', 40, 50);

  autoTable(document, {
    startY: 70,
    head: [['Rank', 'Mentor', 'Sessions', 'Consistency', 'Average growth']],
    body: report.leaderboard.map((entry) => [
      String(entry.rank),
      entry.mentorName,
      String(entry.sessionsCompleted),
      `${entry.consistencyScore}%`,
      `${entry.averageStudentGrowth}%`,
    ]),
    headStyles: {
      fillColor: [29, 78, 216],
    },
    styles: {
      fontSize: 10,
      cellPadding: 7,
    },
  });

  document.setFontSize(18);
  document.text('Impact Stories', 40, (tableDocument.lastAutoTable?.finalY ?? 70) + 36);

  let currentY = (tableDocument.lastAutoTable?.finalY ?? 70) + 60;

  report.stories.forEach((story) => {
    document.setFontSize(13);
    document.text(`${story.studentName}: ${story.title}`, 40, currentY);
    document.setFontSize(11);
    const wrappedBody = document.splitTextToSize(story.body, 500);
    document.text(wrappedBody, 40, currentY + 18);
    currentY += 22 + wrappedBody.length * 14;
  });

  return document;
}

export function downloadCSRReport(report: CSRReportData, fileName = 'vidyasetu-csr-report.pdf'): void {
  const document = buildCSRReportDocument(report);
  document.save(fileName);
}

