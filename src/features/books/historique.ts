import { formatCurrency } from '@/lib/utils/formatters';

/**
 * Une modification, dite en français.
 *
 * L'historique arrive du serveur avec les noms des colonnes : `fileUrl`,
 * `coverUrl`, `previewPercent`. Un auteur n'a jamais vu ces mots ; il a
 * remplacé un fichier et changé une couverture. Traduire n'est pas de
 * l'habillage : un journal qu'on ne comprend pas ne se lit pas, et ne sert
 * donc à rien.
 *
 * Un champ inconnu est passé sous silence plutôt qu'affiché tel quel. Le jour
 * où le serveur en suivra un de plus, l'auteur ne verra pas apparaître un mot
 * anglais dans son atelier.
 */

export type ValeurDeChamp = string | number | boolean | null | string[];

export interface Changement {
  avant: ValeurDeChamp;
  apres: ValeurDeChamp;
}

export interface Revision {
  id: string;
  changedAt: string;
  changes: Record<string, Changement>;
  changedBy: { id: string; firstName: string | null; lastName: string | null } | null;
}

/** Ce que chaque champ suivi veut dire pour l'auteur. */
const NOMS: Record<string, string> = {
  title: 'titre',
  description: 'description',
  price: 'prix',
  isbn: 'ISBN',
  language: 'langue',
  pageCount: 'nombre de pages',
  coverUrl: 'couverture',
  fileUrl: 'fichier',
  fileFormat: 'format du fichier',
  fileSize: 'taille du fichier',
  previewPercent: 'extrait gratuit',
  categories: 'catégories',
};

/**
 * Les champs dont la valeur vaut la peine d'être montrée.
 *
 * « prix : 0 F → 500 F » répond à la question. « description : Trois amis,
 * une ville… → Trois amis, une ville… » l'enterre sous deux paragraphes, et
 * « couverture : a3f9.jpg → 8c21.jpg » ne dit rien à personne : ce sont des
 * noms de fichiers que l'auteur n'a jamais choisis.
 */
const LANGUES: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  es: 'espagnol',
  de: 'allemand',
  pt: 'portugais',
};

function valeurLisible(champ: string, valeur: ValeurDeChamp): string {
  if (valeur === null || valeur === '') return 'rien';
  if (champ === 'price') return formatCurrency(Number(valeur));
  if (champ === 'language') return LANGUES[String(valeur)] ?? String(valeur);
  if (champ === 'previewPercent') return `${valeur} %`;
  if (Array.isArray(valeur)) return valeur.length > 0 ? valeur.join(', ') : 'aucune';
  return String(valeur);
}

const AVEC_LES_VALEURS = new Set([
  'price',
  'pageCount',
  'language',
  'isbn',
  'previewPercent',
  'title',
  'categories',
]);

/** « prix : 0 F → 500 F », ou simplement « description ». */
export function decrire(champ: string, changement: Changement): string | null {
  const nom = NOMS[champ];
  if (!nom) return null;

  if (!AVEC_LES_VALEURS.has(champ)) return nom;

  return `${nom} : ${valeurLisible(champ, changement.avant)} → ${valeurLisible(champ, changement.apres)}`;
}

/** Tout ce qu'une modification a touché, en une phrase. */
export function resumeDe(revision: Revision): string {
  return Object.entries(revision.changes)
    .map(([champ, changement]) => decrire(champ, changement))
    .filter((phrase): phrase is string => phrase !== null)
    .join(' · ');
}
