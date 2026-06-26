# Research: Nível de Item e Bônus em Tempo Real

## 1. Migração de Banco de Dados (Supabase)
**Decision**: Adicionar a coluna `level` nas tabelas `character_items` e `trade_items` via Supabase migration.
**Rationale**: Para suportar o FR-001 (nível do item no inventário) e FR-008 (preservação em transações), o banco de dados precisa persistir a nova informação. Ambas tabelas estão no esquema `public`.
**Alternatives considered**: Usar uma tabela auxiliar `item_levels` referenciando a instância do item, mas isso introduz complexidade excessiva no modelo atual, sendo que um simples campo numérico na tabela pivot já resolve o problema de modo eficiente.

## 2. Atualização de Realtime
**Decision**: Nenhuma alteração de infraestrutura é necessária, pois a tabela `character_items` e `characters` já fazem parte da `supabase_realtime` publication, conforme verificado (FR-006 / SC-003). As atualizações chegarão ao cliente via canal existente na hook de sessão.
**Rationale**: Reutilizar a arquitetura vigente garante que o código seja previsível e sem introduzir múltiplos fluxos paralelos.

## 3. Lógica do Cálculo de CA (equipmentUtils.ts)
**Decision**: Modificar o `getCombatStats` em `src/lib/equipmentUtils.ts`. Ao invés de somar apenas o CA da armadura (via `effects.ca`), deverá somar o `level - 1` da respectiva instância `character_item`. Como o escudo e a armadura podem ter níveis, a CA total soma os níveis individuais, em consonância com o FR-003 (onde o bônus de nível é acumulativo).
**Rationale**: Mantém o cálculo de stats concentrado em um único arquivo de domínio.
**Alternatives considered**: Calcular diretamente no componente UI, o que quebraria separação de responsabilidade e causaria dados inconsistentes para o Mestre/outros jogadores caso o estado de "CA calculada" precisasse trafegar.

## 4. UI e Permissões (EquipmentSlots.tsx / Inventário)
**Decision**: Somente o mestre terá UI ou permissão no Row Level Security (RLS) / backend para editar o valor `level` (FR-007). O componente UI exibirá visualmente o nível (ex: "Cota de Malha Nv. 3") para jogadores.
**Rationale**: Segurança. Previne que jogadores alterem o nível forjando requisições.
