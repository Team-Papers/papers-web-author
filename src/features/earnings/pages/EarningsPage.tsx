import { useEffect, useState, useMemo } from 'react';
import { ArrowDownToLine, Phone, TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { getMyEarnings, requestWithdrawal } from '@/lib/api/authors';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Transaction } from '@/types/models';

export function EarningsPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount] = useState('');
  const [wMethod, setWMethod] = useState('MTN');
  const [wPhone, setWPhone] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  const load = () => {
    setLoading(true);
    getMyEarnings()
      .then((r) => { setBalance(r.balance); setTransactions(r.transactions || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    setWError('');
    if (!wAmount || Number(wAmount) <= 0) { setWError('Montant invalide'); return; }
    if (Number(wAmount) > balance) { setWError('Solde insuffisant'); return; }
    if (!wPhone) { setWError('Numéro requis'); return; }
    setWLoading(true);
    try {
      await requestWithdrawal({ amount: Number(wAmount), method: wMethod, phoneNumber: wPhone });
      setShowWithdraw(false);
      setWAmount(''); setWPhone('');
      load();
    } catch { setWError('Erreur lors du retrait'); }
    finally { setWLoading(false); }
  };

  // Generate chart data from transactions
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const salesOnly = transactions.filter(t => t.type === 'SALE');
    const monthlyData: Record<string, number> = {};

    salesOnly.forEach(t => {
      const date = new Date(t.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + t.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => {
        const [year, m] = month.split('-');
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return { month: monthNames[parseInt(m) - 1], amount };
      });
  }, [transactions]);

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  return (
    <div>
      <Header title="Revenus" subtitle="Gérez vos gains" />
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Balance Card */}
        <Card className="welcome-card relative overflow-hidden p-8 animate-fade-up">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/70">Solde disponible</p>
                <p className="text-3xl lg:text-4xl font-bold text-white mt-1">{formatCurrency(balance)}</p>
              </div>
            </div>
            <Button
              variant="filled"
              onClick={() => setShowWithdraw(true)}
              leftIcon={<ArrowDownToLine className="h-4 w-4" />}
              className="bg-white text-primary-600 hover:bg-white/90 shadow-lg"
            >
              Retirer
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="lg:col-span-2" variant="elevated">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-on-surface">Évolution des revenus</h3>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                  {chartData.length} mois
                </span>
              </div>
              <div className="h-64 min-h-[256px] w-full">
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="amount"
                      stroke="#00B4D8"
                      fill="url(#earningsGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Transactions */}
          <Card variant="elevated" className={chartData.length === 0 ? 'lg:col-span-3' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">Historique</h3>
              <Clock className="h-4 w-4 text-on-surface-variant" />
            </div>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container mb-3">
                  <Wallet className="h-6 w-6 text-on-surface-variant" />
                </div>
                <p className="text-sm text-on-surface-variant">Aucune transaction</p>
                <p className="text-xs text-on-surface-variant/70 mt-1">Vos ventes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions.slice(0, 10).map((t, index) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0 animate-fade-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === 'SALE' ? 'bg-success-container' : 'bg-error-container'}`}>
                        {t.type === 'SALE' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-error" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface line-clamp-1">
                          {t.type === 'SALE' ? t.book?.title || 'Vente' : 'Retrait'}
                        </p>
                        <p className="text-xs text-on-surface-variant">{formatDate(t.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'SALE' ? 'text-success' : 'text-error'}`}>
                      {t.type === 'SALE' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Demander un retrait"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outlined" onClick={() => setShowWithdraw(false)}>Annuler</Button>
            <Button onClick={handleWithdraw} isLoading={wLoading}>Confirmer</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {wError && <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm">{wError}</div>}
          <Input label="Montant (FCFA)" type="number" value={wAmount} onChange={(e) => setWAmount(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Méthode</label>
            <div className="flex gap-3">
              {['MTN', 'OM'].map((m) => (
                <button key={m} type="button" onClick={() => setWMethod(m)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${wMethod === m ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline text-on-surface-variant hover:bg-surface-container'}`}>
                  {m === 'MTN' ? 'MTN Mobile Money' : 'Orange Money'}
                </button>
              ))}
            </div>
          </div>
          <Input label="Numéro de téléphone" value={wPhone} onChange={(e) => setWPhone(e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
        </div>
      </Modal>
    </div>
  );
}
