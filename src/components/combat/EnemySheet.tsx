import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import type { Character } from '@/features/character-management/types';
import type { CombatParticipant } from '@/data-access/combat';
import { Shield, Heart } from 'lucide-react';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import { describeEnemyEffect, enemyAbilityOf } from '@/domain/enemyAbility';

const ATTRIBUTE_KEYS = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;

interface EnemySheetProps {
  enemy: Character | null;
  participant?: Pick<CombatParticipant, 'hp_current'>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnemySheet({ enemy, participant, isOpen, onOpenChange }: EnemySheetProps) {
  if (!enemy) return null;

  const hpCurrent = participant?.hp_current ?? getCurrentPv(enemy.stats);
  const hpMax = getMaxPv(enemy.stats, 0);
  const ca = enemy.stats?.ca ?? 10;
  const isDead = hpCurrent <= 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-stone-900 border-stone-800 text-stone-200 w-full sm:max-w-md overflow-y-auto custom-scrollbar">
        <SheetHeader className="mb-6 mt-4">
          <div className="flex items-center gap-4">
            <CharacterAvatar
              imageUrl={enemy.narrative?.imageUrl}
              name={enemy.name || 'Inimigo'}
              className={`w-16 h-16 border-2 border-red-900/50 ${isDead ? 'grayscale opacity-60' : ''}`}
            />
            <div>
              <SheetTitle className="text-2xl font-bold text-stone-100">
                {enemy.name}{' '}
                {isDead && (
                  <span className="text-sm font-normal text-red-500 ml-2">(Derrotado)</span>
                )}
              </SheetTitle>
              <SheetDescription className="text-stone-400">
                {enemy.tribe} {enemy.vocation && `• ${enemy.vocation}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-800 p-3 rounded-lg flex items-center gap-3 border border-stone-700">
              <Heart className="text-red-400" size={24} />
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Pontos de Vida
                </p>
                <p className="font-bold text-xl">
                  {hpCurrent} <span className="text-sm text-stone-500 font-normal">/ {hpMax}</span>
                </p>
              </div>
            </div>
            <div className="bg-stone-800 p-3 rounded-lg flex items-center gap-3 border border-stone-700">
              <Shield className="text-stone-400" size={24} />
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  C. Armadura
                </p>
                <p className="font-bold text-xl">{ca}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-300 mb-3 border-b border-stone-800 pb-2 uppercase tracking-wider">
              Atributos
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {ATTRIBUTE_KEYS.map((key) => {
                const attr = key.toUpperCase();
                const val = enemy.attributes?.[key] ?? 10;
                const mod = Math.floor((val - 10) / 2);
                return (
                  <div
                    key={attr}
                    className="bg-stone-800/50 py-2 rounded-lg border border-stone-700/50"
                  >
                    <p className="text-[10px] text-stone-400 font-medium">{attr}</p>
                    <p className="text-lg font-bold text-stone-200">{val}</p>
                    <p className="text-xs text-stone-500">{mod >= 0 ? `+${mod}` : mod}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {Array.isArray(enemy.skills) && enemy.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-300 mb-3 border-b border-stone-800 pb-2 uppercase tracking-wider">
                Habilidades
              </h3>
              <ul className="space-y-3">
                {enemy.skills.map((skill, idx) => {
                  const title = skill.name || skill.description;
                  const hasDesc = skill.name && skill.description;
                  const effect = enemyAbilityOf(skill);
                  return (
                    <li
                      key={idx}
                      className="bg-stone-800/30 p-3 rounded-lg border border-stone-800/50"
                    >
                      <p className="font-semibold text-stone-200 text-sm">{title}</p>
                      {hasDesc && (
                        <p className="text-sm text-stone-400 mt-1 leading-relaxed">
                          {skill.description}
                        </p>
                      )}
                      {effect && (
                        <p className="text-xs text-amber-400 mt-1">
                          Efeito: {describeEnemyEffect(effect.effect)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
