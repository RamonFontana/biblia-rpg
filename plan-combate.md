# Plano de Implementação do Sistema de Combate

Este documento detalha a arquitetura e os passos para implementar o sistema de combate no RPG Bíblico, focado em auxiliar as sessões físicas.

## Visão Geral das Regras e Funcionalidades

1. **Economia de Ações (Checklist Visual)**: O sistema não bloqueará rigidamente o uso de ações. Ele funcionará como um checklist visual (Movimento, Ação, Ação Bônus, Reação) para ajudar os jogadores e o Mestre a acompanharem o que já foi feito, permitindo flexibilidade narrativa ao Mestre.
2. **Ações Inimigas**: Os inimigos agirão **individualmente** na ordem de iniciativa. Cada bandido, soldado ou fera terá o seu próprio turno.
3. **Início do Combate**: O Mestre tem o controle de selecionar ativamente quem participa do combate (quais jogadores, quais inimigos e quais NPCs específicos).
4. **Grid/Movimento**: O sistema será puramente "Teatro da Mente" ou apoio digital para mapa na mesa física. O app gerenciará as fichas, HP, iniciativas e ações.

---

## 1. Modelagem de Dados (Supabase)

Tabelas necessárias para o estado da batalha em tempo real:

**Tabela `combats`**
- `id` (uuid, PK)
- `session_id` (uuid, FK)
- `status` (enum: 'setup', 'active', 'paused', 'finished')
- `current_turn_index` (integer) - Indica de quem é a vez (índice do array de iniciativa).
- `round_number` (integer) - Contagem de rodadas.

**Tabela `combat_participants`**
- `id` (uuid, PK)
- `combat_id` (uuid, FK)
- `entity_id` (uuid) - ID do Personagem Jogador, NPC ou Inimigo.
- `entity_type` (enum: 'player', 'npc', 'enemy')
- `initiative` (integer) - Valor rolado para iniciativa (inputado pelo usuário/Mestre).
- `hp_current` (integer)
- `conditions` (jsonb) - Array de strings. Ex: `["sangrando", "caído"]`.

---

## 2. Gerenciamento de Estado (Zustand & Realtime)

**Store: `src/store/combatStore.ts`**
- Inscreve-se nos canais do Supabase Realtime para ouvir mudanças em `combats` e `combat_participants`.
- Gerencia o estado *local* do turno atual na visão do jogador:
  - `hasUsedAction: boolean`
  - `hasUsedBonusAction: boolean`
  - `hasUsedReaction: boolean`
  - `hasUsedMovement: boolean`
- Funções base: `setupCombat(participants)`, `startCombat()`, `nextTurn()`, `applyDamage()`, `setConditions()`.

---

## 3. Interface do Mestre (DM View)

O mestre terá uma tela de controle absoluto do combate.

**Painel de Setup (`SetupCombatModal`)**
- O mestre seleciona ativamente quais jogadores, NPCs e inimigos entrarão na batalha.
- Permite preencher a iniciativa que os jogadores rolaram fisicamente, e rolar a iniciativa dos NPCs/Inimigos.

**Dashboard de Combate (`CombatDashboard`)**
- **Lista de Iniciativa:** Cards ordenados (com opção de reordenar manualmente caso necessário) mostrando de quem é o turno.
- **Painel de Controle:** Botões para "Próximo Turno", "Pausar Combate" e "Encerrar Combate".
- **Controle de HP e Condições:** O Mestre clica em um participante (jogador ou inimigo) para aplicar dano/cura recebidos, ou adicionar status ("Amedrontado", "Envenenado", etc).

---

## 4. Interface do Jogador (Player View)

A tela do jogador foca no turno atual e na economia de ações.

**Painel de Ações (`PlayerCombatView`)**
- **Banner de Turno:** Alerta visual gritante informando "É O SEU TURNO!" ou mostrando quem está agindo.
- **Tracker de Ações (Checklist):** 4 ícones interativos: [Movimento], [Ação], [Ação Bônus], [Reação]. O jogador marca o que já usou no turno para não se perder. O sistema reseta as marcações no próximo turno.
- **Modal de Resolução Híbrido:** Ao selecionar uma arma/habilidade para usar:
  - Opção 1: *"Rolar no App"* (Rola o dado virtualmente e cruza com a CA).
  - Opção 2: *"Rolar Dado Físico"* (O jogador rola o d20 na mesa e digita o resultado. Depois insere o valor do dano, e o app atualiza o HP correspondente na base).

---

## Estrutura de Tracks para o SpecKit (Planejamento Futuro)

Quando for desenvolver com o SpecKit, siga estas Tracks em ordem:

1. **Track 1: Backend e Modelagem:**
   - Criar tabelas `combats` e `combat_participants` no Supabase.
   - Definir os enums necessários.
   - Criar o `combatStore.ts` integrado com Realtime.
2. **Track 2: Setup e Iniciativa:**
   - Tela do Mestre para selecionar participantes da sessão.
   - Inserção de rolagens de iniciativa.
   - Algoritmo de ordenação (Highest -> Lowest).
3. **Track 3: Tracker do Mestre (DM Dashboard):**
   - UI de controle de rodada/turnos.
   - Modal de aplicação de dano/cura.
   - Modal de gerenciamento de condições.
4. **Track 4: Painel do Jogador:**
   - Interface de checklist visual das Ações.
   - Alertas visuais e sonoros de mudança de turno.
   - Fluxo de rolagem (Híbrido: Virtual vs Físico).
