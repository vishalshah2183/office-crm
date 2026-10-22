export function formatCurrency(amount?: number | string): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

export function getStatusBadgeStyle(status?: string): { label: string; className: string } {
  if (!status) return { label: 'UNKNOWN', className: 'bg-slate-800 text-slate-300 border-slate-700' };

  const formatted = status.toUpperCase().replace(/_/g, ' ');

  switch (status.toUpperCase()) {
    case 'COMPLETED':
    case 'ACTIVE':
    case 'FINAL':
    case 'APPROVED':
      return {
        label: formatted,
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'DRAWING_IN_PROGRESS':
    case 'IN_PROGRESS':
    case 'REVIEW':
    case 'PENDING_APPROVAL':
      return {
        label: formatted,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    case 'DRAFT':
    case 'NEW':
    case 'INITIATED':
      return {
        label: formatted,
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
    case 'INACTIVE':
    case 'REJECTED':
    case 'CANCELLED':
    case 'DEACTIVATED':
      return {
        label: formatted,
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    default:
      return {
        label: formatted,
        className: 'bg-slate-700/50 text-slate-300 border-slate-600',
      };
  }
}
