import { adminClient } from './support/admin';
import { addCondition, participantCard, startCombat } from './support/combat';
import { test, expect, type Seed, type SignIn } from './fixtures';

const FILISTEU = 'Filisteu';

/** Põe a arma no inventário da ficha e a veste na mão principal. */
async function equipWeapon(seed: Seed, characterId: string, slug: string) {
  await seed.giveItem(characterId, slug);
  const admin = adminClient();
  const owned = await admin.from('character_items').select('id').eq('character_id', characterId);
  if (owned.error) throw owned.error;
  const equip = await admin
    .from('characters')
    .update({ equipment: { head: null, body: null, mainHand: owned.data[0].id, offHand: null } })
    .eq('id', characterId);
  if (equip.error) throw equip.error;
}

/**
 * Uma mesa com Eliabe (Guerreiro, Espada Curta, FOR 14), Rute (aliada) e um Filisteu (CA 12, 20 PV),
 * no combate, com a iniciativa dando o primeiro turno a Eliabe.
 */
async function openFight(seed: Seed, signIn: SignIn, faith = 50) {
  const eliabe = await seed.createCharacter('player1', {
    name: 'Eliabe',
    stats: { pv: 11, current_pv: 11, ca: 11, faith, current_faith: faith },
  });
  const rute = await seed.createCharacter('player2', {
    name: 'Rute',
    stats: { pv: 11, current_pv: 11, ca: 11, faith: 50 },
  });
  const filisteu = await seed.createEnemy(FILISTEU, { pv: 20, ca: 12 });
  await equipWeapon(seed, eliabe, 'espada_curta');
  const sessionId = await seed.createSession({ characters: [eliabe, rute, filisteu] });

  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  const ally = await signIn('player2');
  await ally.goto(`/session/${sessionId}`);
  await expect(master.getByText('Participantes Online (3)')).toBeVisible();

  await startCombat(master, { Eliabe: 20, [FILISTEU]: 10, Rute: 5 });
  return { master, player, ally, eliabe, rute };
}

