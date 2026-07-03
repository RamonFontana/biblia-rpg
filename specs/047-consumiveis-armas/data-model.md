# Data Model & Interfaces: Mecânica de Munição e Consumíveis

**Branch**: `047-consumiveis-armas` | **Date**: 2026-07-03

## Entidades Existentes com Novos Usos

### `character_items`
- **Tabela / Interface Supabase**: `public.character_items`
- **Campo `quantity`**: Será usado ativamente como o contador de "munições restantes" no inventário.
- **Campo `weapon_effects` (JSON)**: Pode ser usado para armazenar regras adicionais, como `{"recoverable": true, "max_charges": 20}` no momento da inserção.

### `items`
- **Tabela / Interface Supabase**: `public.items`
- **Campo `is_consumable`**: Identificará as munições.
- **Campo `effects` (JSON)**: Conterá as propriedades base do item para quando for comprado/ganho (ex: `{"recoverable": true, "max_charges": 20}`).

## Lógica de Negócio (Interfaces Frontend)

### `AmmunitionService` (ou equivalente no React)
- `consume(character_item_id: string, amount: number = 1)`
  - Diminui a quantidade de um item de munição. Dispara um erro ou alerta se `quantity` < `amount`.
- `recover(character_item_id: string, max_capacity: number, spent_amount: number)`
  - Calcula quantas munições são recuperadas rodando 1 teste (50% de chance) para cada unidade de `spent_amount`.
  - Incrementa o valor na tabela. Limita o valor final por `max_capacity`.
- `addCharges(character_item_id: string, amount: number)`
  - Ação do mestre para adicionar cargas livremente (pedras de funda, flechas compradas etc).
