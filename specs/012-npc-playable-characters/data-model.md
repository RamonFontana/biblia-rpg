# Phase 1: Data Model

## 1. Store do Frontend (`createSessionStore.ts`)

A tipagem da store será atualizada para diferenciar e armazenar os dados de uma ficha completa.

```typescript
export type SessionNPCDraft = {
  id: string; // temp id
  name: string;
  description: string;
  isPlayable: boolean; // Flag indicando se é um NPC com ficha
  characterData?: Record<string, any>; // Dados completos (tribo, classe, atributos, etc.)
};
```

## 2. Fluxo de Salvamento no Supabase (`sessionService.ts`)

O serviço que salva a sessão precisará fazer a distinção ao iterar sobre `npcs`:

- **Para NPCs simples (`isPlayable === false`)**:
  - Inserir na tabela `session_enemies` com `type = 'npc'`.
  
- **Para NPCs jogáveis (`isPlayable === true`)**:
  1. Inserir um novo registro na tabela `characters`, preenchendo todos os campos da ficha (através do `characterData`).
  2. Pegar o `character_id` gerado.
  3. Inserir o NPC na tabela `session_participants` vinculando-o à `session_id` gerada, para que ele apareça na sessão como um personagem ativo (junto aos jogadores reais). O `user_id` pode ficar nulo ou receber o ID do Mestre.

## 3. Estrutura de Presets (`npcPresets.json`)

Os presets ficarão na pasta `src/data/`.

```json
[
  {
    "id": "guarda_cidade",
    "name": "Guarda da Cidade",
    "description": "Um soldado comum com armadura de bronze leve. Ideal para guardas e patrulheiros.",
    "isPlayable": false
  },
  {
    "id": "mercador",
    "name": "Mercador Nômade",
    "description": "Viajante que vende informações ou itens básicos em troca de favores.",
    "isPlayable": false
  },
  {
    "id": "sacerdote_iniciante",
    "name": "Sacerdote Iniciante",
    "description": "Jovem levita aprendendo os ritos. (Exemplo de NPC Jogável)",
    "isPlayable": true,
    "characterData": {
      "level": 1,
      "tribo": "Levi",
      "classe": "Sacerdote",
      "for": 8, "des": 10, "con": 12, "int": 14, "sab": 16, "car": 14,
      "ca": 10
    }
  }
]
```
