export type StatusVariant = 'success' | 'info' | 'warning' | 'destructive' | 'muted' | 'secondary';

const LABELS: Record<string, string> = {
  accepted: 'Won',
  submitted: 'Pending',
  rejected: 'Not accepted',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
};

export function bidStatusLabel(status: string): string {
  return LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export function bidStatusVariant(status: string): StatusVariant {
  if (status === 'accepted') return 'success';
  if (status === 'rejected') return 'destructive';
  if (status === 'submitted') return 'info';
  return 'muted';
}
