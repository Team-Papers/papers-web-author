import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Check, ChevronLeft, ChevronRight, Upload, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { getBookById, updateBook, getCategories, uploadCover, uploadBookFile } from '@/lib/api/books';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Book, Category } from '@/types/models';
import { BookStatus } from '@/types/models';

const steps = ['Informations', 'Détails', 'Couverture', 'Fichier', 'Résumé'];

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
    Promise.all([getBookById(id), getCategories()])
      .then(([bookData, cats]) => {
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
        const catIds = (bookData.categories || []).map((c: any) =>
          'category' in c ? c.category.id : c.id
        );
        setSelectedCats(catIds);
      })
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
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
    } catch {
      setError('Erreur lors de la modification du livre');
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
      <div className="p-8 text-center text-on-surface-variant">
        Livre introuvable
      </div>
    );
  }

  // Only DRAFT and REJECTED books can be edited
  if (book.status !== BookStatus.DRAFT && book.status !== BookStatus.REJECTED) {
    return (
      <div className="p-8 text-center">
        <p className="text-on-surface-variant mb-4">Ce livre ne peut pas être modifié car il est en cours de révision ou déjà publié.</p>
        <Button onClick={() => navigate(`/books/${id}`)}>Retour au livre</Button>
      </div>
    );
  }

  return (
    <div>
      <Header title="Modifier le livre" subtitle={book.title} />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Button variant="text" onClick={() => navigate(`/books/${id}`)} leftIcon={<ArrowLeft className="h-4 w-4" />} className="mb-4">
          Retour aux détails
        </Button>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i < step ? 'bg-primary text-on-primary' :
                  i === step ? 'bg-primary text-on-primary ring-4 ring-primary-container' :
                  'bg-surface-container-high text-on-surface-variant'
                )}>
                  {i < step ? <Check className="h-5 w-5" /> : i + 1}
                </div>
                <span className={cn('text-xs mt-2 hidden sm:block', i <= step ? 'text-primary font-medium' : 'text-on-surface-variant')}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-3', i < step ? 'bg-primary' : 'bg-surface-container-high')} />
              )}
            </div>
          ))}
        </div>

        {error && <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <Card className="p-6">
          {/* Step 1: Basic Info */}
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
              <h3 className="text-lg font-semibold text-on-surface">Détails supplémentaires</h3>
              <p className="text-sm text-on-surface-variant">Ces informations sont optionnelles mais aident les lecteurs.</p>
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
              <h3 className="text-lg font-semibold text-on-surface">Image de couverture</h3>
              <p className="text-sm text-on-surface-variant">Formats acceptés: JPG, PNG. Taille recommandée: 600x900px</p>
              {coverPreview || existingCoverUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={coverPreview || existingCoverUrl} alt="Preview" className="h-64 rounded-xl shadow-md object-cover" />
                  <Button variant="outlined" onClick={() => { setCoverFile(null); setCoverPreview(''); setExistingCoverUrl(''); }}>Changer l'image</Button>
                </div>
              ) : (
                <FileDropzone onFile={handleCover} accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }} maxSize={5 * 1024 * 1024} label="Glissez votre image de couverture ici" />
              )}
            </div>
          )}

          {/* Step 4: File */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Fichier du livre</h3>
              <p className="text-sm text-on-surface-variant">Formats acceptés: PDF, EPUB. Taille max: 50MB</p>
              {bookFile ? (
                <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm text-on-surface font-medium">{bookFile.name}</span>
                  <Button variant="text" size="sm" onClick={() => setBookFile(null)} className="ml-auto">Supprimer</Button>
                </div>
              ) : existingFileUrl ? (
                <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm text-on-surface font-medium">Fichier actuel: {existingFileUrl}</span>
                  <Button variant="text" size="sm" onClick={() => setExistingFileUrl('')} className="ml-auto">Remplacer</Button>
                </div>
              ) : (
                <FileDropzone onFile={handleBookFile} accept={{ 'application/pdf': ['.pdf'], 'application/epub+zip': ['.epub'] }} maxSize={50 * 1024 * 1024} label="Glissez votre fichier ici" icon="file" />
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Résumé des modifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Titre</p>
                  <p className="text-sm font-medium text-on-surface">{title}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Prix</p>
                  <p className="text-sm font-medium text-on-surface">{formatCurrency(Number(price))}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Langue</p>
                  <p className="text-sm font-medium text-on-surface uppercase">{language}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Pages</p>
                  <p className="text-sm font-medium text-on-surface">{pageCount || 'Non spécifié'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-on-surface-variant">Description</p>
                  <p className="text-sm text-on-surface line-clamp-3">{description}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Couverture</p>
                  <p className="text-sm text-on-surface">{coverFile ? coverFile.name : existingCoverUrl ? 'Existante' : 'Aucune'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Fichier</p>
                  <p className="text-sm text-on-surface">{bookFile ? bookFile.name : existingFileUrl ? 'Existant' : 'Aucun'}</p>
                </div>
              </div>
              {(coverPreview || existingCoverUrl) && <img src={coverPreview || existingCoverUrl} alt="Cover" className="h-40 rounded-xl object-cover" />}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate(`/books/${id}`)} leftIcon={<ChevronLeft className="h-4 w-4" />}>
            {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} rightIcon={<ChevronRight className="h-4 w-4" />}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={saving}>
              Enregistrer les modifications
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
