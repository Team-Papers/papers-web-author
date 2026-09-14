import { useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createSeries, getMySeries, type Series } from '@/lib/api/series';
import { messageDe } from '@/lib/utils/erreurs';
import { etatDeSerie } from '../etat';

/**
 * Les séries de l'auteur.
 *
 * Un auteur avec cinq chapitres n'avait aucun moyen de les relier : les
 * collections existent mais sont réservées à l'administration, et plates —
 * rien n'y dit « épisode 1, puis 2 ».
 *
 * L'écran porte la même forme que la liste des livres : une ligne par série,
 * une tranche à gauche qui dit si elle est encore en cours, et le nombre
 * d'épisodes — la seule chose qu'un auteur cherche ici avant d'ouvrir.
 */
export function MySeriesPage() {
  const { data: series, loading, setData } = useAsyncData<Series[]>(getMySeries, [], []);

  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      const creee = await createSeries({ title: titre, description: description || null });
      setData((actuelles) => [creee, ...actuelles]);
      setOuvert(false);
      setTitre('');
      setDescription('');
    } catch (e) {
      // Le message du serveur porte la raison exacte ; « une erreur est
      // survenue » l'effacerait.
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="flex items-baseline justify-between gap-4 pt-8 pb-6">
        <h1 className="font-display text-[28px] font-semibold text-on-surface lg:text-4xl">
          Séries
        </h1>
        {/* Le bouton flottant publie un livre, pas une série : celle-ci a
            besoin de sa propre entrée, visible à toutes les tailles. */}
        {series.length > 0 && (
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nouvelle série
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : series.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline bg-surface px-5 py-10 text-center">
          <h2 className="font-display text-xl font-semibold text-on-surface">Votre première série</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-on-surface-variant">
            Une série réunit des chapitres dans l'ordre et leur donne un calendrier. Vos lecteurs
            voient la suite arriver.
          </p>
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Créer une série
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {series.map((s) => (
            <LigneDeSerie key={s.id} serie={s} />
          ))}
        </ul>
      )}

      <Modal isOpen={ouvert} onClose={() => setOuvert(false)} title="Nouvelle série">
        <form onSubmit={soumettre} className="space-y-4">
          {erreur && (
            <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">
              {erreur}
            </p>
          )}

          <Input
            label="Titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Les nuits de Douala"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="De quoi parle cette série ?"
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="text" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi || titre.trim().length === 0}>
              {envoi ? 'Création…' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function LigneDeSerie({ serie }: { serie: Series }) {
  const etat = etatDeSerie(serie);
  const episodes = serie._count?.books ?? 0;

  return (
    <li>
      <Link
        to={`/series/${serie.id}`}
        className="flex min-h-[72px] items-stretch gap-3 rounded-lg border border-outline bg-surface px-3 py-3 transition-colors hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          aria-hidden
          className="block w-[3px] shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: etat.teinte }}
        />
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate font-medium text-on-surface">{serie.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-sm">
            <span style={{ color: etat.teinte }}>{etat.mot}</span>
            <span className="text-outline" aria-hidden>
              ·
            </span>
            <span className="text-on-surface-muted">
              {episodes === 0 ? 'Aucun épisode' : episodes === 1 ? '1 épisode' : `${episodes} épisodes`}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}
