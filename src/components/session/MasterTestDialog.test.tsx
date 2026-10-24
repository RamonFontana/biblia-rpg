// CARACTERIZAÇÃO: a janela do Mestre para pedir um Teste aos jogadores e acompanhar os resultados:
// o formulário (tipo, dificuldade, Fé, alvos), o envio e o painel do Teste em andamento (resultados,
// cancelar, encerrar). Decisões: ROADMAP.md, Onda 4, passo 7e. Termos: CONTEXT.md (Teste, Fé).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  createSessionTest: vi.fn(),
  cancelSessionTest: vi.fn(),
  completeSessionTest: vi.fn(),
}));

vi.mock('@/data-access/sessionTests', () => ({
  createSessionTest: h.createSessionTest,
  cancelSessionTest: h.cancelSessionTest,
  completeSessionTest: h.completeSessionTest,
}));

import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import type { Character } from '@/features/character-management/types';
import { MasterTestDialog } from './MasterTestDialog';

const sheet = (id: string, name: string, over: Partial<Character> = {}): Character => ({
  id,
  user_id: `user-${id}`,
  name,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  vocation: 'Batedor',
  level: 1,
  attributes: { for: 10, des: 16, con: 12, int: 8, sab: 14, car: 10 },
  proficiencies: { skill_proficiencies: [] },
  ...over,
});

const players = [{ character: sheet('c1', 'Eliab') }, { character: sheet('c2', 'Raquel') }];

const active = (over: Partial<SessionTest> = {}): SessionTest =>
  ({ id: 't1', status: 'active', test_type: 'Destreza', difficulty: 12, ...over }) as SessionTest;
const result = (over: Partial<SessionTestResult> = {}): SessionTestResult =>
  ({
    id: 'r1',
    test_id: 't1',
    character_id: 'c1',
    player_id: 'user-c1',
    status: 'pending',
    result_value: null,
    roll_value: null,
    is_approved: null,
    ...over,
  }) as SessionTestResult;

const onClose = vi.fn();

type Props = Partial<React.ComponentProps<typeof MasterTestDialog>>;
const renderDialog = (props: Props = {}) =>
  render(
    <MasterTestDialog
      sessionId="s1"
      isOpen
      onClose={onClose}
      activeTests={[]}
      testResults={{}}
      playerCharacters={players}
      {...props}
    />,
  );

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Solicitar Teste' }));
const pickPlayer = (name: string) => fireEvent.click(screen.getByText(name));

beforeEach(() => {
  h.createSessionTest.mockResolvedValue(undefined);
  h.cancelSessionTest.mockResolvedValue(undefined);
  h.completeSessionTest.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('MasterTestDialog: formulário', () => {
  it('fechada, não desenha nada', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByText('Solicitar Teste aos Jogadores')).toBeNull();
  });

  it('abre com o primeiro tipo de Teste e a dificuldade 10', () => {
    renderDialog();
    expect(screen.getByText('Solicitar Teste aos Jogadores')).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('Força');
    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  // Decisão do autor (ROADMAP, passo 9c, Q10): o elenco da sessão nunca traz o perfil do jogador,
  // então o texto "(Sem jogador)" ao lado do nome estava sempre errado e saiu.
  it('lista os personagens dos jogadores só pelo nome', () => {
    renderDialog();
    expect(screen.getByText('Eliab')).toBeInTheDocument();
    expect(screen.getByText('Raquel')).toBeInTheDocument();
    expect(screen.queryByText(/Sem jogador/)).toBeNull();
  });

  it('sem jogadores, avisa e não deixa pedir', () => {
    renderDialog({ playerCharacters: [] });
    expect(screen.getByText('Nenhum jogador conectado com personagem.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar Teste' })).toBeDisabled();
  });

  it('só deixa pedir com alguém escolhido, e o contador acompanha', () => {
    renderDialog();
    expect(screen.getByText('Jogadores Alvo (0)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar Teste' })).toBeDisabled();
    pickPlayer('Eliab');
    expect(screen.getByText('Jogadores Alvo (1)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar Teste' })).toBeEnabled();
    pickPlayer('Eliab');
    expect(screen.getByText('Jogadores Alvo (0)')).toBeInTheDocument();
  });

  it('Todos e Nenhum marcam e desmarcam os alvos', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(screen.getByText('Jogadores Alvo (2)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Nenhum' }));
    expect(screen.getByText('Jogadores Alvo (0)')).toBeInTheDocument();
  });

  it('Cancelar e ✕ fecham a janela', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('a dificuldade que não é número vira 0', () => {
    renderDialog();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
  });
});

