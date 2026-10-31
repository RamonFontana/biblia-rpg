import type { Page } from '@playwright/test';
import { adminClient } from './support/admin';
import { test, expect, type Seed, type SignIn } from './fixtures';
import { startCombat } from './support/combat';
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

  test('o Mestre remove um mapa e ele sai da lista dele; remover o mostrado devolve os Retratos ao jogador', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    await openPanel(master, 'Mapas');
    await master.getByLabel('Nome do mapa').fill('Deserto de Zim');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: 'Mostrar aos jogadores: Deserto de Zim' }).click();
    await expect(player.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeVisible();

    await master.getByRole('button', { name: 'Remover Deserto de Zim' }).click();
    await expect(master.getByLabel('Nome de Deserto de Zim')).toHaveCount(0);
    await expect(player.getByRole('region', { name: /^Mapa:/ })).toHaveCount(0);
    await expect(player.getByRole('region', { name: 'Retratos' })).toBeVisible();
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

const GUARD = 'Guarda de Jericó';

test.describe('Pins', () => {
  /** Uma mesa com Eliabe e um Guarda, o terreno já mostrado e o Palco do Mestre livre dos Painéis. */
  async function tableWithMap(seed: Seed, signIn: SignIn, npcs: string[] = []) {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const guard = await seed.createEnemy(GUARD);
    const sessionId = await seed.createSession({ characters: [eliabe, guard], npcs });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await watchPlayers(master, 2);

    await openPanel(master, 'Mapas');
    await master.getByRole('button', { name: 'Somar terreno' }).click();
    await master.getByRole('button', { name: /^Mostrar aos jogadores/ }).click();
    await closePanel(master);
    await expect(player.getByRole('region', { name: /^Mapa:/ })).toBeVisible();
    return { master, player };
  }

  /** Arrasta com o mouse, em passos, de um ponto da tela a outro. */
  async function dragMouse(
    page: Page,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
  }
  const center = (box: { x: number; y: number; width: number; height: number }) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });

  test('o Mestre põe Eliabe no mapa e o move, e o jogador vê o pin aparecer e mudar de Quadrado', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const eliabeOnPlayer = player.getByRole('button', { name: /^Eliabe, \d+ de \d+ PV$/ });
    await expect(eliabeOnPlayer).toHaveCount(0);

    // Da Bandeja ao mapa.
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const item = tray.getByRole('button', { name: /^Eliabe, .*na Bandeja$/ });
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    await dragMouse(
      master,
      center((await item.boundingBox())!),
      center((await area.boundingBox())!),
    );

    const pin = master.getByRole('button', { name: /^Eliabe, \d+ de \d+ PV$/ });
    await expect(pin).toBeVisible();
    await expect(tray.getByRole('button', { name: /^Eliabe/ })).toHaveCount(0);
    const col = Number(await pin.getAttribute('data-col'));
    const row = Number(await pin.getAttribute('data-row'));
    await expect(eliabeOnPlayer).toHaveAttribute('data-col', String(col));
    await expect(eliabeOnPlayer).toHaveAttribute('data-row', String(row));

    // Três Quadrados para a direita.
    const transform = await master
      .getByTestId('camada-do-mapa')
      .evaluate((el) => (el as HTMLElement).style.transform);
    const squarePx = 48 * Number(/scale\(([\d.]+)\)/.exec(transform)?.[1]);
    const box = (await pin.boundingBox())!;
    const from = center(box);
    await dragMouse(master, from, { x: from.x + 3 * squarePx, y: from.y });

    await expect(eliabeOnPlayer).toHaveAttribute('data-col', String(col + 3));
    await expect(eliabeOnPlayer).toHaveAttribute('data-row', String(row));

    // O jogador não arrasta: tentar mover o próprio pin não muda nada.
    const playerBox = (await eliabeOnPlayer.boundingBox())!;
    const playerFrom = center(playerBox);
    await dragMouse(player, playerFrom, { x: playerFrom.x - 60, y: playerFrom.y });
    await expect(eliabeOnPlayer).toHaveAttribute('data-col', String(col + 3));

    const { data } = await adminClient().from('session_map_pins').select('col, row');
    expect(data).toEqual([{ col: col + 3, row }]);
  });

  test('o inimigo posto no mapa entra Oculto: o jogador só o vê depois de revelado', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const guardOnPlayer = player.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) }).boundingBox())!),
      center((await area.boundingBox())!),
    );

    // Entrou Oculto: o Mestre o vê marcado; o jogador não vê nada.
    const hiddenPin = master.getByRole('button', {
      name: new RegExp(`^${GUARD}, \\d+ de \\d+ PV, oculto$`),
    });
    await expect(hiddenPin).toBeVisible();
    await expect(guardOnPlayer).toHaveCount(0);
    const { data: before } = await adminClient()
      .from('characters')
      .select('is_visible')
      .eq('name', GUARD)
      .single();
    expect(before?.is_visible).toBe(false);

    // Revelado com um toque no pin: aparece para o jogador, fora do combate.
    await hiddenPin.click();
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await expect(guardOnPlayer).toBeVisible();

    // Oculto de novo: some do mapa do jogador sem recarregar.
    await master.getByRole('button', { name: `Ocultar ${GUARD}` }).click();
    await expect(guardOnPlayer).toHaveCount(0);

    // Revelado e devolvido à Bandeja: o pin sai do mapa do jogador.
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await expect(guardOnPlayer).toBeVisible();
    const pin = master.getByRole('button', { name: new RegExp(`^${GUARD}, \\d+ de \\d+ PV$`) });
    await dragMouse(
      master,
      center((await pin.boundingBox())!),
      center((await tray.boundingBox())!),
    );
    await expect(guardOnPlayer).toHaveCount(0);
    await expect(tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) })).toBeVisible();
  });

  test('o NPC ocultado some do mapa do jogador sem recarregar', async ({ seed, signIn }) => {
    const { master, player } = await tableWithMap(seed, signIn, ['Raabe']);
    const raabeOnPlayer = player.getByRole('button', { name: /^Raabe, / });
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const area = master.getByRole('group', { name: /^Área do mapa/ });

    // O NPC nasce Oculto; revelado na Bandeja, vai ao mapa e o jogador o vê.
    const trayItem = tray.getByRole('button', { name: /^Raabe, .*oculto, na Bandeja$/ });
    await trayItem.click();
    await master.getByRole('button', { name: 'Revelar Raabe' }).click();
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: /^Raabe, / }).boundingBox())!),
      center((await area.boundingBox())!),
    );
    await expect(raabeOnPlayer).toBeVisible();

    // Oculto pela barra do pin: some da tela do jogador na hora, sem recarregar.
    await master.getByRole('button', { name: /^Raabe, / }).click();
    await master.getByRole('button', { name: 'Ocultar Raabe' }).click();
    await expect(raabeOnPlayer).toHaveCount(0);
  });

  test('à noite o inimigo fora da luz some do mapa do jogador; uma luz ou a luz do pin o revela', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    const areaBox = (await area.boundingBox())!;

    // Eliabe e o Guarda (revelado) em lugares diferentes do mapa.
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: /^Eliabe, / }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.25, y: areaBox.y + areaBox.height * 0.5 },
    );
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.75, y: areaBox.y + areaBox.height * 0.5 },
    );
    await master.getByRole('button', { name: new RegExp(`^${GUARD}, .*oculto$`) }).click();
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    const guardOnPlayer = player.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    const eliabeOnPlayer = player.getByRole('button', { name: /^Eliabe, / });
    await expect(guardOnPlayer).toBeVisible();
    await expect(player.getByTestId('escuridao-do-mapa')).toHaveCount(0);

    // A noite cai: o Mestre fixa o Ambiente em Escuridão. O grupo fica; o inimigo some.
    await master.getByRole('button', { name: 'Fechar' }).click();
    await master.getByLabel('Ambiente do mapa').selectOption('escuridao');
    await expect(player.getByTestId('escuridao-do-mapa')).toHaveAttribute(
      'data-ambient',
      'escuridao',
    );
    await expect(guardOnPlayer).toHaveCount(0);
    await expect(eliabeOnPlayer).toBeVisible();
    // O Mestre vê tudo, com o escuro mais leve.
    await expect(master.getByRole('button', { name: new RegExp(`^${GUARD}, `) })).toBeVisible();

    // Uma fogueira arrastada até o Guarda o ilumina.
    await master.getByRole('button', { name: 'Somar luz' }).click();
    const lightToken = master.getByRole('button', { name: /^Luz Luz, 6 m de Luz plena/ });
    await expect(lightToken).toBeVisible();
    const guardAtMaster = master.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    await dragMouse(
      master,
      center((await lightToken.boundingBox())!),
      center((await guardAtMaster.boundingBox())!),
    );
    await expect(guardOnPlayer).toBeVisible();
    await expect(player.getByTestId('escuridao-do-mapa')).toHaveAttribute('data-sources', '1');
    const { data: lights } = await adminClient()
      .from('session_map_lights')
      .select('bright_m, dim_m, col, row');
    expect(lights).toHaveLength(1);
    expect(Number(lights![0]!.bright_m)).toBe(6);

    // Tirar a luz o devolve ao escuro.
    await lightToken.click();
    await master.getByRole('button', { name: 'Remover luz' }).click();
    await expect(guardOnPlayer).toHaveCount(0);

    // A luz que o inimigo carrega no pin faz o mesmo.
    await guardAtMaster.click();
    await master.getByRole('button', { name: `Acender luz em ${GUARD}` }).click();
    await expect(guardOnPlayer).toBeVisible();
    const { data: pins } = await adminClient()
      .from('session_map_pins')
      .select('light_bright_m, light_dim_m')
      .not('light_bright_m', 'is', null);
    expect(pins).toHaveLength(1);

    // De volta ao período: sem Ambiente fixado, manhã é clara.
    await master.getByLabel('Ambiente do mapa').selectOption('');
    await expect(player.getByTestId('escuridao-do-mapa')).toHaveCount(0);
  });

  test('o personagem Cego não vê o inimigo no mapa, e o Mestre confere por "Ver como"', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    const areaBox = (await area.boundingBox())!;
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: /^Eliabe, / }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.25, y: areaBox.y + areaBox.height * 0.5 },
    );
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.75, y: areaBox.y + areaBox.height * 0.5 },
    );
    await master.getByRole('button', { name: new RegExp(`^${GUARD}, .*oculto$`) }).click();
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await master.getByRole('button', { name: 'Fechar' }).click();
    const guardOnPlayer = player.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    await expect(guardOnPlayer).toBeVisible();

    // Eliabe fica Cego: o inimigo some do mapa dele; o Mestre continua vendo.
    const { error } = await adminClient()
      .from('characters')
      .update({ conditions: [{ conditionId: 'cego', duration: null }] })
      .eq('name', 'Eliabe');
    if (error) throw error;
    await player.reload();
    await expect(player.getByRole('button', { name: /^Eliabe, / })).toBeVisible();
    await expect(guardOnPlayer).toHaveCount(0);
    await master.reload();
    const guardAtMaster = master.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    await expect(guardAtMaster).toBeVisible();

    // "Ver como Eliabe" mostra o mapa pela Visão dele; a saída devolve o Mestre à visão dele.
    await master.getByLabel('Ver como').selectOption({ label: 'Eliabe' });
    await expect(master.getByText('Vendo como Eliabe')).toBeVisible();
    await expect(guardAtMaster).toHaveCount(0);
    await master.getByRole('button', { name: 'Voltar à visão do Mestre' }).click();
    await expect(guardAtMaster).toBeVisible();
  });

  test('o jogador acende a Tocha pela Hotbar: gasta uma, ilumina o inimigo perto, e o Mestre a apaga', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const { data: eliabe } = await adminClient()
      .from('characters')
      .select('id')
      .eq('name', 'Eliabe')
      .single();
    await seed.giveItem(eliabe!.id, 'tocha', 2);
    const tray = master.getByRole('region', { name: 'Bandeja' });
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    const areaBox = (await area.boundingBox())!;
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: /^Eliabe, / }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.4, y: areaBox.y + areaBox.height * 0.5 },
    );
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) }).boundingBox())!),
      { x: areaBox.x + areaBox.width * 0.46, y: areaBox.y + areaBox.height * 0.5 },
    );
    await master.getByRole('button', { name: new RegExp(`^${GUARD}, .*oculto$`) }).click();
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await master.getByRole('button', { name: 'Fechar' }).click();
    await master.getByLabel('Ambiente do mapa').selectOption('escuridao');
    const guardOnPlayer = player.getByRole('button', { name: new RegExp(`^${GUARD}, `) });
    await expect(guardOnPlayer).toHaveCount(0);

    // Acender é Ação Livre: a Tocha está em Itens e em Livre.
    await player.reload();
    await player.getByRole('tab', { name: /^Livre/ }).click();
    await player.getByRole('button', { name: 'Tocha, 2 unidades' }).click();
    await player
      .getByRole('dialog', { name: 'Tocha' })
      .getByRole('button', { name: 'Acender' })
      .click();
    await expect(guardOnPlayer).toBeVisible();
    await expect(player.getByRole('button', { name: 'Tocha, 1 unidade' })).toBeVisible();
    const { data: after } = await adminClient()
      .from('characters')
      .select('torch_lit, character_items(quantity, items(slug))')
      .eq('id', eliabe!.id)
      .single();
    expect(after?.torch_lit).toBe(true);
    expect(after?.character_items.find((row) => row.items?.slug === 'tocha')?.quantity).toBe(1);

    // O Mestre apaga pelo pin, e o inimigo volta ao escuro.
    await master.getByRole('button', { name: /^Eliabe, / }).click();
    await master.getByRole('button', { name: 'Apagar Tocha de Eliabe' }).click();
    await expect(guardOnPlayer).toHaveCount(0);
    const { data: off } = await adminClient()
      .from('characters')
      .select('torch_lit')
      .eq('id', eliabe!.id)
      .single();
    expect(off?.torch_lit).toBe(false);
  });

  test('sem mapa na tela, o Mestre oculta e revela um inimigo pelo Painel Inimigos', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const guard = await seed.createEnemy(GUARD);
    const sessionId = await seed.createSession({ characters: [eliabe, guard] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);

    await openPanel(master, 'Inimigos');
    await master.getByRole('button', { name: `Ocultar ${GUARD}` }).click();
    await expect(master.getByText('Oculto', { exact: true })).toBeVisible();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from('characters')
          .select('is_visible')
          .eq('id', guard)
          .single();
        return data?.is_visible;
      })
      .toBe(false);

    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await expect(master.getByRole('button', { name: `Ocultar ${GUARD}` })).toBeVisible();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from('characters')
          .select('is_visible')
          .eq('id', guard)
          .single();
        return data?.is_visible;
      })
      .toBe(true);
  });

  test('no combate, o pin do turno fica destacado e o Ataque mostra a distância até o alvo', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await tableWithMap(seed, signIn);
    const area = master.getByRole('group', { name: /^Área do mapa/ });
    const tray = master.getByRole('region', { name: 'Bandeja' });

    // Eliabe no meio do mapa e o Guarda quatro Quadrados à direita dele (6 m).
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: /^Eliabe, / }).boundingBox())!),
      center((await area.boundingBox())!),
    );
    const eliabePin = master.getByRole('button', { name: /^Eliabe, \d+ de \d+ PV$/ });
    await expect(eliabePin).toBeVisible();
    const transform = await master
      .getByTestId('camada-do-mapa')
      .evaluate((el) => (el as HTMLElement).style.transform);
    const squarePx = 48 * Number(/scale\(([\d.]+)\)/.exec(transform)?.[1]);
    const eliabeAt = center((await eliabePin.boundingBox())!);
    await dragMouse(
      master,
      center((await tray.getByRole('button', { name: new RegExp(`^${GUARD}, `) }).boundingBox())!),
      { x: eliabeAt.x + 4 * squarePx, y: eliabeAt.y },
    );
    const guardOnPlayer = player.getByRole('button', {
      name: new RegExp(`^${GUARD}, \\d+ de \\d+ PV$`),
    });
    // O inimigo entra Oculto; o Mestre o revela antes do combate.
    await master.getByRole('button', { name: new RegExp(`^${GUARD}, .*oculto$`) }).click();
    await master.getByRole('button', { name: `Revelar ${GUARD}` }).click();
    await expect(guardOnPlayer).toBeVisible();

    // O Guarda age primeiro: o pin dele é o destacado.
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await expect(guardOnPlayer).toHaveAttribute('data-turn', 'true');
    await expect(
      player.getByRole('button', { name: /^Eliabe, \d+ de \d+ PV$/ }),
    ).not.toHaveAttribute('data-turn');
    await expect(player.getByRole('list', { name: 'Ordem de iniciativa' })).toBeVisible();

    // Chega a vez de Eliabe: o Ataque mostra a distância, sem travar nada.
    await master.getByRole('button', { name: 'Próximo Turno' }).click();
    await expect(player.getByRole('button', { name: /^Eliabe, \d+ de \d+ PV$/ })).toHaveAttribute(
      'data-turn',
      'true',
    );
    await player.getByRole('combobox', { name: /^Alvo/ }).selectOption({ label: GUARD });
    await expect(player.getByLabel('Distância até o alvo', { exact: true })).toHaveText('a 6 m');
    await expect(player.getByRole('button', { name: 'Atacar' })).toBeEnabled();
  });
});

