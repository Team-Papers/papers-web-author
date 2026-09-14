import type { BookStatus } from '@/types/models';
import { etatDe } from './etat';
import { cn } from '@/lib/utils/cn';

/**
 * La tranche d'etat.
 *
 * Un filet vertical colore, colle au bord gauche de la ligne d'un manuscrit.
 * C'est le seul ornement de cette application, et ce n'en est pas un : c'est
 * la seule chose qu'un auteur balaie du regard quand il ouvre l'ecran. Elle
 * se repete a l'identique partout — liste, fiche, tableau de bord — pour que
 * la lecture soit apprise une fois.
 */
export function Tranche({ statut, className }: { statut: BookStatus | string; className?: string }) {
  const etat = etatDe(statut);

  return (
    <span
      aria-hidden
      className={cn('block w-[3px] shrink-0 rounded-full self-stretch', className)}
      style={{ backgroundColor: etat.teinte }}
    />
  );
}

/** Le mot de l'etat, pour les endroits ou la tranche ne suffit pas. */
export function MotDEtat({ statut }: { statut: BookStatus | string }) {
  const etat = etatDe(statut);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: etat.teinte }}
      />
      <span style={{ color: etat.teinte }}>{etat.mot}</span>
    </span>
  );
}
