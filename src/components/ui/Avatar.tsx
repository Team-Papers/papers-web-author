import { cn } from '@/lib/utils/cn';

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-xl' };

interface AvatarProps { src?: string; name: string; size?: keyof typeof sizeMap; className?: string; }

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', sizeMap[size], className)} />;
  return (
    <div className={cn('flex items-center justify-center rounded-full bg-primary-container font-medium text-on-primary-container', sizeMap[size], className)}>
      {initials}
    </div>
  );
}
