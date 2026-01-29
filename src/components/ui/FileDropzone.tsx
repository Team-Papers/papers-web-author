import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FileDropzoneProps {
  accept: Record<string, string[]>;
  maxSize: number;
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  preview?: string;
  icon?: 'image' | 'file';
  error?: string;
}

export function FileDropzone({ accept, maxSize, onFile, label, hint, preview, icon = 'file', error }: FileDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setFileName(accepted[0].name); onFile(accepted[0]); }
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxSize, multiple: false });
  const Icon = icon === 'image' ? Image : FileText;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
          isDragActive ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:border-primary hover:bg-primary-container/10',
          error && 'border-error',
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="h-32 w-auto rounded-xl object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); setFileName(null); }}
              className="absolute -top-2 -right-2 rounded-full bg-error p-1 text-white shadow"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-surface-container p-3 mb-3">
              <Icon size={24} className="text-on-surface-variant" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-on-surface">
                {isDragActive ? 'Déposez le fichier ici' : label}
              </p>
              {hint && <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>}
              {fileName && (
                <p className="mt-2 text-xs font-medium text-primary flex items-center gap-1">
                  <Upload size={12} /> {fileName}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
