import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgotPassword } from '@/lib/api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch { /* still show success */ setSent(true); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-success-container flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Email envoyé</h2>
        <p className="text-sm text-on-surface-variant mb-6">Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.</p>
        <Link to="/login" className="text-primary font-medium hover:underline text-sm">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-on-surface mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-on-surface-variant mb-6">Entrez votre email pour recevoir un lien de réinitialisation</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4" />} required />
        <Button type="submit" fullWidth isLoading={loading}>Envoyer le lien</Button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
