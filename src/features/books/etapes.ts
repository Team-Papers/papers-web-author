/**
 * Les cinq étapes de l'assistant, dites par ce qu'elles demandent.
 *
 * « Informations », « Détails », « Résumé » nommaient des rubriques de
 * formulaire. Un auteur ne sait pas ce qu'on attend de lui sous « Détails » ;
 * il sait répondre à « Ce qu'il faut savoir ». Chaque étape porte donc une
 * question, et une phrase qui dit si elle est obligatoire.
 *
 * La liste vit ici, hors des deux écrans qui l'emploient : publier et
 * modifier suivent le même chemin, et deux copies auraient fini par ne plus
 * dire la même chose au même rang.
 */
export interface Etape {
  /** Le titre de l'écran, et le mot de la pastille. */
  label: string;
  /** Ce que l'étape demande, en une question. */
  demande: string;
  /** Faux quand on peut passer et y revenir plus tard. */
  requis: boolean;
}

export const ETAPES_DU_LIVRE: readonly Etape[] = [
  { label: 'Le livre', demande: 'De quoi parle-t-il, et combien coûte-t-il ?', requis: true },
  { label: 'Les détails', demande: 'Langue, nombre de pages, ISBN.', requis: false },
  { label: 'La couverture', demande: "C'est elle qu'on voit d'abord.", requis: false },
  { label: 'Le fichier', demande: 'Le manuscrit, en PDF ou ePub.', requis: false },
  { label: 'Relecture', demande: 'Vérifiez avant d’enregistrer.', requis: true },
];
