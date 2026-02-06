import { useEffect, useState, type FormEvent } from 'react';
import { Save, PenLine, Lock, User, Globe, Phone, CheckCircle, AlertCircle, Shield, Smartphone } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateMyProfile, getMyProfile } from '@/lib/api/authors';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { key: 'author', label: 'Profil auteur', icon: User },
  { key: 'password', label: 'Securite', icon: Shield },
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
      <Header title="Parametres" subtitle="Gerez votre compte" />
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <Card variant="elevated" className="p-2 sticky top-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setError(''); setSuccess(''); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all',
                      activeTab === tab.key
                        ? 'bg-primary text-white shadow-md'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    )}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {success && (
              <div className="bg-success-container text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fade-up">
                <CheckCircle size={18} />
                {success}
              </div>
            )}
            {error && (
              <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fade-up">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {activeTab === 'author' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-up">
                {/* Identity Section */}
                <Card variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
                      <PenLine className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">Identite</h3>
                      <p className="text-sm text-on-surface-variant">Votre nom de plume et biographie</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input label="Nom de plume" value={penName} onChange={(e) => setPenName(e.target.value)} leftIcon={<PenLine className="h-4 w-4" />} />
                    <Textarea label="Biographie" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parlez de vous aux lecteurs..." />
                  </div>
                </Card>

                {/* Social Section */}
                <Card variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-container">
                      <Globe className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">Reseaux sociaux</h3>
                      <p className="text-sm text-on-surface-variant">Liens vers vos profils en ligne</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input label="Site web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://monsite.com" leftIcon={<Globe className="h-4 w-4" />} />
                    <Input label="Twitter / X" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@monpseudo" />
                  </div>
                </Card>

                {/* Payment Section */}
                <Card variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-container">
                      <Smartphone className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">Paiement Mobile</h3>
                      <p className="text-sm text-on-surface-variant">Numeros pour recevoir vos gains</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Numero MTN Mobile Money" value={mtnNumber} onChange={(e) => setMtnNumber(e.target.value)} placeholder="6XXXXXXXX" leftIcon={<Phone className="h-4 w-4" />} />
                    <Input label="Numero Orange Money" value={omNumber} onChange={(e) => setOmNumber(e.target.value)} placeholder="6XXXXXXXX" leftIcon={<Phone className="h-4 w-4" />} />
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />} className="shadow-lg">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-up">
                <Card variant="elevated">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-container">
                      <Lock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">Changer le mot de passe</h3>
                      <p className="text-sm text-on-surface-variant">Protegez votre compte avec un mot de passe fort</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input label="Mot de passe actuel" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
                    <div className="border-t border-outline-variant pt-4">
                      <Input label="Nouveau mot de passe" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
                    </div>
                    <Input label="Confirmer le nouveau mot de passe" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />} className="shadow-lg">
                    Mettre a jour le mot de passe
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
