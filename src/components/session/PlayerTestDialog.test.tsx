// CARACTERIZAÇÃO: fixa o que o jogador vê e envia quando o Mestre pede um Teste (comum ou de Fé),
// com os dados e o serviço falsos. Decisões: ROADMAP.md, Onda 2 (bloco B): Teste de Fé com
// Modificador de Fé; a Desvantagem de Furtividade só aparece, o app não rola 2 dados (GAP conhecido).
// Termos: CONTEXT.md (Teste de Fé, Fé Efetiva, Item Profano, Modificador de Fé).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  submitTestResult: vi.fn(),
  getCharacterStats: vi.fn(),
  getCharacterTestContext: vi.fn(),
  getItemFaithPenalty: vi.fn(),
  listCharacterItemEffects: vi.fn(),
}));

vi.mock('@/services/sessionTestService', () => ({ submitTestResult: mocks.submitTestResult }));
vi.mock('@/data-access/characters', () => ({
  getCharacterStats: mocks.getCharacterStats,
  getCharacterTestContext: mocks.getCharacterTestContext,
}));
vi.mock('@/data-access/inventory', () => ({
  getItemFaithPenalty: mocks.getItemFaithPenalty,
  listCharacterItemEffects: mocks.listCharacterItemEffects,
}));
// O sorteio do app lê Math.random na hora, para o teste fixar o valor com um spy.
vi.mock('@/lib/systemRng', () => ({ systemRng: () => Math.random() }));

import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { PlayerTestDialog } from './PlayerTestDialog';

const test = (over: Partial<SessionTest> = {}): SessionTest => ({
  id: 't1',
  session_id: 's1',
  test_type: 'Destreza',
  difficulty: 12,
  status: 'active',
  created_at: '',
  ...over,
});
const result = (over: Partial<SessionTestResult> = {}): SessionTestResult => ({
  id: 'r1',
  test_id: 't1',
  character_id: 'c1',
  player_id: 'p1',
  status: 'pending',
  result_value: null,
  roll_value: null,
  is_approved: null,
  created_at: '',
  updated_at: '',
  ...over,
});

// Destreza 16 (+3), Furtividade proficiente (+2 no nível 1).
const sheet = {
  stats: { pv: 10, faith: 50, current_faith: 50 },
  equipment: { body: 'ci-armor' },
  level: 1,
  vocation: 'Guerreiro',
  attributes: { for: 10, des: 16, con: 10, int: 10, sab: 10, car: 10 },
  proficiencies: { skill_proficiencies: ['furtividade'] },
};

