import { Zap } from 'lucide-react';
import { calculateProficiency } from '@/domain/attributes';
import { CharacterAvatar } from '../../ui/CharacterAvatar';

interface SheetHeaderProps {
  name: string | undefined;
  tribe: string | undefined;
  vocation: string | undefined;
  level: number;
  imageUrl: string | undefined;
}

/** O topo da ficha: avatar, nome, tribo, vocação e bônus de proficiência. */
export function SheetHeader({ name, tribe, vocation, level, imageUrl }: SheetHeaderProps) {
  return (
    <div className="relative p-4 md:p-6 border-b border-stone-800 bg-gradient-to-b from-stone-900 to-stone-950 flex gap-4 md:gap-6 items-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>

      <CharacterAvatar
        imageUrl={imageUrl}
        name={name || 'Desconhecido'}
        className="w-24 h-24 border-4 border-stone-800 shadow-xl"
      />

      <div className="flex-1">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2">
          {name || 'Desconhecido'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-400">
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm">
            Tribo: <span className="text-stone-200 font-medium">{tribe || 'Nenhuma'}</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm">
            Vocação: <span className="text-stone-200 font-medium">{vocation || 'Nenhuma'}</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            Proficiência:{' '}
            <span className="text-stone-200 font-medium">+{calculateProficiency(level)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
