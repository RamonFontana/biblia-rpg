import { ABILITIES } from '../src/content/abilities';
import { adminClient } from './support/admin';
import { startCombat } from './support/combat';
import { expect, test, type Seed, type SignIn } from './fixtures';

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
  await expect(master.getByText('Participantes Online (2)')).toBeVisible();
  return { master, player, eliabe, sessionId };
}

test.describe('Descanso Curto', () => {
  test('o Mestre abre: o jogador vê, as Habilidades recarregam uma vez, e o Mestre encerra', async ({
    seed,
    signIn,
  }) => {
    const { master, player, eliabe, sessionId } = await openTable(seed, signIn);

    await expect(master.getByText('2 restantes hoje')).toBeVisible();
    await expect(player.getByText('Aguardando o Mestre abrir o descanso.')).toBeVisible();

    await master.getByRole('button', { name: 'Abrir Descanso Curto' }).click();

    await expect(master.getByText('Aberto pelo Mestre')).toBeVisible();
    await expect(master.getByText('1 restante hoje')).toBeVisible();
    await expect(player.getByText('Aberto pelo Mestre')).toBeVisible();
    await expect(player.getByText('Aguardando o Mestre abrir o descanso.')).toHaveCount(0);

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
    await expect(player.getByText('Aguardando o Mestre abrir o descanso.')).toBeVisible();
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
});