const show = async (t: SessionTest, r: SessionTestResult = result()) => {
  const view = render(<PlayerTestDialog isOpen activeTest={t} testResult={r} />);
  await waitFor(() => expect(mocks.getItemFaithPenalty).toHaveBeenCalled());
  await act(async () => {});
  return view;
};
const input = () => screen.getByRole('spinbutton') as HTMLInputElement;
const roll = (value: string) => fireEvent.change(input(), { target: { value } });
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Enviar Valor' }));

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.submitTestResult.mockResolvedValue(undefined);
  mocks.getCharacterTestContext.mockResolvedValue(sheet);
  mocks.listCharacterItemEffects.mockResolvedValue([]);
  mocks.getItemFaithPenalty.mockResolvedValue(0);
  mocks.getCharacterStats.mockResolvedValue({ pv: 10, faith: 50, current_faith: 50 });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('o desafio na tela', () => {
  it('nada aparece sem Teste, sem resultado ou fechado', () => {
    const { container, rerender } = render(
      <PlayerTestDialog isOpen activeTest={null} testResult={null} />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<PlayerTestDialog isOpen={false} activeTest={test()} testResult={result()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o tipo e a dificuldade do Teste comum', async () => {
    await show(test({ test_type: 'Furtividade', difficulty: 14 }));
    expect(screen.getByText('O Mestre Exige um Teste!')).toBeInTheDocument();
    expect(screen.getByText('Furtividade')).toBeInTheDocument();
    expect(screen.getByText('Dificuldade')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rolar D20/ })).toBeInTheDocument();
  });

  it('Teste de Fé: Misericórdia quando positivo, Punição quando negativo, d100', async () => {
    const { unmount } = await show(test({ test_type: 'Fé', difficulty: 10 }));
    expect(screen.getByText('Misericórdia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rolar D100/ })).toBeInTheDocument();
    expect(screen.queryByText('Seus bônus serão aplicados automaticamente.')).toBeNull();
    unmount();
    await show(test({ test_type: 'Fé', difficulty: -15 }));
    expect(screen.getByText('Punição')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });
});

describe('avisos', () => {
  it('Desvantagem: só em Teste de Destreza com item equipado que atrapalha a furtividade', async () => {
    mocks.listCharacterItemEffects.mockResolvedValue([
      { id: 'ci-armor', items: { effects: { properties: ['stealth_disadvantage'] } } },
    ]);
    await show(test({ test_type: 'Destreza' }));
    expect(screen.getByText('⚠️ Desvantagem')).toBeInTheDocument();
  });

  it('o item no inventário mas não equipado não dá Desvantagem', async () => {
    mocks.listCharacterItemEffects.mockResolvedValue([
      { id: 'outro', items: { effects: { properties: ['stealth_disadvantage'] } } },
    ]);
    await show(test({ test_type: 'Destreza' }));
    expect(screen.queryByText('⚠️ Desvantagem')).toBeNull();
  });

  it('o aviso de Desvantagem não aparece em outro tipo de Teste', async () => {
    mocks.listCharacterItemEffects.mockResolvedValue([
      { id: 'ci-armor', items: { effects: { properties: ['stealth_disadvantage'] } } },
    ]);
    await show(test({ test_type: 'Furtividade' }));
    expect(screen.queryByText('⚠️ Desvantagem')).toBeNull();
  });

  it('Profanação: aparece no Teste de Fé quando o Item Profano reduz a Fé', async () => {
    mocks.getItemFaithPenalty.mockResolvedValue(-10);
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    expect(screen.getByText('⚠️ Profanação')).toBeInTheDocument();
    expect(screen.getByText(/reduziu sua Fé em/)).toHaveTextContent('10');
  });

  it('Profanação não aparece fora do Teste de Fé nem sem penalidade', async () => {
    mocks.getItemFaithPenalty.mockResolvedValue(-10);
    const { unmount } = await show(test({ test_type: 'Destreza' }));
    expect(screen.queryByText('⚠️ Profanação')).toBeNull();
    unmount();
    mocks.getItemFaithPenalty.mockResolvedValue(0);
    await show(test({ test_type: 'Fé' }));
    expect(screen.queryByText('⚠️ Profanação')).toBeNull();
  });

  it('se a leitura da ficha falha, a tela segue sem bônus nem avisos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getCharacterTestContext.mockRejectedValue(new Error('falhou'));
    mocks.listCharacterItemEffects.mockRejectedValue(new Error('falhou'));
    mocks.getItemFaithPenalty.mockRejectedValue(new Error('falhou'));
    await show(test());
    roll('10');
    send();
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult.mock.calls[0][1]).toBe(10);
  });
});

describe('leituras que falham', () => {
  it('sem a penalidade de Fé, a ficha e os avisos ainda carregam', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getItemFaithPenalty.mockRejectedValue(new Error('falhou'));
    mocks.listCharacterItemEffects.mockResolvedValue([
      { id: 'ci-armor', items: { effects: { properties: ['stealth_disadvantage'] } } },
    ]);
    await show(test({ test_type: 'Destreza' }));
    expect(screen.getByText('⚠️ Desvantagem')).toBeInTheDocument();
    roll('10');
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('13');
  });

  it('sem Teste ativo ou sem resultado do jogador, não lê a ficha', async () => {
    const { rerender } = render(<PlayerTestDialog isOpen activeTest={test()} testResult={null} />);
    await act(async () => {});
    rerender(<PlayerTestDialog isOpen activeTest={null} testResult={result()} />);
    await act(async () => {});
    expect(mocks.getCharacterTestContext).not.toHaveBeenCalled();
  });
});