describe('MasterTestDialog: Fé', () => {
  const chooseFaith = () =>
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Fé' } });

  it('o Teste de Fé pede o modificador e muda o rótulo', () => {
    renderDialog();
    expect(screen.queryByText('Modificador')).toBeNull();
    chooseFaith();
    expect(screen.getByText('Modificador')).toBeInTheDocument();
    expect(screen.getByText('Misericórdia (0-100)')).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'punishment' } });
    expect(screen.getByText('Punição (0-100)')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveAttribute('max', '100');
  });

  it('a Punição é gravada como dificuldade negativa', async () => {
    renderDialog();
    chooseFaith();
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'punishment' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } });
    pickPlayer('Eliab');
    submit();
    await waitFor(() => expect(h.createSessionTest).toHaveBeenCalled());
    expect(h.createSessionTest).toHaveBeenCalledWith('s1', 'Fé', -30, expect.any(Array));
  });

  it('a Misericórdia é gravada como dificuldade positiva', async () => {
    renderDialog();
    chooseFaith();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } });
    pickPlayer('Eliab');
    submit();
    await waitFor(() => expect(h.createSessionTest).toHaveBeenCalled());
    expect(h.createSessionTest).toHaveBeenCalledWith('s1', 'Fé', 30, expect.any(Array));
  });
});

describe('MasterTestDialog: enviar o Teste', () => {
  it('envia o tipo, a dificuldade e um alvo por personagem escolhido', async () => {
    renderDialog();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Furtividade' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '14' } });
    pickPlayer('Eliab');
    pickPlayer('Raquel');
    submit();

    await waitFor(() => expect(h.createSessionTest).toHaveBeenCalledTimes(1));
    expect(h.createSessionTest).toHaveBeenCalledWith('s1', 'Furtividade', 14, [
      { characterId: 'c1', playerId: 'user-c1' },
      { characterId: 'c2', playerId: 'user-c2' },
    ]);
  });

  it('deixa de fora o personagem sem dono', async () => {
    renderDialog({
      playerCharacters: [
        { character: sheet('c1', 'Eliab') },
        { character: sheet('c3', 'Sem Dono', { user_id: '' }) },
      ],
    });
    pickPlayer('Eliab');
    pickPlayer('Sem Dono');
    submit();

    await waitFor(() => expect(h.createSessionTest).toHaveBeenCalled());
    expect(h.createSessionTest.mock.calls[0][3]).toEqual([
      { characterId: 'c1', playerId: 'user-c1' },
    ]);
  });

  it('recusa uma dificuldade fora de 0 a 100', async () => {
    renderDialog();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '150' } });
    pickPlayer('Eliab');
    submit();
    expect(await screen.findByText('O valor deve estar entre 0 e 100.')).toBeInTheDocument();
    expect(h.createSessionTest).not.toHaveBeenCalled();
  });

  it('mostra Enviando enquanto grava', async () => {
    let resolve: () => void = () => {};
    h.createSessionTest.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
    renderDialog();
    pickPlayer('Eliab');
    submit();
    expect(await screen.findByRole('button', { name: 'Enviando...' })).toBeDisabled();
    resolve();
    expect(await screen.findByRole('button', { name: 'Solicitar Teste' })).toBeInTheDocument();
  });

  it('mostra a mensagem do erro e libera o botão', async () => {
    h.createSessionTest.mockRejectedValueOnce(new Error('sem rede'));
    renderDialog();
    pickPlayer('Eliab');
    submit();
    expect(await screen.findByText('sem rede')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar Teste' })).toBeEnabled();
  });

  it('usa a mensagem padrão quando o erro não traz texto', async () => {
    h.createSessionTest.mockRejectedValueOnce({});
    renderDialog();
    pickPlayer('Eliab');
    submit();
    expect(await screen.findByText('Erro ao criar o teste.')).toBeInTheDocument();
  });
});

