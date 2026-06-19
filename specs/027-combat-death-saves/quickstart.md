# Quickstart: Sistema de Combate - Teste de Morte e Fim de Combate

Este guia descreve como começar a testar as funcionalidades da feature na interface.

## Pré-requisitos

1. Um Mestre deve criar uma sessão e iniciar um combate com pelo menos 1 jogador ativo.
2. Certifique-se de que a API do Supabase está rodando para disparar as atualizações de *realtime* em `characters` e `combat_sessions`.

## Testando a Morte de Personagens

1. Com o painel do Mestre, reduza os Pontos de Vida (PV) de um jogador para `0`.
2. Observe a tela do jogador: um modal ou painel de "Teste de Morte" deve aparecer imediatamente (FR-002, FR-003).
3. Na tela do jogador, simule uma rolagem manual inserindo um valor como `15`. A barra de sucessos deve avançar para 1 (FR-005).
4. Na tela do mestre, o painel de controle do personagem deve refletir o sucesso recebido (FR-008).
5. O mestre clica em "Adicionar Falha" para o jogador (FR-009). A tela do jogador atualiza para 1 falha instantaneamente.
6. O mestre clica em "Levantar" (curar) (FR-012). O PV sobe para 1 e o modal some, com os marcadores de sucesso/falha sendo zerados (FR-010).

## Testando o Fim de Combate

1. O mestre, em seu painel de controle de combate, clica em "Finalizar Combate" (FR-001).
2. O combate é marcado como finalizado. As telas dos jogadores deixam de exibir a visão de combate e retornam à visão padrão da sessão.
3. Se um jogador estava morto (is_dead = true) na hora do encerramento do combate, ele sofre *soft delete* e passa para o modo "espectador" (FR-013, FR-014).
