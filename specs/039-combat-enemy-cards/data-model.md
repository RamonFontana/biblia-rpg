# Data Model: combat-enemy-cards

Não há novas entidades de banco de dados para esta funcionalidade. As entidades necessárias já estão criadas.

## Entities

### CombatParticipant (Existente)
A tabela `combat_participants` já atende à necessidade de armazenar o estado do inimigo durante o combate.

**Fields Used**:
- `id` (UUID): Identificador único no combate
- `combat_id` (UUID): FK para o combate
- `entity_id` (UUID): FK para a entidade (inimigo)
- `entity_type` (Enum): 'enemy' (neste caso)
- `hp_current` (Int): Vida atual, sincronizada via Realtime.

### Enemy (Existente)
Dados estáticos e atributos do inimigo ficam em uma tabela própria (ex: `enemies` ou `monsters`), acessada via `entity_id`.

## Relacionamentos

Apenas leitura do relacionamento entre `combat_participants` e a tabela do `entity_id` para carregar a ficha completa quando o jogador solicitar a consulta.
