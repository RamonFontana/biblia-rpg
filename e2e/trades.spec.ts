import { adminClient } from './support/admin';
import { offerCoins, offerItem, readyButton, tradeSide } from './support/trade';
import { closePanel, negotiateWith, openPanel } from './support/ui';
import type { Page } from '@playwright/test';
import { test, expect, type Seed, type SignIn } from './fixtures';

const SESSION_NAME = 'Invasão a Jericó';

/** Eliabe (50 SP, uma adaga) e Rute (20 SP) na mesma sessão, os dois online. */
const retrato = (page: Page, name: string) =>
  page
    .getByRole('region', { name: 'Retratos' })
    .getByRole('button', { name: new RegExp(`^${name},`) });

/** A lista do Grupo marca quem está numa troca; ela mora num Painel, que se abre só para ler. */
async function expectNegotiating(page: Page, count: number) {
  await openPanel(page, 'Grupo');
  await expect(page.getByText('⚖️ Negociando...')).toHaveCount(count);
  await closePanel(page);
}

async function openTable(seed: Seed, signIn: SignIn) {
  const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', coins: 50 });
  const rute = await seed.createCharacter('player2', { name: 'Rute', coins: 20 });
  await seed.giveItem(eliabe, 'adaga');
  const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe, rute] });

  const eliabePage = await signIn('player1');
  await eliabePage.goto(`/session/${sessionId}`);
  const rutePage = await signIn('player2');
  await rutePage.goto(`/session/${sessionId}`);
  // Os dois já enxergam um ao outro no Palco antes de pedir a troca.
  await expect(retrato(eliabePage, 'Rute')).toBeVisible();
  await expect(retrato(rutePage, 'Eliabe')).toBeVisible();
  return { eliabePage, rutePage, eliabe, rute, sessionId };
}

async function coinsOf(characterId: string) {
  const { data } = await adminClient().from('characters').select('coins').eq('id', characterId);
  return data?.[0]?.coins;
}

async function inventoryOf(characterId: string) {
  const { data } = await adminClient()
    .from('character_items')
    .select('quantity, items(slug)')
    .eq('character_id', characterId);
  return (data ?? []).map((row) => ({ slug: row.items?.slug, quantity: row.quantity }));
}

async function tradeStatuses() {
  const { data } = await adminClient().from('trades').select('type, status');
  return data;
}

/** A prontidão que a troca concluída guarda: executar não pode desmarcá-la. */
async function readyFlags() {
  const { data } = await adminClient().from('trades').select('initiator_ready, target_ready');
  return data;
}

