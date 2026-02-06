import { ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
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
  revenueChange,
}: WelcomeCardProps) {
  const greeting = getGreeting();

  return (
    <div className="welcome-card relative overflow-hidden p-6 lg:p-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Main greeting */}
        <div className="flex-1">
          <p className="text-sm font-medium text-white/70 uppercase tracking-wider">
            {greeting}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white lg:text-3xl">
            {authorName}
          </h1>
          <p className="mt-2 text-sm text-white/80 max-w-md">
            Voici un apercu de vos performances. Continuez a publier pour atteindre plus de lecteurs.
          </p>

          <Link
            to="/books/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl focus-ring"
          >
            <BookOpen className="h-4 w-4" />
            Publier un livre
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 lg:gap-6">
          <div className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-4 min-w-[100px]">
            <span className="text-3xl font-bold text-white">{booksCount}</span>
            <span className="text-xs text-white/70 mt-1">Livres</span>
          </div>

          {monthlyRevenue !== undefined && (
            <div className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-sm px-6 py-4 min-w-[120px]">
              <span className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('fr-CM', {
                  style: 'currency',
                  currency: 'XAF',
                  maximumFractionDigits: 0,
                }).format(monthlyRevenue)}
              </span>
              <span className="text-xs text-white/70 mt-1">Ce mois</span>
              {revenueChange !== undefined && revenueChange !== 0 && (
                <span className={`text-xs font-medium mt-1 flex items-center gap-0.5 ${revenueChange > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  <TrendingUp className={`h-3 w-3 ${revenueChange < 0 ? 'rotate-180' : ''}`} />
                  {revenueChange > 0 ? '+' : ''}{revenueChange}%
                </span>
              )}
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
