# Data Model: Sistema de Combate - Teste de Morte e Fim de Combate

## 1. Alterações em `characters`

Para refletir globalmente o estado do personagem mesmo fora de um combate formal.

- **Novos campos propostos** (se não existirem):
  - `death_saves_successes` (integer, default: 0): Contagem de 0 a 3.
  - `death_saves_failures` (integer, default: 0): Contagem de 0 a 3.
  - `is_stable` (boolean, default: false): Se o personagem atingiu 3 sucessos.
  - `is_dead` (boolean, default: false): Se o personagem atingiu 3 falhas ou morreu instantaneamente.
  - `is_deleted` (boolean, default: false): Para o *soft delete* que o Mestre executará no fim do combate.

## 2. Alterações em `combat_sessions`

A entidade de combate precisa permitir a finalização.

- **Campos existentes modificados/utilizados**:
  - `status` (string/enum): Alterar de `active` para `finished` (ou `inactive`) quando o mestre clicar em Finalizar Combate. 
  - *Trigger* ou lógica no cliente: Ao finalizar, todos os personagens envolvidos que tenham `is_dead == true` recebem `is_deleted = true`.

## 3. Fluxo de Regras e Transições de Estado

- **Regra do D20**:
  - `1`: `death_saves_failures += 2`
  - `2-9`: `death_saves_failures += 1`
  - `10-19`: `death_saves_successes += 1`
  - `20`: `current_hp = 1`, limpa todos os stats de morte.
- **Regra de Estabilização**:
  - Se `death_saves_successes == 3` -> `is_stable = true`. Personagem para de rolar os dados, fica com `current_hp = 0`.
- **Regra de Morte**:
  - Se `death_saves_failures >= 3` -> `is_dead = true`. O personagem morre, o avatar/ícone deve mudar para indicar o óbito para todos os jogadores.
- **Ação "Levantar"**:
  - O Mestre altera o `current_hp` do personagem caído para `>= 1`. O sistema automaticamente zera `death_saves_successes` e `death_saves_failures`, além de `is_stable = false` e `is_dead = false`.
