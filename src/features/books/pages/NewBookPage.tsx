import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { createBook, getCategories, uploadCover, uploadBookFile } from '@/lib/api/books';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Category } from '@/types/models';

/**
 * Les cinq etapes, dites par ce qu'elles demandent.
 *
 * « Informations », « Details », « Resume » nommaient des rubriques de
 * formulaire. Un auteur ne sait pas ce qu'on attend de lui sous « Details » ;
 * il sait repondre a « Ce qu'il faut savoir ». Chaque etape porte donc une
 * question, et une phrase qui dit si elle est obligatoire.
 */
const steps = [
  { label: 'Le livre', demande: 'De quoi parle-t-il, et combien coûte-t-il ?', requis: true },
  { label: 'Les détails', demande: 'Langue, nombre de pages, ISBN.', requis: false },
  { label: 'La couverture', demande: "C'est elle qu'on voit d'abord.", requis: false },
  { label: 'Le fichier', demande: 'Le manuscrit, en PDF ou ePub.', requis: false },
  { label: 'Relecture', demande: 'Vérifiez avant d’enregistrer.', requis: true },
];

export function NewBookPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isbn, setIsbn] = useState('');
  const [language, setLanguage] = useState('fr');
  const [pageCount, setPageCount] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCover = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleBookFile = (file: File) => {
    setBookFile(file);
  };

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    setError('');
    if (selectedCats.length === 0) { setError('Sélectionnez au moins une catégorie'); return; }
    setLoading(true);
    try {
      let coverUrl: string | undefined;
      let fileUrl: string | undefined;
      let fileSize: number | undefined;
      let fileFormat: string | undefined;

      if (coverFile) {
        coverUrl = await uploadCover(coverFile);
      }

      if (bookFile) {
        const result = await uploadBookFile(bookFile);
        fileUrl = result.url;
        fileSize = result.size;
        fileFormat = result.format;
      }

      await createBook({
        title,
        description,
        price: Number(price),
        categoryIds: selectedCats,
        coverUrl,
        fileUrl,
        fileSize,
        fileFormat,
        isbn: isbn || undefined,
        language,
        pageCount: pageCount ? Number(pageCount) : undefined,
      });
      navigate('/books');
    } catch {
      setError('Erreur lors de la création du livre');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return title && description && price && selectedCats.length > 0;
    if (step === 1) return true; // details optional
    if (step === 2) return true; // cover optional
    if (step === 3) return true; // file optional for draft
    return true;
  };

  return (
    <div>
      {/*
        Trois dispositifs disaient la meme chose : une barre de progression, un
        pourcentage, et cinq pastilles de 48 px reliees par des traits. Sur un
        telephone, les pastilles mangeaient un quart de l'ecran pour repeter ce
        que « Etape 2 sur 5 » dit en trois mots. Il en reste un.
      */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-32 lg:max-w-3xl lg:px-8 lg:pb-8">
        <header className="pt-8 pb-6">
          <p className="text-sm text-on-surface-muted">
            Étape {step + 1} sur {steps.length}
          </p>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
            {steps[step].label}
          </h1>
          <p className="mt-2 text-on-surface-variant">{steps[step].demande}</p>
          {!steps[step].requis && (
            <p className="mt-1 text-sm text-on-surface-muted">
              Vous pouvez passer et y revenir plus tard.
            </p>
          )}

          <div
            className="mt-5 h-1 overflow-hidden rounded-full bg-surface-container-high"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Étape ${step + 1} sur ${steps.length}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </header>

        {/* Le message du serveur porte la raison exacte — titre deja pris,
            fichier refuse. Un ecran qui calcule une erreur sans l'afficher
            laisse l'auteur cliquer dans le vide. */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        )}

        <Card variant="elevated" className="p-6 animate-fade-up">
          {/* Step 1: Info */}
          {step === 0 && (
            <div className="space-y-4">
              <Input label="Titre du livre" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              <Input label="Prix (FCFA)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Catégories</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                          selectedCats.includes(cat.id)
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface border-outline text-on-surface-variant hover:bg-surface-container'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-on-surface">Détails supplémentaires</h3>
              <p className="text-sm text-on-surface-muted">Ces informations sont optionnelles mais aident les lecteurs.</p>
              <Input label="ISBN (optionnel)" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-..." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Langue</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                    <option value="pt">Portugais</option>
                  </select>
                </div>
                <Input label="Nombre de pages (optionnel)" type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="250" />
              </div>
            </div>
          )}

          {/* Step 3: Cover */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-on-surface">Image de couverture</h3>
              <p className="text-sm text-on-surface-muted">Formats acceptés: JPG, PNG. Taille recommandée: 600x900px</p>
              {coverPreview ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={coverPreview} alt="Preview" className="h-64 rounded-xl shadow-md object-cover" />
                  <Button variant="outlined" onClick={() => { setCoverFile(null); setCoverPreview(''); }}>Changer l'image</Button>
                </div>
              ) : (
                <FileDropzone onFile={handleCover} accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} maxSize={5 * 1024 * 1024} label="Glissez votre image de couverture ici" />
              )}
            </div>
          )}

          {/* Step 4: File */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-display font-semibold text-on-surface">Fichier du livre</h3>
              <p className="text-sm text-on-surface-muted">Formats acceptés: PDF, EPUB. Taille max: 50MB</p>
              {bookFile ? (
                <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm text-on-surface font-medium">{bookFile.name}</span>
                  <Button variant="text" size="sm" onClick={() => setBookFile(null)} className="ml-auto">Supprimer</Button>
                </div>
              ) : (
                <FileDropzone onFile={handleBookFile} accept={{ 'application/pdf': ['.pdf'], 'application/epub+zip': ['.epub'] }} maxSize={50 * 1024 * 1024} label="Glissez votre fichier ici" icon="file" />
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="space-y-6">
              {/* La pastille et son icone repetaient le titre de l'etape,
                  desormais en haut de l'ecran. Une redite de plus. */}
              <div>
                <div>
                  {/* This step creates a draft, it does not publish. Saying
                      "Prêt à publier" let an author believe the book was on its
                      way to readers when it was sitting in their own drafts,
                      waiting for a separate "Soumettre pour révision". */}
                  <h3 className="text-lg font-display font-semibold text-on-surface">
                    Prêt à enregistrer
                  </h3>
                  <p className="text-sm text-on-surface-muted">
                    Vérifiez les informations. Votre livre sera enregistré comme brouillon : vous
                    le soumettrez ensuite à la révision depuis sa fiche.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Cover preview */}
                {coverPreview && (
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 opacity-20 blur group-hover:opacity-30 transition-opacity" />
                      <img src={coverPreview} alt="Cover" className="relative h-48 w-32 rounded-xl object-cover shadow-lg" />
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="col-span-2 p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Titre</p>
                    <p className="text-base font-semibold text-on-surface mt-1">{title}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Prix</p>
                    <p className="text-lg font-bold text-primary mt-1">{formatCurrency(Number(price))}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Langue</p>
                    <p className="text-base font-medium text-on-surface mt-1 uppercase">{language}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Pages</p>
                    <p className="text-base font-medium text-on-surface mt-1">{pageCount || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Fichier</p>
                    <p className="text-sm font-medium text-on-surface mt-1 truncate">{bookFile ? bookFile.name : 'Aucun'}</p>
                  </div>
                  <div className="col-span-2 p-4 rounded-xl bg-surface-container">
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Description</p>
                    <p className="text-sm text-on-surface mt-1 line-clamp-3">{description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

      </div>

      {/*
        Les boutons descendent au bas de l'ecran et y restent. Ils etaient a la
        suite du formulaire : sur l'etape des categories, il fallait faire
        defiler une trentaine de pastilles pour retrouver « Suivant », et
        recommencer a chaque etape.

        L'action qui avance est a droite, sous le pouce d'un droitier ; celle
        qui recule, loin de lui. Se tromper de sens coute un aller-retour, pas
        un manuscrit.
      */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg lg:static lg:border-0 lg:bg-transparent lg:px-8 lg:pb-8 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl items-center gap-3 lg:max-w-3xl lg:px-0">
          <Button
            variant="outlined"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate('/books'))}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>

          <div className="flex-1" />

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={loading}>
              Enregistrer le livre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
