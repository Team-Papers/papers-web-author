import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { getMyBooks } from '@/lib/api/books';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Book } from '@/types/models';
import { BookStatus } from '@/types/models';

const statusBadge: Record<BookStatus, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  [BookStatus.DRAFT]: { variant: 'neutral', label: 'Brouillon' },
  [BookStatus.PENDING]: { variant: 'warning', label: 'En attente' },
  [BookStatus.APPROVED]: { variant: 'info', label: 'Approuvé' },
  [BookStatus.REJECTED]: { variant: 'error', label: 'Rejeté' },
  [BookStatus.PUBLISHED]: { variant: 'success', label: 'Publié' },
};

const tabs = [
  { key: '', label: 'Tous' },
  { key: BookStatus.DRAFT, label: 'Brouillon' },
  { key: BookStatus.PENDING, label: 'En attente' },
  { key: BookStatus.PUBLISHED, label: 'Publiés' },
  { key: BookStatus.REJECTED, label: 'Rejetés' },
];

export function MyBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (activeTab) params.status = activeTab;
    if (search) params.search = search;
    getMyBooks(params)
      .then((res) => setBooks(res.data))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  return (
    <div>
      <Header title="Mes livres" subtitle={`${books.length} livre(s)`} />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Rechercher un livre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/books/new')}>
            Nouveau livre
          </Button>
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : books.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="Aucun livre"
            description="Commencez par publier votre premier livre"
            action={{ label: 'Créer un livre', onClick: () => navigate('/books/new') }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                  <div className="aspect-[3/4] bg-surface-container-high relative overflow-hidden">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-on-surface-variant/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={statusBadge[book.status].variant}>{statusBadge[book.status].label}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-on-surface text-sm line-clamp-1">{book.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1">{formatCurrency(book.price)}</p>
                    {book.totalSales > 0 && (
                      <p className="text-xs text-success mt-1">{book.totalSales} vente(s)</p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
