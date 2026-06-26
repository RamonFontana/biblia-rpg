import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface CharacterAvatarProps {
  imageUrl?: string | null;
  name: string;
  className?: string;
}

export function CharacterAvatar({ imageUrl, name, className }: CharacterAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Extract initials (up to 2 letters)
  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const showFallback = !imageUrl || hasError;

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        'w-12 h-12', // default size, can be overridden by className
        className
      )}
    >
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
          {getInitials(name)}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={name}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
