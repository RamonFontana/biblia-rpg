import { describe, expect, it } from 'vitest';
import { fitWithin } from './imageCompression';

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
