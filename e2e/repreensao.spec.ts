import type { Locator, Page } from '@playwright/test';
import { adminClient } from './support/admin';
import { startCombat } from './support/combat';
import { test, expect, type Seed, type SignIn } from './fixtures';
import { openPanel, watchPlayers } from './support/ui';

const LEGION = 'Legião';
const BANDIT = 'Bandido';

/** Um inimigo de CAR 10, com as Habilidades pedidas. */
const enemy = (seed: Seed, name: string, skills: unknown[]) =>
  seed.createCharacter('master', {
    name,
    is_enemy: true,
    tribe: 'Inimigo',
    has_participated_in_session: true,
    attributes: { for: 12, des: 12, con: 12, int: 6, sab: 10, car: 10 },
    stats: { pv: 20, current_pv: 20, ca: 12, faith: 0, current_faith: 0 },
    skills: skills as never,
  });

/** Uma mesa com Eliabe (Sacerdote nível 2, SAB 16, 40 de Fé), no turno dele, contra os inimigos. */
async function openFight(
  seed: Seed,
  signIn: SignIn,
  enemies: string[],
  initiative: Record<string, number>,
) {
  const eliabe = await seed.createCharacter('player1', {
    name: 'Eliabe',
    tribe: 'Levi',
    vocation: 'Sacerdote',
    level: 2,
    attributes: { for: 10, des: 10, con: 12, int: 10, sab: 16, car: 12 },
    skills: { path_choices: {}, ability_uses: {} },
    stats: { pv: 20, current_pv: 20, ca: 11, faith: 40, current_faith: 40 },
  });
  const session = await seed.createSession({ characters: [eliabe, ...enemies] });
  const master = await signIn('master');
  await master.goto(`/session/${session}`);
  const player = await signIn('player1');
  await player.goto(`/session/${session}`);
  await watchPlayers(master, 2);
  await startCombat(master, { Eliabe: 20, ...initiative });
  await expect(player.getByText('Inimigos na Cena')).toBeVisible({ timeout: 20_000 });
  return { master, player, eliabe };
}

/** Abre o painel de uso da Repreensão Divina pela Hotbar. */
async function openRebuke(player: Page): Promise<Locator> {
  await player.getByRole('tab', { name: /^Ação \d/ }).click();
  await player.getByRole('button', { name: /^Repreensão Divina/ }).click();
  const card = player.getByRole('dialog', { name: 'Repreensão Divina' });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Usar', exact: true }).click();
  return player.getByRole('dialog');
}

test.describe('Repreensão Divina', () => {
  test('só o Endemoniado é alvo; o Mestre lança o TR de CAR e a falha vira lembrete de fuga', async ({
    seed,
    signIn,
  }) => {
    const legion = await enemy(seed, LEGION, [
      { name: 'Vulnerabilidade Espiritual', description: 'Alvo da Repreensão Divina.' },
    ]);
    const bandit = await enemy(seed, BANDIT, [{ name: 'Ataque Furtivo', description: '+1d6.' }]);
    const { master, player, eliabe } = await openFight(seed, signIn, [legion, bandit], {
      [LEGION]: 10,
      [BANDIT]: 5,
    });

    const panel = await openRebuke(player);
    // CD: 8 + Proficiência +2 (nível 2) + SAB +3 = 13. Só o Endemoniado aparece.
    await expect(
      panel.getByText(/TR de Carisma dos alvos \(CD 13\): o Mestre lembra de quem falhar/),
    ).toBeVisible();
    await expect(panel.getByLabel('Alvo').locator('option')).toHaveText(['Escolha...', LEGION]);
    await panel.getByLabel('Alvo').selectOption({ label: LEGION });
    await panel.getByRole('button', { name: 'Usar Habilidade' }).click();
    await expect(
      player.getByText('Aguardando o Mestre lançar o TR de Carisma (CD 13).', { exact: true }),
    ).toBeVisible();

    // O Mestre lança: d20 4 + CAR +0 = 4, contra a CD 13, falha.
    const pending = master.getByRole('region', { name: 'TRs de Habilidades pendentes' });
    await expect(pending.getByText('TR de Carisma · CD 13')).toBeVisible({ timeout: 15_000 });
    await pending.getByLabel(`d20 de ${LEGION}`).fill('4');
    await pending.getByRole('button', { name: 'Resolver TR' }).click();

    const flight = 'foge do combate por 1 min (10 rodadas)';
    await expect(
      player.getByText(`Legião: falhou no TR: ${flight} (d20 4, total 4)`, { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(pending).toBeHidden();
    // Nenhuma Condição foi aplicada.
    const { data: participant } = await adminClient()
      .from('combat_participants')
      .select('conditions')
      .eq('entity_id', legion)
      .single();
    expect(participant?.conditions).toEqual([]);

    // O histórico do Mestre traz o resultado e o lembrete.
    await openPanel(master, 'Histórico');
    await expect(master.getByText(`Lembrete (${LEGION}): ${flight}`)).toBeVisible();

    // Os 8 de Fé e o uso foram gastos.
    const { data: character } = await adminClient()
      .from('characters')
      .select('stats, skills')
      .eq('id', eliabe)
      .single();
    expect((character?.stats as { current_faith: number }).current_faith).toBe(32);
    expect((character?.skills as { ability_uses: Record<string, number> }).ability_uses).toEqual({
      'vocation-sacerdote-2-repreensao-divi': 1,
    });
  });

  test('sem Endemoniado na mesa, o painel avisa e a Habilidade não gasta nada', async ({
    seed,
    signIn,
  }) => {
    const bandit = await enemy(seed, BANDIT, [{ name: 'Ataque Furtivo', description: '+1d6.' }]);
    const { player, eliabe } = await openFight(seed, signIn, [bandit], {
      [BANDIT]: 5,
    });

    const panel = await openRebuke(player);
    await expect(
      panel.getByText('Nenhum alvo possível: só atinge inimigos com Vulnerabilidade Espiritual.'),
    ).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Usar Habilidade' })).toHaveCount(0);

    const { data } = await adminClient()
      .from('characters')
      .select('stats')
      .eq('id', eliabe)
      .single();
    expect((data?.stats as { current_faith: number }).current_faith).toBe(40);
  });
});
