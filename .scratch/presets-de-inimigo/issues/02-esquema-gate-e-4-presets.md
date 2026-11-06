# 02: Esquema do Preset, gate de dados e os 4 Presets atuais com os números dos docs

Status: ready-for-agent
Blocked by: 01
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

O Mestre escolhe um Preset do Bestiário no formulário de inimigo (assistente e "Criar inimigo") e o inimigo nasce pronto, com os números de `docs/bestiario/`. O Preset passa a ser conteúdo tipado: esquema zod do Preset e do ataque estruturado (modalidade, atributo, bônus, alcance, dano, tipo de dano, texto extra), `id` estável, validado pelo gate de dados. Entram Bandido do Deserto, Soldado Filisteu, General de Guerra e Leão da Judeia, já com os números do doc (CA, atributos, passivas em texto, Habilidade da biblioteca no Leão). O arquivo de presets do componente é apagado. O inimigo criado grava `presetId`, ataques, imunidades, bônus de TR e detalhes no jsonb existente (sem migration); `vocation` passa a guardar tipo e tamanho; fichas antigas continuam válidas. Rótulo "Preset do Bestiário". Inclui o teste docs ↔ conteúdo, no padrão de `abilitiesDocs.test.ts`.

## Acceptance criteria

- [ ] Esquema do Preset e do ataque validado pelo gate; `npm run test:data` passa.
- [ ] Os 4 Presets batem com o doc em PV, CA, atributos, bônus de acerto e dano; o teste docs ↔ conteúdo falha ao mutar um número (verificado).
- [ ] Escolher o Preset preenche o formulário; criar grava a cópia e a origem; nada lê o Preset depois da criação.
- [ ] `bestiaryPresets.ts` removido; nenhum import sobra.
- [ ] Ficha de inimigo antiga (sem os campos novos) abre e funciona.
- [ ] Sem migration; `npx supabase db diff --linked` vazio.
- [ ] Testes do formulário atualizados; `npm run check` passa.
