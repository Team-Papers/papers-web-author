import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { CalendarClock, Check, ChevronLeft, Copy, ExternalLink, ImagePlus, Plus, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyBooks, uploadCover } from '@/lib/api/books';
import {
  attachEpisode,
  detachEpisode,
  getSeriesDetail,
  scheduleSeries,
  updateSeries,
  type EpisodeIgnore,
  type EpisodeProgramme,
} from '@/lib/api/series';
import { cn } from '@/lib/utils/cn';
import { messageDe } from '@/lib/utils/erreurs';
import { BookStatus, type Book } from '@/types/models';
import { calendrierDeSortie, demainHuitHeures, jourEtHeure } from '../calendrier';
import { etatDeSerie } from '../etat';
import { pageDeLaSerie } from '@/lib/site';

type Detail = Awaited<ReturnType<typeof getSeriesDetail>>;
type Episode = Detail['episodes'][number];

/**
 * Une série et ses épisodes.
 *
 * Ranger, numéroter et dater vont ensemble : c'est le geste « ce chapitre est
 * le troisième, et il sort mardi ». Les séparer ferait trois allers-retours
 * pour une seule décision.
 *
 * Chaque épisode porte, comme un manuscrit, une tranche : paru, programmé,
 * ou sans date — ce dernier est le seul qui attende quelque chose de
 * l'auteur, et le seul dit en rouge.
 */
