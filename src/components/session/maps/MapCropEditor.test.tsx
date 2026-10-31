// O editor de recorte de um mapa enviado: a imagem fica por baixo do grid, o Mestre arrasta e amplia
// e escolhe colunas × linhas inteiras. Termos: CONTEXT.md (Mapa, Quadrado).
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lib = vi.hoisted(() => ({
  loadImageFile: vi.fn(),
  cropToDataUrl: vi.fn(),
}));
vi.mock('@/lib/imageCompression', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/imageCompression')>('@/lib/imageCompression');
  return { ...actual, loadImageFile: lib.loadImageFile, cropToDataUrl: lib.cropToDataUrl };
});

import { MapCropEditor } from './MapCropEditor';

// A imagem tem 1200×900 (a proporção 4:3 do 20×15).
const IMAGE = { naturalWidth: 1200, naturalHeight: 900 } as HTMLImageElement;
const file = new File(['x'], 'jerico.png', { type: 'image/png' });

beforeEach(() => {
  lib.loadImageFile.mockReset().mockResolvedValue({
    image: IMAGE,
    url: 'blob:jerico',
    revoke: vi.fn(),
  });
  lib.cropToDataUrl.mockReset().mockReturnValue('data:image/webp;base64,RECORTE');
  // jsdom não mede nada: a janela do recorte mede o quadro (o `div` com largura e altura), e o resto 400×300.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const frame = this.closest<HTMLElement>('div[style*="width"]');
    const width = frame ? parseFloat(frame.style.width) : 400;
    const height = frame ? parseFloat(frame.style.height) : 300;
    return {
      width,
      height,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      toJSON: () => ({}),
    };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function openEditor() {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(<MapCropEditor file={file} onSave={onSave} onCancel={onCancel} />);
  await screen.findByRole('group', { name: 'Imagem do mapa' });
  return { onSave, onCancel };
}
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar mapa' }));

describe('MapCropEditor', () => {
  it('abre com o nome do arquivo (sem a extensão) e 20×15 Quadrados', async () => {
    await openEditor();
    expect(screen.getByLabelText('Nome do mapa')).toHaveValue('jerico');
    expect(screen.getByLabelText('Colunas')).toHaveValue(20);
    expect(screen.getByLabelText('Linhas')).toHaveValue(15);
  });

  it('desenha o grid por cima da imagem, com uma linha por divisão de Quadrado', async () => {
    await openEditor();
    const grid = screen.getByTestId('grid-do-recorte');
    expect(grid.getAttribute('data-vertical')).toBe('19');
    expect(grid.getAttribute('data-horizontal')).toBe('14');
  });

  it('o grid acompanha as colunas e linhas escolhidas', async () => {
    await openEditor();
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '8' } });
    const grid = screen.getByTestId('grid-do-recorte');
    expect(grid.getAttribute('data-vertical')).toBe('29');
    expect(grid.getAttribute('data-horizontal')).toBe('7');
  });

  it('salva o recorte da imagem com colunas e linhas inteiras e o nome escolhido', async () => {
    const { onSave } = await openEditor();
    fireEvent.change(screen.getByLabelText('Nome do mapa'), {
      target: { value: 'Cerco de Jericó' },
    });
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Cerco de Jericó',
      columns: 20,
      rows: 15,
      image: 'data:image/webp;base64,RECORTE',
    });
  });

  it('recorta o retângulo que o Palco mostra e reduz para no máximo 2048 px', async () => {
    await openEditor();
    save();
    await waitFor(() => expect(lib.cropToDataUrl).toHaveBeenCalled());
    const [image, rect, size, quality] = lib.cropToDataUrl.mock.calls[0]!;
    expect(image).toBe(IMAGE);
    // A proporção bate (4:3): o recorte é a imagem toda.
    expect(rect).toMatchObject({ x: expect.closeTo(0, 3), y: expect.closeTo(0, 3) });
    expect(rect.width).toBeCloseTo(1200, 3);
    expect(rect.height).toBeCloseTo(900, 3);
    expect(size).toEqual({ width: 1200, height: 900 });
    expect(quality).toBeGreaterThan(0);
  });

  it('com outra proporção, corta o que sobra, centrado', async () => {
    await openEditor();
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '20' } });
    save();
    await waitFor(() => expect(lib.cropToDataUrl).toHaveBeenCalled());
    const [, rect, size] = lib.cropToDataUrl.mock.calls[0]!;
    expect(rect.width / rect.height).toBeCloseTo(10 / 20, 3);
    expect(size.width / size.height).toBeCloseTo(10 / 20, 2);
    expect(rect.height).toBeCloseTo(900, 3);
    expect(rect.x).toBeCloseTo((1200 - 450) / 2, 2);
  });

  it('prende colunas e linhas entre 5 e 60 e as arredonda para inteiros', async () => {
    const { onSave } = await openEditor();
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '12.7' } });
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0]).toMatchObject({ columns: 60, rows: 13 });
  });

  it('nome vazio vira o nome do arquivo', async () => {
    const { onSave } = await openEditor();
    fireEvent.change(screen.getByLabelText('Nome do mapa'), { target: { value: '   ' } });
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0]![0].name).toBe('jerico');
  });

  it('Cancelar fecha sem salvar', async () => {
    const { onSave, onCancel } = await openEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('se a imagem não abre, avisa e não deixa salvar', async () => {
    lib.loadImageFile.mockRejectedValue(new Error('inválida'));
    render(<MapCropEditor file={file} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir a imagem');
    expect(screen.queryByRole('button', { name: 'Salvar mapa' })).not.toBeInTheDocument();
  });

  it('se o recorte falha, avisa e deixa tentar de novo', async () => {
    lib.cropToDataUrl.mockImplementationOnce(() => {
      throw new Error('sem canvas');
    });
    const { onSave } = await openEditor();
    save();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível recortar');
    save();
    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });
});
