/**
 * La raison donnée par le serveur, ou un message générique en dernier recours.
 *
 * Renvoyer un texte maison à la place efface ce que l'API explique — deux
 * épisodes au même rang, le livre d'un autre auteur — et c'est précisément ce
 * qui permet à l'auteur de corriger. La leçon vient de l'espace auteur, où un
 * `catch` affichait « Erreur lors du retrait » en jetant la raison exacte.
 */
export function messageDe(erreur: unknown): string {
  const reponse = (erreur as { response?: { data?: { message?: string } } })?.response;
  return reponse?.data?.message ?? "Cette action n'a pas abouti.";
}
