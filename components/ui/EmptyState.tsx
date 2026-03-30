import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-300 bg-slate-50/80">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-slate-500 shadow-sm">
          {icon ?? '...'}
        </div>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="max-w-md">{description}</CardDescription>
        </div>
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}

