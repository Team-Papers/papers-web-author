import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-display font-bold text-on-surface mb-1">Connexion</h2>
      <p className="text-sm text-on-surface-muted mb-6">Accedez a votre espace auteur</p>

      {error && (
        <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4 animate-fade-up">{error}</div>
      )}

      <button
        type="button"
        disabled={googleLoading}
        onClick={async () => {
          setError('');
          setGoogleLoading(true);
          try {
            await loginWithGoogle();
            navigate('/dashboard');
          } catch {
            setError('Erreur lors de la connexion avec Google');
          } finally {
            setGoogleLoading(false);
          }
        }}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-outline bg-surface text-on-surface font-medium text-sm hover:bg-surface-container transition-colors disabled:opacity-50"
      >
        {googleLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-outline/50" />
        <span className="text-xs text-on-surface-muted">ou</span>
        <div className="flex-1 h-px bg-outline/50" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Mot de passe oublie ?</Link>
        </div>
        <Button type="submit" fullWidth isLoading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Se connecter
        </Button>
      </form>

      <p className="text-sm text-center text-on-surface-muted mt-6">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">S&apos;inscrire</Link>
      </p>
    </div>
  );
}
