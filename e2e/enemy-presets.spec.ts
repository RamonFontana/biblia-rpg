import { adminClient } from './support/admin';
import { test, expect } from './fixtures';
import { openPanel } from './support/ui';

const SESSION_NAME = 'Emboscada no Deserto';

test.describe('Presets de inimigo', () => {
  test('o Mestre cria 3 Bandidos do Deserto no assistente e mais 2 na sessão, numerados', async ({
    seed,
    signIn,
  }) => {
    await seed.createCharacter('player1', { name: 'Eliabe' });
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill(SESSION_NAME);
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();

    // No assistente: o Preset, a quantidade e criar, sem abrir o ajuste fino.
    await master.getByRole('button', { name: 'Adicionar Inimigo' }).click();
    await master.getByRole('combobox').first().click();
    await master.getByRole('option', { name: /^Bandido do Deserto/ }).click();
    await master.getByLabel('Quantidade').fill('3');
    await master.getByRole('button', { name: 'Adicionar à Sessão' }).click();
    await expect(master.getByRole('heading', { name: 'Inimigos Selecionados (3)' })).toBeVisible();
    for (const n of [1, 2, 3]) {
      await expect(master.getByText(`Bandido do Deserto ${n}`, { exact: true })).toBeVisible();
    }

    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();
    await master.getByLabel('Eliabe').check();
    await master.getByRole('button', { name: 'Próximo: Mapas' }).click();
    await master.getByRole('button', { name: 'Próximo: Resumo' }).click();
    await master.getByRole('button', { name: 'Iniciar Sessão' }).click();
    await expect(master).toHaveURL(/\/session\/[0-9a-f-]{36}$/);

    // Na sessão: a numeração continua de onde parou.
    await openPanel(master, 'Inimigos');
    const panel = master.getByRole('dialog', { name: 'Inimigos' });
    await panel.getByRole('button', { name: 'Criar Inimigo' }).click();
    await master.getByRole('combobox').first().click();
    await master.getByRole('option', { name: /^Bandido do Deserto/ }).click();
    await master.getByLabel('Quantidade').fill('2');
    await master.getByRole('button', { name: 'Criar Inimigo' }).last().click();
    await expect(master.getByText('Bandido do Deserto 5', { exact: true })).toBeVisible();

    const admin = adminClient();
    const { data: enemies } = await admin
      .from('characters')
      .select('name, stats, narrative')
      .eq('is_enemy', true)
      .order('name');
    expect(enemies?.map((e) => e.name)).toEqual([
      'Bandido do Deserto 1',
      'Bandido do Deserto 2',
      'Bandido do Deserto 3',
      'Bandido do Deserto 4',
      'Bandido do Deserto 5',
    ]);
    expect(enemies?.every((e) => (e.stats as { ca: number }).ca === 12)).toBe(true);
    expect(
      enemies?.every(
        (e) =>
          (e.narrative as { enemy: { presetId: string } }).enemy.presetId ===
          'enemy-preset-bandido-do-deserto',
      ),
    ).toBe(true);
  });

  test('o Mestre cria um Leão da Judeia Endemoniado: 34 PV, nome e imune a Amedrontado', async ({
    seed,
    signIn,
  }) => {
    await seed.createCharacter('player1', { name: 'Eliabe' });
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill(SESSION_NAME);
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();
    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();
    await master.getByLabel('Eliabe').check();
    await master.getByRole('button', { name: 'Próximo: Mapas' }).click();
    await master.getByRole('button', { name: 'Próximo: Resumo' }).click();
    await master.getByRole('button', { name: 'Iniciar Sessão' }).click();
    await expect(master).toHaveURL(/\/session\/[0-9a-f-]{36}$/);

    await openPanel(master, 'Inimigos');
    const panel = master.getByRole('dialog', { name: 'Inimigos' });
    await panel.getByRole('button', { name: 'Criar Inimigo' }).click();
    await master.getByRole('combobox').first().click();
    await master.getByRole('option', { name: /^Leão da Judeia/ }).click();
    await master.getByLabel('Endemoniado (Template)').check();
    await expect(master.getByPlaceholder('Ex: Lobo Selvagem')).toHaveValue(
      'Leão da Judeia Endemoniado',
    );
    await master.getByRole('button', { name: 'Criar Inimigo' }).last().click();
    await expect(master.getByText('Leão da Judeia Endemoniado', { exact: true })).toBeVisible();

    const { data: enemies } = await adminClient()
      .from('characters')
      .select('name, stats, attributes, narrative')
      .eq('is_enemy', true);
    expect(enemies).toHaveLength(1);
    const [lion] = enemies ?? [];
    expect(lion.name).toBe('Leão da Judeia Endemoniado');
    expect(lion.stats).toMatchObject({
      pv: 34,
      current_pv: 34,
      conditionImmunities: ['amedrontado'],
    });
    expect(lion.attributes).toMatchObject({ for: 21, con: 17, int: 3 });
    expect(lion.narrative).toMatchObject({
      enemy: { presetId: 'enemy-preset-leao-da-judeia', endemoniado: true },
    });
  });
});
