import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/features/auth/store/authStore';

export function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password });
      navigate('/apply');
    } catch {
      setError('Erreur lors de l\'inscription. Vérifiez vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-on-surface mb-1">Inscription</h2>
      <p className="text-sm text-on-surface-variant mb-6">Créez votre compte Papers</p>

      {error && <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" value={form.firstName} onChange={update('firstName')} leftIcon={<User className="h-4 w-4" />} required />
          <Input label="Nom" value={form.lastName} onChange={update('lastName')} required />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={update('email')} leftIcon={<Mail className="h-4 w-4" />} required />
        <Input label="Mot de passe" type="password" value={form.password} onChange={update('password')} leftIcon={<Lock className="h-4 w-4" />} required />
        <Input label="Confirmer" type="password" value={form.confirm} onChange={update('confirm')} leftIcon={<Lock className="h-4 w-4" />} required />
        <Button type="submit" fullWidth isLoading={loading}>Créer mon compte</Button>
      </form>

      <p className="text-sm text-center text-on-surface-variant mt-6">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
