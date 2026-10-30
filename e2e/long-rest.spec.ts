import { ABILITIES } from '../src/content/abilities';
import { adminClient } from './support/admin';
import { expect, test } from './fixtures';
import { watchPlayers, openPanel } from './support/ui';

const SESSION_NAME = 'Invasão a Jericó';
const longRestAbility = ABILITIES.find((a) => a.usageType === 'long_rest')!.id;

test.describe('Dados de Vida: Descanso Longo e sessão nova', () => {
  test('o Descanso Longo devolve metade dos Dados de Vida gastos, arredondada para cima', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      level: 5,
      hit_dice_spent: 3,
      stats: { pv: 30, current_pv: 4, ca: 11, faith: 50, current_faith: 40 },
    });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });
    const admin = adminClient();
    const day = await admin.from('game_sessions').update({ current_day: 2 }).eq('id', sessionId);
    if (day.error) throw day.error;

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await watchPlayers(master, 2);
    await openPanel(master, 'Jogadores');
    await expect(master.getByText('Dados de Vida 2/5 (d10)')).toBeVisible();
    await openPanel(master, 'Descanso');

    await master.getByRole('button', { name: /Descanso Longo/ }).click();
    await master.getByRole('spinbutton').fill('2');
    await master.getByRole('button', { name: /Confirmar/ }).click();

    // 3 gastos: devolve 2 (metade, para cima) e sobra 1 gasto, então 4 de 5 na reserva.
    await openPanel(master, 'Jogadores');
    await expect(master.getByText('Dados de Vida 4/5 (d10)')).toBeVisible();
    await expect
      .poll(async () => {
        const { data, error } = await admin
          .from('characters')
          .select('hit_dice_spent, stats')
          .eq('id', eliabe)
          .single();
        if (error) throw error;
        return [data.hit_dice_spent, (data.stats as { current_pv: number }).current_pv];
      })
      .toEqual([1, 30]);
  });

  test('uma sessão nova devolve todos os Dados de Vida, o PV máximo e as Habilidades', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      level: 5,
      hit_dice_spent: 4,
      stats: { pv: 30, current_pv: 3, ca: 11, faith: 50, current_faith: 40 },
      skills: { ability_uses: { [longRestAbility]: 1 } },
    });
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill(SESSION_NAME);
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();
    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();
    await master.getByLabel('Eliabe').check();
    await master.getByRole('button', { name: 'Próximo: Resumo' }).click();
    await master.getByRole('button', { name: 'Iniciar Sessão' }).click();
    await expect(master).toHaveURL(/\/session\/[0-9a-f-]{36}$/);

    await expect
      .poll(async () => {
        const { data, error } = await adminClient()
          .from('characters')
          .select('hit_dice_spent, stats, skills')
          .eq('id', eliabe)
          .single();
        if (error) throw error;
        return {
          spent: data.hit_dice_spent,
          pv: (data.stats as { current_pv: number; current_faith: number }).current_pv,
          faith: (data.stats as { current_faith: number }).current_faith,
          uses: (data.skills as { ability_uses: Record<string, number> }).ability_uses,
        };
      })
      .toEqual({ spent: 0, pv: 30, faith: 40, uses: {} });
  });
});
