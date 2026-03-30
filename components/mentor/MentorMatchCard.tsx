import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { MentorMatchResult } from '@/types';

interface MentorMatchCardProps {
  match: MentorMatchResult;
}

export function MentorMatchCard({ match }: MentorMatchCardProps) {
  return (
    <Card className={match.recommended ? 'border-emerald-300' : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{match.mentor.fullName}</CardTitle>
            <CardDescription>{match.rationale}</CardDescription>
          </div>
          <Badge tone={match.recommended ? 'success' : 'info'}>{match.totalScore}% fit</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {match.signals.map((signal) => (
          <div key={signal.key} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{signal.label}</p>
              <span className="text-sm text-slate-600">{signal.score}%</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{signal.reason}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