test.describe('Mapas do Mestre', () => {
  /** Uma imagem 4:3 desenhada no navegador, para enviar como arquivo. */
  async function makePng(page: Page) {
    const base64 = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#7a5c3a';
      ctx.fillRect(0, 0, 480, 360);
      ctx.fillStyle = '#d9c9a3';
      for (let i = 0; i < 20; i++) ctx.fillRect(i * 24 + 4, (i % 15) * 24 + 4, 16, 16);
      return canvas.toDataURL('image/png').split(',')[1]!;
    });
    return Buffer.from(base64, 'base64');
  }

  test('o Mestre envia uma imagem, recorta, soma à sessão e mostra; o jogador vê a imagem', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const sessionId = await seed.createSession({ characters: [eliabe] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await watchPlayers(master, 2);

    await openPanel(master, 'Mapas');
    await master.getByLabel('Enviar imagem de mapa').setInputFiles({
      name: 'jerico.png',
      mimeType: 'image/png',
      buffer: await makePng(master),
    });

    // O editor abre com o nome do arquivo e 20×15 Quadrados; o Mestre renomeia e salva.
    const dialog = master.getByRole('dialog', { name: 'Recortar mapa' });
    await expect(dialog.getByLabel('Nome do mapa')).toHaveValue('jerico');
    await expect(dialog.getByLabel('Colunas')).toHaveValue('20');
    await dialog.getByLabel('Nome do mapa').fill('Cerco de Jericó');
    await dialog.getByRole('button', { name: 'Salvar mapa' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(master.getByLabel('Renomear meu mapa Cerco de Jericó')).toBeVisible();

    // A imagem fica numa tabela própria, em webp.
    const admin = adminClient();
    const { data: maps } = await admin.from('master_maps').select('id, name, columns, rows');
    expect(maps).toEqual([
      expect.objectContaining({ name: 'Cerco de Jericó', columns: 20, rows: 15 }),
    ]);
    const { data: images } = await admin.from('master_map_images').select('image');
    expect(images?.[0]?.image).toMatch(/^data:image\/webp;base64,/);

    // Soma à sessão e mostra: o jogador recebe o mapa e a imagem, lida à parte.
    await master.getByRole('button', { name: 'Somar à sessão: Cerco de Jericó' }).click();
    await master.getByRole('button', { name: 'Mostrar aos jogadores: Cerco de Jericó' }).click();
    await expect(player.getByRole('region', { name: 'Mapa: Cerco de Jericó' })).toBeVisible();
    await expect(player.getByTestId('fundo-do-mapa')).toHaveAttribute('data-status', 'ready');
    await expect(player.locator('[data-testid="fundo-do-mapa"] image')).toHaveAttribute(
      'href',
      /^data:image\/webp;base64,/,
    );

    const { data: sessionMaps } = await admin
      .from('session_maps')
      .select('library_id, master_map_id');
    expect(sessionMaps).toEqual([{ library_id: null, master_map_id: maps![0]!.id }]);

    // Em uso por sessão ativa: o app recusa apagar, e o mapa continua lá.
    await master.getByRole('button', { name: 'Apagar meu mapa Cerco de Jericó' }).click();
    await master.getByRole('button', { name: 'Confirmar: apagar Cerco de Jericó' }).click();
    await expect(master.getByRole('alert')).toContainText('em uso por uma sessão ativa');
    const { data: still } = await admin.from('master_maps').select('id');
    expect(still).toHaveLength(1);
  });

  test('o Mestre recusa o que não é imagem, e apaga um mapa que nenhuma sessão ativa usa', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const sessionId = await seed.createSession({ characters: [eliabe] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);

    await openPanel(master, 'Mapas');
    const input = master.getByLabel('Enviar imagem de mapa');
    await input.setInputFiles({
      name: 'regras.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    });
    await expect(master.getByRole('alert')).toContainText('não é uma imagem');
    await expect(master.getByRole('dialog', { name: 'Recortar mapa' })).toHaveCount(0);

    await input.setInputFiles({
      name: 'jerico.png',
      mimeType: 'image/png',
      buffer: await makePng(master),
    });
    await master
      .getByRole('dialog', { name: 'Recortar mapa' })
      .getByRole('button', { name: 'Salvar mapa' })
      .click();
    await expect(master.getByLabel('Renomear meu mapa jerico')).toBeVisible();

    await master.getByRole('button', { name: 'Apagar meu mapa jerico' }).click();
    await master.getByRole('button', { name: 'Confirmar: apagar jerico' }).click();
    await expect(master.getByLabel('Renomear meu mapa jerico')).toHaveCount(0);
    const { data } = await adminClient().from('master_maps').select('id');
    expect(data).toEqual([]);
  });
});
