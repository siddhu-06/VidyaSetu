'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { generateCSRReport } from '@/lib/pdf/csrReport';
import type { DashboardStats, SessionRecord, Student } from '@/types';

interface CSRReportButtonProps {
  stats: DashboardStats;
  students: Student[];
  sessions: SessionRecord[];
}

export function CSRReportButton({ stats, students, sessions }: CSRReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate(): Promise<void> {
    try {
      setIsGenerating(true);
      generateCSRReport(stats, students, sessions);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      isLoading={isGenerating}
      onClick={() => void handleGenerate()}
    >
      Generate CSR Report
    </Button>
  );
}
