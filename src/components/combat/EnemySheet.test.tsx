// CARACTERIZAÇÃO: a ficha do inimigo aberta pelo Mestre: PV, CA, atributos e Habilidades.
// Decisões: ROADMAP.md, Onda 4, passo 7f. Termos: CONTEXT.md (Inimigo, Habilidade).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Character } from '@/features/character-management/types';
import { EnemySheet } from './EnemySheet';

afterEach(cleanup);

const enemy = (over: Partial<Character> = {}): Character => ({
  id: 'e1',
  user_id: 'u1',
  name: 'Filisteu',
  tribe: 'Inimigo',
  vocation: 'Guerreiro',
  is_enemy: true,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 20, current_pv: 14, ca: 13, faith: 0 },
  attributes: { for: 16, des: 12, con: 14, int: 8, sab: 10, car: 6 },
  ...over,
});

const open = (e: Character | null, participant?: { hp_current: number }) =>
  render(<EnemySheet enemy={e} participant={participant} isOpen onOpenChange={() => {}} />);

describe('EnemySheet', () => {
  it('sem inimigo não desenha nada', () => {
    open(null);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mostra o nome, a tribo e a vocação, o PV e a CA', () => {
    open(enemy());
    expect(screen.getByText('Filisteu')).toBeInTheDocument();
    expect(screen.getByText('Inimigo • Guerreiro')).toBeInTheDocument();
    expect(screen.getByText('Pontos de Vida').nextElementSibling).toHaveTextContent('14 / 20');
    expect(screen.getByText('C. Armadura').nextElementSibling).toHaveTextContent('13');
  });

  it('o PV do participante vale mais que o da ficha, e o PV 0 marca como derrotado', () => {
    open(enemy(), { hp_current: 0 });
    expect(screen.getByText('(Derrotado)')).toBeInTheDocument();
    expect(screen.getByText('Pontos de Vida').nextElementSibling).toHaveTextContent('0 / 20');
  });

  it('com PV acima de 0 não marca como derrotado', () => {
    open(enemy());
    expect(screen.queryByText('(Derrotado)')).toBeNull();
  });

  // Decisão do autor (ROADMAP, passo 9c, Q13): a tela lê as chaves que o inimigo guarda
  // (for/des/con/int/sab/car); antes lia forca/destreza/… e mostrava tudo como 10 (+0).
  it('mostra os atributos do inimigo com o modificador de cada um', () => {
    open(enemy());
    const group = screen.getByText('Atributos').nextElementSibling as HTMLElement;
    expect(group.textContent).toBe('FOR16+3DES12+1CON14+2INT8-1SAB10+0CAR6-2');
  });

  it('um atributo que falta na ficha sai como 10 (+0), e os outros seguem', () => {
    open(enemy({ attributes: { for: 18 } as Character['attributes'] }));
    const group = screen.getByText('Atributos').nextElementSibling as HTMLElement;
    expect(group.textContent).toBe('FOR18+4DES10+0CON10+0INT10+0SAB10+0CAR10+0');
  });

  it('lista as Habilidades com a descrição quando há nome e descrição', () => {
    open(
      enemy({
        skills: [
          { name: 'Golpe Brutal', description: 'Dano dobrado' },
          { name: '', description: 'Só descrição' },
          { name: 'Só Nome', description: '' },
        ],
      }),
    );
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(screen.getByText('Golpe Brutal')).toBeInTheDocument();
    expect(screen.getByText('Dano dobrado')).toBeInTheDocument();
    expect(screen.getByText('Só descrição')).toBeInTheDocument();
    expect(screen.getByText('Só Nome')).toBeInTheDocument();
    // A descrição só aparece à parte quando o nome também existe.
    expect(screen.getAllByText('Só descrição')).toHaveLength(1);
  });

  it('sem Habilidades, a seção não aparece (nem para a forma de ficha de jogador)', () => {
    open(enemy({ skills: [] }));
    expect(screen.queryByText('Habilidades')).toBeNull();
    cleanup();
    open(enemy({ skills: { ability_uses: {} } }));
    expect(screen.queryByText('Habilidades')).toBeNull();
  });
});
