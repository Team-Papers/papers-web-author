import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Layers, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createSeries, getMySeries, type Series } from '@/lib/api/series';
import { messageDe } from '@/lib/utils/erreurs';

/**
 * Les séries de l'auteur.
 *
 * Un auteur avec cinq chapitres n'avait aucun moyen de les relier : les
 * collections existent mais sont réservées à l'administration, et plates —
 * rien n'y dit « épisode 1, puis 2 ».
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
    <div>
      <Header title="Mes séries" subtitle={`${series.length} série(s)`} />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setOuvert(true)}>
            <Plus className="h-4 w-4" /> Nouvelle série
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : series.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title="Aucune série"
            description="Une série réunit des chapitres dans l'ordre et leur donne un calendrier. Vos lecteurs voient la suite arriver."
            action={{ label: 'Créer ma première série', onClick: () => setOuvert(true) }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <Link
                key={s.id}
                to={`/series/${s.id}`}
                className="rounded-xl border border-outline bg-surface p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-on-surface">{s.title}</h2>
                  {s.completed && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Terminée
                    </Badge>
                  )}
                </div>
                {s.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">
                    {s.description}
                  </p>
                )}
                <p className="mt-4 text-sm text-on-surface-muted">
                  {s._count?.books ?? 0} épisode(s)
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={ouvert} onClose={() => setOuvert(false)} title="Nouvelle série">
        <form onSubmit={soumettre} className="space-y-4">
          {erreur && (
            <p role="alert" className="rounded-lg bg-error-light px-3 py-2 text-sm text-error">
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
