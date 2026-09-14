import { BookStatus } from '@/types/models';

/**
 * L'etat d'un manuscrit, dit d'une seule facon dans toute l'application.
 *
 * Ce qui occupe un auteur, ce n'est pas son catalogue : c'est de savoir ou en
 * est chaque manuscrit. Brouillon, envoye, en examen, paru, refuse. Cet etat
 * est donc le squelette de l'interface — pas une etiquette posee dessus.
 *
 * Chaque etat porte trois choses : un mot, une couleur, et ce qu'il faut faire
 * ensuite. La derniere est la plus utile : un auteur qui voit « Refuse » veut
 * surtout savoir qu'il peut corriger et renvoyer.
 */
export interface Etat {
  /** Ce que l'auteur lit. */
  mot: string;
  /** La couleur de la tranche. Un jeton, jamais une valeur ecrite sur place. */
  teinte: string;
  /** Ce qui l'attend, quand quelque chose l'attend. */
  suite: string | null;
  /** Vrai quand l'auteur doit agir : la tranche se met alors a compter. */
  vousAttend: boolean;
}

const ETATS: Record<BookStatus, Etat> = {
  [BookStatus.DRAFT]: {
    mot: 'Brouillon',
    teinte: 'var(--color-etat-brouillon)',
    suite: 'À compléter et envoyer',
    vousAttend: true,
  },
  [BookStatus.PENDING]: {
    mot: 'En examen',
    teinte: 'var(--color-etat-examen)',
    // Rien a faire : le dire evite d'attendre en se demandant si on a oublie
    // quelque chose.
    suite: 'Notre équipe le relit',
    vousAttend: false,
  },
  [BookStatus.APPROVED]: {
    mot: 'Accepté',
    teinte: 'var(--color-etat-programme)',
    suite: 'Paraît bientôt',
    vousAttend: false,
  },
  [BookStatus.PUBLISHED]: {
    mot: 'En ligne',
    teinte: 'var(--color-etat-paru)',
    suite: null,
    vousAttend: false,
  },
  [BookStatus.REJECTED]: {
    mot: 'Refusé',
    teinte: 'var(--color-etat-refuse)',
    // Un refus sans suite est un mur. Il y en a toujours une.
    suite: 'Voir le motif et corriger',
    vousAttend: true,
  },
};

export function etatDe(statut: BookStatus | string | null | undefined): Etat {
  return ETATS[statut as BookStatus] ?? ETATS[BookStatus.DRAFT];
}

/** Les manuscrits qui demandent quelque chose, dans l'ordre de l'urgence. */
export function ceQuiVousAttend<T extends { status: BookStatus | string }>(livres: T[]): T[] {
  const rang: Record<string, number> = {
    [BookStatus.REJECTED]: 0,
    [BookStatus.DRAFT]: 1,
  };

  return livres
    .filter((livre) => etatDe(livre.status).vousAttend)
    .sort((a, b) => (rang[a.status] ?? 9) - (rang[b.status] ?? 9));
}
