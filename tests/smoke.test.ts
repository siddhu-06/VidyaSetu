import { describe, expect, it } from 'vitest';

import { detectLearningGaps } from '@/lib/intelligence/gapDetector';
import { formatDate, toIsoDate } from '@/lib/utils/date';

describe('VidyaSetu smoke checks', () => {
  it('detects arithmetic and reading gaps from session notes', () => {
    const result = detectLearningGaps(
      'Student struggled with subtraction borrowing and reading fluency during paired practice.',
    );

    expect(result.gaps).toContain('arithmetic: subtraction');
    expect(result.gaps).toContain('reading: fluency');
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('formats and normalizes dates for India-friendly displays', () => {
    expect(toIsoDate('2026-03-30T10:15:00.000Z')).toBe('2026-03-30');
    expect(formatDate('2026-03-30T10:15:00.000Z')).toContain('2026');
  });
});