test.describe('ataque físico', () => {
  test('o jogador acerta o inimigo, o PV cai nos dois navegadores e o Mestre vê o registro', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openFight(seed, signIn);

    await expect(player.getByText('É O SEU TURNO!')).toBeVisible();
    await expect(player.getByText(/Arma:/)).toContainText('Espada Curta');
    await player.getByLabel('Alvo').selectOption({ label: FILISTEU });
    await player.getByLabel('d20 natural').fill('10'); // 10 + 2 (FOR) + 2 (Proficiência) = 14 ≥ CA 12
    await player.getByRole('button', { name: 'Atacar' }).click();

    await expect(player.getByText('Acertou!')).toBeVisible();
    await expect(player.getByText('Role 1d6.')).toBeVisible();
    await player.getByLabel('Dano rolado').fill('4');
    await player.getByRole('button', { name: 'Aplicar dano' }).click();

    await expect(player.getByText('6 de dano.')).toBeVisible(); // 4 + 2
    await expect(player.getByText(/contra CA/)).toHaveCount(0);
    await expect(participantCard(master, FILISTEU)).toContainText('14');
    await expect(master.getByText('Últimos ataques')).toBeVisible();
    await expect(master.getByText(/Eliabe → Filisteu/)).toBeVisible();
    await expect(master.getByText(/contra CA 12/)).toBeVisible();
    await expect(master.getByText('Eliabe acertou Filisteu: 6 de dano.')).toBeVisible();

    const { data } = await adminClient()
      .from('combat_attacks')
      .select('natural_roll, total, target_ac, hit, damage, target_hp_before, target_hp_after');
    expect(data).toEqual([
      {
        natural_roll: 10,
        total: 14,
        target_ac: 12,
        hit: true,
        damage: 6,
        target_hp_before: 20,
        target_hp_after: 14,
      },
    ]);

    // A Ação principal ficou marcada e o painel bloqueia o segundo ataque.
    await player.getByRole('button', { name: 'Novo ataque' }).click();
    await expect(player.getByText(/Ação principal já usada/)).toBeVisible();
    await expect(player.getByRole('button', { name: 'Atacar' })).toBeDisabled();
  });

  test('um erro não tira PV, e o jogador vê só "Errou"', async ({ seed, signIn }) => {
    const { master, player } = await openFight(seed, signIn);

    await player.getByLabel('Alvo').selectOption({ label: FILISTEU });
    await player.getByLabel('d20 natural').fill('3'); // 3 + 4 = 7 < CA 12
    await player.getByRole('button', { name: 'Atacar' }).click();

    await expect(player.getByText('Errou')).toBeVisible();
    await expect(master.getByText('Eliabe errou Filisteu.')).toBeVisible();
    await expect(participantCard(master, FILISTEU)).toContainText('20');
  });

  test('20 natural é Acerto Crítico: os dados dobram e o aliado pode ser o alvo', async ({
    seed,
    signIn,
  }) => {
    const { master, player } = await openFight(seed, signIn);

    await player.getByLabel('Alvo').selectOption({ label: 'Rute' });
    await player.getByLabel('d20 natural').fill('20');
    await player.getByRole('button', { name: 'Atacar' }).click();

    await expect(player.getByText('Acerto Crítico!')).toBeVisible();
    await expect(player.getByText('Role 2d6.')).toBeVisible();
    await player.getByLabel('Dano rolado').fill('7');
    await player.getByRole('button', { name: 'Aplicar dano' }).click();

    await expect(player.getByText('9 de dano.')).toBeVisible(); // 7 + 2, o modificador uma vez só
    await expect(participantCard(master, 'Rute')).toContainText('2'); // 11 - 9
  });

  test('fora do turno, não há painel de ataque', async ({ seed, signIn }) => {
    const { ally } = await openFight(seed, signIn);

    await expect(ally.getByText('Inimigos na Cena')).toBeVisible();
    await expect(ally.getByRole('button', { name: 'Atacar' })).toHaveCount(0);
  });

  test('Envenenado ataca com Desvantagem: a Rolagem Virtual rola dois d20 e vale o menor', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe } = await openFight(seed, signIn);
    await addCondition(master, 'Eliabe', 'Envenenado', 0);

    await expect(player.getByText('⚠️ Desvantagem')).toBeVisible();
    await expect(player.getByText('Motivo: Você está Envenenado')).toBeVisible();
    await expect(player.getByText('Role dois d20 e use o menor.')).toBeVisible();
    await player.getByLabel('Alvo').selectOption({ label: FILISTEU });
    await player.getByRole('button', { name: 'Rolar d20' }).click();
    await expect(player.getByLabel('Dados rolados')).toBeVisible();
    await player.getByRole('button', { name: 'Atacar' }).click();

    // O d20 é sorteado: o ataque pode acertar ou errar, e o registro vale nos dois casos.
    const apply = player.getByRole('button', { name: 'Aplicar dano' });
    const missed = player.getByText(/^(Errou|Falha Crítica)$/);
    await expect(apply.or(missed)).toBeVisible();
    if (await apply.isVisible()) {
      await player.getByLabel('Dano rolado').fill('3');
      await apply.click();
    }
    await expect(player.getByRole('button', { name: 'Novo ataque' })).toBeVisible();

    const { data, error } = await adminClient()
      .from('combat_attacks')
      .select('natural_roll, rolls, applied_mode')
      .single();
    if (error) throw error;
    expect(data.applied_mode).toBe('desvantagem');
    expect(data.rolls).toHaveLength(2);
    expect(data.natural_roll).toBe(Math.min(...data.rolls!));
    expect(eliabe).toBeTruthy();
  });

  test('o Inabalável gasta a Inspiração no ataque, que ganha Vantagem', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe } = await openFight(seed, signIn, 80);

    await expect(player.getByText('Inspiração disponível').first()).toBeVisible();
    await player.getByRole('checkbox', { name: /Usar Inspiração/ }).check();
    await expect(player.getByText('Motivo: Inspiração')).toBeVisible();
    await player.getByLabel('Alvo').selectOption({ label: FILISTEU });
    await player.getByLabel('d20 natural').fill('10');
    await player.getByRole('button', { name: 'Atacar' }).click();
    await player.getByLabel('Dano rolado').fill('4');
    await player.getByRole('button', { name: 'Aplicar dano' }).click();
    await expect(player.getByText('6 de dano.')).toBeVisible();

    await expect(player.getByText('Inspiração usada hoje').first()).toBeVisible();
    await expect(master.getByText(/com Vantagem · Inspiração/)).toBeVisible();
    const { data } = await adminClient()
      .from('combat_attacks')
      .select('applied_mode, inspiration_used');
    expect(data).toEqual([{ applied_mode: 'vantagem', inspiration_used: true }]);
    const character = await adminClient()
      .from('characters')
      .select('inspiration_used_day')
      .eq('id', eliabe)
      .single();
    expect(character.data?.inspiration_used_day).toBe(1);
  });
});
