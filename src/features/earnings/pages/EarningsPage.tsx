import { useEffect, useState, useMemo } from 'react';
import { ArrowDownToLine, Phone } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { getMyEarnings, requestWithdrawal } from '@/lib/api/authors';
import type { WithdrawalRequest } from '@/lib/api/authors';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Transaction } from '@/types/models';

export function EarningsPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [threshold, setThreshold] = useState(0);
  const [wSuccess, setWSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount] = useState('');
  const [wMethod, setWMethod] = useState('MTN');
  const [wPhone, setWPhone] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');
  const [toutAfficher, setToutAfficher] = useState(false);

  const load = () => {
    setLoading(true);
    getMyEarnings()
      .then((r) => {
        setBalance(r.balance);
        setTransactions(r.transactions || []);
        setWithdrawals(r.withdrawals);
        setThreshold(r.withdrawalThreshold);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    setWError('');
    if (!wAmount || Number(wAmount) <= 0) { setWError('Montant invalide'); return; }
    if (threshold > 0 && Number(wAmount) < threshold) {
      setWError(`Le montant minimal d'un retrait est de ${formatCurrency(threshold)}`);
      return;
    }
    if (Number(wAmount) > balance) { setWError('Solde insuffisant'); return; }
    if (!wPhone) { setWError('Numéro requis'); return; }
    setWLoading(true);
    try {
      const demande = await requestWithdrawal({ amount: Number(wAmount), method: wMethod, phoneNumber: wPhone });
      setShowWithdraw(false);
      setWAmount(''); setWPhone('');
      // Le formulaire se fermait sans rien dire : l'auteur ne savait pas si sa
      // demande etait partie, et voyait seulement son solde baisser.
      setWSuccess(
        // « Sous peu » ne veut rien dire : un auteur qui attend son argent
        // compte les jours. Le versement est fait a la main, sous 72 heures.
        `Demande de ${formatCurrency(Number(demande.amount))} enregistrée. Vous recevrez le versement sous 72 heures.`,
      );
      load();
    } catch (err: unknown) {
      // Le message du serveur porte la raison exacte — seuil, solde — que
      // « Erreur lors du retrait » effaçait.
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setWError(msg || 'Erreur lors du retrait');
    }
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
      // Net, not gross: this chart is what the author will actually be paid.
      monthlyData[key] = (monthlyData[key] || 0) + Number(t.netAmount);
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => {
        const [, m] = month.split('-');
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return { month: monthNames[parseInt(m) - 1], amount };
      });
  }, [transactions]);

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

  const visibles = toutAfficher ? transactions : transactions.slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="pt-8 pb-6">
        <h1 className="font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
          Revenus
        </h1>
      </header>

      {wSuccess && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-success/30 bg-success-container px-4 py-3 text-sm text-success"
        >
          {wSuccess}
        </p>
      )}

      {/*
        Le solde etait pose sur un degrade, un motif, deux halos flous et une
        etiquette en capitales espacees. Beaucoup de decor pour un nombre qui
        se lit tout seul — et le decor coutait le seul renseignement qui
        manquait : combien il reste avant de pouvoir retirer.

        Un auteur a 3 200 F ne veut pas savoir qu'il a 3 200 F, il le sait :
        il veut savoir qu'il lui en manque 1 800.
      */}
      <SoldeEtSeuil
        solde={balance}
        seuil={threshold}
        onRetirer={() => setShowWithdraw(true)}
      />

      {/* Leur montant est deja sorti du solde. Sans cette liste, juste sous
          le solde, l'auteur le voit baisser sans savoir pourquoi. */}
      {withdrawals.length > 0 && (
        <Section titre="En route vers votre numéro">
          <ul className="divide-y divide-outline-variant rounded-xl border border-outline bg-surface">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums text-on-surface">{formatCurrency(Number(w.amount))}</p>
                  <p className="truncate text-sm text-on-surface-variant">
                    {nomDuMoyen(w.paymentMethod)} · {w.phoneNumber} · {formatDate(w.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-on-surface-variant">Sous 72 h</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Un seul mois n'est pas une evolution : la courbe n'apparait qu'a
          partir de deux, et en cuivre — la couleur de l'argent, ici comme
          partout dans l'atelier. */}
      {chartData.length > 1 && (
        <Section titre="Ce que vous avez gagné, mois par mois">
          <div className="rounded-xl border border-outline bg-surface px-2 pt-5 pb-2">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
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
                    width={44}
                    tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v)), 'Net']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-outline)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(31, 27, 46, 0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-accent)"
                    fill="url(#earningsGradient)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--color-accent-lisible)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      <Section titre="Entrées et sorties">
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline bg-surface px-5 py-8 text-center text-sm text-on-surface-variant">
            Chaque vente apparaîtra ici, avec ce qui vous revient.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-outline-variant rounded-xl border border-outline bg-surface">
              {visibles.map((t) => (
                <LigneDeTransaction key={t.id} t={t} />
              ))}
            </ul>
            {transactions.length > 10 && !toutAfficher && (
              <button
                type="button"
                onClick={() => setToutAfficher(true)}
                className="mt-3 min-h-12 w-full rounded-lg text-sm font-medium text-primary-lisible hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Afficher les {transactions.length - 10} autres
              </button>
            )}
          </>
        )}
      </Section>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Demander un retrait"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outlined" onClick={() => setShowWithdraw(false)}>Annuler</Button>
            <Button onClick={handleWithdraw} isLoading={wLoading}>Confirmer</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {wError && <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">{wError}</p>}
          <Input label="Montant (FCFA)" type="number" inputMode="numeric" value={wAmount} onChange={(e) => setWAmount(e.target.value)} />
          <div>
            <p className="mb-2 block text-sm font-medium text-on-surface" id="moyen-de-versement">Moyen de versement</p>
            <div className="flex gap-3" role="group" aria-labelledby="moyen-de-versement">
              {(['MTN', 'OM'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setWMethod(m)} aria-pressed={wMethod === m}
                  className={`min-h-12 flex-1 rounded-lg border text-sm font-medium transition-colors ${wMethod === m ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-surface text-on-surface-variant hover:bg-surface-container'}`}>
                  {nomDuMoyen(m)}
                </button>
              ))}
            </div>
          </div>
          <Input label="Numéro de téléphone" type="tel" inputMode="tel" autoComplete="tel" value={wPhone} onChange={(e) => setWPhone(e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />

          {/* Le versement est fait a la main par l'equipe. Le dire ici, avant
              l'envoi, evite a l'auteur d'attendre sans savoir combien de temps
              — et evite a l'equipe les messages « ou est mon argent ». */}
          <p className="text-sm text-on-surface-muted">
            Le versement est effectué manuellement sur ce numéro, sous 72 heures.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function nomDuMoyen(code: string) {
  return code === 'MTN' ? 'MTN Mobile Money' : 'Orange Money';
}

/** Meme rubrique que sur l'atelier : une etiquette discrete, jamais un titre. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">{titre}</h2>
      {children}
    </section>
  );
}

/**
 * Une vente, une ligne. Le net d'abord, en cuivre : c'est ce que l'auteur
 * touche. Le brut et la commission en dessous, en petit : ils expliquent, ils
 * ne comptent pas. Un retrait s'ecrit en encre, avec un moins — l'argent est
 * parti vers l'auteur, ce n'est pas une perte a signaler en rouge.
 */
function LigneDeTransaction({ t }: { t: Transaction }) {
  const vente = t.type === 'SALE';
  return (
    <li className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-on-surface">
          {vente ? t.book?.title || 'Vente' : 'Retrait'}
        </p>
        <p className="text-xs text-on-surface-variant">{formatDate(t.createdAt)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${vente ? 'text-accent-lisible' : 'text-on-surface'}`}>
          {vente ? '+' : '−'} {formatCurrency(Number(t.netAmount))}
        </p>
        {vente && Number(t.commission) > 0 && (
          <p className="text-xs tabular-nums text-on-surface-muted">
            sur {formatCurrency(Number(t.amount))}, commission {formatCurrency(Number(t.commission))}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Le solde, et la distance qui reste.
 *
 * Trois etats, trois phrases :
 *
 *   rien encore     — on dit d'ou vient l'argent, pas qu'il n'y en a pas ;
 *   en chemin       — on chiffre ce qui manque, et on le montre ;
 *   retirable       — le bouton, et rien qui le distraie.
 *
 * La barre n'est pas un ornement : elle transforme « 3 200 F » en « les deux
 * tiers du chemin », ce qu'un nombre seul ne dit pas.
 */
function SoldeEtSeuil({
  solde,
  seuil,
  onRetirer,
}: {
  solde: number;
  seuil: number;
  onRetirer: () => void;
}) {
  const peutRetirer = seuil > 0 && solde >= seuil;
  const manque = Math.max(0, seuil - solde);
  const avancement = seuil > 0 ? Math.min(100, (solde / seuil) * 100) : 0;

  return (
    <section className="rounded-xl border border-outline bg-surface p-6">
      <p className="text-sm text-on-surface-muted">Disponible</p>
      <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-accent-lisible lg:text-5xl">
        {formatCurrency(solde)}
      </p>

      {seuil > 0 && !peutRetirer && (
        <div className="mt-5">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-container-high"
            role="progressbar"
            aria-valuenow={Math.round(avancement)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression vers le seuil de retrait de ${formatCurrency(seuil)}`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${avancement}%` }}
            />
          </div>
          <p className="mt-2.5 text-sm text-on-surface-variant">
            {solde === 0
              ? `Vos ventes arrivent ici. Retrait possible à partir de ${formatCurrency(seuil)}.`
              : `Encore ${formatCurrency(manque)} avant de pouvoir retirer.`}
          </p>
        </div>
      )}

      {peutRetirer && (
        <>
          <button
            type="button"
            onClick={onRetirer}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 font-medium text-white transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
          >
            <ArrowDownToLine className="h-4 w-4" aria-hidden />
            Retirer {formatCurrency(solde)}
          </button>
          <p className="mt-2.5 text-sm text-on-surface-muted">
            Versé manuellement sur votre numéro, sous 72 heures.
          </p>
        </>
      )}
    </section>
  );
}
