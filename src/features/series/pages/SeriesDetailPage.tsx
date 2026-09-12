import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { CalendarClock, CheckCircle2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
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

type Detail = Awaited<ReturnType<typeof getSeriesDetail>>;

/**
 * Une série et ses épisodes.
 *
 * Ranger, numéroter et dater vont ensemble : c'est le geste « ce chapitre est
 * le troisième, et il sort mardi ». Les séparer ferait trois allers-retours
 * pour une seule décision.
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
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  // Les livres déjà rangés ailleurs dans cette série n'ont pas à être proposés
  // deux fois.
  const dejaRanges = new Set(serie.episodes.map((e) => e.id));
  const disponibles = livres.filter((l) => !dejaRanges.has(l.id));
  const prochainRang =
    Math.max(0, ...serie.episodes.map((e) => e.episodeNumber ?? 0)) + 1;

  return (
    <div>
      <Header title={serie.title} subtitle={`${serie.episodes.length} épisode(s)`} />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/series"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" /> Toutes mes séries
          </Link>

          <div className="flex gap-2">
            <Button variant="text" onClick={basculerTerminee}>
              <CheckCircle2 className="h-4 w-4" />
              {serie.completed ? 'Rouvrir la série' : 'Marquer terminée'}
            </Button>
            <Button onClick={() => setOuvert(true)} disabled={disponibles.length === 0}>
              <Plus className="h-4 w-4" /> Ajouter un épisode
            </Button>
          </div>
        </div>

        {erreur && (
          <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
            {erreur}
          </p>
        )}

        {serie.episodes.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="h-10 w-10" />}
            title="Aucun épisode"
            description="Rangez vos chapitres dans l'ordre et donnez-leur une date. Chacun se publiera tout seul le jour dit."
            action={
              disponibles.length > 0
                ? { label: 'Ajouter le premier', onClick: () => setOuvert(true) }
                : undefined
            }
          />
        ) : (
          <ol className="space-y-2">
            {serie.episodes.map((episode) => (
              <li
                key={episode.id}
                className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular-nums">
                  {episode.episodeNumber ?? '—'}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-on-surface">{episode.title}</p>
                  <p className="text-sm text-on-surface-muted">{dateDeSortie(episode)}</p>
                </div>

                {episode.paru ? (
                  <Badge variant="success">Paru</Badge>
                ) : (
                  <Badge variant="info">À venir</Badge>
                )}

                <button
                  type="button"
                  onClick={() => retirer(episode.id)}
                  aria-label={`Retirer ${episode.title} de la série`}
                  className="rounded-lg p-2 text-on-surface-muted transition-colors hover:bg-error-light hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

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

/** Ce que le lecteur lira sous le titre : paru le, ou prévu pour. */
function dateDeSortie(episode: Detail['episodes'][number]): string {
  if (episode.paru) return 'Disponible';
  if (!episode.publishAt) return 'Sans date — publiez-le vous-même';

  return `Prévu pour le ${new Date(episode.publishAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
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
          <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
            {erreur}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-on-surface">Chapitre</span>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            required
            className="w-full rounded-lg border border-outline bg-surface px-3 py-2 text-on-surface"
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
