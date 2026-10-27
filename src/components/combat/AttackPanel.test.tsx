// O painel de ataque do jogador: arma, alvo, d20 digitado, "Acertou/Errou" sem mostrar a CA, dano
// digitado com o lembrete do dado e o envio. O serviço é falso. Termos: CONTEXT.md (Ataque, Acerto
// Crítico, Falha Crítica, CA).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  submitAttack: vi.fn(),
  // A sequência de números que a Rolagem Virtual sorteia (a cada chamada); depois dela, 0,5.
  random: [] as number[],
}));
vi.mock('@/services/attackService', () => ({ submitAttack: h.submitAttack }));
vi.mock('@/lib/systemRng', () => ({ systemRng: () => h.random.shift() ?? 0.5 }));

import { AttackPanel } from './AttackPanel';

const targets = [
  {
    participantId: 'p-rute',
    entityId: 'e-p-rute',
    entityType: 'player',
    name: 'Rute',
    ac: 12,
    conditionIds: [] as string[],
  },
  {
    participantId: 'p-fil',
    entityId: 'e-p-fil',
    entityType: 'player',
    name: 'Filisteu',
    ac: 15,
    conditionIds: [] as string[],
  },
  {
    participantId: 'p-stun',
    entityId: 'e-p-stun',
    entityType: 'player',
    name: 'Atordoado',
    ac: 15,
    conditionIds: ['atordoado'],
  },
];
const equipped = (slug: string | null) => ({
  attributes: { for: 16, des: 12 }, // FOR +3, DES +1
  level: 1, // Proficiência +2
  vocation: 'Guerreiro',
  equipment: { head: null, body: null, mainHand: slug ? 'ci-1' : null, offHand: null },
  character_items: slug ? [{ id: 'ci-1', items: { slug, name: slug } }] : [],
});

const onActionUsed = vi.fn();
const show = (over: Partial<React.ComponentProps<typeof AttackPanel>> = {}) =>
  render(
    <AttackPanel
      character={equipped('espada_longa')}
      characterId="c1"
      attackerParticipantId="p-me"
      attackerConditionIds={[]}
      targets={targets}
      actionUsed={false}
      onActionUsed={onActionUsed}
      {...over}
    />,
  );
const pick = (name: string) =>
  fireEvent.change(screen.getByLabelText('Alvo'), {
    target: { value: targets.find((t) => t.name === name)!.participantId },
  });
const roll = (value: string) =>
  fireEvent.change(screen.getByLabelText('d20 natural'), { target: { value } });
const attack = () => fireEvent.click(screen.getByRole('button', { name: 'Atacar' }));

beforeEach(() => {
  h.submitAttack.mockResolvedValue('atk-1');
});
beforeEach(() => {
  h.random.length = 0;
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AttackPanel: a arma', () => {
  it('mostra a arma da mão principal com o dado', () => {
    show();
    expect(screen.getByText(/Espada Longa/)).toBeInTheDocument();
    expect(screen.getByText(/1d8 cortante/)).toBeInTheDocument();
    expect(screen.queryByText('Não proficiente')).toBeNull();
  });

  it('avisa quando a Vocação não é proficiente com a arma', () => {
    show({ character: { ...equipped('espada_longa'), vocation: 'Sacerdote' } });
    expect(screen.getByText('Não proficiente')).toBeInTheDocument();
  });

  it('sem arma na mão, ataca desarmado', () => {
    show({ character: equipped(null) });
    expect(screen.getByText(/Desarmado/)).toBeInTheDocument();
  });
});

