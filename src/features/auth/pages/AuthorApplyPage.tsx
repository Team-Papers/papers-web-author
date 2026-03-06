import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuthStore } from '@/features/auth/store/authStore';

export function AuthorApplyPage() {
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const applyAsAuthor = useAuthStore((s) => s.applyAsAuthor);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applyAsAuthor({ penName, bio });
      navigate('/pending');
    } catch {
      setError('Erreur lors de la soumission. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <PenLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-on-surface">Devenir auteur</h2>
          <p className="text-sm text-on-surface-muted">Remplissez votre profil d&apos;auteur</p>
        </div>
      </div>

      {error && <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom de plume" value={penName} onChange={(e) => setPenName(e.target.value)} required />
        <Textarea label="Biographie" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} required />
        <Button type="submit" fullWidth isLoading={loading}>Soumettre ma candidature</Button>
      </form>
    </div>
  );
}
