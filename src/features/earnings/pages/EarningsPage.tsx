import { useEffect, useState } from 'react';
import { ArrowDownToLine, Phone } from 'lucide-react';
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

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  return (
    <div>
      <Header title="Revenus" subtitle="Gérez vos gains" />
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Balance Card */}
        <Card className="p-8 bg-gradient-to-br from-primary to-primary-dark text-on-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Solde disponible</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(balance)}</p>
            </div>
            <Button variant="tonal" onClick={() => setShowWithdraw(true)} leftIcon={<ArrowDownToLine className="h-4 w-4" />}
              className="bg-white/20 text-white hover:bg-white/30 border-0">
              Retirer
            </Button>
          </div>
        </Card>

        {/* Transactions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Historique des transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Aucune transaction</p>
          ) : (
            <div className="divide-y divide-outline-variant">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{t.type === 'SALE' ? t.book?.title || 'Vente' : 'Retrait'}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === 'SALE' ? 'text-success' : 'text-error'}`}>
                    {t.type === 'SALE' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
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
