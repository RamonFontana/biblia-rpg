# Data Model: Sistema de Perícias e Proficiência

Este documento descreve as mudanças necessárias na camada de dados para suportar o sistema de perícias e proficiências.

## Alterações na Tabela `characters`

Duas novas colunas serão adicionadas à tabela principal `characters`.

### 1. Coluna `level`

- **Tipo**: `integer`
- **Default**: `1`
- **Nullable**: Não (NOT NULL)
- **Descrição**: O nível atual do personagem, que dita o Bônus de Proficiência (Proficiency Bonus). Personagens criados antes desta atualização assumirão nível 1 por padrão.

### 2. Coluna `proficiencies`

- **Tipo**: `jsonb`
- **Default**: `null`
- **Nullable**: Sim
- **Descrição**: Armazena as perícias escolhidas e os testes de resistência derivados da vocação.

#### Schema do JSON `proficiencies`

```typescript
interface CharacterProficiencies {
  // Lista de nomes das perícias em que o personagem possui proficiência.
  // Ex: ["Atletismo", "Percepção"]
  skill_proficiencies: string[];
  
  // Lista de atributos para os testes de resistência (saving throws) em que o personagem possui proficiência.
  // Baseado na vocação. Ex: ["FOR", "CON"]
  saving_throws: string[];
}
```

## Migrações (Database Migrations)

Será necessária uma migração SQL no Supabase para aplicar essas mudanças:

```sql
-- Adicionar coluna 'level'
ALTER TABLE public.characters 
ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Adicionar coluna 'proficiencies'
ALTER TABLE public.characters 
ADD COLUMN proficiencies jsonb DEFAULT NULL;
```

## Atualização de Tipos (TypeScript)

O arquivo `src/types/database.types.ts` precisará ser regenerado via Supabase CLI (ou atualizado manualmente) para refletir a nova estrutura da tabela `characters`:

```typescript
// Em src/types/database.types.ts > Database['public']['Tables']['characters']
Row: {
  // ... outras propriedades
  level: number;
  proficiencies: Json | null;
}
Insert: {
  // ... outras propriedades
  level?: number;
  proficiencies?: Json | null;
}
Update: {
  // ... outras propriedades
  level?: number;
  proficiencies?: Json | null;
}
```

E no tipo de domínio em `src/features/character-management/types/index.ts`:

```typescript
export interface Character extends DraftCharacter {
  // ...
  level: number;
  proficiencies?: {
    skill_proficiencies: string[];
    saving_throws: string[];
  } | null;
}
```

E no DraftCharacter `src/features/character-creation/types/index.ts`:

```typescript
export interface DraftCharacter {
  // ...
  level?: number;
  proficiencies?: {
    skill_proficiencies: string[];
    saving_throws: string[];
  };
}
```
