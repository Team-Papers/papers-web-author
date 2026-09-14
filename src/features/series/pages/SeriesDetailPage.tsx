import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyBooks } from '@/lib/api/books';
import {
  attachEpisode,
  detachEpisode,
  getSeriesDetail,
  updateSeries,
} from '@/lib/api/series';
import { messageDe } from '@/lib/utils/erreurs';
import type { Book } from '@/types/models';
import { etatDeSerie } from '../etat';

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
  const [erreur, setErreur] = useState<string | null>(null);

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
              <LigneDEpisode key={episode.id} episode={episode} onRetirer={() => retirer(episode.id)} />
            ))}
          </ol>

          {/* Les actions viennent apres la liste, pas avant : on lit la
              serie, puis on decide. « Ajouter » est l'action principale ;
              terminer une serie est rare et se fait a la fin. */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
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
    </div>
  );
}

/** L'état d'un épisode : ce que le lecteur verra, et la teinte de sa tranche. */
function etatDEpisode(episode: Episode) {
  if (episode.paru) {
    return { mot: 'Paru', teinte: 'var(--color-etat-paru)', suite: null };
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

function LigneDEpisode({ episode, onRetirer }: { episode: Episode; onRetirer: () => void }) {
  const etat = etatDEpisode(episode);

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
