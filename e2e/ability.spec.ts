import { adminClient } from './support/admin';
import { addCondition, startCombat } from './support/combat';
import type { Locator, Page } from '@playwright/test';
import { test, expect, type Seed, type SignIn } from './fixtures';
import { watchPlayers } from './support/ui';

const FILISTEU = 'Filisteu';

/**
 * Uma mesa com Eliabe (Levi, Sacerdote nível 16, Caminho A: Palavra de Autoridade e Retribuição
 * Divina), Rute (aliada) e um Filisteu, no combate. `initiative` decide de quem é o primeiro turno.
 */
async function openFight(
  seed: Seed,
  signIn: SignIn,
  initiative: Record<string, number> = { Eliabe: 20, [FILISTEU]: 10, Rute: 5 },
  options: { eliabe?: Parameters<Seed['createCharacter']>[1]; extraEnemy?: boolean } = {},
) {
  const eliabe = await seed.createCharacter('player1', {
    name: 'Eliabe',
    tribe: 'Levi',
    vocation: 'Sacerdote',
    level: 16,
    skills: { path_choices: { tribe: { 16: 'A' } }, ability_uses: {} },
    stats: { pv: 40, current_pv: 40, ca: 11, faith: 80, current_faith: 80 },
    ...options.eliabe,
  });
  const rute = await seed.createCharacter('player2', {
    name: 'Rute',
    stats: { pv: 11, current_pv: 11, ca: 11, faith: 50 },
  });
  const filisteu = await seed.createEnemy(FILISTEU, { pv: 20, ca: 12 }, { sab: 10 });
  // O segundo inimigo tem SAB 18 (+4): o modificador do TR conta.
  const bandido = options.extraEnemy
    ? await seed.createEnemy('Bandido', { pv: 11, ca: 12 }, { sab: 18 })
    : null;
  const sessionId = await seed.createSession({
    characters: [eliabe, rute, filisteu, ...(bandido ? [bandido] : [])],
  });

  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  const ally = await signIn('player2');
  await ally.goto(`/session/${sessionId}`);
  await watchPlayers(master, 3);

  await startCombat(master, initiative);
  // Os jogadores recebem o combate pelo tempo real: cada teste só começa com a tela de combate no ar.
  await expect(player.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
  await expect(ally.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
  return { master, player, ally, eliabe, rute, filisteu, bandido };
}

type Slot = 'Ação' | 'Ação Bônus' | 'Reação';
const TAB: Record<Slot, RegExp> = {
  Ação: /^Ação \d/,
  'Ação Bônus': /^Ação Bônus/,
  Reação: /^Reação/,
};

/** Abre o Cartão da Habilidade pela Hotbar: a aba do espaço do turno e depois a peça. */
async function openAbility(player: Page, name: string, slot: Slot = 'Ação'): Promise<Locator> {
  await player.getByRole('tab', { name: TAB[slot] }).click();
  await player.getByRole('button', { name: new RegExp(`^${name}`) }).click();
  const card = player.getByRole('dialog', { name });
  await expect(card).toBeVisible();
  return card;
}

/** O painel de uso aberto: mora dentro do Cartão da Habilidade. */
function usePanel(player: Page): Locator {
  return player.getByRole('dialog');
}

/** As Condições gravadas no participante do combate de uma ficha. */
async function conditionsOf(entityId: string): Promise<string[]> {
  const { data, error } = await adminClient()
    .from('combat_participants')
    .select('conditions')
    .eq('entity_id', entityId)
    .single();
  if (error) throw error;
  return (data.conditions as { conditionId: string }[]).map((c) => c.conditionId);
}

test.describe('efeito de Habilidade', () => {
  test('Palavra de Autoridade paraliza o inimigo, marca a Ação e gasta o uso', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe, filisteu } = await openFight(seed, signIn);

    await expect(player.getByText('É O SEU TURNO!')).toBeVisible();
    const card = await openAbility(player, 'Palavra de Autoridade');
    await card.getByRole('button', { name: 'Usar', exact: true }).click();
    await expect(player.getByText('O app aplica: Paralisado por 1 rodada')).toBeVisible();
    await usePanel(player).getByLabel('Alvo').selectOption({ label: FILISTEU });
    await usePanel(player).getByRole('button', { name: 'Usar Habilidade' }).click();

    await expect(player.getByText('Filisteu: Paralisado')).toBeVisible();
    await expect(master.getByText('Filisteu: Paralisado')).toBeVisible({ timeout: 15_000 });
    await expect(master.getByText(/Eliabe usou Palavra de Autoridade/).first()).toBeVisible();
    await expect(master.getByText('Últimos ataques e Habilidades')).toBeVisible();

    expect(await conditionsOf(filisteu)).toEqual(['paralisado']);
    const { data, error } = await adminClient()
      .from('characters')
      .select('skills')
      .eq('id', eliabe)
      .single();
    if (error) throw error;
    expect((data.skills as { ability_uses: Record<string, number> }).ability_uses).toEqual({
      'tribe-levi-16-palavra-de-auto': 1,
    });

    // A Ação principal ficou marcada, e a Habilidade (1 por combate) está sem usos.
    await expect(player.getByRole('checkbox', { name: 'Ação Principal' })).toBeChecked();
    await usePanel(player).getByRole('button', { name: 'Fechar' }).first().click();
    const again = await openAbility(player, 'Palavra de Autoridade');
    await expect(again.getByRole('button', { name: 'Usar', exact: true })).toBeDisabled();
  });

  test('fora do turno a Ação é recusada, mas a Reação vale: Retribuição Divina amedronta o agressor', async ({
    seed,
    signIn,
  }) => {
    const { player, filisteu } = await openFight(seed, signIn, {
      Eliabe: 5,
      [FILISTEU]: 10,
      Rute: 20,
    });

    const blocked = await openAbility(player, 'Palavra de Autoridade');
    await expect(blocked.getByText('Não é o seu turno')).toBeVisible();
    await expect(blocked.getByRole('button', { name: 'Usar', exact: true })).toBeDisabled();
    await blocked.getByRole('button', { name: 'Fechar' }).click();

    const reaction = await openAbility(player, 'Retribuição Divina', 'Reação');
    await reaction.getByRole('button', { name: 'Usar', exact: true }).click();
    await expect(player.getByText('O app aplica: Amedrontado até ser removido')).toBeVisible();
    await usePanel(player).getByLabel('Alvo').selectOption({ label: FILISTEU });
    await usePanel(player).getByRole('button', { name: 'Usar Habilidade' }).click();

    await expect(player.getByText('Filisteu: Amedrontado')).toBeVisible();
    await expect(player.getByRole('checkbox', { name: 'Reação' })).toBeChecked();
    expect(await conditionsOf(filisteu)).toEqual(['amedrontado']);
  });
  test('Tática do Cântaro Quebrado fica pendente: o Mestre lança o TR e só quem falha fica Amedrontado', async ({
    seed,
    signIn,
  }) => {
    const { master, player, filisteu, bandido } = await openFight(
      seed,
      signIn,
      { Eliabe: 20, [FILISTEU]: 10, Bandido: 8, Rute: 5 },
      {
        extraEnemy: true,
        eliabe: {
          tribe: 'Manassés',
          vocation: 'Guerreiro',
          level: 12,
          attributes: { for: 16, des: 10, con: 12, int: 10, sab: 10, car: 10 },
          skills: { path_choices: { tribe: { 12: 'A' } }, ability_uses: {} },
        },
      },
    );

    await expect(player.getByText('É O SEU TURNO!')).toBeVisible();
    const tactic = await openAbility(player, 'Tática do Cântaro Quebrado', 'Ação Bônus');
    await tactic.getByRole('button', { name: 'Usar', exact: true }).click();
    // CD da Habilidade: 8 + Proficiência +4 (nível 12) + FOR +3 (Guerreiro) = 15.
    await expect(
      player.getByText('TR de Sabedoria dos alvos (CD 15): a Condição só entra em quem falhar.', {
        exact: true,
      }),
    ).toBeVisible();
    await usePanel(player).getByLabel(FILISTEU).check();
    await usePanel(player).getByLabel('Bandido').check();
    await usePanel(player).getByRole('button', { name: 'Usar Habilidade' }).click();

    await expect(
      player.getByText('Aguardando o Mestre lançar o TR de Sabedoria (CD 15).', { exact: true }),
    ).toBeVisible();
    // Nada entrou ainda.
    expect(await conditionsOf(filisteu)).toEqual([]);
    expect(await conditionsOf(bandido!)).toEqual([]);

    // O Mestre lança: Filisteu (SAB +0) tira 5 e falha; Bandido (SAB +4) tira 12, 16 no total, e passa.
    const pending = master.getByRole('region', { name: 'TRs de Habilidades pendentes' });
    await expect(pending.getByText('TR de Sabedoria · CD 15')).toBeVisible({ timeout: 15_000 });
    await pending.getByLabel(`d20 de ${FILISTEU}`).fill('5');
    await pending.getByLabel('d20 de Bandido').fill('12');
    await pending.getByRole('button', { name: 'Resolver TR' }).click();

    await expect(
      player.getByText('Filisteu: Amedrontado (d20 5, total 5)', { exact: true }),
    ).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      player.getByText('Bandido: passou no TR (d20 12, total 16)', { exact: true }),
    ).toBeVisible();
    await expect(pending).toBeHidden();
    expect(await conditionsOf(filisteu)).toEqual(['amedrontado']);
    expect(await conditionsOf(bandido!)).toEqual([]);
    await expect(player.getByRole('checkbox', { name: 'Ação Bônus' })).toBeChecked();
  });

  test('Purificação tira a Condição escolhida do aliado e deixa as outras', async ({
    seed,
    signIn,
  }) => {
    const { master, player, rute } = await openFight(seed, signIn);
    await addCondition(master, 'Rute', 'Envenenado', 0);
    await addCondition(master, 'Rute', 'Cego', 0);

    await expect(player.getByText('É O SEU TURNO!')).toBeVisible();
    const purify = await openAbility(player, 'Purificação');
    await purify.getByRole('button', { name: 'Usar', exact: true }).click();
    await expect(
      player.getByText('O app tira: Amedrontado, Atordoado ou Envenenado do aliado', {
        exact: true,
      }),
    ).toBeVisible();
    await usePanel(player).getByLabel('Alvo').selectOption({ label: 'Rute' });
    // Só as Condições da lista que Rute tem entram na escolha: o Cego fica de fora.
    const choice = usePanel(player).getByLabel('Condição que sai de Rute');
    await expect(choice.getByRole('option', { name: 'Envenenado' })).toBeAttached({
      timeout: 15_000,
    });
    await expect(choice.getByRole('option', { name: 'Cego' })).toHaveCount(0);
    await expect(usePanel(player).getByRole('button', { name: 'Usar Habilidade' })).toBeDisabled();
    await choice.selectOption({ label: 'Envenenado' });
    await usePanel(player).getByRole('button', { name: 'Usar Habilidade' }).click();

    await expect(player.getByText('Rute: deixou de estar Envenenado')).toBeVisible();
    await expect(master.getByText(/Eliabe usou Purificação/).first()).toBeVisible({
      timeout: 15_000,
    });
    expect(await conditionsOf(rute)).toEqual(['cego']);
    // Ação gasta e Habilidade sem usos até o próximo Descanso Curto.
    await expect(player.getByRole('checkbox', { name: 'Ação Principal' })).toBeChecked();
    await usePanel(player).getByRole('button', { name: 'Fechar' }).first().click();
    const again = await openAbility(player, 'Purificação');
    await expect(again.getByRole('button', { name: 'Usar', exact: true })).toBeDisabled();
  });

  test('Presença Aterradora: o TR chega ao celular dos jogadores e a Condição entra só em quem falhou', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      stats: { pv: 40, current_pv: 40, ca: 11, faith: 80, current_faith: 80 },
    });
    const rute = await seed.createCharacter('player2', {
      name: 'Rute',
      stats: { pv: 11, current_pv: 11, ca: 11, faith: 50 },
    });
    // O Anakim traz a Habilidade da biblioteca do bestiário: TR de Sabedoria CD 13, Amedrontado.
    const anakim = await seed.createCharacter('master', {
      name: 'Anakim',
      is_enemy: true,
      tribe: 'Inimigo',
      has_participated_in_session: true,
      stats: { pv: 60, current_pv: 60, ca: 15, faith: 0, current_faith: 0 },
      skills: [
        {
          name: 'Presença Aterradora',
          description: 'Assusta quem o vê.',
          libraryId: 'enemy-presenca-aterradora',
        },
        { name: 'Comando', description: 'Só texto' },
      ],
    });
    const sessionId = await seed.createSession({ characters: [eliabe, rute, anakim] });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    const ally = await signIn('player2');
    await ally.goto(`/session/${sessionId}`);
    await watchPlayers(master, 3);
    await startCombat(master, { Anakim: 20, Eliabe: 10, Rute: 5 });
    await expect(player.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
    await expect(ally.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });

    // Só a Habilidade com efeito aparece para o Mestre usar; o efeito vem do bestiário.
    const panel = master.getByRole('region', { name: 'Habilidades dos inimigos' });
    await expect(panel.getByText('TR de Sabedoria CD 13 · Amedrontado (10 rodadas)')).toBeVisible({
      timeout: 15_000,
    });
    await expect(panel.getByText('Comando')).toHaveCount(0);
    await panel.getByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }).click();
    await panel.getByLabel('Eliabe').check();
    await panel.getByLabel('Rute').check();
    await panel.getByRole('button', { name: 'Usar a Habilidade' }).click();
    await expect(panel.getByRole('status')).toContainText('o TR foi para os jogadores');

    // O TR chega como um Teste de sessão: Eliabe tira 2 e falha, Rute tira 20 e passa.
    await expect(player.getByText('Resistência (Sabedoria)')).toBeVisible({ timeout: 15_000 });
    await player.getByRole('spinbutton').fill('2');
    await player.getByRole('button', { name: 'Enviar Valor' }).click();
    await expect(player.getByText('Resultado Enviado!')).toBeVisible();
    await expect(ally.getByText('Resistência (Sabedoria)')).toBeVisible({ timeout: 15_000 });
    await ally.getByRole('spinbutton').fill('20');
    await ally.getByRole('button', { name: 'Enviar Valor' }).click();
    await expect(ally.getByText('Resultado Enviado!')).toBeVisible();

    // Nada entrou até o Mestre aplicar os resultados.
    const pending = master.getByRole('region', { name: 'TRs de Habilidades pendentes' });
    await expect(pending.getByText(/Eliabe: falhou/)).toBeVisible({ timeout: 15_000 });
    await expect(pending.getByText(/Rute: passou/)).toBeVisible();
    expect(await conditionsOf(eliabe)).toEqual([]);
    await pending.getByRole('button', { name: 'Aplicar resultados' }).click();

    await expect(pending).toBeHidden({ timeout: 15_000 });
    expect(await conditionsOf(eliabe)).toEqual(['amedrontado']);
    expect(await conditionsOf(rute)).toEqual([]);
    await expect(master.getByText(/Anakim usou Presença Aterradora/).first()).toBeVisible();
  });

  test('Grito Atormentador: quem falha perde a Fé pelo dado, a Habilidade entra em Recarga e volta com 5 ou 6', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      stats: { pv: 40, current_pv: 40, ca: 11, faith: 80, current_faith: 80 },
    });
    const rute = await seed.createCharacter('player2', {
      name: 'Rute',
      stats: { pv: 11, current_pv: 11, ca: 11, faith: 50, current_faith: 50 },
    });
    // O Endemoniado traz o Grito Atormentador da biblioteca: TR de Sabedoria CD 12, 1d4 de Fé, Recarga 5-6.
    const endemoniado = await seed.createCharacter('master', {
      name: 'Endemoniado',
      is_enemy: true,
      tribe: 'Inimigo',
      has_participated_in_session: true,
      stats: { pv: 30, current_pv: 30, ca: 12, faith: 0, current_faith: 0 },
      skills: [
        {
          name: 'Grito Atormentador',
          description: 'Um ruído inumano.',
          libraryId: 'enemy-grito-atormentador',
        },
      ],
    });
    const sessionId = await seed.createSession({ characters: [eliabe, rute, endemoniado] });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    const ally = await signIn('player2');
    await ally.goto(`/session/${sessionId}`);
    await watchPlayers(master, 3);
    // O Endemoniado age primeiro: é o turno dele quando a Recarga for lançada.
    await startCombat(master, { Endemoniado: 20, Eliabe: 10, Rute: 5 });
    await expect(player.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
    await expect(ally.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });

    const panel = master.getByRole('region', { name: 'Habilidades dos inimigos' });
    await expect(
      panel.getByText(/TR de Sabedoria CD 12.*perde 1d4 de Fé.*Recarga 5-6/),
    ).toBeVisible({
      timeout: 15_000,
    });
    await panel.getByRole('button', { name: 'Usar Grito Atormentador (Endemoniado)' }).click();
    await panel.getByLabel('Eliabe').check();
    await panel.getByLabel('Rute').check();
    await panel.getByRole('button', { name: 'Usar a Habilidade' }).click();
    await expect(panel.getByRole('status')).toContainText('o TR foi para os jogadores');

    // Eliabe falha (2) e Rute passa (20).
    await expect(player.getByText('Resistência (Sabedoria)')).toBeVisible({ timeout: 15_000 });
    await player.getByRole('spinbutton').fill('2');
    await player.getByRole('button', { name: 'Enviar Valor' }).click();
    await expect(player.getByText('Resultado Enviado!')).toBeVisible();
    await expect(ally.getByText('Resistência (Sabedoria)')).toBeVisible({ timeout: 15_000 });
    await ally.getByRole('spinbutton').fill('20');
    await ally.getByRole('button', { name: 'Enviar Valor' }).click();
    await expect(ally.getByText('Resultado Enviado!')).toBeVisible();

    // O Mestre rola o dado de Fé só de quem falhou, e o lembrete da Desvantagem aparece.
    const pending = master.getByRole('region', { name: 'TRs de Habilidades pendentes' });
    await expect(pending.getByText(/Eliabe: falhou/)).toBeVisible({ timeout: 15_000 });
    await expect(pending.getByText(/Rute: passou/)).toBeVisible();
    await expect(pending.getByLabel('Dado de Fé de Rute (1d4)')).toHaveCount(0);
    await expect(
      pending.getByText(/Lembrete: Desvantagem na próxima jogada de ataque/),
    ).toBeVisible();
    const faithDie = pending.getByLabel('Dado de Fé de Eliabe (1d4)');
    await faithDie.fill('5');
    await expect(pending.getByRole('button', { name: 'Aplicar resultados' })).toBeDisabled();
    await faithDie.fill('3');
    await pending.getByRole('button', { name: 'Aplicar resultados' }).click();
    await expect(pending).toBeHidden({ timeout: 15_000 });

    const faithOf = async (id: string) => {
      const { data, error } = await adminClient()
        .from('characters')
        .select('stats')
        .eq('id', id)
        .single();
      if (error) throw error;
      return (data.stats as { current_faith: number }).current_faith;
    };
    expect(await faithOf(eliabe)).toBe(77);
    expect(await faithOf(rute)).toBe(50);
    await expect(
      master.getByText(/Eliabe: d20 2 .* · falhou · perdeu 3 de Fé/).first(),
    ).toBeVisible();

    // A Habilidade entrou em Recarga: não dá para usar de novo.
    await expect(
      panel.getByRole('button', { name: 'Usar Grito Atormentador (Endemoniado)' }),
    ).toBeDisabled({ timeout: 15_000 });
    await expect(panel.getByText('Em Recarga (5-6)', { exact: true })).toBeVisible();

    // No turno do Endemoniado o Mestre lança o d6: 4 não volta, 5 volta.
    const d6 = panel.getByLabel('d6 da Recarga de Grito Atormentador (Endemoniado)');
    const recharge = panel.getByRole('button', {
      name: 'Recarregar Grito Atormentador (Endemoniado)',
    });
    await d6.fill('4');
    await recharge.click();
    await expect(panel.getByRole('status')).toContainText('continua em Recarga');
    await d6.fill('5');
    await recharge.click();
    await expect(panel.getByRole('status')).toContainText('Grito Atormentador voltou');
    await expect(
      panel.getByRole('button', { name: 'Usar Grito Atormentador (Endemoniado)' }),
    ).toBeEnabled({ timeout: 15_000 });
    const { data: state, error } = await adminClient()
      .from('combat_participants')
      .select('ability_state')
      .eq('entity_id', endemoniado)
      .single();
    if (error) throw error;
    expect(state.ability_state).toEqual({});
  });
});
