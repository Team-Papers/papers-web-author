import { useState } from 'react';
import { BadgeCheck, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/store/authStore';
import { accepterBluePapers } from '@/lib/api/authors';
import { messageDe } from '@/lib/utils/erreurs';

/**
 * Faire entrer une œuvre dans Blue Papers.
 *
 * L'abonnement ouvrait tout le catalogue. Une collection de neuf volumes à
 * 5 000 FCFA se lisait donc entièrement pour les 3 000 du mois, et son autrice
 * n'avait jamais accepté d'être payée au prorata des pages plutôt qu'au prix
 * de ses livres. Désormais l'abonnement n'ouvre que ce qui est dans le
 * programme, et c'est l'auteur qui y met ce qu'il veut.
 *
 * Deux gestes, volontairement séparés : accepter les conditions une fois, puis
 * inscrire chaque œuvre. Un auteur peut vouloir y mettre un roman-feuilleton
 * et pas le lot qu'il vend 5 000 FCFA le volume — et c'est exactement le cas
 * qui a motivé le programme.
 *
 * On n'affiche aucun bouton de retrait : il n'existe pas. Le dire ici, avant
 * l'inscription, vaut mieux que de le faire découvrir après.
 */
export function CarteBluePapers({
  dedans,
  sujet,
  onRejoindre,
}: {
  /** L'œuvre est déjà dans le programme. */
  dedans: boolean;
  /** « ce livre » ou « cette série », pour que les phrases se lisent. */
  sujet: 'livre' | 'série';
  /** Ce que fait l'inscription côté API ; rend le nombre d'épisodes pour une série. */
  onRejoindre: () => Promise<void>;
}) {
  const authorProfile = useAuthStore((s) => s.authorProfile);
  const fetchAuthorProfile = useAuthStore((s) => s.fetchAuthorProfile);

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [accepte, setAccepte] = useState(Boolean(authorProfile?.bluePapersAcceptedAt));
  const [lu, setLu] = useState(false);

  const ce = sujet === 'livre' ? 'Ce livre' : 'Cette série';
  const le = sujet === 'livre' ? 'ce livre' : 'cette série';

  async function rejoindre() {
    setErreur(null);
    setEnCours(true);

    try {
      if (!accepte) {
        await accepterBluePapers();
        setAccepte(true);
        // Le profil est relu : la date d'accord sert ailleurs, et la garder
        // fraîche évite de redemander les conditions sur le livre suivant.
        await fetchAuthorProfile();
      }

      await onRejoindre();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnCours(false);
    }
  }

  if (dedans) {
    return (
      <section className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-on-surface">
          <BadgeCheck className="h-5 w-5 text-secondary" />
          Dans Blue Papers
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {ce} est compris dans l&apos;abonnement : les lecteurs abonnés
          {sujet === 'livre' ? ' le lisent' : ' lisent ses épisodes'} sans
          l&apos;acheter, et vous touchez une part de l&apos;argent des
          abonnements au prorata des pages lues — au même taux que sur une
          vente. {ce} reste vendable à l&apos;unité.
        </p>
        <p className="mt-2 text-xs text-on-surface-muted">
          Pour en sortir, écrivez à l&apos;équipe Papers : un abonné au milieu
          d&apos;une lecture ne doit pas la voir se refermer du jour au
          lendemain.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-outline/60 bg-surface p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-on-surface">
        <Sparkles className="h-5 w-5 text-primary" />
        Blue Papers — l&apos;abonnement
      </h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        Les lecteurs abonnés à Papers lisent sans acheter ce qui est dans le
        programme. {ce} n&apos;y est pas : l&apos;abonnement ne
        l&apos;ouvre pas, et {le} ne s&apos;obtient qu&apos;en
        l&apos;achetant.
      </p>

      <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 flex-none text-secondary" />
          Vous touchez la part auteur de l&apos;argent des abonnements — le
          même taux que sur une vente — répartie au prorata des pages lues, et
          non le prix du livre à chaque lecture.
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 flex-none text-secondary" />
          {ce} reste en vente à l&apos;unité et dans vos coffrets. Vos ventes
          ne changent pas.
        </li>
        <li className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 flex-none text-secondary" />
          Vous ne pouvez pas l&apos;en retirer vous-même : le retrait passe par
          l&apos;équipe Papers, pour ne pas fermer une lecture en cours.
        </li>
      </ul>

      {!accepte && (
        <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl bg-surface-container p-3 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={lu}
            onChange={(e) => setLu(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none accent-primary"
          />
          <span>
            J&apos;accepte les conditions de Blue Papers, et notamment
            d&apos;être rémunéré au prorata des pages lues pour les lectures
            faites par abonnement.
          </span>
        </label>
      )}

      {erreur && <p className="mt-3 text-sm text-error">{erreur}</p>}

      <Button
        className="mt-4"
        disabled={(!accepte && !lu) || enCours}
        onClick={rejoindre}
        leftIcon={enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
      >
        {sujet === 'livre'
          ? 'Inclure ce livre dans l’abonnement'
          : 'Inclure cette série dans l’abonnement'}
      </Button>
    </section>
  );
}
