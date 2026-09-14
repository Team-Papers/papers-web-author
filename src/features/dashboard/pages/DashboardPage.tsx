import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Bell, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Tranche } from '@/components/atelier/Tranche';
import { ceQuiVousAttend, etatDe } from '@/components/atelier/etat';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMyStats, getMyEarnings } from '@/lib/api/authors';
import { getMyBooks } from '@/lib/api/books';
import { formatCurrency, toNumber } from '@/lib/utils/formatters';
import type { AuthorStats, Book } from '@/types/models';

/**
 * L'atelier.
 *
 * L'ecran ouvrait sur quatre tuiles de chiffres — livres, ventes, revenus,
 * note — puis un graphique. C'est le tableau de bord d'un observateur, pas
 * d'un auteur : il repond a « comment ca va » alors que la question du matin
 * est « qu'est-ce que j'ai a faire ».
 *
 * Il ouvre donc sur ce qui attend une action : un refus a corriger, un
 * brouillon a envoyer. Vient ensuite ce qui est en cours — rien a faire, mais
 * savoir que la relecture avance evite de se demander si on a oublie quelque
 * chose. L'argent ferme la page : il compte, mais il ne demande rien.
 */
export function DashboardPage() {
  const profil = useAuthStore((s) => s.authorProfile);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [solde, setSolde] = useState(0);
  const [livres, setLivres] = useState<Book[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      try {
        const [s, e, b] = await Promise.all([
          getMyStats().catch(() => null),
          getMyEarnings().catch(() => ({ balance: 0, transactions: [] })),
          getMyBooks({ limit: 100 }).catch(() => ({
            data: [],
            total: 0,
            page: 1,
            limit: 100,
            totalPages: 0,
          })),
        ]);
        if (s) setStats(s);
        setSolde(toNumber(e.balance));
        setLivres(b.data);
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  if (chargement) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const attendent = ceQuiVousAttend(livres);
  const enCours = livres.filter((l) => {
    const etat = etatDe(l.status);
    return !etat.vousAttend && etat.suite !== null;
  });
  const enLigne = livres.filter((l) => l.status === 'PUBLISHED').length;
  const prenom = profil?.penName || profil?.user?.firstName || '';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <Entete prenom={prenom} attendent={attendent.length} enLigne={enLigne} />

      {attendent.length > 0 && (
        <Section titre="À vous de jouer">
          {attendent.map((livre) => (
            <LigneDeManuscrit key={livre.id} livre={livre} />
          ))}
        </Section>
      )}

      {enCours.length > 0 && (
        <Section titre="En cours">
          {enCours.map((livre) => (
            <LigneDeManuscrit key={livre.id} livre={livre} />
          ))}
        </Section>
      )}

      {livres.length === 0 && <PremierLivre />}

      <Argent solde={solde} ventes={stats?.totalSales ?? 0} />
    </div>
  );
}

/**
 * L'en-tete dit une chose, celle qui compte ce matin.
 *
 * « Bonjour » suivi de quatre chiffres ne dit rien. Une phrase qui compte ce
 * qui attend se lit d'un coup d'oeil, et disparait quand rien n'attend.
 */
function Entete({
  prenom,
  attendent,
  enLigne,
}: {
  prenom: string;
  attendent: number;
  enLigne: number;
}) {
  const phrase =
    attendent > 0
      ? `${attendent} ${attendent > 1 ? 'manuscrits demandent' : 'manuscrit demande'} votre attention`
      : enLigne > 0
        ? `${enLigne} ${enLigne > 1 ? 'livres en ligne' : 'livre en ligne'}. Rien ne vous attend.`
        : 'Votre atelier est prêt.';

  return (
    <header className="pt-8 pb-7">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-on-surface-muted">Bonjour{prenom ? ` ${prenom}` : ''}</p>
        <Cloche />
      </div>
      <h1 className="mt-1.5 font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
        {phrase}
      </h1>
    </header>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">{titre}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

/**
 * Une ligne de manuscrit.
 *
 * La tranche coloree a gauche porte l'etat ; le reste est du texte. Pas de
 * carte, pas d'ombre, pas de couverture en vignette : ce qu'un auteur cherche
 * ici, c'est un titre et une suite a donner, et une couverture de 40 px n'aide
 * ni a lire l'un ni a comprendre l'autre.
 */
function LigneDeManuscrit({ livre }: { livre: Book }) {
  const etat = etatDe(livre.status);

  return (
    <li>
      <Link
        to={`/books/${livre.id}`}
        className="flex min-h-[64px] items-stretch gap-3 rounded-lg border border-outline bg-surface px-3 py-3 transition-colors hover:border-outline-variant hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Tranche statut={livre.status} />

        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate font-medium text-on-surface">{livre.title}</span>
          <span className="mt-0.5 truncate text-sm" style={{ color: etat.teinte }}>
            {etat.suite ?? etat.mot}
          </span>
        </span>

        <ArrowRight
          className="h-4 w-4 shrink-0 self-center text-on-surface-muted"
          aria-hidden
        />
      </Link>
    </li>
  );
}

/** Un ecran vide est une invitation, pas un constat. */
function PremierLivre() {
  return (
    <section className="rounded-xl border border-dashed border-outline bg-surface px-5 py-10 text-center">
      <h2 className="font-display text-xl font-semibold text-on-surface">
        Rien n&apos;est encore sorti d&apos;ici
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-on-surface-variant">
        Déposez un manuscrit : titre, prix, fichier. Notre équipe le relit, puis il part en vente.
      </p>
      <Link
        to="/books/new"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary transition-transform active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Publier un livre
      </Link>
    </section>
  );
}

/**
 * L'argent, en cuivre et en bas.
 *
 * Il ne demande rien — le mettre en haut ferait ouvrir l'application pour
 * regarder un solde plutot que pour travailler. Mais c'est la raison d'etre
 * du reste, alors il a sa couleur a lui, qui ne sert nulle part ailleurs.
 */
function Argent({ solde, ventes }: { solde: number; ventes: number }) {
  return (
    <section className="mb-4">
      <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">Ce que vous avez gagné</h2>

      <div className="flex items-stretch gap-2">
        <Link
          to="/earnings"
          className="flex flex-1 flex-col justify-center rounded-lg border border-outline bg-surface px-4 py-4 transition-colors hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="text-xs text-on-surface-muted">Disponible</span>
          <span className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent-lisible">
            {formatCurrency(solde)}
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-center rounded-lg border border-outline bg-surface px-4 py-4">
          <span className="text-xs text-on-surface-muted">Ventes</span>
          <span className="mt-1 font-display text-2xl font-semibold tabular-nums text-on-surface">
            {ventes}
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * La cloche du telephone. Le bandeau qui la portait a disparu avec la
 * refonte ; sans elle, un auteur n'apprenait plus une relecture terminee ou
 * une vente qu'en allant voir. Le compte des non-lues vient du meme
 * sondage que la page Activite.
 */
function Cloche() {
  const { unreadCount } = useNotifications();
  return (
    <Link
      to="/notifications"
      aria-label={unreadCount > 0 ? `Activité, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Activité'}
      className="relative -mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 min-w-[18px] rounded-full bg-error px-1 text-center text-[11px] leading-[18px] font-semibold text-on-error">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
