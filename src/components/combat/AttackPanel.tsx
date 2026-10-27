import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  canThrow,
  canUseTwoHands,
  computeDamage,
  damageReminder,
  effectiveWeapon,
  isWeaponProficient,
  resolveAttack,
  resolveAttackMode,
  rollDamage,
  weaponIsRanged,
  type AttackResult,
} from '@/domain/attack';
import { pickCountingDie, rollTestDice, type TestMode } from '@/domain/testMode';
import { systemRng } from '@/lib/systemRng';
import { ModeBanner } from '../session/player-test/ModeBanner';
import { getErrorMessage } from '@/lib/errorMessage';
import {
  isOffHandFree,
  resolveAmmunition,
  resolveMainHandWeapon,
  type AttackTarget,
} from '@/lib/attackSetup';
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
  /** A ficha do atacante (a Inspiração é gravada nela). */
  characterId: string;
  attackerParticipantId: string;
  /** Os ids das Condições do atacante (Envenenado, Cego, Impedido dão Desvantagem). */
  attackerConditionIds: string[];
  targets: AttackTarget[];
  /** A Inspiração de hoje: se está disponível, e a sessão e o dia que ela gasta. */
  inspiration?: { available: boolean; sessionId: string; day: number };
  /** Avisa a tela do dia gravado quando a Inspiração foi gasta neste ataque. */
  onInspirationUsed?: (patch: {
    inspiration_used_day: number;
    inspiration_session_id: string;
  }) => void;
  /** A Ação principal do turno já foi usada. */
  actionUsed: boolean;
  /** Marca a Ação principal como usada depois que o ataque é registrado. */
  onActionUsed: () => void;
}

interface Rolled {
  mode: TestMode;
  rolls: number[] | null;
  useInspiration: boolean;
}

type Stage =
  | { name: 'form' }
  | ({
      name: 'damage';
      target: AttackTarget;
      natural: number;
      result: AttackResult;
    } & Rolled)
  | { name: 'done'; result: AttackResult; damage: number; weaponEffectTriggered: boolean };

/**
 * O ataque do jogador no próprio turno: escolhe o alvo, digita o d20 do dado físico e vê só
 * "Acertou" ou "Errou" (a CA é do Mestre). No acerto, digita o dano rolado; o app soma o
 * modificador, tira o PV do alvo e registra o ataque.
 */