test.describe('negociação entre jogadores', () => {
  test('o pedido chega ao outro jogador, que pode recusar', async ({ seed, signIn }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);

    await negotiateWith(eliabePage, 'Rute');

    await expect(rutePage.getByText('Solicitação de Troca')).toBeVisible();
    await expect(rutePage.getByText('Eliabe quer negociar com você')).toBeVisible();
    await expectNegotiating(eliabePage, 2);
    await expect(eliabePage.getByText('Pedido de Troca enviado')).toBeVisible();
    await expect(eliabePage.getByText(/Você quer negociar com\s*Rute/)).toBeVisible();

    await rutePage.getByRole('button', { name: 'Recusar' }).click();

    await expect(rutePage.getByText('Solicitação de Troca')).toHaveCount(0);
    await expect(eliabePage.getByText('Pedido de Troca enviado')).toHaveCount(0);
    await expectNegotiating(eliabePage, 0);
    await expect(eliabePage.getByRole('dialog')).toHaveCount(0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'cancelled' }]);
  });

  test('quem pediu a troca pode cancelar o pedido antes da resposta', async ({ seed, signIn }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);

    await negotiateWith(eliabePage, 'Rute');
    await expect(rutePage.getByText('Eliabe quer negociar com você')).toBeVisible();

    await eliabePage.getByRole('button', { name: 'Cancelar pedido' }).click();

    await expect(eliabePage.getByText('Pedido de Troca enviado')).toHaveCount(0);
    await expect(rutePage.getByText('Solicitação de Troca')).toHaveCount(0);
    await expectNegotiating(rutePage, 0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'cancelled' }]);
  });

  test('sair da mesa cancela o pedido de troca aberto', async ({ seed, signIn }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);

    await negotiateWith(eliabePage, 'Rute');
    await expect(rutePage.getByText('Solicitação de Troca')).toBeVisible();

    await eliabePage.getByRole('link', { name: 'Home' }).click();

    await expect(rutePage.getByText('Solicitação de Troca')).toHaveCount(0);
    await expectNegotiating(rutePage, 0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'cancelled' }]);
  });

  test('ao aceitar, os dois veem a mesma negociação e cada um edita só o próprio lado', async ({
    seed,
    signIn,
  }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);

    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();

    for (const page of [eliabePage, rutePage]) {
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText('Eliabe ↔ Rute')).toBeVisible();
      await expect(readyButton(dialog)).toHaveCount(1);
    }
    const eliabeDialog = eliabePage.getByRole('dialog');
    await expect(readyButton(tradeSide(eliabeDialog, 'Eliabe'))).toBeVisible();
    await expect(tradeSide(eliabeDialog, 'Rute').locator('input[type="number"]')).toBeDisabled();
    await expect(readyButton(tradeSide(rutePage.getByRole('dialog'), 'Rute'))).toBeVisible();
  });

  test('os dois ficam prontos e a troca move o item e os SP', async ({ seed, signIn }) => {
    const { eliabePage, rutePage, eliabe, rute } = await openTable(seed, signIn);
    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();

    // Cada um monta a própria oferta antes de qualquer Pronto: mudar a oferta desmarca os dois.
    const eliabeDialog = eliabePage.getByRole('dialog');
    const eliabeSide = tradeSide(eliabeDialog, 'Eliabe');
    await offerItem(eliabeSide, 'Faca/Adaga de Bronze');
    await offerCoins(eliabeSide, 5);
    const ruteDialog = rutePage.getByRole('dialog');
    const ruteSide = tradeSide(ruteDialog, 'Rute');
    await offerCoins(ruteSide, 3);
    await expect(tradeSide(eliabeDialog, 'Rute').locator('input[type="number"]')).toHaveValue('3');

    await readyButton(eliabeSide).click();

    // Rute vê que Eliabe já está pronto e que falta a vez dela.
    await expect(tradeSide(ruteDialog, 'Eliabe').getByText('✓ Pronto')).toBeVisible();
    await expect(ruteSide.getByText('Aguardando outro lado...')).toBeVisible();
    await expect(ruteDialog.getByText('Faca/Adaga de Bronze × 1')).toBeVisible();
    await readyButton(ruteSide).click();

    await expect(eliabePage.getByRole('dialog')).toHaveCount(0);
    await expect(rutePage.getByRole('dialog')).toHaveCount(0);

    // As fichas já mostram o resultado, sem recarregar a página.
    await openPanel(rutePage, 'Ficha');
    await expect(rutePage.getByText('Faca/Adaga de Bronze')).toBeVisible();
    await openPanel(eliabePage, 'Ficha');
    await expect(eliabePage.getByText('Inventário vazio.')).toBeVisible();

    expect(await inventoryOf(eliabe)).toEqual([]);
    expect(await inventoryOf(rute)).toEqual([{ slug: 'adaga', quantity: 1 }]);
    expect(await coinsOf(eliabe)).toBe(48);
    expect(await coinsOf(rute)).toBe(22);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'completed' }]);
    expect(await readyFlags()).toEqual([{ initiator_ready: true, target_ready: true }]);
  });

  test('mudar a oferta depois do Pronto desmarca os dois lados', async ({ seed, signIn }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);
    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();

    const eliabeSide = tradeSide(eliabePage.getByRole('dialog'), 'Eliabe');
    await offerCoins(eliabeSide, 5);
    await readyButton(eliabeSide).click();
    const ruteDialog = rutePage.getByRole('dialog');
    await expect(tradeSide(ruteDialog, 'Eliabe').getByText('✓ Pronto')).toBeVisible();

    await offerCoins(tradeSide(ruteDialog, 'Rute'), 3);

    await expect(tradeSide(ruteDialog, 'Eliabe').getByText('✓ Pronto')).toHaveCount(0);
    await expect(eliabeSide.getByText('✓ Pronto')).toHaveCount(0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'active' }]);
  });

  test('não fica pronto quem oferece mais SP do que tem', async ({ seed, signIn }) => {
    const { eliabePage, rutePage } = await openTable(seed, signIn);
    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();

    const eliabeSide = tradeSide(eliabePage.getByRole('dialog'), 'Eliabe');
    await offerCoins(eliabeSide, 60);
    await readyButton(eliabeSide).click();

    await expect(eliabeSide.getByText('Saldo insuficiente de SP. Você tem 50 SP.')).toBeVisible();
    await expect(eliabeSide.getByText('✓ Pronto')).toHaveCount(0);
    await expect(
      tradeSide(rutePage.getByRole('dialog'), 'Eliabe').getByText('✓ Pronto'),
    ).toHaveCount(0);
  });

  test('desmarcar o pronto desfaz a espera e nada é executado', async ({ seed, signIn }) => {
    const { eliabePage, rutePage, eliabe, rute } = await openTable(seed, signIn);
    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();

    const eliabeSide = tradeSide(eliabePage.getByRole('dialog'), 'Eliabe');
    await offerCoins(eliabeSide, 5);
    await readyButton(eliabeSide).click();
    const ruteView = tradeSide(rutePage.getByRole('dialog'), 'Eliabe');
    await expect(ruteView.getByText('✓ Pronto')).toBeVisible();

    await eliabeSide.getByRole('button', { name: 'Cancelar Pronto' }).click();

    await expect(ruteView.getByText('✓ Pronto')).toHaveCount(0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'active' }]);
    expect(await coinsOf(eliabe)).toBe(50);
    expect(await coinsOf(rute)).toBe(20);
  });

  test('cancelar a negociação fecha a janela dos dois e nada muda', async ({ seed, signIn }) => {
    const { eliabePage, rutePage, eliabe, rute } = await openTable(seed, signIn);
    await negotiateWith(eliabePage, 'Rute');
    await rutePage.getByRole('button', { name: 'Aceitar' }).click();
    const eliabeSide = tradeSide(eliabePage.getByRole('dialog'), 'Eliabe');
    await offerItem(eliabeSide, 'Faca/Adaga de Bronze');

    await eliabePage.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

    await expect(eliabePage.getByRole('dialog')).toHaveCount(0);
    await expect(rutePage.getByRole('dialog')).toHaveCount(0);
    expect(await tradeStatuses()).toEqual([{ type: 'player_trade', status: 'cancelled' }]);
    expect(await inventoryOf(eliabe)).toEqual([{ slug: 'adaga', quantity: 1 }]);
    expect(await inventoryOf(rute)).toEqual([]);
  });
});

