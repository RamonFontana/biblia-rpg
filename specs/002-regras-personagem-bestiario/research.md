# Phase 0: Research & Decisions

**Feature**: Regras de Personagem e Bestiário
**Date**: 2026-06-14

## Resolving Unknowns

*Não foram identificadas ambiguidades graves no contexto técnico, porém definimos os seguintes padrões.*

### Quantidade de Fortalezas e Tentações
- **Decision**: Cada personagem DEVE ter exatamente **1 Fortaleza** e **1 Tentação** no nível 1, mas o sistema pode prever ganho de 1 adicional por marco narrativo maior (opcional pelo mestre).
- **Rationale**: Manter o número baixo facilita o roleplay e o acompanhamento pelo mestre. O foco é na qualidade do defeito/virtude, não na quantidade. A restrição de nível 1 já constava em `regras-base.md`, mas o novo documento vai oficializar as listas.
- **Alternatives considered**: Permitir até 3 de cada, mas isso tornaria o ganho/perda de Fé muito volátil e difícil de balancear.

### Formato do Bestiário (Stat Block)
- **Decision**: Usar o padrão de tabelas e listas markdown similar ao D&D 5e condensado. Atributos resumidos com seus modificadores, HP, CA, Movimento, e lista de Ações/Passivas.
- **Rationale**: Familiaridade para mestres experientes em D&D e fácil leitura em Markdown.
- **Alternatives considered**: Desenvolver um gerador em HTML/CSS (complexidade desnecessária), ou blocos de texto corrido (difícil de ler em combate).

### Template de Endemoniado
- **Decision**: Funciona como um modificador mecânico que pode ser adicionado a qualquer criatura humana ou besta do bestiário.
- **Rationale**: Garante escalabilidade. Um "soldado" pode virar um "soldado endemoniado" aplicando o template (ex: imunidade a medo, +FOR, fraqueza contra oração).
- **Alternatives considered**: Criar perfis fechados e separados só para "homem endemoniado", limitando a flexibilidade do mestre.
