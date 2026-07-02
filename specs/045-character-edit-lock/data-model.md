# Data Model

## Entidades e Mudanças
Não há alteração de esquema necessária na base de dados, pois a tabela `characters` já suporta o estado que precisamos consultar para bloquear a edição.

### `characters` (Tabela Supabase)
*   **id**: UUID
*   **has_participated_in_session**: Boolean (True: bloqueia as abas mecânicas; False: permite edição livre)
*   *Atributos Mecânicos (Bloqueados se True)*: `stats`, `skills`, `attributes`, `tribe`, `vocation`, `equipment`
*   *Atributos Narrativos (Editáveis independentemente)*: `narrative`, `name` (recomendado manter o nome liberado se o mestre desejar ou pode bloquear também a critério).

## Validações de Interface
*   **Bloqueio de Campos**: Desabilitar `selects`, `inputs` e botões interativos que lidam com atributos que afetam as regras (mecânica de jogo).
*   **Feedback visual**: Apresentar `disabled: opacity-50 cursor-not-allowed` ou um Tooltip avisando o motivo do bloqueio para garantir boa UX.
