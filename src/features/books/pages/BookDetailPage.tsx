import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ChevronLeft, Send, Pencil, EyeOff } from 'lucide-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Tranche } from '@/components/atelier/Tranche';
import { etatDe } from '@/components/atelier/etat';
import { getMyBooks, submitBook, deleteBook, unpublishBook } from '@/lib/api/books';
import { aEteModifie, formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { BookCategoryLink, Book } from '@/types/models';
import { BookStatus } from '@/types/models';

/**
 * La fiche d'un manuscrit.
 *
 * Elle ouvre sur ce que l'auteur doit savoir avant tout : ou en est le livre,
 * et ce qu'on attend de lui. Un refus commence donc par son motif, puis par
 * le bouton qui corrige. Les chiffres viennent ensuite, et seulement ceux
 * que l'API a reellement comptes : la fiche inventait un « revenu par vente »
 * a 70 % alors que le taux est un reglage serveur, et un « revenu total »
 * multiplie a partir du prix courant. Le net reellement verse existe, livre
 * par livre ; c'est lui qu'on lit.
 */
export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data: book,
    loading,
    setData: setBook,
  } = useAsyncData<Book | null>(
    () => {
      if (!id) return Promise.resolve(null);
      return getMyBooks({ limit: 100 }).then((res) => res.data.find((b) => b.id === id) ?? null);
    },
    [id],
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showUnpublish, setShowUnpublish] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!book) return;
    setError('');
    setActionLoading(true);
    try {
      const updated = await submitBook(book.id);
      setBook(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('file is required')) {
        setError('Ajoutez le fichier du livre (PDF ou ePub) avant de l’envoyer.');
      } else {
        setError(msg || 'L’envoi a échoué. Réessayez.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!book) return;
    setActionLoading(true);
    try {
      await deleteBook(book.id);
      navigate('/books');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!book) return;
    setError('');
    setActionLoading(true);
    try {
      const updated = await unpublishBook(book.id);
      setBook(updated);
      setShowUnpublish(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Le retrait a échoué. Réessayez.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;
  if (!book) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center lg:max-w-4xl lg:px-8">
        <p className="text-on-surface-variant">Ce livre n’existe pas, ou n’est pas à vous.</p>
        <Link to="/books" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary-lisible">
          Retour à mes livres
        </Link>
      </div>
    );
  }

  const etat = etatDe(book.status);
  const aCorriger = book.status === BookStatus.DRAFT || book.status === BookStatus.REJECTED;
  const enVente = book.status === BookStatus.PUBLISHED;
  const aVendu = (book.totalSales ?? 0) > 0;
  const categories = (book.categories ?? []).map((c: BookCategoryLink) =>
    'category' in c ? c.category : c,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="pt-6 pb-6">
        <Link
          to="/books"
          className="-ml-1 inline-flex min-h-11 items-center gap-0.5 text-sm text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Livres
        </Link>
        <div className="mt-1 flex items-stretch gap-3">
          <Tranche statut={book.status} />
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
              {book.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm">
              <span style={{ color: etat.teinte }}>{etat.mot}</span>
              {etat.suite && (
                <>
                  <span className="text-outline" aria-hidden>
                    ·
                  </span>
                  <span className="text-on-surface-muted">{etat.suite}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Un refus s'ouvre sur son motif, et sur la porte de sortie : corriger.
          C'est la promesse de la tranche rouge, tenue ici. */}
      {book.status === BookStatus.REJECTED && book.rejectionReason && (
        <section className="mb-6 rounded-xl border border-error/30 bg-error-container p-5">
          <h2 className="text-sm font-semibold text-error">Motif du refus</h2>
          <p className="mt-1.5 text-on-surface">{book.rejectionReason}</p>
          <Link
            to={`/books/${book.id}/edit`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-on-primary"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Corriger le manuscrit
          </Link>
        </section>
      )}

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-error-container px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <section className="flex gap-4">
        <div className="w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-high sm:w-32">
          <div className="aspect-[3/4]">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-on-surface-muted">
                Sans couverture
              </div>
            )}
          </div>
        </div>
        <dl className="min-w-0 flex-1 space-y-3 text-sm">
          <div>
            <dt className="text-on-surface-muted">Prix</dt>
            <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums text-on-surface">
              {Number(book.price) > 0 ? formatCurrency(Number(book.price)) : 'Gratuit'}
            </dd>
          </div>
          <div>
            <dt className="text-on-surface-muted">Créé le</dt>
            <dd className="mt-0.5 text-on-surface">{formatDate(book.createdAt)}</dd>
          </div>
          {/* Seulement si le livre a bougé depuis : sur un brouillon qui vient
              de naître, les deux dates sont la même, et la répéter n'apprend
              rien. */}
          {aEteModifie(book.createdAt, book.updatedAt) && (
            <div>
              <dt className="text-on-surface-muted">Modifié le</dt>
              <dd className="mt-0.5 text-on-surface">{formatDate(book.updatedAt)}</dd>
            </div>
          )}
          {categories.length > 0 && (
            <div>
              <dt className="text-on-surface-muted">Catégories</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant"
                  >
                    {cat.name}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Les chiffres n'apparaissent que sur un livre qui s'est vendu : sur un
          brouillon, « 0 vente, 0 F » n'apprend rien et pese. */}
      {(enVente || aVendu) && (
        <Rubrique titre="Ce que ce livre a rapporté">
          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-outline bg-surface p-5 sm:grid-cols-4">
            {typeof book.views === 'number' && (
              <div>
                <dt className="text-sm text-on-surface-muted">Vues</dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-on-surface">
                  {book.views}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-on-surface-muted">Ventes</dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-on-surface">
                {book.totalSales ?? 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-on-surface-muted">Net pour vous</dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-accent-lisible">
                {formatCurrency(Number(book.totalRevenue) || 0)}
              </dd>
            </div>
            {(book.reviewCount ?? 0) > 0 && (
              <div>
                <dt className="text-sm text-on-surface-muted">Note</dt>
                <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-on-surface">
                  {book.averageRating.toFixed(1)}
                  <span className="ml-1.5 font-sans text-sm font-normal text-on-surface-muted">
                    sur {book.reviewCount} avis
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </Rubrique>
      )}

      {book.description && (
        <Rubrique titre="Résumé">
          <p className="text-sm leading-relaxed whitespace-pre-line text-on-surface">{book.description}</p>
        </Rubrique>
      )}

      {book.rejectionHistory && book.rejectionHistory.length > (book.status === BookStatus.REJECTED ? 1 : 0) && (
        <Rubrique titre="Refus précédents">
          <ol className="space-y-3 border-l-2 border-outline pl-4">
            {book.rejectionHistory
              .filter((r) => !(book.status === BookStatus.REJECTED && r.reason === book.rejectionReason))
              .map((r, i) => (
                <li key={i} className="text-sm">
                  <p className="text-on-surface">{r.reason}</p>
                  <p className="text-xs text-on-surface-muted">{formatDate(r.date)}</p>
                </li>
              ))}
          </ol>
        </Rubrique>
      )}

      {/* Les actions ferment la page, dans l'ordre de leur poids : d'abord ce
          que l'etat appelle, puis ce qui est rare, et en dernier, a l'ecart,
          ce qui detruit. */}
      <section className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {aCorriger && (
          <>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={actionLoading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Send className="h-4 w-4" aria-hidden />
              {actionLoading ? 'Envoi…' : 'Envoyer à la relecture'}
            </button>
            <Link
              to={`/books/${book.id}/edit`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline bg-surface px-5 font-medium text-on-surface hover:bg-surface-dim"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Modifier
            </Link>
          </>
        )}

        {enVente && (
          <button
            type="button"
            onClick={() => setShowUnpublish(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline bg-surface px-5 font-medium text-on-surface hover:bg-surface-dim"
          >
            <EyeOff className="h-4 w-4" aria-hidden />
            Retirer de la vente
          </button>
        )}
      </section>

      <div className="mt-8 border-t border-outline-variant pt-4">
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="inline-flex min-h-11 items-center text-sm font-medium text-error hover:underline"
        >
          Supprimer ce livre
        </button>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Supprimer ce livre ?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outlined" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>Supprimer</Button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">« {book.title} » sera définitivement supprimé. Il n’y a pas de retour en arrière.</p>
      </Modal>

      <Modal isOpen={showUnpublish} onClose={() => setShowUnpublish(false)} title="Retirer de la vente ?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outlined" onClick={() => setShowUnpublish(false)}>Annuler</Button>
            <Button onClick={handleUnpublish} isLoading={actionLoading}>Retirer</Button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">« {book.title} » disparaîtra du catalogue. Les lecteurs qui l’ont acheté le gardent. Vous pourrez le remettre en vente.</p>
      </Modal>
    </div>
  );
}

function Rubrique({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">{titre}</h2>
      {children}
    </section>
  );
}
