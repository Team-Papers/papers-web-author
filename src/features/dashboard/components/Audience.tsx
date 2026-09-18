import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { getMyAudience, type Audience as AudienceLue, type LigneDAudience } from '@/lib/api/authors';

/**
 * Ce qui attire.
 *
 * L'auteur savait ce qu'il avait gagne ; il ne savait pas ce qu'on regardait.
 * `views` existait sur un livre, mais c'est un compteur a vie : il ne dit rien
 * de ce qui s'est passe depuis le lancement d'une publicite mardi, et les
 * series n'en avaient aucun — alors que ce sont elles que les annonces visent.
 *
 * Deux colonnes, et il ne faut jamais les confondre : les visites disent
 * combien de gens sont arrives, les lectures disent combien sont restes. Une
 * publicite peut gonfler la premiere sans rien changer a la seconde, et c'est
 * exactement ce qu'il faut voir avant de remettre de l'argent dedans.
 */
export function Audience() {
  const [audience, setAudience] = useState<AudienceLue | null>(null);
  const [jours, setJours] = useState(30);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let abandonne = false;
    setChargement(true);
    getMyAudience(jours)
      .then((a) => {
        if (!abandonne) setAudience(a);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!abandonne) setChargement(false);
      });
    return () => {
      abandonne = true;
    };
  }, [jours]);

  if (chargement && !audience) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!audience) return null;

  const oeuvres = [
    ...audience.series.map((s) => ({ ...s, genre: 'serie' as const })),
    ...audience.livres.map((l) => ({ ...l, genre: 'livre' as const })),
  ]
    .filter((o) => o.visites > 0 || o.pagesLues > 0)
    .sort((a, b) => b.visites - a.visites || b.pagesLues - a.pagesLues);

  const total = audience.parJour.reduce((n, j) => n + j.visites, 0);
  const plafond = Math.max(1, ...audience.parJour.map((j) => j.visites));

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-on-surface-variant">Ce qui attire</h2>
          <p className="mt-0.5 text-xs text-on-surface-muted">
            Les visites disent combien de gens sont arrivés. Les lectures, combien sont restés.
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Période observée">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setJours(n)}
              aria-pressed={jours === n}
              className={
                jours === n
                  ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-lg border border-outline px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-dim'
              }
            >
              {n} j
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-outline bg-surface px-5 py-8 text-center text-sm text-on-surface-variant">
          Personne n'est encore passé sur cette période. Partagez l'adresse de votre page d'auteur
          ou d'une série : c'est là que les visites se comptent.
        </p>
      ) : (
        <>
          <Courbe jours={audience.parJour} plafond={plafond} total={total} />
          {audience.sources.length > 0 && <Provenances sources={audience.sources} total={total} />}
          <ol className="mt-4 flex flex-col gap-2">
            {oeuvres.map((o) => (
              <li key={`${o.genre}-${o.id}`}>
                <LigneOeuvre ligne={o} genre={o.genre} plafond={oeuvres[0]?.visites ?? 1} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/**
 * Les visites jour par jour.
 *
 * Des barres plutot qu'une courbe : sur trente points dont la moitie valent
 * zero, une ligne brisee se lit moins bien qu'un peigne, et c'est le jour de
 * la parution qu'on cherche des yeux.
 */
function Courbe({
  jours,
  plafond,
  total,
}: {
  jours: Array<{ jour: string; visites: number }>;
  plafond: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-outline bg-surface p-4">
      <p className="font-display text-2xl font-semibold tabular-nums text-on-surface">
        {total}
        <span className="ml-1.5 font-sans text-sm font-normal text-on-surface-muted">
          {total === 1 ? 'visite' : 'visites'}
        </span>
      </p>
      <div className="mt-3 flex h-16 items-end gap-[2px]" aria-hidden>
        {jours.map((j) => (
          <span
            key={j.jour}
            title={`${j.jour} · ${j.visites}`}
            className="flex-1 rounded-sm bg-primary/70"
            style={{ height: `${Math.max(2, (j.visites / plafond) * 100)}%` }}
          />
        ))}
      </div>
      <p className="mt-1.5 flex justify-between text-[11px] text-on-surface-muted">
        <span>{jours[0]?.jour}</span>
        <span>{jours.at(-1)?.jour}</span>
      </p>
    </div>
  );
}

/**
 * D'ou viennent les visiteurs.
 *
 * « direct » couvre tout ce qui arrive sans provenance connue : un lien
 * partage, un signet, une adresse tapee. La part qu'il occupe est elle-meme
 * une information — sans elle, on croirait que toute l'audience vient des
 * publicites.
 */
function Provenances({
  sources,
  total,
}: {
  sources: Array<{ source: string; visites: number }>;
  total: number;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {sources.map((s) => (
        <li
          key={s.source}
          className="rounded-lg border border-outline bg-surface px-3 py-1.5 text-xs text-on-surface-variant"
        >
          <span className="font-medium text-on-surface">{s.source}</span>{' '}
          <span className="tabular-nums">
            {s.visites} · {Math.round((s.visites / total) * 100)} %
          </span>
        </li>
      ))}
    </ul>
  );
}

function LigneOeuvre({
  ligne,
  genre,
  plafond,
}: {
  ligne: LigneDAudience;
  genre: 'livre' | 'serie';
  plafond: number;
}) {
  const part = plafond > 0 ? Math.max(4, (ligne.visites / plafond) * 100) : 0;

  return (
    <Link
      to={genre === 'serie' ? `/series/${ligne.id}` : `/books/${ligne.id}`}
      className="flex min-h-[72px] flex-col justify-center gap-1.5 rounded-lg border border-outline bg-surface px-3 py-3 transition-colors hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          {genre === 'serie' && (
            <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-lisible">
              Série
            </span>
          )}
          <span className="truncate font-medium text-on-surface">{ligne.titre}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-on-surface">
          {ligne.visites}
          <span className="ml-1 font-sans text-xs font-normal text-on-surface-muted">
            {ligne.visites === 1 ? 'visite' : 'visites'}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-high" aria-hidden>
          <span className="block h-full rounded-full bg-primary" style={{ width: `${part}%` }} />
        </span>
        <span className="shrink-0 text-xs tabular-nums text-on-surface-muted">
          {ligne.lecteurs === 0
            ? 'aucune lecture'
            : `${ligne.lecteurs} ${ligne.lecteurs === 1 ? 'lecteur' : 'lecteurs'} · ${ligne.pagesLues} pages`}
        </span>
      </span>
    </Link>
  );
}
