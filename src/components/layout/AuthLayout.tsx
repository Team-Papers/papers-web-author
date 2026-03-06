import { Outlet } from 'react-router';
import { BookOpen } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - immersive branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 pattern-african" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <img src="/logo.png" alt="Papers" className="h-7 w-7" />
            </div>
            <div>
              <span className="text-2xl font-display font-bold text-white">Papers<span className="text-primary-400">.</span></span>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Espace Auteur</p>
            </div>
          </div>

          {/* Center content */}
          <div className="max-w-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-6">
              <BookOpen className="w-7 h-7 text-primary-300" />
            </div>
            <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white leading-[1.15] mb-4">
              Publiez vos histoires,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-400">
                touchez l&apos;Afrique
              </span>
            </h2>
            <p className="text-white/50 leading-relaxed">
              Rejoignez la communaute d&apos;auteurs Papers. Publiez, gerez vos ventes et recevez vos revenus directement par Mobile Money.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-display font-bold text-white">200+</p>
              <p className="text-xs text-white/40">Auteurs actifs</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-display font-bold text-white">70%</p>
              <p className="text-xs text-white/40">Revenus a l&apos;auteur</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-2xl font-display font-bold text-white">1500+</p>
              <p className="text-xs text-white/40">Lecteurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-dim">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <img src="/logo.png" alt="Papers" className="h-6 w-6" />
              </div>
              <span className="text-xl font-display font-bold text-on-surface">Papers<span className="text-primary">.</span></span>
            </div>
          </div>

          <div className="bg-surface rounded-2xl shadow-lg border border-outline/50 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
