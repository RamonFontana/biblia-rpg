import type { Page } from '@playwright/test';
import { adminClient } from './support/admin';
import { expect, test } from './fixtures';

const SESSION_NAME = 'Invasão a Jericó';

const stats = (current_faith: number) => ({
  pv: 11,
  current_pv: 11,
  ca: 11,
  faith: 50,
  current_faith,
});

test.describe('Estado de Fé', () => {
  test('o selo aparece na ficha do jogador e no cartão do Mestre, e segue a Fé em tempo real', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(25) });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);

    await expect(master.getByText('Eliabe (Nível 1)')).toBeVisible();
    await expect(master.getByText('Abalado')).toBeVisible();
    await expect(player.getByText('Abalado').first()).toBeVisible();

    const { error } = await adminClient()
      .from('characters')
      .update({ stats: stats(80) })
      .eq('id', eliabe);
    if (error) throw error;

    await expect(master.getByText('Inabalável')).toBeVisible();
    await expect(player.getByText('Inabalável').first()).toBeVisible();
    await expect(master.getByText('Abalado')).toHaveCount(0);
  });

  test('o aviso de Ruptura aparece com Fé 0, com o nome, e some quando a Fé sobe', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(0) });
    const rute = await seed.createCharacter('player2', { name: 'Rute', stats: stats(40) });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe, rute],
    });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);

    const alert = master.getByRole('alert').filter({ hasText: 'Ruptura' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Eliabe');
    await expect(alert).not.toContainText('Rute');

    const { error } = await adminClient()
      .from('characters')
      .update({ stats: stats(3) })
      .eq('id', eliabe);
    if (error) throw error;

    await expect(alert).toHaveCount(0);
  });
});

const faithOf = async (characterId: string) => {
  const { data, error } = await adminClient()
    .from('characters')
    .select('stats')
    .eq('id', characterId)
    .single();
  if (error) throw error;
  return (data.stats as { current_faith: number }).current_faith;
};

/** O Mestre pede um Teste de Fé de Clamor (Pequena Providência, Punição 0) ao personagem. */
async function askClamor(master: Page, characterName: string, selfish: boolean) {
  await master.getByRole('button', { name: /Solicitar Teste/ }).click();
  const dialog = master.locator('div.fixed');
  await dialog.getByRole('combobox').first().selectOption('Fé');
  await dialog.getByRole('radio', { name: 'Clamor' }).click();
  await dialog.getByRole('button', { name: /Pequena Providência/ }).click();
  if (selfish) await dialog.getByRole('checkbox', { name: 'Pedido Egoísta' }).check();
  await dialog.getByText(characterName).click();
  await dialog.getByRole('button', { name: 'Solicitar Teste' }).click();
}

test.describe('Teste de Fé: Clamor', () => {
  test('o Clamor que falha com Pedido Egoísta custa 1d6 de Fé', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(50) });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    await expect(master.getByText('Eliabe (Nível 1)')).toBeVisible();

    await askClamor(master, 'Eliabe', true);

    await expect(player.getByText('O Mestre Exige um Teste!')).toBeVisible();
    await expect(player.getByText('Clamor')).toBeVisible();
    await expect(player.getByText('Pedido Egoísta')).toBeVisible();
    await player.getByRole('spinbutton').fill('100');
    await player.getByRole('button', { name: 'Enviar Valor' }).click();
    await expect(player.getByText('Teste de Fé Reprovado!')).toBeVisible();
    await player.getByRole('spinbutton').fill('4');
    await player.getByRole('button', { name: 'Confirmar Punição' }).click();

    await expect(player.getByText(/perdeu 1d6 pontos de Fé/)).toBeVisible();
    await expect(master.getByText('Perdeu Fé (1d6)')).toBeVisible();
    expect(await faithOf(eliabe)).toBe(46);
  });

  test('o Clamor que falha sem Pedido Egoísta é silêncio divino: a Fé não muda', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(50) });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    await expect(master.getByText('Eliabe (Nível 1)')).toBeVisible();

    await askClamor(master, 'Eliabe', false);

    await expect(player.getByText('O Mestre Exige um Teste!')).toBeVisible();
    await player.getByRole('spinbutton').fill('100');
    await player.getByRole('button', { name: 'Enviar Valor' }).click();

    await expect(player.getByText(/silêncio divino/i)).toBeVisible();
    await expect(player.getByText('Teste de Fé Reprovado!')).toHaveCount(0);
    await expect(master.getByText(/Silêncio divino/)).toBeVisible();
    expect(await faithOf(eliabe)).toBe(50);
  });
});

test.describe('Fortaleza', () => {
  test('o Mestre dá +1d4 de Fé, o jogador vê a Fé mudar e o teto de 100 vale', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      fortress: 'Coragem',
      stats: stats(40),
    });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    await expect(master.getByText('Eliabe (Nível 1)')).toBeVisible();

    const giveFortitude = async (die: string) => {
      await master.getByRole('button', { name: 'Fortaleza' }).click();
      await expect(master.getByText('Coragem')).toBeVisible();
      await master.getByRole('spinbutton').fill(die);
      await master.getByRole('button', { name: 'Aplicar Fortaleza' }).click();
      await expect(master.getByText('Coragem')).toHaveCount(0);
    };

    await giveFortitude('3');
    await expect(player.getByText('43/100').first()).toBeVisible();
    expect(await faithOf(eliabe)).toBe(43);

    // Sem limite por dia, e o teto de 100 vale.
    const { error } = await adminClient()
      .from('characters')
      .update({ stats: stats(99) })
      .eq('id', eliabe);
    if (error) throw error;
    await expect(master.getByText('99/100')).toBeVisible();
    await giveFortitude('4');
    await expect(player.getByText('100/100').first()).toBeVisible();
    expect(await faithOf(eliabe)).toBe(100);
  });
});
