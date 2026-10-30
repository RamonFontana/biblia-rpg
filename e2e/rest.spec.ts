import { ABILITIES } from '../src/content/abilities';
import { adminClient } from './support/admin';
import { startCombat } from './support/combat';
import { expect, test, type Seed, type SignIn } from './fixtures';
import { openPanel, watchPlayers } from './support/ui';

const SESSION_NAME = 'Invasão a Jericó';
const GUARD = 'Guarda de Jericó';
const shortRestAbility = ABILITIES.find((a) => a.usageType === 'short_rest')!.id;
const longRestAbility = ABILITIES.find((a) => a.usageType === 'long_rest')!.id;

/** Uma mesa com Eliabe (jogador 1), que gastou duas Habilidades, e o Mestre, os dois já online. */
async function openTable(seed: Seed, signIn: SignIn, withEnemy = false) {
  const eliabe = await seed.createCharacter('player1', {
    name: 'Eliabe',
    skills: { ability_uses: { [shortRestAbility]: 1, [longRestAbility]: 1 } },
  });
  const enemy = withEnemy ? await seed.createEnemy(GUARD) : null;
  const sessionId = await seed.createSession({
    name: SESSION_NAME,
    characters: enemy ? [eliabe, enemy] : [eliabe],
  });
  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  await openPanel(player, 'Descanso');
  await watchPlayers(master, 2);
  await openPanel(master, 'Descanso');
  return { master, player, eliabe, sessionId };
}

