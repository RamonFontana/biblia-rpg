import { adminClient } from './support/admin';
import { startCombat } from './support/combat';
import type { Locator, Page } from '@playwright/test';
import { test, expect, type Seed, type SignIn } from './fixtures';

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
  await expect(master.getByText('Participantes Online (3)')).toBeVisible();

  await startCombat(master, initiative);
  // Os jogadores recebem o combate pelo tempo real: cada teste só começa com a tela de combate no ar.
  await expect(player.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
  await expect(ally.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
  return { master, player, ally, eliabe, filisteu, bandido };
}

/**
 * O cartão de uma Habilidade na lista da visão de combate (a ficha, mais abaixo, também lista as
 * Habilidades, com outro caminho de uso).
 */
function abilityCard(player: Page, name: string): Locator {
  const list = player.getByRole('heading', { name: 'Habilidades', level: 3 }).first().locator('..');
  // Os blocos de fora também casam com o filtro; o último, em ordem do documento, é o cartão.
  return list.locator('div.bg-stone-900.border-stone-800').filter({ hasText: name }).last();
}

/** O painel de uso aberto (no turno do jogador o painel de ataque também tem um "Alvo"). */
function usePanel(player: Page): Locator {
  return player.locator('div[class*="border-amber-600/60"]').filter({
    has: player.getByRole('button', { name: 'Usar Habilidade' }),
  });
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
    await abilityCard(player, 'Palavra de Autoridade')
      .getByRole('button', { name: 'Usar' })
      .click();
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
    await expect(player.getByLabel('Ação Principal')).toBeChecked();
    await expect(
      abilityCard(player, 'Palavra de Autoridade').getByRole('button', { name: 'Usar' }),
    ).toBeDisabled();
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

    await abilityCard(player, 'Palavra de Autoridade')
      .getByRole('button', { name: 'Usar' })
      .click();
    await expect(player.getByText('Não é o seu turno')).toBeVisible();
    await usePanel(player).getByLabel('Alvo').selectOption({ label: FILISTEU });
    await expect(player.getByRole('button', { name: 'Usar Habilidade' })).toBeDisabled();
    await player.getByRole('button', { name: 'Fechar' }).click();

    await abilityCard(player, 'Retribuição Divina').getByRole('button', { name: 'Usar' }).click();
    await expect(player.getByText('O app aplica: Amedrontado até ser removido')).toBeVisible();
    await usePanel(player).getByLabel('Alvo').selectOption({ label: FILISTEU });
    await usePanel(player).getByRole('button', { name: 'Usar Habilidade' }).click();

    await expect(player.getByText('Filisteu: Amedrontado')).toBeVisible();
    await expect(player.getByLabel('Reação')).toBeChecked();
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
    await abilityCard(player, 'Tática do Cântaro Quebrado')
      .getByRole('button', { name: 'Usar' })
      .click();
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
    await expect(player.getByLabel('Ação Bônus')).toBeChecked();
  });
});
