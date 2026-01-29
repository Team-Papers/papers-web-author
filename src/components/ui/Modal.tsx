import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeMap[size]} rounded-3xl bg-surface shadow-2xl`}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 pb-6 pt-2">{footer}</div>}
      </div>
    </div>
  );
}
