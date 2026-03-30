const defaultLocale = 'en-IN';

export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = defaultLocale,
): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = defaultLocale,
): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}

export function formatRelativeDate(value: string | Date, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  }

  if (diffInDays === -1) {
    return 'Yesterday';
  }

  if (diffInDays === 1) {
    return 'Tomorrow';
  }

  if (Math.abs(diffInDays) < 7) {
    return new Intl.RelativeTimeFormat(defaultLocale, { numeric: 'auto' }).format(
      diffInDays,
      'day',
    );
  }

  return formatDate(date);
}

export function getStartOfWeek(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  const currentDay = date.getDay();
  const distance = currentDay === 0 ? -6 : 1 - currentDay;

  date.setDate(date.getDate() + distance);
  date.setHours(0, 0, 0, 0);

  return date;
}

export function toIsoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function isSameWeek(left: string | Date, right: string | Date): boolean {
  return getStartOfWeek(left).toISOString() === getStartOfWeek(right).toISOString();
}

