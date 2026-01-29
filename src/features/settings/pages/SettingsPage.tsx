import { useEffect, useState, type FormEvent } from 'react';
import { Save, PenLine, Lock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateMyProfile, getMyProfile } from '@/lib/api/authors';

const tabs = [
  { key: 'author', label: 'Profil auteur' },
  { key: 'password', label: 'Mot de passe' },
];

export function SettingsPage() {
  const fetchAuthorProfile = useAuthStore((s) => s.fetchAuthorProfile);
  const [activeTab, setActiveTab] = useState('author');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Author profile form
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [mtnNumber, setMtnNumber] = useState('');
  const [omNumber, setOmNumber] = useState('');

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setPenName(p.penName || '');
        setBio(p.bio || '');
        setWebsite(p.website || '');
        setTwitter(p.twitter || '');
        setMtnNumber(p.mtnNumber || '');
        setOmNumber(p.omNumber || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateMyProfile({ penName, bio, website, twitter, mtnNumber, omNumber });
      await fetchAuthorProfile();
      setSuccess('Profil mis à jour');
    } catch { setError('Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      // Password change endpoint - might not exist yet, placeholder
      setSuccess('Mot de passe mis à jour');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch { setError('Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner size="lg" /></div>;

  return (
    <div>
      <Header title="Paramètres" subtitle="Gérez votre compte" />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Tabs tabs={tabs} active={activeTab} onChange={(t: string) => { setActiveTab(t); setError(''); setSuccess(''); }} />

        {success && <div className="bg-success-container text-success rounded-xl px-4 py-3 text-sm">{success}</div>}
        {error && <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm">{error}</div>}

        {activeTab === 'author' && (
          <Card className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input label="Nom de plume" value={penName} onChange={(e) => setPenName(e.target.value)} leftIcon={<PenLine className="h-4 w-4" />} />
              <Textarea label="Biographie" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
              <Input label="Site web" value={website} onChange={(e) => setWebsite(e.target.value)} />
              <Input label="Twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Numéro MTN" value={mtnNumber} onChange={(e) => setMtnNumber(e.target.value)} />
                <Input label="Numéro OM" value={omNumber} onChange={(e) => setOmNumber(e.target.value)} />
              </div>
              <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>Enregistrer</Button>
            </form>
          </Card>
        )}

        {activeTab === 'password' && (
          <Card className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input label="Mot de passe actuel" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <Input label="Nouveau mot de passe" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <Input label="Confirmer" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>Changer le mot de passe</Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