describe('AttackPanel: antes de atacar', () => {
  it('com a Ação já usada, não deixa atacar', () => {
    show({ actionUsed: true });
    expect(screen.getByText(/Ação principal já usada/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
  });

  it('sem alvos no combate, avisa', () => {
    show({ targets: [] });
    expect(screen.getByText(/Nenhum alvo/)).toBeInTheDocument();
  });

  it('exige o alvo e um d20 de 1 a 20', () => {
    show();
    attack();
    expect(screen.getByText('Escolha o alvo.')).toBeInTheDocument();
    pick('Rute');
    attack();
    expect(screen.getByText('Insira o d20 (1-20).')).toBeInTheDocument();
    roll('21');
    attack();
    expect(screen.getByText('Insira o d20 (1-20).')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();
  });

  it('lista os alvos, aliados e inimigos, só pelo nome (a CA fica escondida)', () => {
    show();
    expect(screen.getByRole('option', { name: 'Rute' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Filisteu' })).toBeInTheDocument();
    expect(screen.queryByText(/15/)).toBeNull();
  });
});

describe('AttackPanel: errar', () => {
  it('d20 baixo contra a CA: mostra "Errou", registra o ataque sem dano e usa a Ação', async () => {
    show();
    pick('Filisteu');
    roll('5'); // 5 + 3 + 2 = 10 contra CA 15
    attack();
    expect(await screen.findByText('Errou')).toBeInTheDocument();
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      attackerParticipantId: 'p-me',
      targetParticipantId: 'p-fil',
      targetAc: 15,
      naturalRoll: 5,
      damage: 0,
      result: { hit: false, total: 10 },
    });
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
    expect(screen.queryByText(/15/)).toBeNull();
  });

  it('1 natural é Falha Crítica', async () => {
    show();
    pick('Rute');
    roll('1');
    attack();
    expect(await screen.findByText('Falha Crítica')).toBeInTheDocument();
  });
});

describe('AttackPanel: acertar', () => {
  it('mostra "Acertou!", o lembrete do dado e só registra depois do dano', async () => {
    show();
    pick('Filisteu');
    roll('12'); // 12 + 5 = 17 contra CA 15
    attack();
    expect(await screen.findByText('Acertou!')).toBeInTheDocument();
    expect(screen.getByText('Role 1d8.')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      naturalRoll: 12,
      damage: 9, // 6 do dado + 3 de FOR, uma vez só
      result: { hit: true, critical: false },
    });
    expect(await screen.findByText(/9 de dano/)).toBeInTheDocument();
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
  });

  it('20 natural é Acerto Crítico e o lembrete dobra os dados', async () => {
    show();
    pick('Filisteu');
    roll('20');
    attack();
    expect(await screen.findByText('Acerto Crítico!')).toBeInTheDocument();
    expect(screen.getByText('Role 2d8.')).toBeInTheDocument();
  });

  it('o dano precisa ser um número de 0 para cima', async () => {
    show();
    pick('Rute');
    roll('15');
    attack();
    await screen.findByText('Acertou!');
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    expect(screen.getByText('Insira o dano rolado.')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();
  });

  it('desarmado não pede dado: o dano é 1 mais o modificador', async () => {
    show({ character: equipped(null) });
    pick('Rute');
    roll('15');
    attack();
    await screen.findByText('Acertou!');
    expect(screen.queryByLabelText('Dano rolado')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({ damage: 4 });
  });
});

describe('AttackPanel: falhas e novo ataque', () => {
  it('se o banco recusa, mostra o erro e não usa a Ação', async () => {
    h.submitAttack.mockRejectedValue(new Error('Não é o turno do atacante'));
    show();
    pick('Filisteu');
    roll('3');
    attack();
    expect(await screen.findByText(/Não é o turno do atacante/)).toBeInTheDocument();
    expect(onActionUsed).not.toHaveBeenCalled();
  });

  it('"Novo ataque" volta ao formulário', async () => {
    show();
    pick('Filisteu');
    roll('3');
    attack();
    await screen.findByText('Errou');
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Novo ataque' }));
    expect(screen.getByLabelText('d20 natural')).toHaveValue(null);
  });
});

describe('AttackPanel: Vantagem e Desvantagem', () => {
  it('o atacante Envenenado ataca com Desvantagem, com o motivo e o lembrete', () => {
    show({ attackerConditionIds: ['envenenado'] });
    expect(screen.getByText('⚠️ Desvantagem')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Você está Envenenado')).toBeInTheDocument();
    expect(screen.getByText('Role dois d20 e use o menor.')).toBeInTheDocument();
  });

  it('a Condição do alvo escolhido dá Vantagem', () => {
    show();
    expect(screen.queryByText('✨ Vantagem')).toBeNull();
    pick('Atordoado');
    expect(screen.getByText('✨ Vantagem')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Alvo Atordoado')).toBeInTheDocument();
  });

  it('o ataque normal não mostra aviso de modalidade', () => {
    show();
    expect(screen.queryByText(/Vantagem|Desvantagem/)).toBeNull();
  });

  it('manda a modalidade que valeu no ataque', async () => {
    show();
    pick('Atordoado');
    roll('12');
    attack();
    await screen.findByText('Acertou!');
    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({ appliedMode: 'vantagem', rolls: null });
  });
});

describe('AttackPanel: Inspiração', () => {
  const inspiration = { available: true, sessionId: 's1', day: 3 };

  it('só oferece a Inspiração quando está disponível', () => {
    show();
    expect(screen.queryByRole('checkbox', { name: /Usar Inspiração/ })).toBeNull();
    cleanup();
    show({ inspiration: { ...inspiration, available: false } });
    expect(screen.queryByRole('checkbox', { name: /Usar Inspiração/ })).toBeNull();
    cleanup();
    show({ inspiration });
    expect(screen.getByRole('checkbox', { name: /Usar Inspiração/ })).not.toBeChecked();
  });

  it('marcar dá Vantagem pela Inspiração', () => {
    show({ inspiration });
    fireEvent.click(screen.getByRole('checkbox', { name: /Usar Inspiração/ }));
    expect(screen.getByText('Motivo: Inspiração')).toBeInTheDocument();
  });

  it('gasta a Inspiração no envio e avisa a tela do dia gravado', async () => {
    const onInspirationUsed = vi.fn();
    show({ inspiration, onInspirationUsed });
    fireEvent.click(screen.getByRole('checkbox', { name: /Usar Inspiração/ }));
    pick('Filisteu');
    roll('2');
    attack();
    await screen.findByText('Errou');
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      appliedMode: 'vantagem',
      inspiration: { characterId: 'c1', sessionId: 's1', day: 3 },
    });
    await waitFor(() =>
      expect(onInspirationUsed).toHaveBeenCalledWith({
        inspiration_used_day: 3,
        inspiration_session_id: 's1',
      }),
    );
  });

  it('sem marcar, a Inspiração não é gasta', async () => {
    const onInspirationUsed = vi.fn();
    show({ inspiration, onInspirationUsed });
    pick('Filisteu');
    roll('2');
    attack();
    await screen.findByText('Errou');
    expect(h.submitAttack.mock.calls[0][0].inspiration).toBeUndefined();
    expect(onInspirationUsed).not.toHaveBeenCalled();
  });

  it('um ataque recusado não gasta a Inspiração na tela', async () => {
    h.submitAttack.mockRejectedValue(new Error('Não é o turno do atacante'));
    const onInspirationUsed = vi.fn();
    show({ inspiration, onInspirationUsed });
    fireEvent.click(screen.getByRole('checkbox', { name: /Usar Inspiração/ }));
    pick('Filisteu');
    roll('2');
    attack();
    await screen.findByText(/Não é o turno do atacante/);
    expect(onInspirationUsed).not.toHaveBeenCalled();
  });
});

describe('AttackPanel: Rolagem Virtual', () => {
  it('o d20 normal rola um dado só e preenche o campo', () => {
    h.random.push(0.5); // 1 + floor(0,5 × 20) = 11
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByLabelText('d20 natural')).toHaveValue(11);
    expect(screen.queryByLabelText('Dados rolados')).toBeNull();
  });

  it('com Vantagem rola dois d20, mostra os dois e usa o maior', async () => {
    h.random.push(0.7, 0.2); // 15 e 5
    show();
    pick('Atordoado');
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByLabelText('d20 natural')).toHaveValue(15);
    expect(screen.getByLabelText('Dados rolados')).toHaveTextContent('15 e 5');
    attack();
    await screen.findByText('Acertou!');
    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      naturalRoll: 15,
      appliedMode: 'vantagem',
      rolls: [15, 5],
    });
  });

  it('com Desvantagem usa o menor', () => {
    h.random.push(0.7, 0.2);
    show({ attackerConditionIds: ['cego'] });
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByLabelText('d20 natural')).toHaveValue(5);
  });

  it('digitar depois da Rolagem Virtual apaga os dois dados', async () => {
    h.random.push(0.7, 0.2);
    show();
    pick('Atordoado');
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    roll('12');
    expect(screen.queryByLabelText('Dados rolados')).toBeNull();
    attack();
    await screen.findByText('Acertou!');
    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({ rolls: null });
  });

  it('o dano rola o dado da arma, dobrado no crítico, e preenche o campo', async () => {
    show();
    pick('Filisteu');
    roll('20');
    attack();
    await screen.findByText('Acerto Crítico!');
    h.random.push(0.9, 0.5); // 2d8: 8 e 5
    fireEvent.click(screen.getByRole('button', { name: 'Rolar dano' }));
    expect(screen.getByLabelText('Dano rolado')).toHaveValue(13);
  });

  it('desarmado não tem Rolagem Virtual de dano', async () => {
    show({ character: equipped(null) });
    pick('Rute');
    roll('15');
    attack();
    await screen.findByText('Acertou!');
    expect(screen.queryByRole('button', { name: 'Rolar dano' })).toBeNull();
  });
});

