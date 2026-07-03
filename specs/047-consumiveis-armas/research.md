# Research: Mecânica de Munição e Consumíveis

**Branch**: `047-consumiveis-armas` | **Date**: 2026-07-03

## Phase 0: Clarifications & Research

### Needs Clarification (Resolved in Spec)
- Todas as perguntas e ambiguidades sobre a mecânica de recuperação e diferença entre os tipos de munição (Flechas vs Pedras) foram respondidas na fase de especificação (veja a seção *Clarifications* em `spec.md`).

### Schema Analysis
- A tabela `character_items` já possui um campo `quantity: number | null` que pode ser usado para rastrear as "cargas" da munição.
- O campo `weapon_effects: Json | null` em `character_items` (ou `effects` em `items`) pode ser usado para armazenar metadados do tipo: `{"max_charges": 20, "recoverable": true}`.

### Tech Stack / Patterns
- Utilizaremos componentes React baseados em Tailwind/UI Components existentes para criar botões pequenos na lista de inventário (`InventoryList.tsx` ou similar).
- A chamada ao backend será via funções que atualizam a quantidade do `character_items` correspondente, provavelmente usando a API existente ou ajustando a função `use_consumable_item` no banco de dados.

**Decision**:
- Reutilizar `quantity` de `character_items` para representar o total de munições que o jogador possui agrupadas naquele slot.
- Usar `weapon_effects` para determinar qual é a "capacidade máxima" se a mecânica de recuperação exigir um teto.

**Rationale**:
- Evita migrations complexas no banco de dados. A estrutura atual já suporta a maioria das necessidades através do campo genérico `quantity`.
