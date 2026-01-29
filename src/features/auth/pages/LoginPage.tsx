import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
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
      <h2 className="text-2xl font-bold text-on-surface mb-1">Connexion</h2>
      <p className="text-sm text-on-surface-variant mb-6">Accédez à votre espace auteur</p>

      {error && (
        <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

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
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" fullWidth isLoading={loading}>Se connecter</Button>
      </form>

      <p className="text-sm text-center text-on-surface-variant mt-6">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">S'inscrire</Link>
      </p>
    </div>
  );
}
