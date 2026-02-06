import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Check, ChevronLeft, ChevronRight, Upload, FileText, Image, Info, BookOpen, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { createBook, getCategories, uploadCover, uploadBookFile } from '@/lib/api/books';
import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Category } from '@/types/models';

const steps = [
  { label: 'Informations', icon: FileText },
  { label: 'Details', icon: Info },
  { label: 'Couverture', icon: Image },
  { label: 'Fichier', icon: BookOpen },
  { label: 'Resume', icon: Sparkles },
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

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div>
      <Header title="Nouveau livre" subtitle="Publiez votre oeuvre" />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-on-surface">Etape {step + 1} sur {steps.length}</span>
            <span className="text-sm text-on-surface-variant">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-initial min-w-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300',
                    i < step ? 'bg-primary text-white shadow-md' :
                    i === step ? 'bg-primary text-white shadow-lg scale-110 ring-4 ring-primary-container' :
                    'bg-surface-container text-on-surface-variant'
                  )}>
                    {i < step ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={cn(
                    'text-xs mt-2 hidden sm:block font-medium transition-colors',
                    i <= step ? 'text-primary' : 'text-on-surface-variant'
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 mx-3 h-1 rounded-full overflow-hidden bg-surface-container-high">
                    <div
                      className={cn(
                        'h-full bg-primary transition-all duration-500',
                        i < step ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2 animate-fade-up">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10">
              <Info className="h-4 w-4" />
            </div>
            {error}
          </div>
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
              <h3 className="text-lg font-semibold text-on-surface">Fichier du livre</h3>
              <p className="text-sm text-on-surface-variant">Formats acceptés: PDF, EPUB. Taille max: 50MB</p>
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-container">
                  <Sparkles className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Pret a publier!</h3>
                  <p className="text-sm text-on-surface-variant">Verifiez les informations avant de creer votre livre</p>
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

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate('/books')} leftIcon={<ChevronLeft className="h-4 w-4" />}>
            {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} rightIcon={<ChevronRight className="h-4 w-4" />}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} isLoading={loading}>
              Créer le livre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
