import { useEffect, useState, type FormEvent } from 'react';
import { Copy, Check, ExternalLink, ImagePlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { updateMyProfile, getMyProfile } from '@/lib/api/authors';
import { uploadCover } from '@/lib/api/books';
import { forgotPassword } from '@/lib/api/auth';
import { messageDe } from '@/lib/utils/erreurs';
import { pagePublique } from '@/lib/site';
import { cn } from '@/lib/utils/cn';

/**
 * Le profil de l'auteur.
 *
 * L'écran s'appelait « Paramètres » et rangeait deux onglets dans une colonne
 * de bureau. Il ouvre désormais sur ce qui sert le plus un auteur : l'adresse
 * de sa page publique, à partager. Viennent ensuite ce que les lecteurs
 * voient de lui, où il reçoit son argent, l'apparence, et le compte.
 *
 * L'onglet « Sécurité » annonçait « Mot de passe mis à jour » sans appeler
 * l'API, qui n'a pas d'endpoint pour cela. Le seul chemin qui existe est
 * celui du mot de passe oublié — un lien par e-mail. La page l'emprunte, et
 * le dit.
 */
export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const authorProfile = useAuthStore((s) => s.authorProfile);
  const fetchAuthorProfile = useAuthStore((s) => s.fetchAuthorProfile);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [slug, setSlug] = useState<string | null | undefined>(authorProfile?.slug);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [penName, setPenName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [mtnNumber, setMtnNumber] = useState('');
  const [omNumber, setOmNumber] = useState('');

  const [lienEnvoye, setLienEnvoye] = useState(false);
  const [envoiLien, setEnvoiLien] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setSlug(p.slug);
        setPhotoUrl(p.photoUrl || null);
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
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateMyProfile({ penName, bio, website, twitter, mtnNumber, omNumber });
      await fetchAuthorProfile();
      setSuccess('Profil enregistré.');
    } catch (err) {
      setError(messageDe(err));
    } finally {
      setSaving(false);
    }
  };

  /** La photo est ce que la carte de partage de la page auteur montre. */
  const changerPhoto = async (fichier: File) => {
    setEnvoiPhoto(true);
    setError('');
    try {
      const nom = await uploadCover(fichier);
      const p = await updateMyProfile({ photoUrl: nom });
      setPhotoUrl(p.photoUrl || null);
      await fetchAuthorProfile();
    } catch (err) {
      setError(messageDe(err));
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const demanderLien = async () => {
    if (!user?.email) return;
    setEnvoiLien(true);
    setError('');
    try {
      await forgotPassword(user.email);
      setLienEnvoye(true);
    } catch (err) {
      setError(messageDe(err));
    } finally {
      setEnvoiLien(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

  const profilPublic = authorProfile ? { id: authorProfile.id, slug } : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="pt-8 pb-6">
        <h1 className="font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
          Profil
        </h1>
      </header>

      {success && (
        <p role="status" className="mb-6 rounded-lg border border-success/30 bg-success-container px-4 py-3 text-sm text-success">
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-error-container px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {/* Le premier renseignement de la page n'est pas un formulaire : c'est
          l'adresse que l'auteur va donner a ses lecteurs. */}
      {profilPublic && <PagePublique url={pagePublique(profilPublic)} nom={penName || user?.firstName || ''} />}

      <form onSubmit={handleSaveProfile}>
        <Rubrique titre="Ce que les lecteurs voient de vous">
          <div className="space-y-4 rounded-xl border border-outline bg-surface p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline bg-surface px-4 text-sm font-medium text-on-surface hover:bg-surface-dim">
                <ImagePlus className="h-4 w-4" aria-hidden />
                {envoiPhoto ? 'Envoi…' : photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={envoiPhoto}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void changerPhoto(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <Input label="Nom de plume" value={penName} onChange={(e) => setPenName(e.target.value)} autoComplete="nickname" />
            <Textarea label="Biographie" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Qui vous êtes, ce que vous écrivez." />
            <Input label="Site web" type="url" inputMode="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            <Input label="X (Twitter)" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@" />
          </div>
        </Rubrique>

        <Rubrique titre="Où recevoir vos gains">
          <div className="space-y-4 rounded-xl border border-outline bg-surface p-5">
            <Input label="Numéro MTN Mobile Money" type="tel" inputMode="tel" value={mtnNumber} onChange={(e) => setMtnNumber(e.target.value)} placeholder="6XX XXX XXX" />
            <Input label="Numéro Orange Money" type="tel" inputMode="tel" value={omNumber} onChange={(e) => setOmNumber(e.target.value)} placeholder="6XX XXX XXX" />
            <p className="text-sm text-on-surface-muted">
              Les versements sont faits à la main sur l’un de ces numéros, sous 72 heures après votre demande.
            </p>
          </div>
        </Rubrique>

        <div className="mt-4">
          <Button type="submit" isLoading={saving} className="min-h-12 w-full sm:w-auto">
            Enregistrer
          </Button>
        </div>
      </form>

      <Rubrique titre="Apparence">
        <Apparence />
      </Rubrique>

      <Rubrique titre="Compte">
        <div className="rounded-xl border border-outline bg-surface">
          <div className="px-5 py-4">
            <p className="text-sm text-on-surface-muted">Adresse e-mail</p>
            <p className="mt-0.5 text-on-surface">{user?.email}</p>
          </div>
          <div className="border-t border-outline-variant px-5 py-4">
            {lienEnvoye ? (
              <p role="status" className="text-sm text-on-surface">
                Un lien pour choisir un nouveau mot de passe vient de partir vers {user?.email}. Il est valable une heure.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={demanderLien}
                  disabled={envoiLien}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-primary-lisible hover:underline disabled:opacity-50"
                >
                  {envoiLien ? 'Envoi…' : 'Changer de mot de passe'}
                </button>
                <p className="mt-1 text-sm text-on-surface-muted">
                  Vous recevrez un lien par e-mail pour en choisir un nouveau.
                </p>
              </>
            )}
          </div>
          <div className="border-t border-outline-variant px-5 py-4">
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-error hover:underline"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </Rubrique>

      <Modal isOpen={showLogout} onClose={() => setShowLogout(false)} title="Se déconnecter ?"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outlined" onClick={() => setShowLogout(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => logout()}>Se déconnecter</Button>
          </div>
        }
      >
        <p className="text-sm text-on-surface-variant">Vous pourrez vous reconnecter avec votre adresse e-mail.</p>
      </Modal>
    </div>
  );
}

/**
 * L'adresse publique, et les deux gestes qui la font circuler : partager
 * (la feuille native du telephone) et copier. C'est le levier de croissance
 * le moins cher de la plateforme : un auteur qui partage sa page amene ses
 * propres lecteurs.
 */
function PagePublique({ url, nom }: { url: string; nom: string }) {
  const [copie, setCopie] = useState(false);
  const peutPartager = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Sans presse-papiers (contexte non securise), le lien reste selectionnable.
    }
  }

  async function partager() {
    try {
      await navigator.share({ title: nom ? `${nom} sur Papers` : 'Ma page sur Papers', url });
    } catch {
      // L'auteur a ferme la feuille de partage : rien a signaler.
    }
  }

  return (
    <section className="rounded-xl border border-outline bg-surface p-5">
      <h2 className="text-sm font-semibold text-on-surface-variant">Votre page publique</h2>
      <p className="mt-2 font-display text-lg font-semibold text-on-surface">
        Donnez cette adresse à vos lecteurs.
      </p>
      <p className="mt-1 text-sm text-on-surface-variant">
        Ils y trouvent tous vos livres, et peuvent vous suivre pour être prévenus des prochains.
      </p>
      <p className="mt-3 truncate rounded-lg bg-surface-container px-3 py-2 font-mono text-sm text-on-surface select-all">
        {url.replace(/^https?:\/\//, '')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {peutPartager && (
          <button
            type="button"
            onClick={partager}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Partager
          </button>
        )}
        <button
          type="button"
          onClick={copier}
          className={cn(
            'inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium',
            peutPartager ? 'border-outline bg-surface text-on-surface' : 'border-primary bg-primary text-on-primary',
          )}
        >
          {copie ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copie ? 'Copié' : 'Copier le lien'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-lisible hover:underline"
        >
          Voir ma page
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}

function Apparence() {
  const { rawTheme, setTheme } = useTheme();
  const choix = [
    { cle: 'system', libelle: 'Comme le téléphone' },
    { cle: 'light', libelle: 'Clair' },
    { cle: 'dark', libelle: 'Sombre' },
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Thème">
      {choix.map(({ cle, libelle }) => (
        <button
          key={cle}
          type="button"
          onClick={() => setTheme(cle)}
          aria-pressed={rawTheme === cle}
          className={cn(
            'min-h-11 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
            rawTheme === cle
              ? 'border-primary bg-primary text-on-primary'
              : 'border-outline bg-surface text-on-surface-variant hover:bg-surface-dim',
          )}
        >
          {libelle}
        </button>
      ))}
    </div>
  );
}

function Rubrique({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">{titre}</h2>
      {children}
    </section>
  );
}