describe('enviar um Teste comum', () => {
  it('soma o modificador do atributo e a proficiência e manda o dado à parte', async () => {
    await show(test({ test_type: 'Furtividade', difficulty: 14 }));
    roll('9');
    // Dado 9 + Mod DES 3 + Prof 2 = 14
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('14');
    send();
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult).toHaveBeenCalledWith(
      'r1',
      14,
      14,
      'c1',
      'Furtividade',
      undefined,
      9,
    );
  });

  it('teste de atributo soma só o modificador', async () => {
    await show(test({ test_type: 'Destreza' }));
    roll('10');
    expect(screen.queryByText('Prof')).toBeNull();
    send();
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult).toHaveBeenCalledWith(
      'r1',
      13,
      12,
      'c1',
      'Destreza',
      undefined,
      10,
    );
  });

  it('Enter no campo também envia', async () => {
    await show(test({ test_type: 'Destreza' }));
    roll('10');
    fireEvent.keyDown(input(), { key: 'Enter' });
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
  });

  it('enviar fica desligado com o campo vazio', async () => {
    await show(test());
    expect(screen.getByRole('button', { name: 'Enviar Valor' })).toBeDisabled();
  });

  it('resultado final fora de 0 a 100 mostra o erro e não envia', async () => {
    await show(test({ test_type: 'Destreza' }));
    roll('99'); // 99 + 3 = 102
    send();
    expect(
      await screen.findByText('Valor fora do intervalo aceitável (0-100).'),
    ).toBeInTheDocument();
    expect(mocks.submitTestResult).not.toHaveBeenCalled();
  });

  it('erro do envio aparece na tela e libera o botão', async () => {
    mocks.submitTestResult.mockRejectedValue(new Error('RLS negou'));
    await show(test({ test_type: 'Destreza' }));
    roll('10');
    send();
    expect(await screen.findByText('RLS negou')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar Valor' })).toBeEnabled();
  });

  it('erro sem texto mostra a mensagem padrão', async () => {
    mocks.submitTestResult.mockRejectedValue({});
    await show(test({ test_type: 'Destreza' }));
    roll('10');
    send();
    expect(await screen.findByText('Erro ao enviar resultado.')).toBeInTheDocument();
  });

  it('enquanto envia, o botão mostra "Enviando..."', async () => {
    mocks.submitTestResult.mockReturnValue(new Promise(() => {}));
    await show(test({ test_type: 'Destreza' }));
    roll('10');
    send();
    expect(await screen.findByRole('button', { name: 'Enviando...' })).toBeDisabled();
  });
});

