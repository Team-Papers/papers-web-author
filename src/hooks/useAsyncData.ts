import { useEffect, useState } from 'react';

/**
 * Charge une donnée asynchrone et ignore les réponses devenues obsolètes.
 *
 * Cinq écrans chargeaient leurs données dans un `useEffect` sans annulation.
 * Quand l'effet se relance — une frappe dans la recherche, un changement
 * d'onglet — rien ne garantit l'ordre des réponses : celle lancée en premier
 * peut revenir en dernier et écraser un résultat plus récent. L'auteur voit
 * alors une liste qui ne correspond pas à ce qu'il a demandé.
 *
 * Le garde tient en trois lignes, mais écrit cinq fois il aurait divergé cinq
 * fois. C'est le motif qui a déjà coûté cher à ce projet : une logique correcte
 * écrite à un seul endroit et jamais partagée.
 *
 * On ignore la réponse plutôt que d'abandonner la requête : le contrat des
 * fonctions de `lib/api` ne prend pas d'`AbortSignal`, et une requête déjà
 * partie ne coûte que sa bande passante. Ce qui compte est qu'elle n'écrive
 * plus dans un état qui ne la concerne plus.
 */
export function useAsyncData<T>(
  charger: () => Promise<T>,
  deps: unknown[],
  valeurInitiale: T,
  // `setData` est expose parce que plusieurs ecrans reecrivent la donnee apres
  // une action de l'utilisateur — soumettre un livre, le depublier. Sans lui,
  // ces ecrans devraient garder leur propre `useState` a cote du hook et la
  // garde d'obsolescence serait a nouveau ecrite a la main.
): { data: T; loading: boolean; setData: React.Dispatch<React.SetStateAction<T>> } {
  const [data, setData] = useState<T>(valeurInitiale);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let obsolete = false;
    setLoading(true);

    charger()
      .then((resultat) => {
        if (obsolete) return;
        setData(resultat);
      })
      .catch(() => {
        // L'appelant decide de son repli via `valeurInitiale` ; une erreur ne
        // doit pas laisser l'ecran bloque sur un indicateur de chargement.
      })
      .finally(() => {
        if (obsolete) return;
        setLoading(false);
      });

    return () => {
      obsolete = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, setData };
}