describe('AttackPanel: Versátil, arremesso e munição', () => {
  const armed = (
    slug: string,
    extra: { offHand?: string | null; ammo?: { slug: string; quantity: number } } = {},
  ) => ({
    attributes: { for: 16, des: 12 },
    level: 1,
    vocation: 'Guerreiro',
    equipment: { head: null, body: null, mainHand: 'ci-1', offHand: extra.offHand ?? null },
    character_items: [
      { id: 'ci-1', items: { slug, name: slug } },
      ...(extra.ammo
        ? [
            {
              id: 'ci-ammo',
              quantity: extra.ammo.quantity,
              items: { slug: extra.ammo.slug, name: extra.ammo.slug },
            },
          ]
        : []),
    ],
  });
  const twoHands = () => screen.queryByRole('checkbox', { name: /Duas Mãos/ });
  const mode = (name: string) => screen.getByRole('radio', { name });

  describe('Versátil', () => {
    it('com a outra mão livre, oferece o ataque com duas mãos e o dado maior', async () => {
      show({ character: armed('espada_longa') });
      expect(twoHands()).toBeInTheDocument();
      expect(screen.getByText(/1d8 cortante/)).toBeInTheDocument();
      fireEvent.click(twoHands()!);
      expect(screen.getByText(/1d10 cortante/)).toBeInTheDocument();
      pick('Rute');
      roll('15');
      attack();
      await screen.findByText('Acertou!');
      expect(screen.getByText('Role 1d10.')).toBeInTheDocument();
    });

    it('com a outra mão ocupada (escudo), não oferece', () => {
      show({ character: armed('espada_longa', { offHand: 'ci-escudo' }) });
      expect(twoHands()).toBeNull();
    });

    it('arma que não é Versátil não oferece', () => {
      show({ character: armed('espada_curta') });
      expect(twoHands()).toBeNull();
    });

    it('arremessando, não se usa com duas mãos', () => {
      show({ character: armed('lanca') });
      expect(twoHands()).toBeInTheDocument();
      fireEvent.click(mode('Arremesso'));
      expect(twoHands()).toBeNull();
    });
  });

  describe('arremesso', () => {
    it('a arma de arremesso escolhe entre corpo a corpo e arremesso, e as outras não', () => {
      show({ character: armed('adaga') });
      expect(mode('Corpo a corpo')).toBeChecked();
      expect(mode('Arremesso')).not.toBeChecked();
      cleanup();
      show({ character: armed('espada_curta') });
      expect(screen.queryByRole('radio', { name: 'Arremesso' })).toBeNull();
    });

    it('contra alvo Caído: Vantagem de perto e Desvantagem arremessando', () => {
      show({
        character: armed('adaga'),
        targets: [
          {
            participantId: 'p-down',
            entityId: 'e-p-down',
            entityType: 'player',
            name: 'Caído',
            ac: 10,
            conditionIds: ['caido'],
          },
        ],
      });
      fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p-down' } });
      expect(screen.getByText('✨ Vantagem')).toBeInTheDocument();
      fireEvent.click(mode('Arremesso'));
      expect(screen.getByText('⚠️ Desvantagem')).toBeInTheDocument();
      expect(screen.getByText('Motivo: Alvo Caído (à distância)')).toBeInTheDocument();
    });

    it('arremessar não gasta munição', async () => {
      show({ character: armed('adaga') });
      fireEvent.click(mode('Arremesso'));
      pick('Filisteu');
      roll('2');
      attack();
      await screen.findByText('Errou');
      expect(h.submitAttack.mock.calls[0][0].ammunition).toBeUndefined();
    });
  });

  describe('munição', () => {
    it('mostra a munição que resta', () => {
      show({ character: armed('arco_curto', { ammo: { slug: 'flechas', quantity: 12 } }) });
      expect(screen.getByText(/Munição: Flecha/)).toHaveTextContent('12');
    });

    it('o ataque gasta a munição (manda o item ao serviço)', async () => {
      show({ character: armed('funda', { ammo: { slug: 'pedras_funda', quantity: 3 } }) });
      pick('Filisteu');
      roll('2');
      attack();
      await screen.findByText('Errou');
      expect(h.submitAttack.mock.calls[0][0].ammunition).toEqual({ characterItemId: 'ci-ammo' });
    });

    it('sem munição, bloqueia o ataque e diz o motivo', () => {
      show({ character: armed('arco_curto', { ammo: { slug: 'flechas', quantity: 0 } }) });
      expect(screen.getByText(/Sem munição \(Flecha\)/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
    });

    it('sem a munição no inventário, também bloqueia', () => {
      show({ character: armed('arco_curto') });
      expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
    });

    it('à distância, o alvo Caído dá Desvantagem', () => {
      show({
        character: armed('arco_curto', { ammo: { slug: 'flechas', quantity: 5 } }),
        targets: [
          {
            participantId: 'p-down',
            entityId: 'e-p-down',
            entityType: 'player',
            name: 'Caído',
            ac: 10,
            conditionIds: ['caido'],
          },
        ],
      });
      fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p-down' } });
      expect(screen.getByText('⚠️ Desvantagem')).toBeInTheDocument();
    });

    it('arma de corpo a corpo não mostra munição', () => {
      show({ character: armed('espada_curta') });
      expect(screen.queryByText(/Munição/)).toBeNull();
    });
  });
});

describe('AttackPanel: efeito de arma', () => {
  const withEffects = () => ({
    ...equipped('espada_curta'),
    character_items: [
      {
        id: 'ci-1',
        items: { slug: 'espada_curta', name: 'espada_curta' },
        weapon_effects: [{ conditionId: 'sangrando', trigger: 'natural_18_plus' }],
      },
    ],
  });

  it('manda os efeitos da arma e o alvo ao serviço', async () => {
    show({ character: withEffects() as never });
    pick('Filisteu');
    roll('3');
    attack();
    await screen.findByText('Errou');
    expect(h.submitAttack.mock.calls[0][0].weaponEffect).toEqual({
      effects: [{ conditionId: 'sangrando', trigger: 'natural_18_plus' }],
      target: { entityId: 'e-p-fil', entityType: 'player' },
    });
  });

  it('arma sem efeito não manda nada', async () => {
    show();
    pick('Filisteu');
    roll('3');
    attack();
    await screen.findByText('Errou');
    expect(h.submitAttack.mock.calls[0][0].weaponEffect).toBeUndefined();
  });

  it('avisa quando o efeito de arma disparou', async () => {
    h.submitAttack.mockResolvedValue({ id: 'a1', weaponEffectTriggered: true, messages: [] });
    show({ character: withEffects() as never });
    pick('Filisteu');
    roll('18');
    attack();
    await screen.findByText('Acertou!');
    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    expect(await screen.findByText('Efeito de arma ativado!')).toBeInTheDocument();
  });

  it('sem disparo, não fala em efeito de arma', async () => {
    show({ character: withEffects() as never });
    pick('Filisteu');
    roll('3');
    attack();
    await screen.findByText('Errou');
    expect(screen.queryByText(/Efeito de arma/)).toBeNull();
  });
});

describe('AttackPanel: a conta e a arma na tela', () => {
  it('mostra o atributo e a Proficiência que entram na soma, sem a CA', () => {
    show();
    expect(screen.getByText('d20 + FOR +3 + Proficiência +2')).toBeInTheDocument();
  });

  it('sem proficiência com a arma, a Proficiência não entra na conta mostrada', () => {
    show({ character: { ...equipped('espada_longa'), vocation: 'Sacerdote' } });
    expect(screen.getByText('d20 + FOR +3')).toBeInTheDocument();
  });

  it('mostra as propriedades da arma', () => {
    show({ character: equipped('adaga') });
    expect(screen.getByText(/Acuidade, Arremesso/)).toBeInTheDocument();
  });

  it('mudar a Inspiração depois de rolar o d20 apaga os dados rolados (a modalidade mudou)', () => {
    h.random.push(0.7, 0.2);
    show({ inspiration: { available: true, sessionId: 's1', day: 3 } });
    pick('Atordoado');
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByLabelText('Dados rolados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Usar Inspiração/ }));
    expect(screen.queryByLabelText('Dados rolados')).toBeNull();
  });

  it('trocar o alvo depois de rolar o d20 apaga os dados rolados', () => {
    h.random.push(0.7, 0.2);
    show();
    pick('Atordoado');
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    pick('Rute');
    expect(screen.queryByLabelText('Dados rolados')).toBeNull();
  });
});
