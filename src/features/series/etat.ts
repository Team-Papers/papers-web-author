/** Le mot et la teinte d'une série, sur le modèle de l'état d'un manuscrit. */
export function etatDeSerie(serie: { completed: boolean }) {
  return serie.completed
    ? { mot: 'Terminée', teinte: 'var(--color-etat-paru)' }
    : { mot: 'En cours', teinte: 'var(--color-etat-programme)' };
}
