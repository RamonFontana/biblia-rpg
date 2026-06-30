# Specification: Efeitos e Condições (042-effects-conditions)

## Overview
A mecânica de condições (como Sangrando, Atordoado, Cego, etc.) é essencial para o combate tático e a exploração narrativa. O objetivo desta feature é implementar a infraestrutura e a interface para suportar condições, permitindo tanto a aplicação manual pelo Mestre (focando no suporte a mesas físicas e roleplay) quanto a automação de combate (para habilidades e itens).

## Clarifications
### Session 2026-06-30
- Q: O que acontece quando um personagem recebe uma condição que ele já possui? → A: Sobrescreve (A duração é reiniciada/substituída).
- Q: Como as durações baseadas em "turnos" são tratadas fora de combate? → A: Duração Narrativa (Fica a critério do Mestre dizer quando acaba, baseado no Roleplay).
- Q: Além do ID da condição, o que mais precisa ser salvo na estrutura JSON? → A: `conditionId` e `duration` (Turnos restantes).

## User Scenarios & Testing

### Scenario 1: Mestre aplica condição manualmente fora de combate
- **Given** um grupo explorando uma masmorra fora de turno.
- **When** um jogador pisa em uma armadilha e falha no teste de resistência.
- **Then** o Mestre deve conseguir abrir a Ficha Global do Personagem (Painel do Mestre) e adicionar manualmente a condição "Envenenado".
- **And** a condição deve persistir no banco de dados e aparecer visualmente na interface do jogador.

### Scenario 2: Sincronização ao iniciar e terminar combate
- **Given** um personagem que já possui a condição "Envenenado" na sua Ficha Global.
- **When** o Mestre inicia um combate e o personagem é adicionado à iniciativa.
- **Then** a condição "Envenenado" deve ser importada para o registro do combatente.
- **When** o combate é encerrado.
- **Then** as condições permanentes (Envenenado, Sangrando) devem ser salvas de volta na Ficha Global do personagem, enquanto as temporárias (Atordoado, Caído) devem ser limpas automaticamente.

### Scenario 3: Automação de Habilidade no Combate
- **Given** um jogador usando uma habilidade que aplica "Sangrando" (ex: Corte Preciso).
- **When** o jogador acerta o ataque no alvo.
- **Then** o sistema (se configurado para automação) deve ler o payload da habilidade, avaliar a salvaguarda do alvo e, em caso de falha, inserir automaticamente a condição "Sangrando" no registro do alvo.

## Functional Requirements

1. **Persistência Global (Ficha do Personagem)**
   - O sistema deve armazenar um array de condições ativas na tabela `characters` (ou no JSON de `stats`), garantindo que os efeitos persistam fora de combate.
   - Fora de combate, a duração das condições (em turnos) é tratada de forma **Narrativa** (o Mestre decide quando terminam).

2. **Regra de Acúmulo (Stacking)**
   - Se um personagem receber uma condição que já possui, a nova aplicação **sobrescreve** a antiga (a duração é reiniciada/substituída). Não há acúmulo de turnos ou intensidade.

3. **Sincronização de Estado (Combate <-> Global)**
   - Ao adicionar participantes em um combate (`combat_participants`), o sistema deve copiar as condições ativas da tabela `characters`.
   - Ao encerrar o combate, o sistema deve salvar as condições ativas do participante de volta na tabela `characters`.
   - O sistema deve expurgar condições estritamente temporárias (ex: Atordoado, Agarrado, Caído) durante o encerramento do combate.

3. **Gatilhos Manuais (UI do Mestre e Jogador)**
   - A UI da ficha do personagem e do card de combate deve ter um botão "Adicionar Condição" (dropdown com a lista de condições).
   - O Mestre deve poder adicionar ou remover condições de qualquer personagem ou NPC a qualquer momento.

4. **Motor de Automação de Efeitos (Payload)**
   - Habilidades e itens consumíveis devem suportar um payload de efeitos (ex: `applyConditions: [{ conditionId: 'sangrando', trigger: 'onHit', saveRequired: 'CON' }]`).
   - O front-end de combate deve processar esse payload ao confirmar um acerto.

5. **Modificadores Passivos e Ativos**
   - A interface deve exibir indicadores visuais (Vantagem / Desvantagem) em rolagens de ataque/testes baseados nas condições atuais do atacante e do alvo (ex: Cego = Desvantagem ao atacar).

## Success Criteria
- O Mestre consegue aplicar e remover uma condição em um jogador com no máximo 2 cliques.
- As condições sobrevivem à transição (Entrar em combate -> Sair de combate) sem perda de dados (salvo condições limpas por design).
- O sistema processa dano periódico (ex: 1d4 de Sangramento) no final do turno do jogador no Tracker de Iniciativa, quando aplicável.

## Key Entities
- **Character (`characters` table):** Necessita de estrutura JSON para armazenar condições ativas (ex: `stats.conditions`). Cada objeto deve conter pelo menos `{ conditionId: string, duration: number }`.
- **Combat Participant (`combat_participants` table):** Já possui a coluna `conditions` (Json). Deve seguir a mesma estrutura (`{ conditionId, duration }`).
- **Ability Payload:** Modificação na estrutura de `abilities.ts` para suportar `mechanics.applyConditions`.

## Assumptions
- Assumimos que o Mestre sempre tem a palavra final, ou seja, botões manuais para forçar Vantagem/Desvantagem e limpar/adicionar efeitos sempre se sobreporão à automação.
- Assumimos que a UI de combate será o local principal para a resolução automática.
