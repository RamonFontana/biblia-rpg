import { adminClient } from './support/admin';
import { test, expect, type Seed, type SignIn } from './fixtures';
import { closePanel, openPanel, watchPlayers } from './support/ui';

/** Uma mesa com Eliabe (jogador 1), os dois já online. */
async function openTable(seed: Seed, signIn: SignIn) {
  const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
  const sessionId = await seed.createSession({ characters: [eliabe] });
  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  await watchPlayers(master, 2);
  return { master, player, sessionId };
}

test.describe('Mapa atual', () => {
  test('o Mestre soma um terreno e o mostra, e o jogador vê o Palco trocar sem recarregar', async ({
    seed,
    signIn,
  }) => {
    const { master, player, sessionId } = await openTable(seed, signIn);
    await expect(player.getByRole('region', { name: 'Retratos' })).toBeVisible();

    await openPanel(master, 'Mapas');
    await master.getByLabel('Nome do mapa').fill('Deserto de Zim');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: 'Mostrar aos jogadores: Deserto de Zim' }).click();

    await expect(player.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeVisible();
    await expect(player.getByRole('region', { name: 'Retratos' })).toHaveCount(0);

    const { data } = await adminClient()
      .from('game_sessions')
      .select('shown_map_id')
      .eq('id', sessionId)
      .single();
    expect(data?.shown_map_id).not.toBeNull();

    await master.getByRole('button', { name: 'Voltar à cena' }).click();
    await expect(player.getByRole('region', { name: 'Retratos' })).toBeVisible();
    await expect(player.getByRole('region', { name: /^Mapa:/ })).toHaveCount(0);
  });

  test('o Mestre prepara outro mapa sem que o jogador o veja', async ({ seed, signIn }) => {
    const { master, player } = await openTable(seed, signIn);

    await openPanel(master, 'Mapas');
    await master.getByLabel('Nome do mapa').fill('Deserto de Zim');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: 'Mostrar aos jogadores: Deserto de Zim' }).click();
    await expect(player.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeVisible();

    await master.getByLabel('Terreno', { exact: true }).selectOption('terreno-piso-de-casa');
    await master.getByLabel('Nome do mapa').fill('Casa de Raabe');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: 'Preparar Casa de Raabe' }).click();
    await closePanel(master);

    await expect(master.getByRole('region', { name: 'Mapa: Casa de Raabe' })).toBeVisible();
    await expect(master.getByText('Em preparo: Casa de Raabe')).toBeVisible();
    await expect(player.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeVisible();
  });

  test('o jogador amplia e arrasta o mapa, e o botão Ajustar volta ao mapa inteiro', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    await openPanel(master, 'Mapas');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: /^Mostrar aos jogadores/ }).click();

    const layer = player.getByTestId('camada-do-mapa');
    await expect(layer).toBeVisible();
    const scaleOf = async () => {
      const transform = await layer.evaluate((el) => (el as HTMLElement).style.transform);
      return Number(/scale\(([\d.]+)\)/.exec(transform)?.[1]);
    };
    const fitted = await scaleOf();
    expect(fitted).toBeGreaterThan(0);

    await player.getByRole('button', { name: 'Ampliar o mapa' }).click();
    await player.getByRole('button', { name: 'Ampliar o mapa' }).click();
    const zoomed = await scaleOf();
    expect(zoomed).toBeGreaterThan(fitted);

    // Arrastar com o mouse desloca o mapa ampliado.
    const area = player.getByRole('group', { name: /^Área do mapa/ });
    const box = (await area.boundingBox())!;
    const before = await layer.evaluate((el) => (el as HTMLElement).style.transform);
    await player.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await player.mouse.down();
    await player.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2 - 40, { steps: 5 });
    await player.mouse.up();
    expect(await layer.evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(before);

    await player.getByRole('button', { name: 'Ajustar o mapa ao Palco' }).click();
    expect(await scaleOf()).toBeCloseTo(fitted, 4);
  });
});
