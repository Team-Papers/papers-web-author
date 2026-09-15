import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Le chemin de l'assistant, et l'endroit où l'on en est.
 *
 * L'assistant ne disait que « Étape 3 sur 5 » et montrait une barre. Un
 * auteur y apprenait sa position et rien d'autre : ni ce qui vient après —
 * faut-il prévoir la couverture maintenant ? — ni comment revenir corriger le
 * prix sans repasser par deux écrans.
 *
 * C'est une rangée, pas cinq pastilles de 48 px reliées par des traits :
 * celles-là mangeaient un quart d'un écran de téléphone pour répéter ce que
 * trois mots disaient, et c'est pour cela qu'elles avaient disparu. Une
 * rangée d'étiquettes qui défile tient sur une seule ligne de 44 px — la
 * hauteur tenable au doigt — et en dit davantage.
 *
 * Une étape qu'on ne peut pas encore atteindre reste visible mais éteinte :
 * savoir qu'elle existe fait partie de ce qu'on est venu chercher ; la
 * masquer rendrait le chemin imprévisible.
 */
export function Etapes({
  etapes,
  courante,
  atteignable,
  onAller,
}: {
  etapes: readonly { label: string }[];
  courante: number;
  /** Vrai quand l'auteur peut sauter directement à cette étape. */
  atteignable: (index: number) => boolean;
  onAller: (index: number) => void;
}) {
  const rangee = useRef<HTMLOListElement>(null);

  // Au cinquième rang, l'étape en cours sort de l'écran d'un téléphone : on
  // la ramène sous les yeux plutôt que de laisser l'auteur chercher où il en
  // est dans une rangée qui a défilé toute seule.
  useEffect(() => {
    const active = rangee.current?.querySelector('[aria-current="step"]');
    active?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [courante]);

  return (
    <ol
      ref={rangee}
      aria-label="Étapes"
      // Les marges négatives laissent la rangée défiler d'un bord à l'autre :
      // une étiquette coupée net par une gouttière ne se lit pas comme « il y
      // en a d'autres à droite ».
      className="scrollbar-hide -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 lg:-mx-2 lg:px-2"
    >
      {etapes.map((etape, index) => {
        const ici = index === courante;
        const ouverte = atteignable(index);

        return (
          <li key={etape.label} className="shrink-0">
            <button
              type="button"
              disabled={!ouverte || ici}
              aria-current={ici ? 'step' : undefined}
              onClick={() => onAller(index)}
              className={cn(
                'flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                ici
                  ? 'bg-primary-container font-semibold text-on-primary-container'
                  : ouverte
                    ? 'font-medium text-primary-lisible hover:bg-surface-container'
                    : // Éteinte : elle existe, elle n'est pas encore à vous.
                      'text-on-surface-muted',
              )}
            >
              <span className="font-display text-xs tabular-nums opacity-70">{index + 1}</span>
              {etape.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
