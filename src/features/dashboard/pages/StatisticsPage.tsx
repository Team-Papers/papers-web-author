import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { getMyStats } from '@/lib/api/authors';
import { getMyBooks } from '@/lib/api/books';
import { formatCurrency } from '@/lib/utils/formatters';
import type { AuthorStats, Book } from '@/types/models';
import { BookStatus } from '@/types/models';

export function StatisticsPage() {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyStats().catch(() => null),
      getMyBooks({ limit: 100 }).catch(() => ({ data: [] })),
    ]).then(([s, b]) => {
      if (s) setStats(s);
      setBooks(b.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  const statusCounts = [
    { name: 'Brouillon', count: books.filter((b) => b.status === BookStatus.DRAFT).length, fill: '#dadce0' },
    { name: 'En attente', count: books.filter((b) => b.status === BookStatus.PENDING).length, fill: '#fbbc04' },
    { name: 'Publié', count: books.filter((b) => b.status === BookStatus.PUBLISHED).length, fill: '#34a853' },
    { name: 'Rejeté', count: books.filter((b) => b.status === BookStatus.REJECTED).length, fill: '#ea4335' },
  ];

  const topBooks = [...books].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);

  return (
    <div>
      <Header title="Statistiques" subtitle="Analysez vos performances" />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Books by status */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Livres par statut</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5f6368' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6368' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top books */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Top livres par ventes</h3>
            {topBooks.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">Aucun livre avec des ventes</p>
            ) : (
              <div className="space-y-3">
                {topBooks.map((book, i) => (
                  <div key={book.id} className="flex items-center gap-3 py-2">
                    <span className="text-lg font-bold text-on-surface-variant w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{book.title}</p>
                      <p className="text-xs text-on-surface-variant">{book.totalSales} ventes · {formatCurrency(book.totalRevenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Summary */}
        {stats && (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Résumé</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-surface-container rounded-2xl">
                <p className="text-2xl font-bold text-primary">{stats.totalBooks}</p>
                <p className="text-xs text-on-surface-variant mt-1">Livres</p>
              </div>
              <div className="text-center p-4 bg-surface-container rounded-2xl">
                <p className="text-2xl font-bold text-success">{stats.totalSales}</p>
                <p className="text-xs text-on-surface-variant mt-1">Ventes</p>
              </div>
              <div className="text-center p-4 bg-surface-container rounded-2xl">
                <p className="text-2xl font-bold text-warning">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-on-surface-variant mt-1">Revenus total</p>
              </div>
              <div className="text-center p-4 bg-surface-container rounded-2xl">
                <p className="text-2xl font-bold text-on-surface">{stats.averageRating?.toFixed(1) || '—'}</p>
                <p className="text-xs text-on-surface-variant mt-1">Note moyenne</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
