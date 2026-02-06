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
          'dropzone relative flex flex-col items-center justify-center p-8 cursor-pointer',
          isDragActive && 'active',
          error && 'border-error',
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-auto rounded-xl object-cover shadow-md transition-transform group-hover:scale-105"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setFileName(null); }}
              className="absolute -top-2 -right-2 rounded-full bg-error p-1.5 text-white shadow-lg transition-transform hover:scale-110"
              aria-label="Supprimer"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className={cn(
              'rounded-2xl p-4 mb-4 transition-all duration-300',
              isDragActive
                ? 'bg-primary text-white scale-110'
                : 'bg-surface-container text-on-surface-variant'
            )}>
              <Icon size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-on-surface">
                {isDragActive ? 'Deposez le fichier ici' : label}
              </p>
              {hint && <p className="mt-1.5 text-xs text-on-surface-variant">{hint}</p>}
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
                  <Upload size={12} />
                  <span className="max-w-[200px] truncate">{fileName}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