export function SeriesDetailPage() {
  const { id = '' } = useParams();

  const { data: serie, loading, setData } = useAsyncData<Detail | null>(
    () => getSeriesDetail(id),
    [id],
    null,
  );

  const { data: livres } = useAsyncData<Book[]>(
    () => getMyBooks({ limit: 100 }).then((r) => r.data),
    [],
    [],
  );

  const [ouvert, setOuvert] = useState(false);
  const [envoiCouverture, setEnvoiCouverture] = useState(false);
  const [programmation, setProgrammation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function recharger() {
    setData(await getSeriesDetail(id));
  }

  async function retirer(bookId: string) {
    setErreur(null);
    try {
      await detachEpisode(id, bookId);
      await recharger();
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  /**
   * La couverture de la serie est l'image que Facebook, WhatsApp et le site
   * montrent quand on partage la serie : sans elle, la carte est generique.
   * On reutilise le televersement des couvertures de livre.
   */
  async function changerCouverture(fichier: File) {
    setErreur(null);
    setEnvoiCouverture(true);
    try {
      const nom = await uploadCover(fichier);
      await updateSeries(id, { coverUrl: nom });
      await recharger();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoiCouverture(false);
    }
  }

  async function basculerTerminee() {
    if (!serie) return;
    setErreur(null);
    try {
      await updateSeries(id, { completed: !serie.completed });
      await recharger();
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  if (loading || !serie) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Les livres déjà rangés ailleurs dans cette série n'ont pas à être proposés
  // deux fois.
  const dejaRanges = new Set(serie.episodes.map((e) => e.id));
  const disponibles = livres.filter((l) => !dejaRanges.has(l.id));
  const prochainRang =
    Math.max(0, ...serie.episodes.map((e) => e.episodeNumber ?? 0)) + 1;
  const etat = etatDeSerie(serie);
  const n = serie.episodes.length;
  // Le statut d'un épisode ne figure pas sur la fiche de la série — le lecteur
  // n'a pas à le connaître — mais sur la liste des livres de l'auteur, si.
  const statuts = new Map(livres.map((l) => [l.id, l.status]));
  const aVenir = serie.episodes.filter((e) => !e.paru);

  /**
   * Ce que le serveur a fait, en une phrase : combien d'épisodes, de quand à
   * quand, et ce qu'il a laissé de côté. L'auteur n'a pas à relire la liste
   * pour savoir si tout y est.
   */
  function annoncer(resultat: { episodes: EpisodeProgramme[]; ignores: EpisodeIgnore[] }) {
    const { episodes, ignores } = resultat;
    const phrases: string[] = [];
    if (episodes.length === 0) {
      phrases.push('Aucun épisode à programmer.');
    } else if (episodes.length === 1) {
      phrases.push(`1 épisode programmé, le ${jourEtHeure(new Date(episodes[0].publishAt))}.`);
    } else {
      const premier = jourEtHeure(new Date(episodes[0].publishAt));
      const dernier = jourEtHeure(new Date(episodes[episodes.length - 1].publishAt));
      phrases.push(`${episodes.length} épisodes programmés, du ${premier} au ${dernier}.`);
    }
    if (ignores.length > 0) {
      const motifs = { REJECTED: 'refusé', SUSPENDED: 'suspendu', PENDING: 'en examen' } as const;
      phrases.push(
        `Laissé de côté : ${ignores.map((i) => `${i.title} (${motifs[i.status]})`).join(', ')}.`,
      );
    }
    setConfirmation(phrases.join(' '));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="pt-6 pb-6">
        <Link
          to="/series"
          className="-ml-1 inline-flex min-h-11 items-center gap-0.5 text-sm text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Séries
        </Link>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
          {serie.title}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span style={{ color: etat.teinte }}>{etat.mot}</span>
          <span className="text-outline" aria-hidden>
            ·
          </span>
          <span className="text-on-surface-muted">
            {n === 0 ? 'Aucun épisode' : n === 1 ? '1 épisode' : `${n} épisodes`}
          </span>
        </p>
      </header>

      <section className="mb-6 flex items-center gap-4">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-surface-container-high">
          {serie.coverUrl ? (
            <img src={serie.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-on-surface-muted">Sans image</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-on-surface">
            {serie.coverUrl ? 'Couverture de la série' : 'Aucune couverture : le partage montrera une carte générique.'}
          </p>
          <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline bg-surface px-4 text-sm font-medium text-on-surface hover:bg-surface-dim">
            <ImagePlus className="h-4 w-4" aria-hidden />
            {envoiCouverture ? 'Envoi…' : serie.coverUrl ? 'Changer la couverture' : 'Ajouter une couverture'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={envoiCouverture}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void changerCouverture(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </section>

      <AdressePublique serie={serie} />

      {confirmation && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-success/30 bg-success-container px-4 py-3 text-sm text-success"
        >
          {confirmation}
        </p>
      )}

      {erreur && (
        <p role="alert" className="mb-6 rounded-lg bg-error-container px-4 py-3 text-sm text-error">
          {erreur}
        </p>
      )}

      {n === 0 ? (
        <div className="rounded-xl border border-dashed border-outline bg-surface px-5 py-10 text-center">
          <h2 className="font-display text-xl font-semibold text-on-surface">Le premier épisode</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-on-surface-variant">
            {disponibles.length > 0
              ? 'Rangez vos chapitres dans l’ordre et donnez-leur une date. Chacun paraîtra tout seul le jour dit.'
              : 'Publiez d’abord un livre : c’est lui qui deviendra un épisode.'}
          </p>
          {disponibles.length > 0 ? (
            <button
              type="button"
              onClick={() => setOuvert(true)}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un épisode
            </button>
          ) : (
            <Link
              to="/books/new"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Publier un livre
            </Link>
          )}
        </div>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {serie.episodes.map((episode) => (
              <LigneDEpisode
                key={episode.id}
                episode={episode}
                refuse={statuts.get(episode.id) === BookStatus.REJECTED}
                onRetirer={() => retirer(episode.id)}
              />
            ))}
          </ol>

          {/* Un épisode ajouté sans date attend l'auteur ; la programmation
              groupée est le chemin conseillé, et une ligne le dit ici, où
              l'auteur regarde après avoir rangé ses chapitres. */}
          <p className="mt-3 text-sm text-on-surface-muted">
            Le plus simple : programmez la sortie, et chaque épisode à venir reçoit sa date d’un
            coup. Un épisode ajouté sans date reste à publier vous-même.
          </p>

          {/* Les actions viennent apres la liste, pas avant : on lit la
              serie, puis on decide. « Ajouter » est l'action principale ;
              programmer vient une fois les chapitres ranges ; terminer une
              serie est rare et se fait a la fin. */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setOuvert(true)}
              disabled={disponibles.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Ajouter un épisode
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setProgrammation(true);
              }}
              disabled={aVenir.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline px-5 font-medium text-primary-lisible hover:bg-surface-container disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <CalendarClock className="h-4 w-4" aria-hidden />
              Programmer la sortie
            </button>
            <button
              type="button"
              onClick={basculerTerminee}
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-medium text-primary-lisible hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {serie.completed ? 'Rouvrir la série' : 'Marquer la série terminée'}
            </button>
          </div>
          {disponibles.length === 0 && (
            <p className="mt-2 text-sm text-on-surface-muted">
              Tous vos livres sont déjà rangés. Publiez-en un pour l’ajouter.
            </p>
          )}
        </>
      )}

      <AjouterUnEpisode
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        seriesId={id}
        rangPropose={prochainRang}
        livres={disponibles}
        onAjoute={recharger}
      />

      {/* Le formulaire est monte a l'ouverture seulement : ses valeurs par
          defaut (demain 8 h) se recalculent a chaque fois qu'on l'ouvre. */}
      {programmation && (
        <ProgrammerLaSortie
          onClose={() => setProgrammation(false)}
          seriesId={id}
          episodes={serie.episodes}
          statuts={statuts}
          onProgramme={async (resultat) => {
            await recharger();
            annoncer(resultat);
          }}
        />
      )}
    </div>
  );
}

/**
 * Dater toute la série d'un coup : un départ, un pas, et l'aperçu des dates
 * qui en résultent — l'auteur confirme ce qu'il voit, pas une formule.
 */
function ProgrammerLaSortie({
  onClose,
  seriesId,
  episodes,
  statuts,
  onProgramme,
}: {
  onClose: () => void;
  seriesId: string;
  episodes: Episode[];
  statuts: Map<string, Book['status']>;
  onProgramme: (resultat: { episodes: EpisodeProgramme[]; ignores: EpisodeIgnore[] }) => Promise<void>;
}) {
  const [depart, setDepart] = useState(() => demainHuitHeures());
  const [tousLes, setTousLes] = useState('3');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // L'instant d'ouverture sert de « maintenant » : le rendu reste pur, et le
  // serveur tranche de toute façon si la date est passée entre-temps.
  const [ouvertA] = useState(() => Date.now());

  const dateDeDepart = depart ? new Date(depart) : null;
  const pas = Number(tousLes);
  const departValide = dateDeDepart !== null && !Number.isNaN(dateDeDepart.getTime());
  const departAVenir = departValide && dateDeDepart.getTime() > ouvertA;
  const pasValide = Number.isInteger(pas) && pas >= 1 && pas <= 30;

  const calendrier =
    departValide && pasValide ? calendrierDeSortie(episodes, statuts, dateDeDepart, pas) : [];
  const programmes = calendrier.filter((l) => l.sort === 'programme');

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!departAVenir || !pasValide || !dateDeDepart) return;
    setErreur(null);
    setEnvoi(true);

    try {
      // Une heure locale devient un instant : le serveur publie à l'heure de
      // l'auteur, où qu'il soit.
      const resultat = await scheduleSeries(seriesId, {
        startAt: dateDeDepart.toISOString(),
        everyDays: pas,
      });
      await onProgramme(resultat);
      onClose();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Programmer la sortie">
      <form onSubmit={soumettre} className="space-y-4">
        {erreur && (
          <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">
            {erreur}
          </p>
        )}

        <Input
          label="Premier épisode"
          type="datetime-local"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
          required
          error={depart && !departAVenir ? 'Choisissez une date à venir.' : undefined}
        />

        <Input
          label="Un épisode tous les"
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          step={1}
          value={tousLes}
          onChange={(e) => setTousLes(e.target.value)}
          required
          rightIcon={<span className="text-sm">jours</span>}
          error={tousLes && !pasValide ? 'Entre 1 et 30 jours.' : undefined}
        />

        {/* L'aperçu reprend la forme de la liste des épisodes : le numéro,
            le titre, et ce qui l'attend. Un refusé n'a pas de date ; on le
            dit plutôt que de le faire disparaître. */}
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-on-surface">Ce qui en résulte</h3>
          <ol aria-label="Dates de sortie" className="flex flex-col gap-1.5">
            {calendrier.map((ligne) => (
              <li
                key={ligne.episode.id}
                className="flex items-baseline gap-2 rounded-lg bg-surface-container px-3 py-2 text-sm"
              >
                <span className="w-6 shrink-0 font-display font-semibold tabular-nums text-on-surface-variant">
                  {ligne.episode.episodeNumber ?? '—'}
                </span>
                <span className="min-w-0 flex-1 truncate text-on-surface">{ligne.episode.title}</span>
                {ligne.sort === 'programme' ? (
                  <span className="shrink-0 text-on-surface-variant">{jourEtHeure(ligne.publishAt)}</span>
                ) : ligne.sort === 'refuse' ? (
                  <span className="shrink-0" style={{ color: 'var(--color-etat-refuse)' }}>
                    Refusé, laissé de côté
                  </span>
                ) : (
                  <span className="shrink-0" style={{ color: 'var(--color-etat-examen)' }}>
                    En examen, laissé de côté
                  </span>
                )}
              </li>
            ))}
          </ol>
          {calendrier.length > 0 && programmes.length === 0 && (
            <p className="mt-2 text-sm text-on-surface-muted">Aucun épisode ne peut recevoir de date.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="text" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !departAVenir || !pasValide || programmes.length === 0}>
            {envoi ? 'Programmation…' : 'Programmer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** L'état d'un épisode : ce que le lecteur verra, et la teinte de sa tranche. */
function etatDEpisode(episode: Episode, refuse: boolean) {
  if (episode.paru) {
    return { mot: 'Paru', teinte: 'var(--color-etat-paru)', suite: null };
  }
  // Un chapitre refusé ne recevra pas de date, quoi qu'on lui donne : lui
  // proposer d'en choisir une enverrait l'auteur dans un mur. Il attend une
  // correction, comme sur la liste des livres.
  if (refuse) {
    return {
      mot: 'Refusé',
      teinte: 'var(--color-etat-refuse)',
      suite: 'Corrigez-le avant de lui donner une date',
    };
  }
  if (!episode.publishAt) {
    return {
      mot: 'Sans date',
      teinte: 'var(--color-etat-refuse)',
      suite: 'Publiez-le vous-même, ou donnez-lui une date',
    };
  }
  const date = new Date(episode.publishAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { mot: 'Programmé', teinte: 'var(--color-etat-programme)', suite: `Paraît le ${date}` };
}

function LigneDEpisode({
  episode,
  refuse,
  onRetirer,
}: {
  episode: Episode;
  refuse: boolean;
  onRetirer: () => void;
}) {
  const etat = etatDEpisode(episode, refuse);

  return (
    <li className="flex min-h-[72px] items-stretch gap-3 rounded-lg border border-outline bg-surface py-3 pr-1 pl-3">
      <span
        aria-hidden
        className="block w-[3px] shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: etat.teinte }}
      />
      <span className="flex w-7 shrink-0 items-center justify-center font-display text-lg font-semibold tabular-nums text-on-surface-variant">
        {episode.episodeNumber ?? '—'}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate font-medium text-on-surface">{episode.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-sm">
          <span className="shrink-0 whitespace-nowrap" style={{ color: etat.teinte }}>{etat.mot}</span>
          {etat.suite && (
            <>
              <span className="text-outline" aria-hidden>
                ·
              </span>
              <span className="truncate text-on-surface-muted">{etat.suite}</span>
            </>
          )}
        </span>
      </span>
      <button
        type="button"
        onClick={onRetirer}
        aria-label={`Retirer ${episode.title} de la série`}
        className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-lg text-on-surface-muted transition-colors hover:bg-error-container hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

function AjouterUnEpisode({
  ouvert,
  onClose,
  seriesId,
  rangPropose,
  livres,
  onAjoute,
}: {
  ouvert: boolean;
  onClose: () => void;
  seriesId: string;
  rangPropose: number;
  livres: Book[];
  onAjoute: () => Promise<void>;
}) {
  const [bookId, setBookId] = useState('');
  const [rang, setRang] = useState(String(rangPropose));
  const [date, setDate] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      await attachEpisode(seriesId, {
        bookId,
        episodeNumber: Number(rang),
        // Une date locale devient un instant : le serveur publie à l'heure, pas
        // au jour près.
        publishAt: date ? new Date(date).toISOString() : null,
      });
      await onAjoute();
      onClose();
      setBookId('');
      setDate('');
      setRang(String(rangPropose + 1));
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal isOpen={ouvert} onClose={onClose} title="Ajouter un épisode">
      <form onSubmit={soumettre} className="space-y-4">
        {erreur && (
          <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">
            {erreur}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-on-surface">Chapitre</span>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            required
            className="min-h-11 w-full rounded-lg border border-outline bg-surface px-3 text-on-surface focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <option value="">Choisir un livre…</option>
            {livres.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Numéro d'épisode"
          type="number"
          inputMode="numeric"
          min={1}
          value={rang}
          onChange={(e) => setRang(e.target.value)}
          required
        />

        <Input
          label="Date de parution"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          helper="Laissez vide pour publier vous-même. Sinon, l'épisode paraît tout seul à cette date."
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="text" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={envoi || !bookId}>
            {envoi ? 'Ajout…' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * L'adresse publique de la serie, et le jour ou elle s'ouvrira.
 *
 * C'est l'adresse qu'un auteur donne a une publicite. Le piege, sans cette
 * section : la page d'une serie n'existe pour le public qu'a partir du
 * premier episode paru. Lancer la campagne la veille, c'est payer pour
 * envoyer des lecteurs sur une page introuvable.
 */
function AdressePublique({
  serie,
}: {
  serie: {
    id: string;
    slug: string;
    title: string;
    episodes: Array<{ paru: boolean; publishAt: string | null }>;
  };
}) {
  const [copie, setCopie] = useState(false);
  const url = pageDeLaSerie(serie);
  const enLigne = serie.episodes.some((e) => e.paru);
  const prochaine = serie.episodes
    .filter((e) => !e.paru && e.publishAt)
    .map((e) => new Date(e.publishAt as string))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const peutPartager = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Sans presse-papiers, l'adresse reste selectionnable.
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-outline bg-surface p-5">
      <h2 className="text-sm font-semibold text-on-surface-variant">Adresse de la série</h2>
      <p className="mt-2 truncate rounded-lg bg-surface-container px-3 py-2 font-mono text-sm text-on-surface select-all">
        {url.replace(/^https?:\/\//, '')}
      </p>

      {enLigne ? (
        <>
          <p className="mt-2.5 text-sm text-on-surface-variant">
            En ligne. Donnez cette adresse à vos lecteurs, ou à votre publicité.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {peutPartager && (
              <button
                type="button"
                onClick={() => {
                  void navigator.share({ title: serie.title, url }).catch(() => {});
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Partager
              </button>
            )}
            <button
              type="button"
              onClick={copier}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium',
                peutPartager
                  ? 'border-outline bg-surface text-on-surface'
                  : 'border-primary bg-primary text-on-primary',
              )}
            >
              {copie ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copie ? 'Copié' : 'Copier le lien'}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-lisible hover:underline"
            >
              Voir la page
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </>
      ) : (
        <p className="mt-2.5 text-sm text-on-surface-variant">
          {prochaine
            ? `Cette page s'ouvrira au public à la parution du premier épisode, le ${prochaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${prochaine.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. N'annoncez pas la série avant.`
            : "Cette page s'ouvrira au public dès qu'un épisode paraîtra. Programmez la sortie, ou publiez le premier vous-même."}
        </p>
      )}
    </section>
  );
}
