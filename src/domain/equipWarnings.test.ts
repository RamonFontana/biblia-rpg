// Avisos ao equipar armadura ou escudo: sem proficiência ou sem a FOR exigida. Equipar continua
// permitido; o aviso só informa (CONTEXT.md, Proficiência de armadura). Decisões: ROADMAP.md,
// Onda 3 (passo 5).
import { describe, expect, it } from 'vitest';
import { getEquipWarnings } from './equipWarnings';

const kinds = (input: Parameters<typeof getEquipWarnings>[0]) =>
  getEquipWarnings(input).map((w) => w.kind);

describe('getEquipWarnings: proficiência de armadura e escudo', () => {
  it('quem tem a proficiência não recebe aviso', () => {
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro', strength: 14 })).toEqual([]);
    expect(getEquipWarnings({ slug: 'cota_escamas', vocation: 'Caçador' })).toEqual([]);
    expect(getEquipWarnings({ slug: 'escudo', vocation: 'Sacerdote' })).toEqual([]);
  });

  it('armadura de peso fora da proficiência avisa', () => {
    expect(kinds({ slug: 'cota_escamas', vocation: 'Batedor' })).toEqual(['proficiency']);
    expect(kinds({ slug: 'cota_malha', vocation: 'Caçador' })).toEqual(['proficiency']);
    expect(kinds({ slug: 'couro_cru', vocation: 'Batedor' })).toEqual([]);
  });

  it('escudo avisa para quem não tem a proficiência', () => {
    expect(kinds({ slug: 'escudo', vocation: 'Batedor' })).toEqual(['proficiency']);
  });

  it('o elmo segue a categoria dele (leve ou pesada)', () => {
    expect(kinds({ slug: 'chapeu_couro', vocation: 'Batedor' })).toEqual([]);
    expect(kinds({ slug: 'elmo_bronze', vocation: 'Batedor' })).toEqual(['proficiency']);
    expect(kinds({ slug: 'elmo_bronze', vocation: 'Guerreiro' })).toEqual([]);
  });

  it('a Túnica Sagrada é só de Sacerdote e Sábio', () => {
    expect(kinds({ slug: 'tunica_sagrada', vocation: 'Guerreiro' })).toEqual(['proficiency']);
    expect(kinds({ slug: 'tunica_sagrada', vocation: 'Sacerdote' })).toEqual([]);
    expect(kinds({ slug: 'tunica_sagrada', vocation: 'Sábio' })).toEqual([]);
  });

  it('Sábio vale como Sacerdote, em qualquer grafia', () => {
    expect(kinds({ slug: 'escudo', vocation: 'sabio' })).toEqual([]);
    expect(kinds({ slug: 'cota_escamas', vocation: 'SÁBIO' })).toEqual([]);
    // e continua sem a armadura pesada, como o Sacerdote
    expect(kinds({ slug: 'cota_malha', vocation: 'sabio' })).toEqual(['proficiency']);
    expect(kinds({ slug: 'cota_malha', vocation: ' SÁBIO ' })).toEqual(['proficiency']);
  });

  it('Vocação ausente ou desconhecida não avisa (não dá para julgar)', () => {
    expect(getEquipWarnings({ slug: 'lorica', vocation: undefined })).toEqual([]);
    expect(getEquipWarnings({ slug: 'lorica', vocation: '' })).toEqual([]);
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Inimigo' })).toEqual([]);
  });

  it('o aviso diz o que falta', () => {
    const [warning] = getEquipWarnings({ slug: 'cota_escamas', vocation: 'Batedor' });
    expect(warning.message).toBe('Sem proficiência em armadura média');
    const [escudo] = getEquipWarnings({ slug: 'escudo', vocation: 'Batedor' });
    expect(escudo.message).toBe('Sem proficiência em escudo');
    const [tunica] = getEquipWarnings({ slug: 'tunica_sagrada', vocation: 'Guerreiro' });
    expect(tunica.message).toBe('Armadura exclusiva de Sacerdote e Sábio');
  });
});

describe('getEquipWarnings: FOR exigida', () => {
  it('a Lorica pede FOR 13 e avisa abaixo disso', () => {
    const warnings = getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro', strength: 12 });
    expect(warnings).toEqual([
      { kind: 'strength', required: 13, message: 'Requer FOR 13 (você tem 12)' },
    ]);
  });

  it('FOR igual ou maior que a exigida não avisa', () => {
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro', strength: 13 })).toEqual([]);
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro', strength: 18 })).toEqual([]);
  });

  it('FOR desconhecida não avisa', () => {
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro' })).toEqual([]);
    expect(getEquipWarnings({ slug: 'lorica', vocation: 'Guerreiro', strength: null })).toEqual([]);
  });

  it('avisa da proficiência e da FOR juntas', () => {
    expect(kinds({ slug: 'lorica', vocation: 'Batedor', strength: 8 })).toEqual([
      'proficiency',
      'strength',
    ]);
  });

  it('armadura sem exigência de FOR nunca avisa de FOR', () => {
    expect(kinds({ slug: 'couro_cru', vocation: 'Guerreiro', strength: 1 })).toEqual([]);
  });
});

describe('getEquipWarnings: o que não é armadura nem escudo', () => {
  it('arma, consumível, utilidade e slug desconhecido nunca avisam aqui', () => {
    for (const slug of ['espada_curta', 'arco_longo', 'tocha', 'corda', 'nao_existe']) {
      expect(getEquipWarnings({ slug, vocation: 'Sacerdote', strength: 1 })).toEqual([]);
    }
    expect(getEquipWarnings({ slug: null, vocation: 'Sacerdote' })).toEqual([]);
  });
});
