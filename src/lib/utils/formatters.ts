import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatMoney, toNumber, type Money } from '@papers/shared';

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

/**
 * Vrai quand un document a été touché après sa création.
 *
 * Une minute de tolérance : l'enregistrement initial écrit les deux dates à
 * quelques millisecondes d'écart, et « Créé le 15 septembre · Modifié le
 * 15 septembre » sur un brouillon qui vient de naître n'apprend rien à
 * personne — c'est du bruit posé à côté d'un fait.
 */
export function aEteModifie(
  createdAt: string | Date,
  updatedAt: string | Date | null | undefined,
): boolean {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}
