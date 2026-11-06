// A Fúria Desumana do Endemoniado (CONTEXT.md: Fúria Desumana; docs/bestiario/template-endemoniado.md):
// ao cair a 0 PV, o Mestre faz um TR de CON contra CD 10, +5 a cada uso no combate; passou, o
// inimigo fica com 1 PV. O estado (usos e "já tratado este 0 PV") vive no `ability_state` do
// participante do combate, que nasce zerado a cada combate (ADR 0012).
import { hasSkillNamed, stateRecord } from './abilityState';
import { resolveAbilitySave } from './abilitySave';
import type { MasterMark } from './testMode';

export const FURIA_NAME = 'Fúria Desumana';
const FURIA_BASE_CD = 10;
const FURIA_CD_STEP = 5;
/** A chave do estado da Fúria dentro do `ability_state` (as Habilidades usam o id da biblioteca). */
export const FURIA_STATE_KEY = 'furia';

export interface FuriaState {
  /** Quantas vezes a Fúria salvou o inimigo neste combate. */
  uses: number;
  /** O 0 PV atual já foi tratado (o TR foi feito e o inimigo falhou): o pedido não repete. */
  handled: boolean;
}

export function furiaCd(uses: number): number {
  return FURIA_BASE_CD + FURIA_CD_STEP * uses;
}

/** O inimigo tem a passiva se a lista de Habilidades (o jsonb `skills`) traz a Fúria Desumana. */
export function hasFuria(skills: unknown): boolean {
  return hasSkillNamed(skills, FURIA_NAME);
}

/** Lê o estado da Fúria do `ability_state` (jsonb); sem estado, ou inválido, é o inicial. */
export function furiaStateOf(raw: unknown): FuriaState {
  const furia = stateRecord(raw)[FURIA_STATE_KEY];
  const { uses, handled } = (typeof furia === 'object' && furia !== null ? furia : {}) as Record<
    string,
    unknown
  >;
  return {
    uses: typeof uses === 'number' && Number.isInteger(uses) && uses > 0 ? uses : 0,
    handled: handled === true,
  };
}

/** O `ability_state` com o estado da Fúria trocado; o resto (uso das Habilidades) fica como está. */
export function withFuriaState(raw: unknown, state: FuriaState): Record<string, unknown> {
  return { ...stateRecord(raw), [FURIA_STATE_KEY]: state };
}

/** O pedido de TR de CON: só para o inimigo com a Fúria a 0 PV cujo 0 PV ainda não foi tratado. */
export function furiaPrompt(input: {
  skills: unknown;
  hp: number;
  state: FuriaState;
}): { cd: number } | null {
  if (!hasFuria(input.skills) || input.hp > 0 || input.state.handled) return null;
  return { cd: furiaCd(input.state.uses) };
}

export interface FuriaResolution {
  cd: number;
  total: number;
  passed: boolean;
  /** O PV do inimigo depois do TR: 1 se passou, 0 se falhou. */
  hpAfter: number;
  state: FuriaState;
}

/**
 * O TR de CON da Fúria (um Teste comum, sem sucesso automático no 20). Passou: o inimigo fica com
 * 1 PV e o uso conta para a próxima CD. Falhou: segue a 0 PV e o pedido não volta até ele ter PV de
 * novo.
 */
export function resolveFuria(input: {
  state: FuriaState;
  conModifier: number;
  natural: number;
  mark: MasterMark;
}): FuriaResolution {
  const cd = furiaCd(input.state.uses);
  const save = resolveAbilitySave({
    dice: [input.natural],
    mark: input.mark,
    modifier: input.conModifier,
    cd,
  });
  const passed = !save.failed;
  return {
    cd,
    total: save.total,
    passed,
    hpAfter: passed ? 1 : 0,
    state: passed
      ? { uses: input.state.uses + 1, handled: false }
      : { uses: input.state.uses, handled: true },
  };
}

/** Com PV de novo, um 0 PV tratado deixa de contar: o próximo 0 PV pede o TR outra vez. */
export function furiaStateAtHp(state: FuriaState, hp: number): FuriaState {
  return hp > 0 && state.handled ? { ...state, handled: false } : state;
}