describe('Teste de Fé', () => {
  it('passa quando o dado cabe na Fé mais o Modificador de Fé: envia direto, sem bônus', async () => {
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('50'); // Fé 50
    send();
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult).toHaveBeenCalledWith('r1', 50, 0, 'c1', 'Fé', undefined, 50);
  });

  it('o Item Profano baixa a Fé Efetiva e a Misericórdia sobe o limite', async () => {
    mocks.getItemFaithPenalty.mockResolvedValue(-10);
    await show(test({ test_type: 'Fé', difficulty: 5 }));
    roll('45'); // Fé 50 - 10 + 5 = 45: passa
    send();
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult.mock.calls[0][6]).toBe(45);
  });

  it('reprovado: abre a tela da punição sem enviar nada', async () => {
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('51');
    send();
    expect(await screen.findByText('Teste de Fé Reprovado!')).toBeInTheDocument();
    expect(mocks.submitTestResult).not.toHaveBeenCalled();
  });

  it('na punição, o d6 digitado é enviado com o dado original', async () => {
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('80');
    send();
    await screen.findByText('Teste de Fé Reprovado!');
    fireEvent.change(input(), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Punição' }));
    await waitFor(() => expect(mocks.submitTestResult).toHaveBeenCalled());
    expect(mocks.submitTestResult).toHaveBeenCalledWith('r1', 80, 0, 'c1', 'Fé', 4, 80);
  });

  it.each([
    ['', 'Insira um valor válido para o d6 (1-6).'],
    ['0', 'O valor do d6 deve estar entre 1 e 6.'],
    ['7', 'O valor do d6 deve estar entre 1 e 6.'],
  ])('d6 "%s" é recusado com a mensagem certa', async (value, message) => {
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('80');
    send();
    await screen.findByText('Teste de Fé Reprovado!');
    fireEvent.change(input(), { target: { value } });
    if (value === '') {
      fireEvent.keyDown(input(), { key: 'Enter' });
    } else {
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar Punição' }));
    }
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mocks.submitTestResult).not.toHaveBeenCalled();
  });

  it('se a leitura da Fé falha, o dado é avaliado só com o Item Profano (Fé 0)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getCharacterStats.mockRejectedValue(new Error('falhou'));
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('1');
    send();
    expect(await screen.findByText('Teste de Fé Reprovado!')).toBeInTheDocument();
  });
});

