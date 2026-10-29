import { useMemo, useState } from 'react';
import { Layers, Plus, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getAllMyBooks, uploadCover } from '@/lib/api/books';
import {
  creerCoffret,
  getMesCoffrets,
  modifierCoffret,
  supprimerCoffret,
  type Coffret,
} from '@/lib/api/coffrets';
import { messageDe } from '@/lib/utils/erreurs';
import { formatCurrency } from '@/lib/utils/formatters';
import { BookStatus, type Book } from '@/types/models';
import { cn } from '@/lib/utils/cn';

/**
 * Les coffrets de l'auteur.
 *
 * Un auteur qui publie une collection de neuf volumes à 5 000 FCFA n'avait
 * aucune façon de les vendre ensemble : son lecteur devait faire neuf achats
 * et neuf confirmations mobile money, pour 45 000 FCFA. Personne ne va au
 * bout. Un coffret se paie une fois, au prix que l'auteur fixe, et dépose
 * tous ses livres dans la bibliothèque.
 *
 * L'écran dit d'emblée les deux règles qui comptent, parce qu'elles sont
 * irréversibles : un coffret vendu ne change plus, et on le retire de la vente
 * au lieu de le supprimer.
 */
export function MesCoffretsPage() {
  const { data: coffrets, loading, setData } = useAsyncData<Coffret[]>(getMesCoffrets, [], []);
  const { data: livres } = useAsyncData<Book[]>(
    () => getAllMyBooks({ status: BookStatus.PUBLISHED }),
    [],
    [],
  );

  const [ouvert, setOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Coffret | null>(null);

  // Un coffret ne contient que des livres publiés et hors série : c'est ce que
  // l'API accepte, et le dire ici évite de laisser choisir un titre qui sera
  // refusé à l'envoi.
  const eligibles = useMemo(
    () => livres.filter((l) => l.status === BookStatus.PUBLISHED && !l.seriesId),
    [livres],
  );

  async function recharger() {
    setData(await getMesCoffrets());
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="flex items-baseline justify-between gap-4 pt-8 pb-6">
        <h1 className="font-display text-[28px] font-semibold text-on-surface lg:text-4xl">
          Coffrets
        </h1>
        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setOuvert(true)}
          disabled={eligibles.length < 2}
        >
          Nouveau coffret
        </Button>
      </header>

      {eligibles.length < 2 && (
        <p className="mb-6 rounded-xl border border-outline bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
          Un coffret réunit au moins deux livres publiés. Publiez-en un second
          et vous pourrez les vendre ensemble.
        </p>
      )}

      {coffrets.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Aucun coffret"
          description="Vendez plusieurs de vos livres en un seul paiement, à un prix d'ensemble. Vos lecteurs les reçoivent tous d'un coup."
        />
      ) : (
        <ul className="space-y-3">
          {coffrets.map((coffret) => (
            <li key={coffret.id}>
              <button
                type="button"
                onClick={() => setEnEdition(coffret)}
                className="flex w-full items-center gap-4 rounded-xl border border-outline bg-surface p-4 text-left hover:bg-surface-dim"
              >
                <span className="flex h-16 w-12 flex-none items-center justify-center overflow-hidden rounded-md bg-surface-container-high">
                  {coffret.coverUrl ? (
                    <img src={coffret.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Layers className="h-5 w-5 text-on-surface-muted" aria-hidden />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display font-semibold text-on-surface">
                    {coffret.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-on-surface-muted">
                    {coffret.nombreDeLivres} livres · {formatCurrency(coffret.price)}
                    {coffret.economie > 0 && (
                      <> · {formatCurrency(coffret.economie)} de moins qu&apos;à l&apos;unité</>
                    )}
                  </span>
                  <span className="mt-1 block text-sm">
                    {coffret.isActive ? (
                      <span className="text-success">En vente</span>
                    ) : (
                      <span className="text-on-surface-muted">Retiré de la vente</span>
                    )}
                    {(coffret.ventes ?? 0) > 0 && (
                      <span className="text-on-surface-variant">
                        {' '}
                        · {coffret.ventes} vendu{(coffret.ventes ?? 0) > 1 ? 's' : ''} ·{' '}
                        {formatCurrency(coffret.recette ?? 0)} encaissés
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {ouvert && (
        <FormulaireDeCoffret
          livres={eligibles}
          onClose={() => setOuvert(false)}
          onFini={recharger}
        />
      )}

      {enEdition && (
        <FormulaireDeCoffret
          coffret={enEdition}
          livres={eligibles}
          onClose={() => setEnEdition(null)}
          onFini={recharger}
        />
      )}
    </div>
  );
}

/**
 * Composer ou modifier un coffret.
 *
 * Le même formulaire pour les deux : ce qu'on remplit est identique, et une
 * seconde copie aurait divergé. Quand le coffret a déjà été vendu, les champs
 * du fond sont grisés plutôt que refusés à l'envoi — l'auteur voit tout de
 * suite ce qui est encore à lui.
 */
function FormulaireDeCoffret({
  coffret,
  livres,
  onClose,
  onFini,
}: {
  coffret?: Coffret;
  livres: Book[];
  onClose: () => void;
  onFini: () => Promise<void>;
}) {
  const fige = coffret ? coffret.modifiable === false : false;

  const [titre, setTitre] = useState(coffret?.title ?? '');
  const [description, setDescription] = useState(coffret?.description ?? '');
  const [prix, setPrix] = useState(String(coffret?.price ?? ''));
  const [couverture, setCouverture] = useState(coffret?.coverUrl ?? '');
  /**
   * Ce qu'on montre, qui n'est pas ce qu'on envoie.
   *
   * Le téléversement rend un *nom de fichier* — c'est ce que l'API range et
   * ce que le site transforme en adresse au moment de servir. Le donner tel
   * quel à `<img src>` affichait une image cassée : l'auteur venait de
   * choisir sa couverture et voyait l'icône du navigateur pour un fichier
   * introuvable. L'aperçu vient donc du fichier local, comme sur le
   * formulaire d'un livre.
   */
  const [apercu, setApercu] = useState(coffret?.coverUrl ?? '');
  const [choisis, setChoisis] = useState<string[]>(coffret?.books.map((l) => l.id) ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const somme = useMemo(
    () =>
      livres
        .filter((l) => choisis.includes(l.id))
        .reduce((total, l) => total + Number(l.price || 0), 0),
    [livres, choisis],
  );

  const prixNombre = Number(prix) || 0;
  const economie = Math.max(0, somme - prixNombre);
  const valide = titre.trim().length > 0 && choisis.length >= 2 && prix !== '';

  function basculer(id: string) {
    setChoisis((actuels) =>
      actuels.includes(id) ? actuels.filter((x) => x !== id) : [...actuels, id],
    );
  }

  async function televerser(fichier: File) {
    setErreur(null);
    setApercu(URL.createObjectURL(fichier));
    try {
      setCouverture(await uploadCover(fichier));
    } catch (e) {
      setErreur(messageDe(e));
      setApercu(coffret?.coverUrl ?? '');
    }
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      const corps = {
        title: titre.trim(),
        description: description.trim() || null,
        coverUrl: couverture || null,
        price: prixNombre,
        // L'ordre des cases cochées est l'ordre de lecture : volume I, II, III.
        bookIds: choisis,
      };

      if (coffret) {
        await modifierCoffret(coffret.id, fige ? {} : corps);
      } else {
        await creerCoffret(corps);
      }

      await onFini();
      onClose();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  async function retirerDeLaVente() {
    if (!coffret) return;
    setEnvoi(true);
    try {
      await modifierCoffret(coffret.id, { isActive: !coffret.isActive });
      await onFini();
      onClose();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer() {
    if (!coffret) return;
    setEnvoi(true);
    try {
      await supprimerCoffret(coffret.id);
      await onFini();
      onClose();
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={coffret ? 'Le coffret' : 'Nouveau coffret'}
      size="lg"
    >
      <form onSubmit={soumettre} className="space-y-4">
        {erreur && (
          <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-error">
            {erreur}
          </p>
        )}

        {fige && (
          <p className="rounded-lg border border-outline bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            Ce coffret a déjà été acheté : son contenu et son prix ne peuvent
            plus changer — quelqu&apos;un a payé cet ensemble à ce prix. Vous
            pouvez encore le retirer de la vente ; il restera dans la
            bibliothèque de ceux qui l&apos;ont payé.
          </p>
        )}

        <Input
          label="Titre du coffret"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Collection complète — les 9 volumes"
          disabled={fige}
          required
        />

        <Textarea
          label="Présentation (facultative)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={fige}
        />

        <div>
          <span className="mb-2 block text-sm font-medium text-on-surface">
            Les livres du coffret
          </span>
          <ul className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-outline p-2">
            {livres.map((livre) => {
              const coche = choisis.includes(livre.id);
              return (
                <li key={livre.id}>
                  <button
                    type="button"
                    // Un bouton qui ne dit pas s'il est enfoncé ne dit rien :
                    // celui-ci s'annonçait « bouton, Volume I », coché ou
                    // non, et rien dans la page ne permettait de retrouver la
                    // sélection autrement qu'en regardant la couleur.
                    aria-pressed={coche}
                    disabled={fige}
                    onClick={() => basculer(livre.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                      coche ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-dim',
                      fige && 'cursor-not-allowed opacity-70',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-5 w-5 flex-none items-center justify-center rounded border',
                        coche ? 'border-primary bg-primary text-white' : 'border-outline',
                      )}
                    >
                      {coche && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{livre.title}</span>
                    <span className="flex-none text-on-surface-muted">
                      {formatCurrency(Number(livre.price) || 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-xs text-on-surface-muted">
            Deux livres au moins. Les épisodes de série n&apos;y entrent pas :
            ils s&apos;ouvrent depuis leur série.
          </p>
        </div>

        <Input
          label="Prix du coffret (FCFA)"
          type="number"
          inputMode="numeric"
          min={0}
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          disabled={fige}
          required
        />

        {/* Ce que le lecteur verra : la somme des volumes, et la remise. C'est
            la raison d'être du coffret, donc elle s'affiche pendant qu'on fixe
            le prix, pas après. */}
        {choisis.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-container p-4 text-sm">
            <div>
              <dt className="text-on-surface-muted">Les volumes à l&apos;unité</dt>
              <dd className="font-display text-lg font-semibold text-on-surface">
                {formatCurrency(somme)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-muted">Le lecteur économise</dt>
              <dd
                className={cn(
                  'font-display text-lg font-semibold',
                  economie > 0 ? 'text-success' : 'text-on-surface-muted',
                )}
              >
                {formatCurrency(economie)}
              </dd>
            </div>
          </dl>
        )}

        <div>
          <span className="mb-2 block text-sm font-medium text-on-surface">
            Couverture du coffret (facultative)
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-20 w-14 flex-none items-center justify-center overflow-hidden rounded-md bg-surface-container-high">
              {apercu ? (
                <img src={apercu} alt="" className="h-full w-full object-cover" />
              ) : (
                <Layers className="h-5 w-5 text-on-surface-muted" aria-hidden />
              )}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={fige}
              onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (fichier) void televerser(fichier);
              }}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            {!fige && (
              <Button type="submit" isLoading={envoi} disabled={!valide}>
                {coffret ? 'Enregistrer' : 'Créer le coffret'}
              </Button>
            )}
            <Button type="button" variant="text" onClick={onClose}>
              Fermer
            </Button>
          </div>

          {coffret && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outlined"
                onClick={retirerDeLaVente}
                disabled={envoi}
              >
                {coffret.isActive ? 'Retirer de la vente' : 'Remettre en vente'}
              </Button>
              {!fige && (
                <Button type="button" variant="danger" onClick={supprimer} disabled={envoi}>
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
