# 07: Template Endemoniado

Status: ready-for-agent
Blocked by: 03, 05, 06
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

O Mestre liga "Endemoniado" ao lado do Preset, ou num inimigo do zero, e o formulário mostra os números transformados, que ele pode editar. Função pura do motor: FOR e CON +4, INT 6 se maior, tendência Caótico e Mau, Intimidação = mod CAR + 2 se ausente, ataques de FOR +2 no acerto e no dano (Acuidade passa a FOR se ficar maior; DES não muda), imune a Amedrontado, Fúria Desumana e Vulnerabilidade Espiritual (texto), Grito Atormentador (CD 12) e Ataque Bestial (+(mod FOR + 2), 1d6 + mod FOR, perfurante). PV pelo dado de vida com a nova CON (Bandido 15, Leão 34); sem dado de vida o PV não muda. O nome concorda em gênero, com o sufixo antes do número. Não vale para o Endemoniado Comum. A origem grava a marca de endemoniado. Só na criação.

## Acceptance criteria

- [ ] Testes por Preset: Bandido (15 PV, FOR 15, CON 16, INT 6), Leão (34 PV), Víbora (nome "Víbora do Deserto Endemoniada"), General, Anakim.
- [ ] Endemoniado Comum recusa o Template (interruptor desligado).
- [ ] Inimigo do zero com o Template mantém o PV.
- [ ] O Endemoniado criado recusa Amedrontado no combate.
- [ ] E2E: criar "Leão da Judeia Endemoniado" e conferir 34 PV, nome e imunidade; passa por mutação.
- [ ] `npm run check` e `npm run test:e2e` passam.
