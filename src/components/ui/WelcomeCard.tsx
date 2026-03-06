import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router';

interface WelcomeCardProps {
  authorName: string;
  booksCount: number;
  monthlyRevenue?: number;
  revenueChange?: number;
}

export function WelcomeCard({
  authorName,
  booksCount,
  monthlyRevenue = 0,
}: WelcomeCardProps) {
  const greeting = getGreeting();

  return (
    <div className="welcome-card relative overflow-hidden p-6 lg:p-8">
      {/* Pattern overlay */}
      <div className="absolute inset-0 pattern-african" />

      {/* Decorative blur blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/15 rounded-full blur-[80px]" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-accent/15 rounded-full blur-[80px]" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Main greeting */}
        <div className="flex-1">
          <p className="text-xs font-medium text-primary-300 uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-2xl font-display font-bold text-white lg:text-3xl">
            {authorName}
          </h1>
          <p className="mt-2 text-sm text-white/50 max-w-md leading-relaxed">
            Voici un apercu de vos performances. Continuez a publier pour atteindre plus de lecteurs.
          </p>

          <Link
            to="/books/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-display font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl hover:scale-[1.02] focus-ring"
          >
            <BookOpen className="h-4 w-4" />
            Publier un livre
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 lg:gap-5">
          <div className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-4 min-w-[100px] border border-white/5">
            <span className="text-3xl font-display font-bold text-white">{booksCount}</span>
            <span className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">Livres</span>
          </div>

          {monthlyRevenue !== undefined && (
            <div className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-4 min-w-[120px] border border-white/5">
              <span className="text-2xl font-display font-bold text-white">
                {new Intl.NumberFormat('fr-CM', {
                  style: 'currency',
                  currency: 'XAF',
                  maximumFractionDigits: 0,
                }).format(monthlyRevenue)}
              </span>
              <span className="text-[11px] text-white/50 mt-1 uppercase tracking-wider">Ce mois</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}
