import { BookStatus } from '@/types/models';

/**
 * Le calendrier d'une série, calculé sur place avant de le demander au serveur.
 *
 * L'auteur choisit un départ et un pas ; il doit voir les dates qui en
 * résultent *avant* de confirmer, sinon il découvre après coup que le
 * chapitre 6 sort à Noël. Le calcul reprend la règle du serveur — premier
 * épisode non paru au départ, puis un tous les N jours dans l'ordre des
 * numéros — et les mêmes exclusions : un épisode refusé n'est pas programmé,
 * un épisode en examen est laissé à l'administration. Le serveur reste la
 * référence ; ici on ne fait que l'annoncer.
 */

export interface EpisodeACalendrier {
  id: string;
  title: string;
  episodeNumber: number | null;
  paru: boolean;
}

export type LigneDeCalendrier =
  | { episode: EpisodeACalendrier; sort: 'programme'; publishAt: Date }
  | { episode: EpisodeACalendrier; sort: 'refuse' | 'en-examen' };

/**
 * `statuts` vient de la liste des livres de l'auteur : la fiche de la série
 * ne porte pas le statut d'un épisode (le lecteur n'a pas à le connaître),
 * mais ses livres, si.
 */
export function calendrierDeSortie(
  episodes: EpisodeACalendrier[],
  statuts: Map<string, BookStatus>,
  depart: Date,
  tousLesJours: number,
): LigneDeCalendrier[] {
  const pas = tousLesJours * 24 * 3600 * 1000;
  const aVenir = episodes
    .filter((e) => !e.paru)
    .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0));

  let rang = 0;
  return aVenir.map((episode) => {
    const statut = statuts.get(episode.id);
    if (statut === BookStatus.REJECTED) return { episode, sort: 'refuse' };
    if (statut === BookStatus.PENDING) return { episode, sort: 'en-examen' };
    const publishAt = new Date(depart.getTime() + rang * pas);
    rang += 1;
    return { episode, sort: 'programme', publishAt };
  });
}

/** Demain à 8 h, au format d'un champ `datetime-local` (heure locale, sans fuseau). */
export function demainHuitHeures(maintenant = new Date()): string {
  const d = new Date(maintenant);
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return valeurLocale(d);
}

/** Une date au format `YYYY-MM-DDTHH:mm`, ce que lit un champ `datetime-local`. */
export function valeurLocale(d: Date): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

/** « mer. 1 octobre, 08:00 » : le jour et l'heure, ce que l'auteur vérifie d'un coup d'œil. */
export function jourEtHeure(d: Date): string {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
