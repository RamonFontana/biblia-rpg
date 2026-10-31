import { describe, expect, it } from 'vitest';
import { MAX_MAP_UPLOAD_BYTES, fitWithin, validateMapFile } from './imageCompression';

// Caracteriza a regra que o retrato do personagem já usava (500x500, proporção mantida).
describe('fitWithin', () => {
  it('mantém a imagem que já cabe', () => {
    expect(fitWithin(300, 200, 500)).toEqual({ width: 300, height: 200 });
  });

  it('reduz a imagem larga pelo lado maior', () => {
    expect(fitWithin(1000, 500, 500)).toEqual({ width: 500, height: 250 });
  });

  it('reduz a imagem alta pelo lado maior', () => {
    expect(fitWithin(400, 1600, 500)).toEqual({ width: 125, height: 500 });
  });

  it('reduz a imagem quadrada', () => {
    expect(fitWithin(2000, 2000, 500)).toEqual({ width: 500, height: 500 });
  });

  it('aceita outro limite', () => {
    expect(fitWithin(4096, 2048, 2048)).toEqual({ width: 2048, height: 1024 });
  });
});

describe('validateMapFile', () => {
  const file = (type: string, size: number) => ({ type, size });

  it('aceita imagem de até 20 MB', () => {
    expect(validateMapFile(file('image/png', 1024))).toBeNull();
    expect(validateMapFile(file('image/webp', MAX_MAP_UPLOAD_BYTES))).toBeNull();
  });

  it('recusa arquivo acima de 20 MB, dizendo o motivo', () => {
    expect(validateMapFile(file('image/png', MAX_MAP_UPLOAD_BYTES + 1))).toMatch(/20 MB/);
  });

  it('recusa o que não é imagem, dizendo o motivo', () => {
    expect(validateMapFile(file('application/pdf', 1024))).toMatch(/imagem/);
    expect(validateMapFile(file('', 1024))).toMatch(/imagem/);
  });

  it('recusa arquivo vazio', () => {
    expect(validateMapFile(file('image/png', 0))).toMatch(/vazio/);
  });
});
