'use client';

import { Button } from '@/components/ui/Button';
import { downloadCSRReport } from '@/lib/pdf/csrReport';
import type { CSRReportData } from '@/types';

interface CSRReportButtonProps {
  data: CSRReportData;
}

export function CSRReportButton({ data }: CSRReportButtonProps) {
  return (
    <Button variant="secondary" onClick={() => downloadCSRReport(data)}>
      Export CSR PDF
    </Button>
  );
}

