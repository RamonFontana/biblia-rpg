import { adminClient } from './support/admin';
import { startCombat } from './support/combat';
import { test, expect } from './fixtures';
import { watchPlayers } from './support/ui';

const BANDIT = 'Bandido do Deserto';

const abilityStateOf = async (name: string) => {
  const { data: character } = await adminClient()
    .from('characters')
    .select('id')
    .eq('name', name)
    .single();
  const { data } = await adminClient()
    .from('combat_participants')
    .select('ability_state')
    .eq('entity_id', character?.id ?? '')
    .single();
  return data?.ability_state;
};

test.describe('Ataque Furtivo', () => {
  test('o lembrete aparece no turno do Bandido, trava no "usei" e volta na rodada seguinte', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const bandit = await seed.createCharacter('master', {
      name: BANDIT,
      is_enemy: true,
      tribe: 'Inimigo',
      has_participated_in_session: true,
      stats: { pv: 11, current_pv: 11, ca: 12, faith: 0, current_faith: 0 },
      skills: [{ name: 'Ataque Furtivo', description: 'Uma vez por turno, +1d6.' }] as never,
    });
    void bandit;
    const sessionId = await seed.createSession({ characters: [eliabe, bandit] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await watchPlayers(master, 2);
    await startCombat(master, { [BANDIT]: 15, Eliabe: 10 });

    const reminder = master.getByTestId('furtivo-reminder');
    await expect(reminder).toContainText('+1d6 disponível (Vantagem ou aliado a 1,5 m do alvo)');
    await reminder.getByRole('button', { name: 'usei' }).click();
    await expect(reminder.getByRole('button', { name: 'Usado' })).toBeDisabled();
    await expect.poll(() => abilityStateOf(BANDIT)).toEqual({ furtivo: { usedRound: 1 } });

    // O jogador não vê o lembrete do inimigo.
    await expect(player.getByTestId('furtivo-reminder')).toHaveCount(0);

    // Turno do Eliabe: sem lembrete. De volta ao Bandido na rodada 2: liberado.
    const next = master.getByRole('button', { name: 'Próximo Turno' });
    await next.click();
    await expect(reminder).toHaveCount(0);
    await next.click();
    await expect(master.getByText('Painel de Combate (Rodada 2)')).toBeVisible();
    await expect(reminder.getByRole('button', { name: 'usei' })).toBeEnabled();
  });

  test('de ponta a ponta: o Bandido criado pelo Preset no assistente traz o lembrete no combate', async ({
    seed,
    signIn,
  }) => {
    await seed.createCharacter('player1', { name: 'Eliabe' });
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill('Emboscada no Deserto');
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();
    await master.getByRole('button', { name: 'Adicionar Inimigo' }).click();
    await master.getByRole('combobox').first().click();
    await master.getByRole('option', { name: /^Bandido do Deserto/ }).click();
    await master.getByRole('button', { name: 'Adicionar à Sessão' }).click();
    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();
    await master.getByLabel('Eliabe').check();
    await master.getByRole('button', { name: 'Próximo: Mapas' }).click();
    await master.getByRole('button', { name: 'Próximo: Resumo' }).click();
    await master.getByRole('button', { name: 'Iniciar Sessão' }).click();
    await expect(master).toHaveURL(/\/session\/[0-9a-f-]{36}$/);

    const player = await signIn('player1');
    await player.goto(master.url());
    await watchPlayers(master, 2);
    await startCombat(master, { [BANDIT]: 15, Eliabe: 10 });

    await expect(master.getByTestId('furtivo-reminder')).toContainText('+1d6 disponível');
    await master.getByTestId('furtivo-reminder').getByRole('button', { name: 'usei' }).click();
    await expect.poll(() => abilityStateOf(BANDIT)).toEqual({ furtivo: { usedRound: 1 } });
  });
});