test.describe('Descanso Curto', () => {
  test('o Mestre abre: o jogador vê, as Habilidades recarregam uma vez, e o Mestre encerra', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe, sessionId } = await openTable(seed, signIn);

    await expect(master.getByText('2 restantes hoje')).toBeVisible();
    await expect(player.getByRole('button', { name: 'Pedir Descanso Curto' })).toBeVisible();

    await master.getByRole('button', { name: 'Abrir Descanso Curto' }).click();

    await expect(master.getByText('Aberto pelo Mestre')).toBeVisible();
    await expect(master.getByText('1 restante hoje')).toBeVisible();
    await expect(player.getByText('Aberto pelo Mestre')).toBeVisible();
    await expect(player.getByRole('button', { name: 'Pedir Descanso Curto' })).toHaveCount(0);

    // O celular do jogador recarrega as Habilidades do Descanso Curto e registra o descanso.
    const admin = adminClient();
    await expect
      .poll(async () => {
        const { data, error } = await admin
          .from('characters')
          .select('skills, last_short_rest_recharge')
          .eq('id', eliabe)
          .single();
        if (error) throw error;
        const session = await admin
          .from('game_sessions')
          .select('short_rest_id')
          .eq('id', sessionId)
          .single();
        if (session.error) throw session.error;
        return {
          uses: (data.skills as { ability_uses: Record<string, number> }).ability_uses,
          registered: data.last_short_rest_recharge === session.data.short_rest_id,
        };
      })
      .toEqual({ uses: { [longRestAbility]: 1 }, registered: true });

    await master.getByRole('button', { name: 'Encerrar descanso' }).click();
    await expect(master.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeVisible();
    await expect(player.getByRole('button', { name: 'Pedir Descanso Curto' })).toBeVisible();
    await expect(player.getByText('Aberto pelo Mestre')).toHaveCount(0);
  });

  test('depois de dois descansos no dia, o Mestre não abre um terceiro', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn);
    for (const left of ['1 restante hoje', '0 restantes hoje']) {
      await master.getByRole('button', { name: 'Abrir Descanso Curto' }).click();
      await expect(master.getByText(left)).toBeVisible();
      await master.getByRole('button', { name: 'Encerrar descanso' }).click();
      await expect(master.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeVisible();
    }
    await expect(master.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeDisabled();
    await expect(master.getByText('Indisponível: sem Descanso Curto restante hoje.')).toBeVisible();
    await expect(player.getByText('Indisponível: sem Descanso Curto restante hoje.')).toBeVisible();
  });

  test('com combate em andamento o descanso não abre e o motivo aparece nas duas telas', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openTable(seed, signIn, true);
    await startCombat(master, { Eliabe: 10, [GUARD]: 15 }, { timeout: 15_000 });

    await expect(master.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeDisabled();
    await expect(master.getByText('Indisponível: combate em andamento.')).toBeVisible();
    await expect(player.getByText('Indisponível: combate em andamento.')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('o jogador gasta Dados de Vida no descanso aberto e o PV sobe na tela do Mestre', async ({
    seed,
    signIn,
  }) => {
    // Guerreiro nível 3 (3d10), CON 14 (+2), 10 de 30 PV.
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      vocation: 'Guerreiro',
      level: 3,
      attributes: { for: 14, des: 12, con: 14, int: 10, sab: 10, car: 8 },
      stats: { pv: 30, current_pv: 10, ca: 11, faith: 50 },
    });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await openPanel(player, 'Descanso');
    await watchPlayers(master, 2);
    await openPanel(master, 'Descanso');

    // Com o descanso fechado não há onde gastar.
    await expect(player.getByLabel('Resultado do d10')).toHaveCount(0);

    await master.getByRole('button', { name: 'Abrir Descanso Curto' }).click();
    await expect(player.getByText('Dados de Vida 3/3 (d10)').first()).toBeVisible();

    // Dado físico: 6 + 2 de CON = 8 PV.
    await player.getByLabel('Resultado do d10').fill('6');
    await player.getByRole('button', { name: 'Gastar dado' }).click();
    await expect(player.getByText(/Curou 8 PV \(10 → 18\)/)).toBeVisible();
    await openPanel(master, 'Jogadores');
    await expect(master.getByText('Dados de Vida 2/3 (d10)')).toBeVisible({ timeout: 15_000 });

    // O segundo dado, pela Rolagem Virtual: cura entre 3 e 12 PV.
    await player.getByRole('button', { name: 'Rolar dado virtual' }).click();
    await expect(player.getByText(/Rolou \d+\. Curou \d+ PV/)).toBeVisible();

    const admin = adminClient();
    await expect
      .poll(async () => {
        const { data, error } = await admin
          .from('characters')
          .select('stats, hit_dice_spent')
          .eq('id', eliabe)
          .single();
        if (error) throw error;
        return {
          spent: data.hit_dice_spent,
          healedMore: (data.stats as { current_pv: number }).current_pv > 18,
        };
      })
      .toEqual({ spent: 2, healedMore: true });
    await expect(master.getByText('Dados de Vida 1/3 (d10)')).toBeVisible({ timeout: 15_000 });

    // Fechado o descanso, o gasto some.
    await openPanel(master, 'Descanso');
    await master.getByRole('button', { name: 'Encerrar descanso' }).click();
    await expect(player.getByLabel('Resultado do d10')).toHaveCount(0);
  });

  test('quem está Estável gasta um dado, acorda e o Morrendo não gasta', async ({
    seed,
    signIn,
  }) => {
    const estavel = await seed.createCharacter('player1', {
      name: 'Eliabe',
      vocation: 'Guerreiro',
      level: 2,
      attributes: { for: 14, des: 12, con: 10, int: 10, sab: 10, car: 8 },
      stats: { pv: 20, current_pv: 0, ca: 11, faith: 50 },
      is_stable: true,
      death_saves_successes: 3,
    });
    const morrendo = await seed.createCharacter('player2', {
      name: 'Rute',
      vocation: 'Batedor',
      level: 2,
      stats: { pv: 14, current_pv: 0, ca: 11, faith: 50 },
    });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [estavel, morrendo],
    });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const eliabe = await signIn('player1');
    await eliabe.goto(`/session/${sessionId}`);
    await openPanel(eliabe, 'Descanso');
    const rute = await signIn('player2');
    await rute.goto(`/session/${sessionId}`);
    await openPanel(rute, 'Descanso');
    await watchPlayers(master, 3);
    await openPanel(master, 'Descanso');

    await master.getByRole('button', { name: 'Abrir Descanso Curto' }).click();

    await expect(rute.getByText('Morrendo: resolva os Testes de Morte antes.')).toBeVisible();
    await expect(rute.getByRole('button', { name: 'Gastar dado' })).toBeDisabled();

    await eliabe.getByLabel('Resultado do d10').fill('4');
    await eliabe.getByRole('button', { name: 'Gastar dado' }).click();
    await expect(eliabe.getByText(/Curou 4 PV \(0 → 4\)/)).toBeVisible();

    const { data, error } = await adminClient()
      .from('characters')
      .select('stats, is_stable, death_saves_successes, hit_dice_spent')
      .eq('id', estavel)
      .single();
    if (error) throw error;
    expect(data).toMatchObject({
      is_stable: false,
      death_saves_successes: 0,
      hit_dice_spent: 1,
    });
    expect((data.stats as { current_pv: number }).current_pv).toBe(4);
  });
  test('todos os jogadores pedem: o descanso abre sozinho, eles gastam um dado e terminam', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      vocation: 'Guerreiro',
      level: 2,
      attributes: { for: 14, des: 12, con: 12, int: 10, sab: 10, car: 8 },
      stats: { pv: 22, current_pv: 5, ca: 11, faith: 50 },
    });
    const rute = await seed.createCharacter('player2', { name: 'Rute' });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe, rute],
    });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const pEliabe = await signIn('player1');
    await pEliabe.goto(`/session/${sessionId}`);
    await openPanel(pEliabe, 'Descanso');
    const pRute = await signIn('player2');
    await pRute.goto(`/session/${sessionId}`);
    await openPanel(pRute, 'Descanso');
    await watchPlayers(master, 3);
    await openPanel(master, 'Descanso');

    await expect(master.getByText('0 de 2 pediram')).toBeVisible();

    // O primeiro pedido ainda não abre; o Mestre e a Rute veem quem pediu.
    await pEliabe.getByRole('button', { name: 'Pedir Descanso Curto' }).click();
    await expect(pEliabe.getByRole('button', { name: 'Retirar pedido' })).toBeVisible();
    await expect(master.getByText('1 de 2 pediram (Eliabe)')).toBeVisible({ timeout: 15_000 });
    await expect(pRute.getByText('1 de 2 pediram (Eliabe)')).toBeVisible({ timeout: 15_000 });
    await expect(master.getByText('Aberto a pedido do grupo')).toHaveCount(0);

    // O último pedido abre o descanso "a pedido do grupo", sem o Mestre.
    await pRute.getByRole('button', { name: 'Pedir Descanso Curto' }).click();
    await expect(master.getByText('Aberto a pedido do grupo')).toBeVisible({ timeout: 15_000 });
    await expect(pEliabe.getByText('Aberto a pedido do grupo')).toBeVisible({ timeout: 15_000 });
    await expect(master.getByText('1 restante hoje')).toBeVisible();

    // Eliabe gasta um dado: 4 + 1 de CON = 5 PV.
    await pEliabe.getByLabel('Resultado do d10').fill('4');
    await pEliabe.getByRole('button', { name: 'Gastar dado' }).click();
    await expect(pEliabe.getByText(/Curou 5 PV \(5 → 10\)/)).toBeVisible();

    // O Mestre vê quem terminou; o último "Terminei" fecha o descanso.
    await pEliabe.getByRole('button', { name: 'Terminei' }).click();
    await expect(master.getByText('1 de 2 terminaram (Eliabe)')).toBeVisible({ timeout: 15_000 });
    await expect(pEliabe.getByText('Você terminou.')).toBeVisible();
    await expect(master.getByText('Aberto a pedido do grupo')).toBeVisible();
    await pRute.getByRole('button', { name: 'Terminei' }).click();
    await expect(master.getByText('Aberto a pedido do grupo')).toHaveCount(0, { timeout: 15_000 });
    await expect(master.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeVisible();
    await expect(pRute.getByRole('button', { name: 'Pedir Descanso Curto' })).toBeVisible();

    // Fechar não devolve o Descanso Curto do dia.
    await expect(master.getByText('1 restante hoje')).toBeVisible();
  });

  test('o jogador retira o pedido e o Mestre recusa os pedidos', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const rute = await seed.createCharacter('player2', { name: 'Rute' });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe, rute],
    });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const pEliabe = await signIn('player1');
    await pEliabe.goto(`/session/${sessionId}`);
    await openPanel(pEliabe, 'Descanso');
    const pRute = await signIn('player2');
    await pRute.goto(`/session/${sessionId}`);
    await openPanel(pRute, 'Descanso');
    await watchPlayers(master, 3);
    await openPanel(master, 'Descanso');

    await pEliabe.getByRole('button', { name: 'Pedir Descanso Curto' }).click();
    await expect(master.getByText('1 de 2 pediram (Eliabe)')).toBeVisible({ timeout: 15_000 });

    await pEliabe.getByRole('button', { name: 'Retirar pedido' }).click();
    await expect(master.getByText('0 de 2 pediram')).toBeVisible({ timeout: 15_000 });
    await expect(master.getByRole('button', { name: 'Recusar pedido' })).toHaveCount(0);

    await pEliabe.getByRole('button', { name: 'Pedir Descanso Curto' }).click();
    await expect(master.getByText('1 de 2 pediram (Eliabe)')).toBeVisible({ timeout: 15_000 });
    await master.getByRole('button', { name: 'Recusar pedido' }).click();
    await expect(master.getByText('0 de 2 pediram')).toBeVisible();
    await expect(pEliabe.getByRole('button', { name: 'Pedir Descanso Curto' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(pRute.getByText('0 de 2 pediram')).toBeVisible({ timeout: 15_000 });
    // Quem não pediu também fica sabendo que o Mestre recusou.
    const refusal = 'O Mestre recusou o pedido de descanso.';
    await expect(pRute.getByText(refusal)).toBeVisible({ timeout: 15_000 });
    await expect(pEliabe.getByText(refusal)).toBeVisible();
    await expect(master.getByText(refusal)).toHaveCount(0);

    // Um novo pedido apaga o aviso.
    await pEliabe.getByRole('button', { name: 'Pedir Descanso Curto' }).click();
    await expect(pRute.getByText(refusal)).toHaveCount(0, { timeout: 15_000 });
  });
});
