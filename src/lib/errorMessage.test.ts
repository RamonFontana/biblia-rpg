import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('usa a mensagem de um Error', () => {
    expect(getErrorMessage(new Error('senha inválida'), 'falhou')).toBe('senha inválida');
  });

  it('usa a mensagem de um objeto de erro do Supabase (que não é um Error)', () => {
    expect(getErrorMessage({ message: 'permissão negada', code: '42501' }, 'falhou')).toBe(
      'permissão negada',
    );
  });

  it('cai no texto padrão quando a mensagem é vazia', () => {
    expect(getErrorMessage(new Error(''), 'falhou')).toBe('falhou');
    expect(getErrorMessage({ message: '' }, 'falhou')).toBe('falhou');
  });

  it('cai no texto padrão quando o erro não tem mensagem em texto', () => {
    expect(getErrorMessage(undefined, 'falhou')).toBe('falhou');
    expect(getErrorMessage(null, 'falhou')).toBe('falhou');
    expect(getErrorMessage('texto solto', 'falhou')).toBe('falhou');
    expect(getErrorMessage({ message: 42 }, 'falhou')).toBe('falhou');
  });
});
