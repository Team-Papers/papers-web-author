import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, ShoppingCart, Wallet, Star, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMyStats, getMyEarnings } from '@/lib/api/authors';
import { getMyBooks } from '@/lib/api/books';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { AuthorStats, Transaction, Book } from '@/types/models';
import { BookStatus } from '@/types/models';

export function DashboardPage() {
  const authorProfile = useAuthStore((s) => s.authorProfile);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rejectedBooks, setRejectedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, e, b] = await Promise.all([
          getMyStats().catch(() => null),
          getMyEarnings().catch(() => ({ balance: 0, transactions: [] })),
          getMyBooks({ status: BookStatus.REJECTED, limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
        ]);
        if (s) setStats(s);
        setTransactions(e.transactions?.slice(0, 5) || []);
        setRejectedBooks(b.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  // Mock chart data
  const chartData = [
    { month: 'Jul', revenue: 0 },
    { month: 'Août', revenue: 0 },
    { month: 'Sep', revenue: 0 },
    { month: 'Oct', revenue: 0 },
    { month: 'Nov', revenue: stats?.monthlyRevenue ?? 0 },
    { month: 'Déc', revenue: stats?.totalRevenue ?? 0 },
  ];

  return (
    <div>
      <Header title="Tableau de bord" subtitle={`Bienvenue, ${authorProfile?.penName || 'Auteur'}`} />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Livres publiés" value={stats?.totalBooks ?? 0} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard title="Ventes totales" value={stats?.totalSales ?? 0} icon={<ShoppingCart className="h-5 w-5" />} iconBg="bg-success-container text-success" />
          <StatCard title="Revenus" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={<Wallet className="h-5 w-5" />} iconBg="bg-warning-container text-warning" />
          <StatCard title="Note moyenne" value={stats?.averageRating?.toFixed(1) ?? '—'} icon={<Star className="h-5 w-5" />} />
        </div>

        {/* Alert for rejected books */}
        {rejectedBooks.length > 0 && (
          <Card className="border-error/30 bg-error-container/30">
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error">{rejectedBooks.length} livre(s) rejeté(s)</p>
                <p className="text-xs text-on-surface-variant mt-1">Consultez vos livres pour voir les motifs de rejet.</p>
                <Link to="/books" className="text-xs text-primary font-medium hover:underline mt-1 inline-block">Voir mes livres →</Link>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Revenus mensuels</h3>
            <div className="h-64 min-h-[256px] w-full">
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4285F4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4285F4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5f6368' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6368' }} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Area type="monotone" dataKey="revenue" stroke="#4285F4" fill="url(#grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent transactions */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Activité récente</h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Aucune activité récente</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{t.book?.title || 'Transaction'}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-success">+{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
