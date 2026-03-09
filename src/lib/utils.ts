import { formatDistanceStrict, format, differenceInMinutes, differenceInSeconds } from 'date-fns';

export function formatDuration(startDate: string | Date, endDate: string | Date): string {
  return formatDistanceStrict(new Date(startDate), new Date(endDate));
}

export function formatDurationMinutes(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 1) return '<1 min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatTimestamp(timestamp: string | Date): string {
  return format(new Date(timestamp), 'h:mm a');
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function getElapsedMinutes(start: string | Date, end?: string | Date): number {
  return differenceInMinutes(end ? new Date(end) : new Date(), new Date(start));
}

export function getElapsedSeconds(start: string | Date): number {
  return differenceInSeconds(new Date(), new Date(start));
}

export function formatElapsedTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
