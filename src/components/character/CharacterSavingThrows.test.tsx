// CARACTERIZAÇÃO: fixa os seis Testes de Resistência da ficha: o modificador do atributo, mais o
// bônus de proficiência nos atributos da Vocação. Decisões: ROADMAP.md, Onda 4, passo 7c.
// Termos: CONTEXT.md (TR, Vocação).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CharacterSavingThrows } from './CharacterSavingThrows';

const attributes = { for: 16, des: 12, con: 14, int: 8, sab: 10, car: 6 };

afterEach(cleanup);

/** O cartão de um atributo: o rótulo, o valor e a legenda ficam no mesmo bloco. */
const card = (name: string) => screen.getByText(name).closest('div[class*="rounded-lg"]');

describe('CharacterSavingThrows', () => {
  it('lista os seis atributos na ordem da ficha', () => {
    render(<CharacterSavingThrows attributes={attributes} level={1} vocation="Guerreiro" />);
    const names = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'];
    const rendered = screen
      .getAllByText(new RegExp(`^(${names.join('|')})$`))
      .map((el) => el.textContent);
    expect(rendered).toEqual(names);
  });

  it('soma o bônus de proficiência nos atributos da Vocação (Guerreiro: FOR e CON)', () => {
    render(<CharacterSavingThrows attributes={attributes} level={1} vocation="Guerreiro" />);
    expect(card('Força')).toHaveTextContent('+5Mod + Prof');
    expect(card('Constituição')).toHaveTextContent('+4Mod + Prof');
    expect(card('Destreza')).toHaveTextContent('+1Apenas Mod');
    expect(card('Inteligência')).toHaveTextContent('-1Apenas Mod');
    expect(card('Sabedoria')).toHaveTextContent('+0Apenas Mod');
    expect(card('Carisma')).toHaveTextContent('-2Apenas Mod');
  });

  it('o bônus de proficiência sobe com o nível', () => {
    render(<CharacterSavingThrows attributes={attributes} level={5} vocation="Guerreiro" />);
    expect(card('Força')).toHaveTextContent('+6Mod + Prof');
    expect(card('Destreza')).toHaveTextContent('+1Apenas Mod');
  });

  it('usa as proficiências de cada Vocação', () => {
    render(<CharacterSavingThrows attributes={attributes} level={1} vocation="Batedor" />);
    expect(card('Destreza')).toHaveTextContent('Mod + Prof');
    expect(card('Força')).toHaveTextContent('Apenas Mod');
  });

  it('sem Vocação conhecida nenhum atributo é proficiente', () => {
    render(<CharacterSavingThrows attributes={attributes} level={1} vocation="Nobre" />);
    expect(screen.queryByText('Mod + Prof')).toBeNull();
    expect(screen.getAllByText('Apenas Mod')).toHaveLength(6);
  });

  it('atributos ausentes valem modificador 0', () => {
    render(<CharacterSavingThrows attributes={undefined} level={1} vocation="Guerreiro" />);
    expect(card('Força')).toHaveTextContent('+2Mod + Prof');
    expect(card('Destreza')).toHaveTextContent('+0Apenas Mod');
  });

  it('um atributo que falta na ficha vale modificador 0', () => {
    render(<CharacterSavingThrows attributes={{ for: 16 }} level={1} vocation="Guerreiro" />);
    expect(card('Força')).toHaveTextContent('+5Mod + Prof');
    expect(card('Constituição')).toHaveTextContent('+2Mod + Prof');
  });
});
