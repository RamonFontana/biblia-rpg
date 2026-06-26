# Research: 040-ability-usage-system

## 1. Documentation Standardization

- **Decision**: Standardize all `docs/tribos/*.md` and `docs/vocacoes/*.md` using a tabular format similar to the Sacerdote template.
- **Rationale**: Currently, ability descriptions vary wildly. Standardizing them with explicitly defined columns (`Nome`, `Nível Min.`, `Tipo Ação`, `Dado de Rolagem`, `Usos/Recarga`, `Efeito`) ensures that when these docs are converted to code (e.g. `src/data/abilities.ts`), the data is strictly structured and can be parsed or manually verified effectively.
- **Alternatives considered**: Leave docs as is and map mentally. Rejected because it leads to ambiguous edge cases when creating the system logic.

## 2. Ability Usage Persistence

- **Decision**: Reuse the existing `skills` JSONB column in the `characters` Supabase table.
- **Rationale**: Avoids the need to run database migrations or create new tables. The `skills` column is currently empty `[]` or null across all characters, making it perfect for storing character-specific progression state.
- **Alternatives considered**: Create a normalized table `character_ability_uses`. Rejected because it's overkill for a lightweight SPA and increases query complexity.

## 3. Path Choice Persistence

- **Decision**: Store path choices (e.g., Tribe Path A/B or Vocation specific choices) **per level** inside the `skills` JSONB column.
- **Rationale**: Players can mix and match paths as they level up (e.g., Path A at Level 4, Path B at Level 8). Storing a single `tribe_path` field is too rigid.
- **Alternatives considered**: Adding a single text column `tribe_path`. Rejected because it prevents hybrid builds.

## 4. UI for Abilities

- **Decision**: Integrate ability cards into `PlayerCombatView.tsx` with clear RPG stats (dice, action type) and a "Use" button that decrements uses and persists to Supabase. Note that abilities can be used both inside and outside of combat.
- **Rationale**: Centralizing the usage inside the main session/combat view makes it easily accessible for players.
- **Alternatives considered**: Creating a separate "Abilities" tab. Rejected because abilities need to be quickly accessible during combat turns.
