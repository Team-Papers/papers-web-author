import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Etapes } from '@/components/atelier/Etapes';
import { getBookById, updateBook, getCategories, uploadCover, uploadBookFile } from '@/lib/api/books';
import { cn } from '@/lib/utils/cn';
import { messageDe } from '@/lib/utils/erreurs';
import { formatCurrency } from '@/lib/utils/formatters';
import type { BookCategoryLink, Book, Category } from '@/types/models';
import { BookStatus } from '@/types/models';
import { ETAPES_DU_LIVRE as steps } from '../etapes';

export function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [book, setBook] = useState<Book | null>(null);

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
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [existingFileUrl, setExistingFileUrl] = useState('');

  useEffect(() => {
    if (!id) return;

    // Cet ecran remplit une dizaine de champs depuis une seule reponse :
    // useAsyncData, qui expose une valeur unique, ne lui convient pas. La garde
    // est donc ecrite ici, mais pour la meme raison — naviguer d'un livre a
    // l'autre laisse deux requetes en vol, et celle du livre quitte peut
    // revenir en dernier et remplir le formulaire avec ses valeurs.
    let obsolete = false;

    Promise.all([getBookById(id), getCategories()])
      .then(([bookData, cats]) => {
        if (obsolete) return;
        setBook(bookData);
        setCategories(cats);
        // Populate form
        setTitle(bookData.title);
        setDescription(bookData.description || '');
        setPrice(String(bookData.price));
        setIsbn(bookData.isbn || '');
        setLanguage(bookData.language || 'fr');
        setPageCount(bookData.pageCount ? String(bookData.pageCount) : '');
        setExistingCoverUrl(bookData.coverUrl || '');
        setExistingFileUrl(bookData.fileUrl || '');
        // Extract category IDs
        const catIds = (bookData.categories || []).map((c: BookCategoryLink) =>
          'category' in c ? c.category.id : c.id
        );
        setSelectedCats(catIds);
      })
      .catch(() => {
        if (!obsolete) setBook(null);
      })
      .finally(() => {
        if (!obsolete) setLoading(false);
      });

    return () => {
      obsolete = true;
    };
  }, [id]);

  const handleCover = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleBookFile = (file: File) => {
    setBookFile(file);
  };

  const toggleCat = (catId: string) => {
    setSelectedCats((prev) => prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]);
  };

  const handleSubmit = async () => {
    if (!id || !book) return;
    setError('');
    if (selectedCats.length === 0) { setError('Sélectionnez au moins une catégorie'); return; }
    setSaving(true);
    try {
      let coverUrl = existingCoverUrl;
      let fileUrl = existingFileUrl;
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

      await updateBook(id, {
        title,
        description,
        price: Number(price),
        categoryIds: selectedCats,
        coverUrl: coverUrl || undefined,
        fileUrl: fileUrl || undefined,
        fileSize,
        fileFormat,
        isbn: isbn || undefined,
        language,
        pageCount: pageCount ? Number(pageCount) : undefined,
      });
      navigate(`/books/${id}`);
    } catch (e) {
      setError(messageDe(e));
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return title && description && price && selectedCats.length > 0;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-on-surface-variant">Ce livre n’existe pas, ou n’est pas à vous.</p>
      </div>
    );
  }

  // Only DRAFT and REJECTED books can be edited
  if (book.status !== BookStatus.DRAFT && book.status !== BookStatus.REJECTED) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-on-surface-variant">Ce livre est en relecture ou en vente : il ne se modifie plus. Retirez-le de la vente pour le reprendre.</p>
        <Button onClick={() => navigate(`/books/${id}`)}>Retour au livre</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Meme coquille que l'assistant de publication : une etape, une
          question, une barre. Modifier un livre est le meme geste que le
          publier, avec les champs deja remplis. */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-32 lg:max-w-3xl lg:px-8 lg:pb-8">
        <header className="pt-8 pb-6">
          <p className="text-sm text-on-surface-muted">
            Étape {step + 1} sur {steps.length} · {book.title}
          </p>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
            {steps[step].label}
          </h1>
          <p className="mt-2 text-on-surface-variant">{steps[step].demande}</p>
          {!steps[step].requis && (
            <p className="mt-1 text-sm text-on-surface-muted">Vous pouvez passer et y revenir plus tard.</p>
          )}
          {/* Tout est déjà rempli : l'ordre n'a plus rien à protéger, et
              l'auteur qui vient corriger son prix ne doit pas traverser quatre
              écrans pour l'atteindre — ni quatre autres pour enregistrer. */}
          <Etapes etapes={steps} courante={step} atteignable={() => true} onAller={setStep} />
        </header>

        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-error">
            {error}
          </p>
        )}

        <section className="rounded-xl border border-outline bg-surface p-5">
          {step === 0 && (
            <div className="space-y-4">
              <Input label="Titre du livre" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              <Input label="Prix (FCFA)" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} required />
              {categories.length > 0 && (
                <div>
                  <p className="mb-2 block text-sm font-medium text-on-surface" id="categories-livre">Catégories</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="categories-livre">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        aria-pressed={selectedCats.includes(cat.id)}
                        className={cn(
                          'min-h-10 rounded-full border px-4 text-sm font-medium transition-colors',
                          selectedCats.includes(cat.id)
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline bg-surface text-on-surface-variant hover:bg-surface-dim',
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

          {step === 1 && (
            <div className="space-y-4">
              <Input label="ISBN" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-…" helper="Si le livre en a un." />
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-on-surface">Langue</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-outline bg-surface px-3 text-on-surface focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                    <option value="pt">Portugais</option>
                  </select>
                </label>
                <Input label="Pages" type="number" inputMode="numeric" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="250" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-muted">JPG ou PNG, 600 × 900 px de préférence, 5 Mo au plus.</p>
              {coverPreview || existingCoverUrl ? (
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                  <img src={coverPreview || existingCoverUrl} alt="" className="h-56 rounded-lg object-cover" />
                  <Button variant="outlined" onClick={() => { setCoverFile(null); setCoverPreview(''); setExistingCoverUrl(''); }}>
                    Changer la couverture
                  </Button>
                </div>
              ) : (
                <FileDropzone onFile={handleCover} accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} maxSize={5 * 1024 * 1024} label="Déposez la couverture ici" />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-muted">PDF ou ePub, 50 Mo au plus.</p>
              {bookFile ? (
                <div className="flex items-center gap-3 rounded-lg bg-surface-container p-4">
                  <Upload className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">{bookFile.name}</span>
                  <Button variant="text" size="sm" onClick={() => setBookFile(null)}>Retirer</Button>
                </div>
              ) : existingFileUrl ? (
                // Le nom du fichier stocke est prive : on dit qu'il existe, pas ou il est.
                <div className="flex items-center gap-3 rounded-lg bg-surface-container p-4">
                  <Upload className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm font-medium text-on-surface">
                    Un manuscrit est déjà en place{book.fileFormat ? ` (${book.fileFormat.toUpperCase()})` : ''}.
                  </span>
                  <Button variant="text" size="sm" onClick={() => setExistingFileUrl('')}>Remplacer</Button>
                </div>
              ) : (
                <FileDropzone onFile={handleBookFile} accept={{ 'application/pdf': ['.pdf'], 'application/epub+zip': ['.epub'] }} maxSize={50 * 1024 * 1024} label="Déposez le manuscrit ici" icon="file" />
              )}
            </div>
          )}

          {step === 4 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div className="col-span-2">
                <dt className="text-on-surface-muted">Titre</dt>
                <dd className="mt-0.5 font-medium text-on-surface">{title}</dd>
              </div>
              <div>
                <dt className="text-on-surface-muted">Prix</dt>
                <dd className="mt-0.5 font-display text-lg font-semibold tabular-nums text-on-surface">
                  {Number(price) > 0 ? formatCurrency(Number(price)) : 'Gratuit'}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-muted">Langue · pages</dt>
                <dd className="mt-0.5 text-on-surface">{language.toUpperCase()} · {pageCount || '—'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-muted">Couverture</dt>
                <dd className="mt-0.5 text-on-surface">{coverFile ? 'Nouvelle' : existingCoverUrl ? 'Inchangée' : 'Aucune'}</dd>
              </div>
              <div>
                <dt className="text-on-surface-muted">Manuscrit</dt>
                <dd className="mt-0.5 text-on-surface">{bookFile ? bookFile.name : existingFileUrl ? 'Inchangé' : 'Aucun'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-on-surface-muted">Description</dt>
                <dd className="mt-0.5 line-clamp-4 text-on-surface">{description}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline bg-surface/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg lg:static lg:border-0 lg:bg-transparent lg:px-8 lg:pb-8 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-2xl items-center gap-3 lg:max-w-3xl lg:px-0">
          <Button
            variant="outlined"
            onClick={() => (step > 0 ? setStep(step - 1) : navigate(`/books/${id}`))}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          <div className="flex-1" />
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} rightIcon={<ChevronRight className="h-4 w-4" />}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={saving}>
              Enregistrer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
