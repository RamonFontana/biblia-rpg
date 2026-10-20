// O aviso depois do envio do Teste: o resultado, "Aprovado!" ou "Reprovado" (cada um com texto
// próprio; a cor é só reforço) e, no Teste de Fé reprovado, a perda de Fé. Decisões: ROADMAP.md,
// Onda 4, passo 6c-4. Termos: CONTEXT.md (Teste, Fé).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { SubmittedResult } from './SubmittedResult';

afterEach(cleanup);

const test = (type: string) => ({ id: 't1', test_type: type, difficulty: 15 }) as SessionTest;
const result = (over: Record<string, unknown> = {}) =>
  ({
    id: 'r1',
    result_value: 17,
    roll_value: 14,
    is_approved: true,
    status: 'submitted',
    ...over,
  }) as unknown as SessionTestResult;

const show = (type: string, over: Record<string, unknown> = {}, onDismiss = vi.fn()) =>
  render(
    <SubmittedResult test={test(type)} result={result(over)} sheet={null} onDismiss={onDismiss} />,
  );

describe('SubmittedResult', () => {
  it('mostra o valor enviado', () => {
    show('Destreza');
    expect(screen.getByText('17')).toBeTruthy();
  });

  it('aprovado: "Aprovado!" e nada de "Reprovado"', () => {
    show('Destreza');
    expect(screen.getByText('Aprovado!')).toBeTruthy();
    expect(screen.queryByText('Reprovado')).toBeNull();
  });

  it('reprovado: "Reprovado" e nada de "Aprovado!"', () => {
    show('Destreza', { is_approved: false });
    expect(screen.getByText('Reprovado')).toBeTruthy();
    expect(screen.queryByText('Aprovado!')).toBeNull();
  });

  it('o selo de aprovado e o de reprovado não têm a mesma aparência', () => {
    show('Destreza');
    const approved = screen.getByText('Aprovado!').className;
    cleanup();
    show('Destreza', { is_approved: false });
    expect(screen.getByText('Reprovado').className).not.toBe(approved);
  });

  it('Teste de Fé reprovado avisa a perda de 1d6 de Fé', () => {
    show('Fé', { is_approved: false });
    expect(screen.getByText(/O personagem perdeu 1d6 pontos de Fé/)).toBeTruthy();
  });

  it('Teste de Fé aprovado e Teste reprovado de outro tipo não avisam perda de Fé', () => {
    show('Fé');
    expect(screen.queryByText(/perdeu 1d6 pontos de Fé/)).toBeNull();
    cleanup();
    show('Força', { is_approved: false });
    expect(screen.queryByText(/perdeu 1d6 pontos de Fé/)).toBeNull();
  });

  it('os dois botões de fechar chamam onDismiss', () => {
    const onDismiss = vi.fn();
    show('Destreza', {}, onDismiss);
    fireEvent.click(screen.getByTitle('Fechar aviso'));
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar Janela' }));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
