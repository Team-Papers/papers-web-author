import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, ShoppingCart, Wallet, Star, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { WelcomeCard } from '@/components/ui/WelcomeCard';
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
    <div className="space-y-6 p-6 lg:p-8">
      {/* Welcome Card */}
      <WelcomeCard
        authorName={authorProfile?.penName || 'Auteur'}
        booksCount={stats?.totalBooks ?? 0}
        monthlyRevenue={stats?.monthlyRevenue ?? 0}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Livres publies"
          value={stats?.totalBooks ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
          index={0}
        />
        <StatCard
          title="Ventes totales"
          value={stats?.totalSales ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconBg="bg-success-container text-success"
          index={1}
        />
        <StatCard
          title="Revenus"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-accent-100 text-accent-600"
          index={2}
        />
        <StatCard
          title="Note moyenne"
          value={stats?.averageRating?.toFixed(1) ?? '—'}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-accent-100 text-accent-600"
          index={3}
        />
      </div>

      {/* Alert for rejected books */}
      {rejectedBooks.length > 0 && (
        <Card className="border-error/30 bg-error-container/30">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
              <AlertTriangle className="h-5 w-5 text-error" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-error">
                {rejectedBooks.length} livre(s) rejete(s)
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Consultez vos livres pour voir les motifs de rejet et soumettre a nouveau.
              </p>
              <Link
                to="/books"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Voir mes livres
                <TrendingUp className="h-3 w-3 rotate-45" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2" variant="elevated">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-on-surface">Revenus mensuels</h3>
            <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
              6 derniers mois
            </span>
          </div>
          <div className="h-64 min-h-[256px] w-full">
            <ResponsiveContainer width="100%" height={256} minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00B4D8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00B4D8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v as number)}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-outline)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00B4D8"
                  fill="url(#chartGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent transactions */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-on-surface">Activite recente</h3>
            <Clock className="h-4 w-4 text-on-surface-variant" />
          </div>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container mb-3">
                <ShoppingCart className="h-6 w-6 text-on-surface-variant" />
              </div>
              <p className="text-sm text-on-surface-variant">Aucune activite recente</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                Les ventes apparaitront ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t, index) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0 animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-container">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface line-clamp-1">
                        {t.book?.title || 'Transaction'}
                      </p>
                      <p className="text-xs text-on-surface-variant">{formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-success">
                    +{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
