import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Send, Trash2, BookOpen, Pencil } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { getMyBooks, submitBook, deleteBook } from '@/lib/api/books';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Book } from '@/types/models';
import { BookStatus } from '@/types/models';

const statusBadge: Record<BookStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  [BookStatus.DRAFT]: { variant: 'neutral', label: 'Brouillon' },
  [BookStatus.PENDING]: { variant: 'warning', label: 'En attente' },
  [BookStatus.APPROVED]: { variant: 'info', label: 'Approuvé' },
  [BookStatus.REJECTED]: { variant: 'error', label: 'Rejeté' },
  [BookStatus.PUBLISHED]: { variant: 'success', label: 'Publié' },
};

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getMyBooks({ limit: 100 })
      .then((res) => {
        const found = res.data.find((b) => b.id === id);
        setBook(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

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
        setError('Vous devez ajouter un fichier (PDF ou ePub) avant de soumettre votre livre.');
      } else {
        setError(msg || 'Erreur lors de la soumission');
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

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;
  if (!book) return <div className="p-8 text-center text-on-surface-variant">Livre introuvable</div>;

  const sb = statusBadge[book.status];

  return (
    <div>
      <Header title={book.title} />
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Button variant="text" onClick={() => navigate('/books')} leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-4">
          Retour aux livres
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cover */}
          <Card className="overflow-hidden">
            <div className="aspect-[3/4] bg-surface-container-high">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-on-surface-variant/30" />
                </div>
              )}
            </div>
          </Card>

          {/* Info */}
          <Card className="md:col-span-2 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-on-surface">{book.title}</h2>
                <p className="text-sm text-on-surface-variant mt-1">Créé le {formatDate(book.createdAt)}</p>
              </div>
              <Badge variant={sb.variant}>{sb.label}</Badge>
            </div>

            {book.rejectionReason && (
              <div className="bg-error-container rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-error">Motif du rejet</p>
                <p className="text-sm text-on-surface mt-1">{book.rejectionReason}</p>
              </div>
            )}

            {/* Rejection History */}
            {book.rejectionHistory && book.rejectionHistory.length > 0 && (
              <div className="bg-warning-container rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-warning mb-2">Historique des rejets ({book.rejectionHistory.length})</p>
                <div className="space-y-2">
                  {book.rejectionHistory.map((rejection, index) => (
                    <div key={index} className="text-sm border-l-2 border-warning pl-3">
                      <p className="text-on-surface">{rejection.reason}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(rejection.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-on-surface-variant">Prix</p>
                <p className="text-lg font-bold text-on-surface">{formatCurrency(book.price)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Revenu/vente (70%)</p>
                <p className="text-lg font-bold text-success">{formatCurrency(book.price * 0.7)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Ventes</p>
                <p className="text-lg font-bold text-on-surface">{book.totalSales ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Revenus totaux</p>
                <p className="text-lg font-bold text-success">{formatCurrency((book.totalSales ?? 0) * book.price * 0.7)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Note</p>
                <p className="text-lg font-bold text-on-surface">
                  {book.averageRating && book.averageRating > 0 ? book.averageRating.toFixed(1) : '—'}
                  {' '}({book.reviewCount ?? 0} avis)
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant mb-1">Description</p>
              <p className="text-sm text-on-surface whitespace-pre-line">{book.description}</p>
            </div>

            {book.categories && book.categories.length > 0 && (
              <div>
                <p className="text-xs text-on-surface-variant mb-2">Catégories</p>
                <div className="flex flex-wrap gap-2">
                  {book.categories.map((c: any) => {
                    const cat = c.category || c;
                    return (
                      <span key={cat.id} className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant">{cat.name}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-error-container rounded-xl px-4 py-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant">
              {(book.status === BookStatus.DRAFT || book.status === BookStatus.REJECTED) && (
                <>
                  <Button variant="outlined" onClick={() => navigate(`/books/${book.id}/edit`)} leftIcon={<Pencil className="h-4 w-4" />}>
                    Modifier
                  </Button>
                  <Button onClick={handleSubmit} isLoading={actionLoading} leftIcon={<Send className="h-4 w-4" />}>
                    Soumettre pour révision
                  </Button>
                  <Button variant="danger" onClick={() => setShowDelete(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Supprimer ce livre ?"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outlined" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={actionLoading}>Supprimer</Button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">Cette action est irréversible. Le livre "{book.title}" sera définitivement supprimé.</p>
      </Modal>
    </div>
  );
}
