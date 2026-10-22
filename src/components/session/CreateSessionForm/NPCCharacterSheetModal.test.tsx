// CARACTERIZAÇÃO: a ficha de NPC jogável da preparação da sessão: os valores padrão, a validação
// (nome, tribo, classe e a regra de Levi) e o que vai para onSave. Decisões: ROADMAP.md, Onda 4,
// passo 7e. Termos: CONTEXT.md (Tribo, Vocação, Regra de Levi).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NPCCharacterSheetModal } from './NPCCharacterSheetModal';

afterEach(cleanup);

const onSave = vi.fn();
const onClose = vi.fn();

const renderModal = (props: { initialName?: string; initialDescription?: string } = {}) =>
  render(<NPCCharacterSheetModal isOpen onClose={onClose} onSave={onSave} {...props} />);

const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar Personagem' }));
const fill = (name: string, tribo: string, classe: string) => {
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: name } });
  const [triboSelect, classeSelect] = screen.getAllByRole('combobox');
  fireEvent.change(triboSelect, { target: { value: tribo } });
  fireEvent.change(classeSelect, { target: { value: classe } });
};

afterEach(() => vi.clearAllMocks());

describe('NPCCharacterSheetModal', () => {
  it('abre com o nome e a descrição iniciais e os valores padrão', () => {
    renderModal({ initialName: 'Zacarias', initialDescription: 'Mercador' });
    const [name, description] = screen.getAllByRole('textbox');
    expect(name).toHaveValue('Zacarias');
    expect(description).toHaveValue('Mercador');
    const numbers = screen.getAllByRole('spinbutton').map((el) => (el as HTMLInputElement).value);
    expect(numbers).toEqual(['1', '10', '10', '10', '10', '10', '10', '10']);
  });

  it('salva a ficha com números, fecha e zera o formulário', async () => {
    renderModal();
    fill('Zacarias', 'Judá', 'Guerreiro');
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '5' } });
    save();

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Zacarias',
      description: '',
      level: 5,
      tribo: 'Judá',
      classe: 'Guerreiro',
      for: 10,
      des: 10,
      con: 10,
      int: 10,
      sab: 10,
      car: 10,
      ca: 10,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('');
  });

  it('exige nome de 2 letras, tribo e classe', async () => {
    renderModal();
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Z' } });
    save();
    expect(await screen.findByText('Nome deve ter no mínimo 2 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Tribo é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Classe é obrigatória')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('o atributo fora de 1 a 20 não deixa salvar', async () => {
    renderModal();
    fill('Zacarias', 'Judá', 'Guerreiro');
    fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '25' } });
    save();
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a regra de Levi: levita só pode ser Sacerdote ou Sábio', async () => {
    renderModal();
    fill('Zacarias', 'Levi', 'Guerreiro');
    save();
    expect(
      await screen.findByText('Levitas devem obrigatoriamente ser Sacerdote ou Sábio'),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each(['Sacerdote', 'Sábio'])('o levita %s passa', async (classe) => {
    renderModal();
    fill('Zacarias', 'Levi', classe);
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ classe })));
  });

  it('Cancelar fecha sem salvar', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