describe('MasterTestDialog: Teste em andamento', () => {
  const running = (over: Props = {}) =>
    renderDialog({
      activeTests: [active()],
      testResults: { t1: [result()] },
      ...over,
    });

  it('mostra o tipo, a dificuldade e quantos resultados já chegaram', () => {
    running({
      testResults: {
        t1: [
          result(),
          result({ id: 'r2', character_id: 'c2', status: 'submitted', result_value: 15 }),
        ],
      },
    });
    expect(screen.getByText('Teste em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Destreza')).toBeInTheDocument();
    expect(screen.getByText('Dificuldade')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Resultados \(1\/\s*2\)/)).toBeInTheDocument();
  });

  it('o Teste de Fé mostra Misericórdia ou Punição e o valor sem sinal', () => {
    running({ activeTests: [active({ test_type: 'Fé', difficulty: -25 })] });
    expect(screen.getByText('Punição')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    cleanup();
    running({ activeTests: [active({ test_type: 'Fé', difficulty: 25 })] });
    expect(screen.getByText('Misericórdia')).toBeInTheDocument();
  });

  it('o resultado pendente espera, o enviado mostra o valor e a decisão', () => {
    running({
      testResults: {
        t1: [
          result(),
          result({
            id: 'r2',
            character_id: 'c2',
            status: 'submitted',
            result_value: 15,
            roll_value: 12,
            is_approved: true,
          }),
          result({
            id: 'r3',
            character_id: 'zz',
            status: 'submitted',
            result_value: 4,
            is_approved: false,
          }),
        ],
      },
    });
    expect(screen.getByText('Aguardando...')).toBeInTheDocument();
    expect(screen.getByText('Raquel')).toBeInTheDocument();
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    expect(screen.getByText('Desconhecido')).toBeInTheDocument();
    expect(screen.getByText('Reprovado')).toBeInTheDocument();
    // O detalhamento usa o dado gravado e os modificadores da ficha de agora.
    expect(screen.getByText('1d20 (12) + Mod (3) = 15')).toBeInTheDocument();
  });

  it('só o Teste ativo conta, e o painel de pedido não aparece', () => {
    renderDialog({ activeTests: [active({ status: 'completed' })] });
    expect(screen.getByText('Solicitar Teste aos Jogadores')).toBeInTheDocument();
  });

  it('Cancelar Teste cancela o Teste ativo', async () => {
    running();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Teste' }));
    await waitFor(() => expect(h.cancelSessionTest).toHaveBeenCalledWith('t1'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Encerrar Teste conclui o Teste e fecha a janela', async () => {
    running();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar Teste' }));
    await waitFor(() => expect(h.completeSessionTest).toHaveBeenCalledWith('t1'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('a falha ao cancelar mostra a mensagem ou a padrão', async () => {
    h.cancelSessionTest.mockRejectedValueOnce(new Error('sem rede'));
    running();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Teste' }));
    expect(await screen.findByText('sem rede')).toBeInTheDocument();

    h.cancelSessionTest.mockRejectedValueOnce({});
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Teste' }));
    expect(await screen.findByText('Erro ao cancelar o teste.')).toBeInTheDocument();
  });

  it('a falha ao encerrar mostra a mensagem e não fecha', async () => {
    h.completeSessionTest.mockRejectedValueOnce({});
    running();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar Teste' }));
    expect(await screen.findByText('Erro ao concluir o teste.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
