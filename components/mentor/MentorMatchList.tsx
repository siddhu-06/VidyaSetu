import { EmptyState } from '@/components/ui/EmptyState';
import { MentorMatchCard } from '@/components/mentor/MentorMatchCard';
import type { LegacyMentorMatchResult as MentorMatchResult } from '@/types';

interface MentorMatchListProps {
  matches: MentorMatchResult[];
}

export function MentorMatchList({ matches }: MentorMatchListProps) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No mentor matches yet"
        description="Choose a student to see the five-signal ranking engine in action."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {matches.map((match) => (
        <MentorMatchCard key={match.mentor.id} match={match} />
      ))}
    </div>
  );
}
