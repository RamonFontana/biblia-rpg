import { adminClient } from './support/admin';
import { test, expect } from './fixtures';
import { nextPaint, openPanel } from './support/ui';

const SESSION_NAME = 'Invasão a Jericó';

test.describe('criar a sessão', () => {
  test('o Mestre percorre os 5 passos e abre a mesa com o jogador e o NPC', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    await seed.createCharacter('player2', { name: 'Rute' });
    const master = await signIn('master');

    await master.getByRole('link', { name: 'Mestre: Criar Sessão' }).click();
    await master.getByLabel('Nome da Sessão').fill(SESSION_NAME);
    await master.getByLabel(/Descrição/).fill('Os muros caem ao sétimo dia.');
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();
    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByLabel('Nome do NPC').fill('Raabe');
    await master.getByRole('button', { name: 'Adicionar NPC Simples' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();
    await master.getByLabel('Eliabe').check();
    await master.getByRole('button', { name: 'Próximo: Resumo' }).click();

    await expect(master.getByText(`Nome: ${SESSION_NAME}`)).toBeVisible();
    await expect(master.getByText('Os muros caem ao sétimo dia.')).toBeVisible();
    await expect(master.getByRole('heading', { name: 'NPCs (1)' })).toBeVisible();
    await expect(master.getByRole('heading', { name: 'Jogadores (1)' })).toBeVisible();

    await master.getByRole('button', { name: 'Iniciar Sessão' }).click();

    await expect(master).toHaveURL(/\/session\/[0-9a-f-]{36}$/);
    await expect(master.getByRole('heading', { name: SESSION_NAME })).toBeVisible();
    await expect(master.getByText('Visão do Mestre')).toBeVisible();
    await expect(master.getByText('Raabe')).toBeVisible();
    await expect(master.getByText('OCULTO')).toBeVisible();

    const admin = adminClient();
    const { data: session } = await admin
      .from('game_sessions')
      .select('id, status')
      .eq('name', SESSION_NAME)
      .single();
    expect(session?.status).toBe('active');
    const { data: participants } = await admin
      .from('session_participants')
      .select('character_id')
      .eq('session_id', session?.id ?? '');
    expect(participants).toEqual([{ character_id: eliabe }]);
    const { data: character } = await admin
      .from('characters')
      .select('has_participated_in_session')
      .eq('id', eliabe)
      .single();
    expect(character?.has_participated_in_session).toBe(true);
  });

  test('o nome da sessão tem no mínimo 3 caracteres', async ({ signIn }) => {
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill('ab');
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();

    await expect(master.getByText('O nome deve ter no mínimo 3 caracteres')).toBeVisible();
    await expect(master.getByText('Passo 1 de 5')).toBeVisible();
  });

  test('personagem com Aumento de Nível pendente não pode ser convocado', async ({
    seed,
    signIn,
  }) => {
    await seed.createCharacter('player1', { name: 'Eliabe', pending_level_up: true });
    const master = await signIn('master');

    await master.goto('/session/create');
    await master.getByLabel('Nome da Sessão').fill(SESSION_NAME);
    await master.getByRole('button', { name: 'Próximo: Inimigos' }).click();
    await master.getByRole('button', { name: 'Próximo: NPCs' }).click();
    await master.getByRole('button', { name: 'Próximo: Jogadores' }).click();

    await expect(master.getByLabel('Eliabe')).toBeDisabled();
    await expect(master.getByText(/Aumento de Nível pendente/)).toBeVisible();
  });
});

test.describe('entrar na sessão', () => {
  test('o jogador usa um consumível pela Hotbar', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    await seed.giveItem(eliabe, 'racao', 3);
    await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const player = await signIn('player1');
    await player.getByRole('link', { name: `Entrar: ${SESSION_NAME}` }).click();

    await player.getByRole('tab', { name: /^Itens/ }).click();
    await player.getByRole('button', { name: 'Ração de Viagem, 3 unidades' }).click();
    await player
      .getByRole('dialog', { name: 'Ração de Viagem' })
      .getByRole('button', { name: 'Usar', exact: true })
      .click();

    await expect(player.getByRole('button', { name: 'Ração de Viagem, 2 unidades' })).toBeVisible();
    const { data, error } = await adminClient()
      .from('character_items')
      .select('quantity')
      .eq('character_id', eliabe)
      .single();
    if (error) throw error;
    expect(data.quantity).toBe(2);
  });

  test('o jogador convocado entra pela Home e vê a própria ficha', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const rute = await seed.createCharacter('player2', { name: 'Rute' });
    await seed.createSession({ name: SESSION_NAME, characters: [eliabe, rute] });

    const player = await signIn('player1');
    await player.getByRole('link', { name: `Entrar: ${SESSION_NAME}` }).click();

    await expect(player.getByRole('heading', { name: SESSION_NAME })).toBeVisible();
    await expect(player.getByRole('main', { name: 'Palco' })).toBeVisible();
    // PV e Fé ficam sempre à vista na Barra de Status, sem abrir nada.
    const statusBar = player.getByRole('region', { name: 'Barra de Status' });
    await expect(statusBar.getByRole('progressbar', { name: 'PV' })).toBeVisible();
    await expect(statusBar.getByText(/^Fé \d+$/)).toBeVisible();
    await openPanel(player, 'Ficha');
    await expect(player.getByText('Vocação: Guerreiro')).toBeVisible();
    await expect(player.getByText('Visão do Mestre')).toHaveCount(0);
  });

  test('com duas fichas convocadas, a sessão aparece uma vez só na Home', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const jonas = await seed.createCharacter('player1', { name: 'Jonas' });
    await seed.createSession({ name: SESSION_NAME, characters: [eliabe, jonas] });

    const player = await signIn('player1');

    await expect(player.getByRole('link', { name: `Entrar: ${SESSION_NAME}` })).toHaveCount(1);
  });

  test('quem não foi convocado não vê a sessão na Home', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    await seed.createCharacter('player2', { name: 'Rute' });
    await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const outsider = await signIn('player2');
    const sessionsLoaded = outsider.waitForResponse((response) =>
      response.url().includes('/rest/v1/session_participants'),
    );
    await outsider.reload();
    await sessionsLoaded;
    await nextPaint(outsider);

    await expect(outsider.getByRole('link', { name: 'Mestre: Criar Sessão' })).toBeVisible();
    await expect(outsider.getByRole('link', { name: /Entrar:/ })).toHaveCount(0);
  });
});

test.describe('mesa em tempo real', () => {
  test('o Mestre vê o jogador chegar e o jogador vê o período avançar sem recarregar', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    await expect(master.getByText('Participantes Online (1)')).toBeVisible();
    await expect(master.getByText('🌅 Manhã')).toBeVisible();

    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await expect(player.getByText('🌅 Manhã')).toBeVisible();

    await expect(master.getByText('Participantes Online (2)')).toBeVisible();
    // `toBeAttached`: no celular a lista do Mestre ainda colapsa a largura do nome (`truncate`); a
    // tela do Mestre no celular é o ticket 11 da Onda 6.
    await expect(master.getByText('Eliabe (Nível 1)')).toBeAttached();

    await master.getByRole('button', { name: /Avançar/ }).click();

    await expect(master.getByText('☀️ Tarde')).toBeVisible();
    await expect(player.getByText('☀️ Tarde')).toBeVisible();
    await expect(player.getByText('🌅 Manhã')).toHaveCount(0);
  });
});
