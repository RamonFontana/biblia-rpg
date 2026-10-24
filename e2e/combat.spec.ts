import { adminClient } from './support/admin';
import {
  addCondition,
  modifyHealth,
  participantCard,
  sheetPv,
  startCombat,
} from './support/combat';
import { test, expect, type Seed, type SignIn } from './fixtures';

const GUARD = 'Guarda de Jericó';

/** Uma mesa com Eliabe (jogador 1, 11 PV) e um Guarda (inimigo, 12 PV), os dois já online. */
async function openTable(seed: Seed, signIn: SignIn) {
  const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
  const guard = await seed.createEnemy(GUARD);
  const sessionId = await seed.createSession({ characters: [eliabe, guard] });

  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  await expect(master.getByText('Participantes Online (2)')).toBeVisible();
  return { master, player, eliabe, guard };
}

test.describe('iniciar o combate', () => {
  test('a iniciativa define a ordem e quem abre o primeiro turno', async ({ seed, signIn }) => {
    const { master, player } = await openTable(seed, signIn);

    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    const cards = master.getByTitle(/^(Eliabe|Guarda de Jericó)$/);
    await expect(cards).toHaveText([GUARD, 'Eliabe']);
    await expect(participantCard(master, GUARD)).toContainText('Inimigo • Init: 15');
    await expect(participantCard(master, GUARD)).toContainText('Turno Atual');
    await expect(participantCard(master, 'Eliabe')).toContainText('Personagem • Init: 10');
    await expect(participantCard(master, 'Eliabe')).not.toContainText('Turno Atual');

    // O jogador recebe o combate sem recarregar, mas ainda não é a vez dele.
    await expect(player.getByText('Inimigos na Cena')).toBeVisible();
    await expect(player.getByText('É O SEU TURNO!')).toHaveCount(0);

    const { data: combats } = await adminClient()
      .from('combats')
      .select('status, round_number, current_turn_index');
    expect(combats).toEqual([{ status: 'active', round_number: 1, current_turn_index: 0 }]);
  });

  test('o combate exige pelo menos dois participantes', async ({ seed, signIn }) => {
    const { master } = await openTable(seed, signIn);

    await master.getByRole('button', { name: 'Iniciar Combate' }).click();
    const setup = master.getByRole('dialog');
    const start = setup.getByRole('button', { name: 'Iniciar Combate' });
    await expect(start).toBeEnabled();

    await setup.getByRole('button', { name: 'Remover' }).first().click();

    await expect(start).toBeDisabled();
  });
});

test.describe('turnos e rodadas', () => {
  test('o turno passa ao jogador, a rodada avança e a vez aparece em tempo real', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    await master.getByRole('button', { name: 'Próximo Turno' }).click();

    await expect(participantCard(master, 'Eliabe')).toContainText('Turno Atual');
    await expect(participantCard(master, GUARD)).not.toContainText('Turno Atual');
    await expect(player.getByText('É O SEU TURNO!')).toBeVisible();

    await master.getByRole('button', { name: 'Próximo Turno' }).click();

    await expect(master.getByText('Painel de Combate (Rodada 2)')).toBeVisible();
    await expect(participantCard(master, GUARD)).toContainText('Turno Atual');
    await expect(player.getByText('É O SEU TURNO!')).toHaveCount(0);
  });

  test('dois cliques seguidos em Próximo Turno avançam dois turnos', async ({ seed, signIn }) => {
    const { master } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    // O segundo clique espera o botão voltar (ele fica desabilitado enquanto grava) e parte do
    // turno já gravado, sem esperar o eco do tempo real.
    const next = master.getByRole('button', { name: 'Próximo Turno' });
    await next.click();
    await next.click();

    await expect(master.getByText('Painel de Combate (Rodada 2)')).toBeVisible();
    const { data } = await adminClient().from('combats').select('current_turn_index, round_number');
    expect(data).toEqual([{ current_turn_index: 0, round_number: 2 }]);
  });
});

test.describe('vida', () => {
  test('dano e cura mudam o PV do participante e a cura para no máximo', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    await modifyHealth(master, 'Eliabe', 'Dano', 4);
    await expect(participantCard(master, 'Eliabe')).toContainText('HP Atual:7');

    await modifyHealth(master, 'Eliabe', 'Cura', 2);
    await expect(participantCard(master, 'Eliabe')).toContainText('HP Atual:9');

    await modifyHealth(master, 'Eliabe', 'Cura', 10);
    await expect(participantCard(master, 'Eliabe')).toContainText('HP Atual:11');

    // O jogador acompanha o PV do inimigo na cena.
    await modifyHealth(master, GUARD, 'Dano', 5);
    await expect(participantCard(master, GUARD)).toContainText('HP Atual:7');
    await expect(player.getByText('Inimigos na Cena')).toBeVisible();
    await expect(player.getByText('/12')).toBeVisible();
    await expect(player.getByText('7', { exact: true }).first()).toBeVisible();
  });

  test('o dano não leva o PV abaixo de zero', async ({ seed, signIn }) => {
    const { master } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    await modifyHealth(master, GUARD, 'Dano', 50);

    await expect(participantCard(master, GUARD)).toContainText('HP Atual:0');
  });
});

