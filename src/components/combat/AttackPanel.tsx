import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  computeDamage,
  damageReminder,
  isWeaponProficient,
  resolveAttack,
  type AttackResult,
} from '@/domain/attack';
import { getErrorMessage } from '@/lib/errorMessage';
import { resolveMainHandWeapon, type AttackTarget } from '@/lib/attackSetup';
import { submitAttack } from '@/services/attackService';
import type { CombatInventoryItem } from '@/types/inventory';

interface AttackPanelProps {
  character: {
    attributes?: { for?: number | null; des?: number | null } | null;
    level?: number | string | null;
    vocation?: string | null;
    equipment?: unknown;
    character_items?: CombatInventoryItem[];
  };
  attackerParticipantId: string;
  targets: AttackTarget[];
  /** A Ação principal do turno já foi usada. */
  actionUsed: boolean;
  /** Marca a Ação principal como usada depois que o ataque é registrado. */
  onActionUsed: () => void;
}

type Stage =
  | { name: 'form' }
  | { name: 'damage'; target: AttackTarget; natural: number; result: AttackResult }
  | { name: 'done'; result: AttackResult; damage: number };

/**
 * O ataque do jogador no próprio turno: escolhe o alvo, digita o d20 do dado físico e vê só
 * "Acertou" ou "Errou" (a CA é do Mestre). No acerto, digita o dano rolado; o app soma o
 * modificador, tira o PV do alvo e registra o ataque.
 */
export function AttackPanel({
  character,
  attackerParticipantId,
  targets,
  actionUsed,
  onActionUsed,
}: AttackPanelProps) {
  const [targetId, setTargetId] = useState('');
  const [natural, setNatural] = useState<number | ''>('');
  const [rolledDamage, setRolledDamage] = useState<number | ''>('');
  const [stage, setStage] = useState<Stage>({ name: 'form' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const equipped = resolveMainHandWeapon(character);
  const weapon = equipped?.weapon ?? null;
  const attributes = character.attributes ?? {};
  const vocation = character.vocation ?? '';

  // Grava o ataque no banco; só depois disso a Ação é marcada como usada.
  const record = async (
    target: AttackTarget,
    naturalRoll: number,
    result: AttackResult,
    damage: number,
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await submitAttack({
        attackerParticipantId,
        targetParticipantId: target.participantId,
        targetAc: target.ac,
        naturalRoll,
        result,
        damage,
      });
      onActionUsed();
      setStage({ name: 'done', result, damage });
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível registrar o ataque.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttack = () => {
    const target = targets.find((t) => t.participantId === targetId);
    if (!target) {
      setError('Escolha o alvo.');
      return;
    }
    if (natural === '' || !Number.isInteger(natural) || natural < 1 || natural > 20) {
      setError('Insira o d20 (1-20).');
      return;
    }
    const result = resolveAttack({
      attributes,
      level: Number(character.level) || 1,
      vocation,
      weapon,
      naturalRoll: natural,
      targetAc: target.ac,
    });
    setError(null);
    if (result.hit) {
      setStage({ name: 'damage', target, natural, result });
    } else {
      void record(target, natural, result, 0);
    }
  };

  const handleDamage = () => {
    if (stage.name !== 'damage') return;
    if (weapon && (rolledDamage === '' || rolledDamage < 0)) {
      setError('Insira o dano rolado.');
      return;
    }
    const damage = computeDamage({
      weapon,
      modifier: stage.result.modifier,
      rolled: Number(rolledDamage) || 0,
    });
    void record(stage.target, stage.natural, stage.result, damage);
  };

  const reset = () => {
    setStage({ name: 'form' });
    setNatural('');
    setRolledDamage('');
    setError(null);
  };

  const outcome = (result: AttackResult) =>
    result.hit ? (result.critical ? 'Acerto Crítico!' : 'Acertou!') : 'Errou';

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Atacar
          {weapon && !isWeaponProficient(vocation, weapon.category) && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              Não proficiente
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {equipped ? (
            <>
              Arma: <span className="font-bold text-amber-500">{equipped.name}</span>
              {weapon?.damage && ` (${weapon.damage})`}
            </>
          ) : (
            'Desarmado (1 + FOR)'
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage.name === 'form' && (
          <>
            {actionUsed && (
              <p className="text-sm text-amber-400">
                Ação principal já usada neste turno. Desmarque-a no checklist para atacar de novo.
              </p>
            )}
            {targets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alvo no combate.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-stone-300">
                  Alvo
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-stone-200"
                  >
                    <option value="">Escolha...</option>
                    {targets.map((t) => (
                      <option key={t.participantId} value={t.participantId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-stone-300">
                  d20 natural
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={natural}
                    onChange={(e) =>
                      setNatural(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-center font-mono text-lg text-stone-200"
                  />
                </label>
              </div>
            )}
            <Button
              type="button"
              onClick={handleAttack}
              disabled={actionUsed || isSubmitting || targets.length === 0}
              className="min-h-[44px] w-full"
            >
              Atacar
            </Button>
          </>
        )}

        {stage.name === 'damage' && (
          <>
            <p className="text-2xl font-bold text-green-400">{outcome(stage.result)}</p>
            {weapon ? (
              <>
                <p className="text-sm text-stone-300">
                  {damageReminder(weapon, stage.result.critical)}
                </p>
                <label className="block text-sm text-stone-300">
                  Dano rolado
                  <input
                    type="number"
                    min={0}
                    value={rolledDamage}
                    onChange={(e) =>
                      setRolledDamage(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-center font-mono text-lg text-stone-200"
                  />
                </label>
              </>
            ) : (
              <p className="text-sm text-stone-300">Dano desarmado: 1 + FOR.</p>
            )}
            <Button
              type="button"
              onClick={handleDamage}
              disabled={isSubmitting}
              className="min-h-[44px] w-full"
            >
              Aplicar dano
            </Button>
          </>
        )}

        {stage.name === 'done' && (
          <>
            <p
              className={`text-2xl font-bold ${stage.result.hit ? 'text-green-400' : 'text-red-400'}`}
            >
              {stage.result.fumble ? 'Falha Crítica' : outcome(stage.result)}
            </p>
            {stage.result.hit && <p className="text-sm text-stone-300">{stage.damage} de dano.</p>}
            <Button type="button" variant="outline" onClick={reset} className="w-full">
              Novo ataque
            </Button>
          </>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
