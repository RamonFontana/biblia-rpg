// CARACTERIZAÇÃO: fixa a lista das 17 Perícias da ficha: o modificador do atributo, mais o bônus de
// proficiência nas Perícias que o personagem domina. Decisões: ROADMAP.md, Onda 4, passo 7c.
// Termos: CONTEXT.md (Perícia, Proficiência).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CharacterSkillsList } from './CharacterSkillsList';

const attributes = { for: 16, des: 12, con: 14, int: 8, sab: 10, car: 6 };

afterEach(cleanup);

/** A linha de uma Perícia: o nome (com o atributo), a bolinha de proficiência e o total. */
const row = (name: string) =>
  screen.getByText(name, { exact: false }).closest('div.justify-between');

describe('CharacterSkillsList', () => {
  it('lista as 17 Perícias com o atributo de cada uma', () => {
    render(<CharacterSkillsList attributes={attributes} level={1} proficiencies={[]} />);
    expect(screen.getAllByTitle('Não Proficiente')).toHaveLength(17);
    expect(row('Acrobacia')).toHaveTextContent('Acrobacia(des)');
    expect(row('Atletismo')).toHaveTextContent('Atletismo(for)');
    expect(row('Percepção')).toHaveTextContent('Percepção(sab)');
  });

  it('mostra só o modificador do atributo nas Perícias sem proficiência', () => {
    render(<CharacterSkillsList attributes={attributes} level={1} proficiencies={[]} />);
    expect(row('Atletismo')).toHaveTextContent('+3');
    expect(row('História')).toHaveTextContent('-1');
    expect(row('Percepção')).toHaveTextContent('+0');
    expect(row('Persuasão')).toHaveTextContent('-2');
  });

  it('soma o bônus de proficiência e marca a Perícia como proficiente', () => {
    render(<CharacterSkillsList attributes={attributes} level={1} proficiencies={['atletismo']} />);
    expect(row('Atletismo')).toHaveTextContent('+5');
    expect(screen.getAllByTitle('Proficiente')).toHaveLength(1);
    expect(screen.getAllByTitle('Não Proficiente')).toHaveLength(16);
    expect(row('Acrobacia')).toHaveTextContent('+1');
  });

  it('o bônus de proficiência sobe com o nível', () => {
    render(<CharacterSkillsList attributes={attributes} level={9} proficiencies={['atletismo']} />);
    expect(row('Atletismo')).toHaveTextContent('+7');
  });

  it('ignora uma proficiência que não é Perícia', () => {
    render(<CharacterSkillsList attributes={attributes} level={1} proficiencies={['arcanismo']} />);
    expect(screen.queryByTitle('Proficiente')).toBeNull();
  });

  it('atributos ausentes valem modificador 0', () => {
    render(<CharacterSkillsList attributes={undefined} level={1} proficiencies={['atletismo']} />);
    expect(row('Atletismo')).toHaveTextContent('+2');
    expect(row('Acrobacia')).toHaveTextContent('+0');
  });
});