test.describe('Condições', () => {
  test('uma Condição com duração perde um turno por rodada e some ao acabar', async ({
    seed,
    signIn,
  }) => {
    const { master } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await addCondition(master, 'Eliabe', 'Sangrando', 2);

    const eliabe = participantCard(master, 'Eliabe');
    await expect(eliabe.getByTitle('Sangrando')).toBeVisible();
    await expect(eliabe).toContainText('Sangrando2');

    // A duração só cai quando a rodada vira (depois do último da ordem). Cada clique espera o
    // turno chegar na tela, porque o painel se atualiza pelo tempo real.
    const nextTurn = master.getByRole('button', { name: 'Próximo Turno' });
    await nextTurn.click();
    await expect(eliabe).toContainText('Turno Atual');
    await expect(eliabe).toContainText('Sangrando2');

    await nextTurn.click();
    await expect(master.getByText('Painel de Combate (Rodada 2)')).toBeVisible();
    await expect(eliabe).toContainText('Sangrando1');

    await nextTurn.click();
    await expect(eliabe).toContainText('Turno Atual');
    await nextTurn.click();
    await expect(master.getByText('Painel de Combate (Rodada 3)')).toBeVisible();
    await expect(eliabe.getByTitle('Sangrando')).toHaveCount(0);
  });

  test('o Mestre remove uma Condição pelo X', async ({ seed, signIn }) => {
    const { master } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await addCondition(master, GUARD, 'Cego', 0);

    const guard = participantCard(master, GUARD);
    await expect(guard.getByTitle('Cego')).toBeVisible();

    await guard.getByTitle('Remover efeito').click();

    await expect(guard.getByTitle('Cego')).toHaveCount(0);
  });
});

test.describe('queda e morte', () => {
  test('a 0 PV o Mestre ganha os controles de morte, o jogador o teste de morte e o Mestre pode levantá-lo', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    await expect(master.getByText('Controles de Morte (Mestre)')).toHaveCount(0);
    await modifyHealth(master, 'Eliabe', 'Dano', 20);

    const eliabe = participantCard(master, 'Eliabe');
    await expect(eliabe).toContainText('HP Atual:0');
    await expect(eliabe).toContainText('Sucessos: 0');
    await expect(eliabe).toContainText('Falhas: 0');
    await expect(player.getByText('TESTE DE MORTE')).toBeVisible();

    await eliabe.getByRole('button', { name: '+1 Falha' }).click();
    await expect(eliabe).toContainText('Falhas: 1');
    await eliabe.getByRole('button', { name: '+1 Sucesso' }).click();
    await expect(eliabe).toContainText('Sucessos: 1');

    await eliabe.getByRole('button', { name: 'Levantar (+1 PV)' }).click();

    await expect(eliabe).toContainText('HP Atual:1');
    await expect(master.getByText('Controles de Morte (Mestre)')).toHaveCount(0);
    await expect(player.getByText('TESTE DE MORTE')).toHaveCount(0);
  });

  test('três falhas nos testes de morte matam o personagem na hora', async ({ seed, signIn }) => {
    const { master, player, eliabe: eliabeId } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await modifyHealth(master, 'Eliabe', 'Dano', 20);
    await expect(player.getByText('TESTE DE MORTE')).toBeVisible();

    const eliabe = participantCard(master, 'Eliabe');
    await expect(eliabe).toContainText('Morto: Não');
    for (const falhas of [1, 2, 3]) {
      await eliabe.getByRole('button', { name: '+1 Falha' }).click();
      await expect(eliabe).toContainText(`Falhas: ${falhas}`);
    }

    await expect(eliabe).toContainText('Morto: Sim');
    // Na hora, ainda dentro do combate: o painel de teste de morte dá lugar ao aviso de morte e a
    // ficha já guarda o rótulo Morto.
    await expect(player.getByText('Você Morreu')).toBeVisible();
    await expect(player.getByText('TESTE DE MORTE')).toHaveCount(0);
    const { data } = await adminClient()
      .from('characters')
      .select('is_dead, death_saves_failures, is_deleted, stats')
      .eq('id', eliabeId)
      .single();
    expect(data).toMatchObject({
      is_dead: true,
      death_saves_failures: 3,
      is_deleted: false,
      stats: { status: 'Morto' },
    });
  });

  test('Morte Instantânea marca o personagem como Morto na hora', async ({ seed, signIn }) => {
    const { master, eliabe: eliabeId } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await modifyHealth(master, 'Eliabe', 'Dano', 20);

    const eliabe = participantCard(master, 'Eliabe');
    await eliabe.getByRole('button', { name: 'Morte Instantânea' }).click();

    await expect(eliabe).toContainText('Morto: Sim');
    const { data } = await adminClient()
      .from('characters')
      .select('is_dead, stats')
      .eq('id', eliabeId)
      .single();
    expect(data).toMatchObject({ is_dead: true, stats: { status: 'Morto' } });
  });
});