export function AttackPanel({
  character,
  characterId,
  attackerParticipantId,
  attackerConditionIds,
  targets,
  inspiration,
  onInspirationUsed,
  actionUsed,
  onActionUsed,
}: AttackPanelProps) {
  const [targetId, setTargetId] = useState('');
  const [natural, setNatural] = useState<number | ''>('');
  const [rolledDamage, setRolledDamage] = useState<number | ''>('');
  const [rolledDice, setRolledDice] = useState<number[] | null>(null);
  const [useInspiration, setUseInspiration] = useState(false);
  const [twoHands, setTwoHands] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const [stage, setStage] = useState<Stage>({ name: 'form' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const equipped = resolveMainHandWeapon(character);
  const baseWeapon = equipped?.weapon ?? null;
  // Arremesso e duas mãos: arremessar uma arma de arremesso exclui o Versátil; o dado Versátil só
  // vale com a outra mão livre.
  const isThrowing = throwing && canThrow(baseWeapon);
  const offHandFree = isOffHandFree(character);
  const canTwoHands = !isThrowing && canUseTwoHands(baseWeapon, offHandFree);
  const weapon = baseWeapon ? effectiveWeapon(baseWeapon, twoHands && canTwoHands) : null;
  const ammunition = resolveAmmunition(character, baseWeapon);
  const outOfAmmo = !!ammunition && ammunition.quantity <= 0;
  const attributes = character.attributes ?? {};
  const vocation = character.vocation ?? '';

  const target = targets.find((t) => t.participantId === targetId);
  const inspirationOn = !!inspiration?.available && useInspiration;
  const resolved = resolveAttackMode({
    attackerConditions: attackerConditionIds,
    targetConditions: target?.conditionIds ?? [],
    ranged: weaponIsRanged(baseWeapon, isThrowing),
    inspirationUsed: inspirationOn,
  });

  // Grava o ataque no banco; só depois disso a Ação é marcada como usada.
  const record = async (
    target: AttackTarget,
    naturalRoll: number,
    result: AttackResult,
    damage: number,
    rolled: Rolled,
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const outcome = await submitAttack({
        attackerParticipantId,
        targetParticipantId: target.participantId,
        targetAc: target.ac,
        naturalRoll,
        result,
        damage,
        appliedMode: rolled.mode,
        rolls: rolled.rolls,
        ...(equipped && equipped.effects.length > 0
          ? {
              weaponEffect: {
                effects: equipped.effects,
                target: { entityId: target.entityId, entityType: target.entityType },
              },
            }
          : {}),
        ...(ammunition?.characterItemId
          ? { ammunition: { characterItemId: ammunition.characterItemId } }
          : {}),
        ...(rolled.useInspiration && inspiration
          ? { inspiration: { characterId, sessionId: inspiration.sessionId, day: inspiration.day } }
          : {}),
      });
      onActionUsed();
      if (rolled.useInspiration && inspiration) {
        onInspirationUsed?.({
          inspiration_used_day: inspiration.day,
          inspiration_session_id: inspiration.sessionId,
        });
      }
      setStage({
        name: 'done',
        result,
        damage,
        weaponEffectTriggered: !!outcome?.weaponEffectTriggered,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível registrar o ataque.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRollD20 = () => {
    const dice = rollTestDice('Ataque', resolved.mode, systemRng);
    setNatural(pickCountingDie(resolved.mode, 'Ataque', dice));
    setRolledDice(dice.length > 1 ? dice : null);
    setError(null);
  };

  const handleAttack = () => {
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
    const rolled: Rolled = {
      mode: resolved.mode,
      rolls: rolledDice,
      useInspiration: inspirationOn,
    };
    if (result.hit) {
      setStage({ name: 'damage', target, natural, result, ...rolled });
    } else {
      void record(target, natural, result, 0, rolled);
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
    void record(stage.target, stage.natural, stage.result, damage, {
      mode: stage.mode,
      rolls: stage.rolls,
      useInspiration: stage.useInspiration,
    });
  };

  const handleRollDamage = () => {
    if (stage.name !== 'damage') return;
    setRolledDamage(rollDamage(weapon, stage.result.critical, systemRng));
    setError(null);
  };

  const reset = () => {
    setStage({ name: 'form' });
    setNatural('');
    setRolledDamage('');
    setRolledDice(null);
    setUseInspiration(false);
    setTwoHands(false);
    setThrowing(false);
    setError(null);
  };

  const outcome = (result: AttackResult) =>
    result.hit ? (result.critical ? 'Acerto Crítico!' : 'Acertou!') : 'Errou';

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Atacar
          {baseWeapon && !isWeaponProficient(vocation, baseWeapon.category) && (
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
            {canThrow(baseWeapon) && (
              <div role="radiogroup" aria-label="Tipo de ataque" className="flex gap-2">
                {[
                  { label: 'Corpo a corpo', value: false },
                  { label: 'Arremesso', value: true },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={throwing === value}
                    aria-label={label}
                    onClick={() => setThrowing(value)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      throwing === value
                        ? 'border-amber-600 bg-amber-600 text-stone-900'
                        : 'border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {canTwoHands && (
              <label className="flex items-center gap-2 text-sm text-stone-300">
                <input
                  type="checkbox"
                  checked={twoHands}
                  onChange={(e) => setTwoHands(e.target.checked)}
                  className="accent-amber-500"
                />
                Ataque com Duas Mãos (Versátil)
              </label>
            )}
            {ammunition && (
              <p className={`text-sm ${outOfAmmo ? 'text-red-400' : 'text-stone-300'}`}>
                {outOfAmmo
                  ? `Sem munição (${ammunition.name}). Recupere ou compre mais para atacar.`
                  : `Munição: ${ammunition.name} ${ammunition.quantity}`}
              </p>
            )}
            {inspiration?.available && (
              <label className="flex items-center gap-2 text-sm text-green-400">
                <input
                  type="checkbox"
                  checked={useInspiration}
                  onChange={(e) => setUseInspiration(e.target.checked)}
                  className="accent-green-500"
                />
                Usar Inspiração (Vantagem)
              </label>
            )}
            <ModeBanner testType="Ataque" resolved={resolved} />
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
                    onChange={(e) => {
                      setNatural(e.target.value === '' ? '' : Number(e.target.value));
                      setRolledDice(null);
                    }}
                    className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-center font-mono text-lg text-stone-200"
                  />
                </label>
              </div>
            )}
            {rolledDice && (
              <p aria-label="Dados rolados" className="text-center text-sm text-stone-300">
                Dados: {rolledDice.join(' e ')}.{' '}
                <strong className="text-amber-400">
                  {pickCountingDie(resolved.mode, 'Ataque', rolledDice)} vale
                </strong>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRollD20}
                disabled={actionUsed || isSubmitting || targets.length === 0}
                className="min-h-[44px]"
              >
                Rolar d20
              </Button>
              <Button
                type="button"
                onClick={handleAttack}
                disabled={actionUsed || isSubmitting || targets.length === 0 || outOfAmmo}
                className="min-h-[44px]"
              >
                Atacar
              </Button>
            </div>
          </>
        )}

        {stage.name === 'damage' && (
          <>
            <p className="text-2xl font-bold text-green-400">{outcome(stage.result)}</p>
            {weapon ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-stone-300">
                    {damageReminder(weapon, stage.result.critical)}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={handleRollDamage}>
                    Rolar dano
                  </Button>
                </div>
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
            {stage.weaponEffectTriggered && (
              <p className="text-sm font-medium text-amber-400">Efeito de arma ativado!</p>
            )}
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