test.describe('Lojinha do Mestre', () => {
  test('o Mestre vende um item do catálogo e o jogador paga', async ({ seed, signIn }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', coins: 50 });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await expect(master.getByText('Participantes Online (2)')).toBeVisible();

    await master.getByRole('button', { name: 'Lojinha' }).click();

    const masterDialog = master.getByRole('dialog');
    await expect(masterDialog.getByText('Lojinha do Mestre')).toBeVisible();
    await expect(masterDialog.getByText('Mestre (Lojinha) ↔ Eliabe')).toBeVisible();
    const playerDialog = player.getByRole('dialog');
    await expect(playerDialog.getByText('Lojinha do Mestre')).toBeVisible();

    const shelf = tradeSide(masterDialog, 'Mestre (Lojinha)');
    await offerItem(shelf, 'Faca/Adaga de Bronze');
    const payment = tradeSide(playerDialog, 'Eliabe');
    await offerCoins(payment, 2);
    await readyButton(payment).click();
    await expect(tradeSide(masterDialog, 'Eliabe').getByText('✓ Pronto')).toBeVisible();
    await readyButton(shelf).click();

    await expect(masterDialog).toHaveCount(0);
    await expect(playerDialog).toHaveCount(0);
    expect(await inventoryOf(eliabe)).toEqual([{ slug: 'adaga', quantity: 1 }]);
    expect(await coinsOf(eliabe)).toBe(48);
    expect(await tradeStatuses()).toEqual([{ type: 'shop', status: 'completed' }]);
  });
});

test.describe('negociação com NPC', () => {
  test('o NPC só aparece quando o Mestre o torna visível, e a troca com ele funciona', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', coins: 50 });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe],
      npcs: ['Raabe'],
    });
    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);
    await expect(master.getByText('Participantes Online (2)')).toBeVisible();
    await expect(player.getByText('Raabe')).toHaveCount(0);

    await master.getByRole('button', { name: 'Alternar visibilidade' }).click();
    await expect(master.getByText('VISÍVEL')).toBeVisible();
    await expect(player.getByText('Raabe')).toBeVisible();

    await negotiateWith(player, 'Raabe');
    await expect(master.getByText('Eliabe quer negociar com Raabe')).toBeVisible();
    await expect(player.getByText(/Aguardando o Mestre aceitar a troca com\s*Raabe/)).toBeVisible();
    await master.getByRole('button', { name: 'Aceitar' }).click();

    const masterDialog = master.getByRole('dialog');
    const playerDialog = player.getByRole('dialog');
    await expect(masterDialog.getByText('Negociação com NPC')).toBeVisible();
    await expect(masterDialog.getByText('Eliabe ↔ Raabe')).toBeVisible();

    const npcSide = tradeSide(masterDialog, 'Raabe');
    await offerItem(npcSide, 'Faca/Adaga de Bronze');
    const playerSide = tradeSide(playerDialog, 'Eliabe');
    await offerCoins(playerSide, 2);
    await readyButton(playerSide).click();
    await expect(tradeSide(masterDialog, 'Eliabe').getByText('✓ Pronto')).toBeVisible();
    await readyButton(npcSide).click();

    await expect(masterDialog).toHaveCount(0);
    await expect(playerDialog).toHaveCount(0);
    expect(await inventoryOf(eliabe)).toEqual([{ slug: 'adaga', quantity: 1 }]);
    expect(await coinsOf(eliabe)).toBe(48);
    expect(await tradeStatuses()).toEqual([{ type: 'npc_trade', status: 'completed' }]);
  });
});