test.describe('finalizar o combate', () => {
  test('grava o PV final na ficha, limpa o que é temporário e marca o inimigo morto', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe: eliabeId, guard } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    // O painel se atualiza pelo tempo real: cada mudança é conferida antes de finalizar.
    const eliabe = participantCard(master, 'Eliabe');
    await modifyHealth(master, 'Eliabe', 'Dano', 4);
    await expect(eliabe).toContainText('HP Atual:7');
    await addCondition(master, 'Eliabe', 'Sangrando', 2);
    await expect(eliabe.getByTitle('Sangrando')).toBeVisible();
    await addCondition(master, 'Eliabe', 'Exausto', 0);
    await expect(eliabe.getByTitle('Exausto')).toBeVisible();
    await modifyHealth(master, GUARD, 'Dano', 12);
    await expect(participantCard(master, GUARD)).toContainText('HP Atual:0');

    await master.getByRole('button', { name: 'Finalizar Combate' }).click();

    await expect(master.getByText(/Painel de Combate/)).toHaveCount(0);
    await expect(player.getByText('Inimigos na Cena')).toHaveCount(0);
    await expect(sheetPv(player)).toHaveText(/7\s*\/11\s*PV/);

    // A lista de inimigos do Mestre mostra o inimigo morto na hora, sem recarregar, e ele
    // continua listado como Morto.
    await expect(master.getByText('Morto', { exact: true })).toBeVisible();
    await master.reload();
    await expect(master.getByText('Morto', { exact: true })).toBeVisible();

    const admin = adminClient();
    const { data: character } = await admin
      .from('characters')
      .select('stats, conditions')
      .eq('id', eliabeId)
      .single();
    expect(character?.stats).toMatchObject({ current_pv: 7 });
    expect(character?.conditions).toEqual([{ conditionId: 'exausto', duration: null }]);
    const { data: enemy } = await admin
      .from('characters')
      .select('is_deleted, stats')
      .eq('id', guard)
      .single();
    expect(enemy?.is_deleted).toBe(true);
    expect(enemy?.stats).toMatchObject({ current_pv: 0, status: 'Morto' });
    const { data: combats } = await admin.from('combats').select('status');
    expect(combats).toEqual([{ status: 'finished' }]);
  });

  test('finalizar logo depois do dano grava o PV novo, sem esperar o painel', async ({
    seed,
    signIn,
  }) => {
    const { master, eliabe: eliabeId } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });

    await modifyHealth(master, 'Eliabe', 'Dano', 20);
    await master.getByRole('button', { name: 'Finalizar Combate' }).click();
    await expect(master.getByText(/Painel de Combate/)).toHaveCount(0);

    const { data } = await adminClient()
      .from('characters')
      .select('stats')
      .eq('id', eliabeId)
      .single();
    expect(data?.stats).toMatchObject({ current_pv: 0, status: 'Morrendo' });
  });

  test('quem morreu nos testes de morte sai do jogo ao fim do combate e vira espectador', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe: eliabeId } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await modifyHealth(master, 'Eliabe', 'Dano', 20);
    const eliabe = participantCard(master, 'Eliabe');
    for (const falhas of [1, 2, 3]) {
      await eliabe.getByRole('button', { name: '+1 Falha' }).click();
      await expect(eliabe).toContainText(`Falhas: ${falhas}`);
    }
    await expect(player.getByText('Você Morreu')).toBeVisible();

    await master.getByRole('button', { name: 'Finalizar Combate' }).click();
    await expect(master.getByText(/Painel de Combate/)).toHaveCount(0);

    await expect(player.getByText(/não está mais entre os vivos/)).toBeVisible();
    const { data } = await adminClient()
      .from('characters')
      .select('is_deleted, is_dead, stats')
      .eq('id', eliabeId)
      .single();
    expect(data).toMatchObject({ is_deleted: true, is_dead: true, stats: { status: 'Morto' } });
  });

  test('quem termina o combate a 0 PV continua Morrendo', async ({ seed, signIn }) => {
    const { master, eliabe: eliabeId } = await openTable(seed, signIn);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 });
    await modifyHealth(master, 'Eliabe', 'Dano', 20);
    await expect(participantCard(master, 'Eliabe')).toContainText('HP Atual:0');

    await master.getByRole('button', { name: 'Finalizar Combate' }).click();
    await expect(master.getByText(/Painel de Combate/)).toHaveCount(0);

    const { data } = await adminClient()
      .from('characters')
      .select('stats, is_dead')
      .eq('id', eliabeId)
      .single();
    expect(data?.is_dead).toBe(false);
    expect(data?.stats).toMatchObject({ current_pv: 0, status: 'Morrendo' });
  });
});
