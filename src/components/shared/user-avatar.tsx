import { cn } from '@/lib/utils/cn';

export function profilePhotoFrom(u: Record<string, unknown> | null | undefined): string | undefined {
  const url = u?.profilePhotoUrl;
  return typeof url === 'string' && url.trim() ? url : undefined;
}

type UserAvatarProps = {
  name: string;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function UserAvatar({
  name,
  photoUrl,
  className,
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const src = typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : undefined;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('rounded-full object-cover', className, imageClassName)}
      />
    );
  }

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-display font-medium',
        className,
        fallbackClassName,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
