import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatMoney, toNumber, type Money } from '@team-papers/shared';

/**
 * Accepts Money, not number: Prisma serialises Decimal columns as JSON
 * strings, so prices and balances arrive as "10000". The shared helper also
 * uses XAF — Cameroon is CEMAC — where this used XOF.
 */
export function formatCurrency(amount: Money | null | undefined): string {
  return formatMoney(amount);
}

/** For arithmetic and chart values, where a string would silently break maths. */
export { toNumber };

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}
