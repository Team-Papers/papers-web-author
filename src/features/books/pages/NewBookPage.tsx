import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Check, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
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

const steps = ['Informations', 'Couverture', 'Fichier', 'Résumé'];

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
    if (step === 1) return true; // cover optional
    if (step === 2) return true; // file optional for draft
    return true;
  };

  return (
    <div>
      <Header title="Nouveau livre" subtitle="Publiez votre œuvre" />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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

          {/* Step 2: Cover */}
          {step === 1 && (
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

          {/* Step 3: File */}
          {step === 2 && (
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

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">Résumé</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Titre</p>
                  <p className="text-sm font-medium text-on-surface">{title}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Prix</p>
                  <p className="text-sm font-medium text-on-surface">{formatCurrency(Number(price))}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-on-surface-variant">Description</p>
                  <p className="text-sm text-on-surface line-clamp-3">{description}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Couverture</p>
                  <p className="text-sm text-on-surface">{coverFile ? coverFile.name : 'Aucune'}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Fichier</p>
                  <p className="text-sm text-on-surface">{bookFile ? bookFile.name : 'Aucun'}</p>
                </div>
              </div>
              {coverPreview && <img src={coverPreview} alt="Cover" className="h-40 rounded-xl object-cover" />}
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate('/books')} leftIcon={<ChevronLeft className="h-4 w-4" />}>
            {step === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 3 ? (
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