describe('dado virtual', () => {
  const rollVirtual = async (name: RegExp) => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByRole('button', { name: /Rolando/ })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
  };

  it('d20 num Teste comum: 1 + floor(sorteio × 20), sem enviar sozinho', async () => {
    await show(test({ test_type: 'Destreza' }));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await rollVirtual(/Rolar D20/);
    expect(input().value).toBe('11');
    expect(screen.getByRole('button', { name: /Rolar D20/ })).toBeEnabled();
    expect(mocks.submitTestResult).not.toHaveBeenCalled();
  });

  it('d100 no Teste de Fé', async () => {
    await show(test({ test_type: 'Fé' }));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await rollVirtual(/Rolar D100/);
    expect(input().value).toBe('51');
  });

  it('o limite do sorteio dá 1 e o máximo dá 20', async () => {
    await show(test({ test_type: 'Destreza' }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await rollVirtual(/Rolar D20/);
    expect(input().value).toBe('1');
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    await rollVirtual(/Rolar D20/);
    expect(input().value).toBe('20');
  });

  it('o d6 de punição rola e envia sozinho depois de uma pausa', async () => {
    await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('90');
    send();
    await screen.findByText('Teste de Fé Reprovado!');
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 1 + floor(0.5 × 6) = 4
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    fireEvent.click(screen.getByRole('button', { name: /Rolar 1d6/ }));
    // A rolagem leva ao menos 1s e o envio espera mais 400ms depois do último número.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(mocks.submitTestResult).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mocks.submitTestResult).toHaveBeenCalledWith('r1', 90, 0, 'c1', 'Fé', 4, 90);
  });
});

describe('depois de enviado', () => {
  const submitted = (over: Partial<SessionTestResult> = {}) =>
    result({ status: 'submitted', result_value: 14, roll_value: 9, is_approved: true, ...over });

  it('mostra o resultado, a aprovação e o detalhamento do dado', async () => {
    await show(test({ test_type: 'Furtividade', difficulty: 14 }), submitted());
    expect(screen.getByText('Resultado Enviado!')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('Aprovado!')).toBeInTheDocument();
    expect(screen.getByText('1d20 (9) + Mod (3) + Prof (2) = 14')).toBeInTheDocument();
    expect(screen.getByText('Aguardando o mestre encerrar o teste...')).toBeInTheDocument();
  });

  it('reprovado em Teste comum não fala de perda de Fé', async () => {
    await show(test(), submitted({ is_approved: false }));
    expect(screen.getByText('Reprovado')).toBeInTheDocument();
    expect(screen.queryByText(/perdeu 1d6 pontos de Fé/)).toBeNull();
  });

  it('reprovado em Teste de Fé avisa da perda de 1d6', async () => {
    await show(
      test({ test_type: 'Fé' }),
      submitted({ is_approved: false, result_value: 80, roll_value: 80 }),
    );
    expect(screen.getByText(/O personagem perdeu 1d6 pontos de Fé/)).toBeInTheDocument();
    expect(screen.getByText('1d100 (80)')).toBeInTheDocument();
  });

  it('"Ocultar Janela" e o X fecham o aviso', async () => {
    const { container } = await show(test(), submitted());
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar Janela' }));
    expect(container).toBeEmptyDOMElement();
  });

  it('um Teste novo reabre o aviso fechado', async () => {
    const { container, rerender } = await show(test(), submitted());
    fireEvent.click(screen.getByTitle('Fechar aviso'));
    expect(container).toBeEmptyDOMElement();
    rerender(
      <PlayerTestDialog
        isOpen
        activeTest={test({ id: 't2' })}
        testResult={result({ id: 'r2', test_id: 't2' })}
      />,
    );
    expect(await screen.findByText('O Mestre Exige um Teste!')).toBeInTheDocument();
  });

  // GAP conhecido (ROADMAP, Onda 4, passo 7b): o formulário zera sempre que `activeTest` ou
  // `testResult` chegam como objetos novos, mesmo sendo o mesmo Teste (o realtime recarrega a
  // lista inteira a cada mudança). O valor digitado se perde.
  it('GAP: o mesmo Teste chegando como objeto novo apaga o valor digitado', async () => {
    const { rerender } = await show(test());
    roll('14');
    expect(input().value).toBe('14');
    rerender(<PlayerTestDialog isOpen activeTest={test()} testResult={result()} />);
    await act(async () => {});
    expect(input().value).toBe('');
  });

  it('basta o objeto do Teste ser novo (o do resultado é o mesmo) para zerar o formulário', async () => {
    const r = result();
    const { rerender } = await show(test(), r);
    roll('14');
    rerender(<PlayerTestDialog isOpen activeTest={test()} testResult={r} />);
    await act(async () => {});
    expect(input().value).toBe('');
  });

  it('basta o objeto do resultado ser novo (o do Teste é o mesmo) para zerar o formulário', async () => {
    const t = test();
    const { rerender } = await show(t, result());
    roll('14');
    rerender(<PlayerTestDialog isOpen activeTest={t} testResult={result()} />);
    await act(async () => {});
    expect(input().value).toBe('');
  });

  it('um Teste novo volta da tela da punição para o formulário do dado', async () => {
    const { rerender } = await show(test({ test_type: 'Fé', difficulty: 0 }));
    roll('51');
    send();
    await screen.findByText('Teste de Fé Reprovado!');
    rerender(
      <PlayerTestDialog
        isOpen
        activeTest={test({ test_type: 'Fé', difficulty: 0 })}
        testResult={result()}
      />,
    );
    await act(async () => {});
    expect(screen.queryByText('Teste de Fé Reprovado!')).toBeNull();
    expect(screen.getByRole('button', { name: 'Enviar Valor' })).toBeInTheDocument();
  });

  it('um Teste novo apaga o erro mostrado', async () => {
    const { rerender } = await show(test({ test_type: 'Destreza' }));
    roll('99');
    send();
    await screen.findByText('Valor fora do intervalo aceitável (0-100).');
    rerender(<PlayerTestDialog isOpen activeTest={test()} testResult={result()} />);
    await act(async () => {});
    expect(screen.queryByText('Valor fora do intervalo aceitável (0-100).')).toBeNull();
  });

  it('as mesmas props (mesmos objetos) não apagam o valor digitado', async () => {
    const t = test();
    const r = result();
    const { rerender } = await show(t, r);
    roll('14');
    rerender(<PlayerTestDialog isOpen activeTest={t} testResult={r} />);
    await act(async () => {});
    expect(input().value).toBe('14');
  });
});
