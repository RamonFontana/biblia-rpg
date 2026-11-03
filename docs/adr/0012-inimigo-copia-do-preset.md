# O inimigo é cópia do Preset, e o Template Endemoniado é um cálculo na criação

Os Presets do Bestiário são conteúdo no repositório (ADR 0003). Decidimos que **criar um inimigo copia o Preset para a ficha do inimigo, e o Mestre ajusta o que quiser**. A ficha guarda só a origem (`presetId` e a marca de endemoniado) no jsonb que já existe. O Template Endemoniado também roda uma vez, na criação: uma função pura em `src/domain` devolve os números já transformados (FOR e CON +4, PV pelo dado de vida, ataques, imunidade), que o formulário mostra e o Mestre pode editar.

## Considered Options

- **Referência viva ao Preset:** uma correção no conteúdo chegaria a todos os inimigos, mas o Mestre não poderia ajustar o PV, a CA ou um ataque de um inimigo só, e o Template teria de ser recalculado a cada leitura.
- **Cópia sem origem:** é o que existe hoje, mas perde o rótulo do Preset e a marca de endemoniado, que a Vulnerabilidade Espiritual vai precisar.

## Consequences

- Corrigir um Preset não corrige os inimigos já criados, e quem lê o código vai estranhar isso; os números valem do dia da criação.
- Não há migration: a origem e o estado da Fúria Desumana e do Ataque Furtivo vão no jsonb existente (`characters` e `combat_participants.ability_state`).
- Possuir um inimigo que já existe, no meio do jogo, fica fora; exigiria recalcular por cima das edições do Mestre.
