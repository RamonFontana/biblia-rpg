# Layout da sessão: Palco, Barra de Status, Hotbar em abas e trilho de Painéis

Status: ready-for-agent

Onda 6, passo 1. Decisões do autor no grill de 2026-10-29 e no veredito do protótipo do mesmo dia. Termos: `CONTEXT.md`, seção "Tela da sessão" (Palco, Retrato, Hotbar, Barra de Status, Painel, Cartão de Habilidade, Barra do Mestre), e também Habilidade, Fé Atual, Estado de Fé, Condição, Inspiração, Mestre, NPC jogável, Teste de sessão, Descanso. ADRs: 0001 (dados físicos), 0008 (motion e bottom sheet próprio) e 0009 (Palco, dock e Painéis). Visual: `docs/DESIGN.md`. Nenhuma regra de jogo muda.

Protótipo: branch `prototype/session-layout`, commit `6ee68b5`, rota `/prototipo/sessao?variant=A|B|C`. Ele respondeu à pergunta "como a Hotbar e o dock cabem no celular com 2 e com 15 Habilidades?". Veredito do autor: **as Habilidades como no B** (abas por espaço do turno, peças grandes com o nome escrito, Cartão ancorado acima da Hotbar) e **o dock como no C** (trilho de ícones na borda do Palco). O resto não mudou entre as variantes e fica como decidido no grill.

## Problem Statement

A tela da sessão empilha tudo numa coluna só: a ficha, o combate, o grupo, o descanso e os avisos. No celular, para usar uma Habilidade o jogador rola até o fim da página, procura o cartão dela numa lista e só então toca em usar. PV, Fé e Condições somem da tela enquanto ele rola. O Mestre tem o mesmo problema com mais coisas: inimigos, Testes, descanso e a lista de iniciativa disputam a mesma coluna. Não existe um centro de tela estável onde o mapa, que é o passo seguinte, possa entrar. E o NPC jogável não tem como usar as próprias Habilidades: o Mestre conduz o NPC, mas não há onde tocar.

## Solution

A tela da sessão passa a ter uma moldura fixa:
- **Barra de Status** no topo, sempre à vista: PV, Fé e Estado de Fé, Condições, Inspiração e de quem é o turno.
- **Palco** no centro, com os Retratos de quem está na cena; no combate, a faixa de iniciativa e os últimos eventos.
- **Hotbar** embaixo.
- **Trilho de ícones** na borda direita do Palco, que abre cada coisa (Ficha, Inventário, Grupo, Histórico, Descanso) num **Painel**: bottom sheet no celular, por cima do Palco no tablet, ao lado do Palco na web larga.

A Hotbar mostra um grupo por vez, em abas: Ação, Ação Bônus, Reação, Livre, Itens e Passivas. Cada aba traz peças grandes com o ícone, o nome escrito e os usos ou o custo de Fé. Tocar numa peça abre o **Cartão de Habilidade** logo acima da Hotbar, sem esconder o Palco. O botão **Usar** fica dentro do Cartão e mostra o motivo quando está desabilitado. Usar sempre exige dois toques.

O Mestre usa a mesma moldura:
- no trilho, os painéis dele;
- na web, uma coluna fixa de combate;
- embaixo, a **Barra do Mestre** com os comandos de hoje e a Hotbar do NPC jogável no turno dele ou pelo seletor "Agir como".

O espectador vê a mesma moldura, só para leitura.

As animações são curtas, nenhuma roda em loop, e todas obedecem ao "reduzir movimento" do aparelho.

## User Stories

1. As a jogador, I want my PV, Fé, Estado de Fé and Condições always on screen, so that I never scroll to know how I am.
2. As a jogador, I want the PV as a bar and a number (`12/18`), so that I read it at a glance and exactly.
3. As a jogador, I want my Condições in the Barra de Status with the rounds left, so that I know when they end.
4. As a jogador, I want to tap my Inspiração in the Barra de Status to use it, so that it is one gesture away.
5. As a jogador, I want a turn badge in the Barra de Status during combat, so that I know whether it is my turn.
6. As a jogador, I want the day and period chip in the Barra de Status, so that I know the session time without opening anything.
7. As a jogador on a phone, I want the Barra de Status in two short lines, so that it leaves room for the Palco.
8. As a jogador, I want to tap the Barra de Status to open my Ficha, so that the full sheet is one tap away.
9. As a jogador, I want the Hotbar always at the bottom, so that my Habilidades are at thumb reach.
10. As a jogador, I want my Habilidades grouped in tabs by turn slot (Ação, Ação Bônus, Reação, Livre), so that I find what fits the moment.
11. As a jogador, I want each tab to show how many Habilidades it has, so that I know where to look.
12. As a jogador, I want tabs with nothing in them hidden, so that a level-1 Guerreiro does not see empty groups.
13. As a jogador, I want each tile to show the name written out, so that I do not have to guess from an icon.
14. As a jogador, I want each tile to show the uses left or the Fé cost, so that I know what I can still spend.
15. As a jogador, I want a blocked Habilidade dimmed, so that I see at once what I cannot use now.
16. As a jogador with 15 active Habilidades, I want the tab to scroll inside a fixed height, so that the Palco does not jump when I switch tabs.
17. As a jogador, I want the tab I chose to stay chosen, so that the Hotbar does not move under my finger.
18. As a jogador, I want an Itens tab with my usable consumables and their quantity, so that I drink the Bálsamo without opening the inventory.
19. As a jogador, I want my equipped weapon's ammo as a counter in the Itens tab, so that I know how many arrows remain.
20. As a jogador, I want a Passivas tab, so that I can read my passives without mistaking them for something to use.
21. As a jogador, I want passive tiles drawn differently from active ones, so that I know they always apply.
22. As a jogador, I want a Dados button at the end of the tab row, so that the virtual dice stay one tap away.
23. As a jogador, I want tapping a tile to open the Cartão de Habilidade just above the Hotbar, so that I still see the Palco.
24. As a jogador, I want long-pressing a tile to open the same Cartão, so that the gesture I try first works.
25. As a jogador, I want the Cartão to show the type, turn slot, Fé cost, uses and recharge, CD da Habilidade, TR, targets and text, so that I decide with everything in view.
26. As a jogador, I want the Usar button inside the Cartão, so that I never use a Habilidade by accident.
27. As a jogador, I want the Usar button disabled with the reason ("Não é o seu turno", "Fé Insuficiente", "Sem Usos"), so that I know why.
28. As a jogador, I want using an Habilidade with an effect to show the target choice inside the same Cartão, so that I stay in one place.
29. As a jogador, I want using an Habilidade to spend the use, the Fé and the turn slot exactly as today, so that no rule changes.
30. As a jogador, I want the Hotbar visible outside combat, so that I can still use an Habilidade that only spends a use and Fé.
31. As a jogador, I want the Cartão to close by the close button, Esc, tapping outside or switching tab, so that leaving is easy.
32. As a jogador, I want a consumable to open the same kind of Cartão with Usar, so that items and Habilidades work alike.
33. As a jogador in combat, I want the turn slots (Ação, Ação Bônus, Reação, Movimento) just above the Hotbar, so that I see what I have spent.
34. As a jogador, I want the panel icons in a rail at the right edge of the Palco, so that the Hotbar keeps the bottom of the screen.
35. As a jogador, I want the rail to have Ficha, Inventário, Grupo, Histórico and Descanso, so that everything else is one tap away.
36. As a jogador, I want a badge on a rail icon when something there needs me (descanso aberto, pedido recusado, troca pendente), so that I do not miss it.
37. As a jogador on a phone, I want the Painel to rise as a bottom sheet I can drag to full height or down to close, so that it feels native.
38. As a jogador on a tablet, I want the Painel over the Palco, so that it has room without squeezing the scene.
39. As a jogador on a wide screen, I want the Painel beside the Palco, so that I see the scene and the sheet together.
40. As a jogador, I want the Palco to show the Retratos of who is in the scene, so that I see the party, the visible NPCs and the enemies.
41. As a jogador, I want the rail not to cover any Retrato, so that I can tap everyone.
42. As a jogador, I want to tap a Retrato to open its card (PV, Condições, Negociar, Atacar), so that I act on that person directly.
43. As a jogador in combat, I want an initiative strip at the top of the Palco, so that I know who comes next.
44. As a jogador in combat, I want the last 3 events of the combat on the Palco, so that I follow what happened without opening the history.
45. As a jogador, I want to tap the event feed to open the Histórico, so that I can read more.
46. As a jogador, I want the Testes, trades, "É O SEU TURNO!" and Testes de Morte still to appear over everything, so that nothing urgent is hidden in a Painel.
47. As a jogador, I want my turn to arrive with a short banner and the Hotbar lighting up, so that I notice it.
48. As a jogador, I want damage and healing to run the PV bar, flash the number and float the delta from the Retrato, so that I feel the hit.
49. As a jogador who set "reduzir movimento", I want only fades and numbers that change without counting, so that the screen does not move.
50. As a jogador, I want no animation to loop, shake or hold my tap longer than about 300 ms, so that the game stays fast.
51. As a jogador, I want every tap target to be at least 44 px (48 px in the Hotbar), so that I hit it on a phone.
52. As a jogador on an iPhone, I want the Hotbar above the home indicator, so that it does not collide with the system gesture.
53. As a jogador using a keyboard, I want to reach the tabs, the tiles, the Cartão and the rail with Tab and arrows, and open with Enter, so that I do not need a mouse.
54. As a jogador using a screen reader, I want a tile to read as "Golpe Sísmico, Ação, 1 de 1 por combate", so that I know what it is and what is left.
55. As a jogador using a screen reader, I want focus to move into the Cartão and back to the tile when it closes, so that I do not get lost.
56. As a Mestre, I want the same frame (Barra de Status replaced by session info, Palco, rail, bottom bar), so that the app feels like one product.
57. As a Mestre, I want a rail with Jogadores, Inimigos, NPCs, Testes, Descanso, Histórico and Sessão, so that each area has a home.
58. As a Mestre, I want the Palco to show all Retratos, with the hidden NPCs marked as hidden, so that I know what the players see.
59. As a Mestre on the web in combat, I want a fixed combat column (initiative, the focused participant with damage, Condições and death controls, pending Habilidade uses and enemy Habilidades), so that I run the fight without opening panels.
60. As a Mestre on the web out of combat, I want that column to show the player cards, so that I watch the party.
61. As a Mestre, I want the Ruptura and Morrendo alerts stacked at the top of the Palco, so that I see them first.
62. As a Mestre, I want the Barra do Mestre with Solicitar Teste, Iniciar/Finalizar Combate, Próximo Turno, Avançar Tempo, Descanso and Dados, so that my commands are always at hand.
63. As a Mestre, I want those commands to keep their current names, so that what I learned still works.
64. As a Mestre on a phone in combat, I want the Palco to become the initiative list with rows that expand, so that I run the fight on a small screen.
65. As a Mestre on a phone, I want a "Cena" button to switch back to the Retratos, so that I can still see the scene.
66. As a Mestre on a phone, I want my commands behind a "Comandos" button, so that the NPC's Hotbar has room.
67. As a Mestre, I want the playable NPC's Hotbar to appear in the Barra do Mestre on its turn, so that the NPC uses its Habilidades like a player.
68. As a Mestre, I want an "Agir como: <NPC>" selector outside the NPC's turn, so that it can use Reações and use Habilidades out of combat.
69. As a Mestre, I want the NPC's Hotbar to work like the player's (tabs, Cartão, Usar with reason), so that I learn one thing.
70. As a Mestre, I want the playable NPC's attributes and AC to count correctly, so that its modifiers and CD da Habilidade are right.
71. As a Mestre, I want the existing playable NPCs converted, so that they are right without being recreated.
72. As an espectador, I want the same frame read-only (Palco, initiative, event feed), so that I follow the game.
73. As an espectador, I want a rail with Ficha (dimmed) and Grupo only, so that I see what I may see.
74. As an espectador, I want no Hotbar and no actions, so that I cannot change anything.
75. As the author, I want each slice to leave the app playable, so that the table can play between PRs.
76. As the author, I want the E2E suites to keep passing with the same accessible names, so that the refactor is safe.
77. As the author, I want the session, ability and combat E2E to also run on a phone viewport, so that the mobile layout is tested.
78. As the author, I want only the palette colors of `DESIGN.md`, so that `check:palette` keeps passing.
79. As the author, I want `motion` as the only new dependency, so that the bundle stays small (ADR 0008).
80. As the author, I want the session screen section added to `DESIGN.md`, so that future screens follow it.

## Implementation Decisions

- **Moldura por papel.** A página da sessão monta uma moldura comum (Barra de Status ou cabeçalho do Mestre, Palco, trilho, barra de baixo) e escolhe o conteúdo pelo papel: jogador, Mestre, espectador. As visões de jogador, Mestre e espectador de hoje passam a preencher essa moldura em vez de empilhar colunas. Os componentes atuais entram nos Painéis **sem mudança** na primeira fatia: Ficha → a ficha de hoje, Grupo → a lista de participantes de hoje, Combate → a visão de combate do jogador de hoje.
- **Pontos de quebra** (ADR 0009):
  - abaixo de `md`, o trilho flutua na borda direita do Palco e o Painel é bottom sheet;
  - de `md` a `lg`, o trilho é uma coluna lateral e o Painel abre por cima do Palco;
  - a partir de `lg`, o Painel abre ao lado e o Palco encolhe.

  Abaixo de `md`, o Palco reserva à direita a largura do trilho, para que nenhum Retrato fique embaixo dele. No protótipo, o trilho cobria a terceira coluna de Retratos.
- **Trilho (dock), veredito do protótipo C.** Ícones de 48 px, em coluna, cada um com nome acessível e título.
  - Jogador: Ficha, Inventário, Grupo, Histórico, Descanso.
  - Mestre: Jogadores, Inimigos, NPCs, Testes, Descanso, Histórico, Sessão.
  - Espectador: Ficha (apagada) e Grupo.

  Um selo âmbar marca o ícone que pede atenção (descanso aberto, pedido recusado, troca pendente). O botão "Mais" do protótipo B e a barra de dock embaixo do A ficam de fora.
- **Painel.** É um componente de `ui/` sobre o Dialog do Radix. Abaixo de `md` vira bottom sheet próprio (ADR 0008): arrasto vertical pela alça, dois pontos de parada (meia altura e tela cheia), e fecha por arrasto para baixo, botão, toque fora ou Esc. A partir de `md` é lateral. Abre um Painel por vez: abrir outro troca o conteúdo. Vaul só volta se o arrasto falhar no iOS.
- **Hotbar, veredito do protótipo B.**
  - **Abas.** Na ordem Ação, Ação Bônus, Reação, Livre, Itens, Passivas, só as que têm conteúdo, com a contagem no rótulo. A aba ativa tem um sublinhado âmbar que desliza.
  - **Conteúdo das abas.** As Habilidades vêm do conteúdo, como hoje (Tribo, Vocação, nível e caminhos). `actionType` passivo vai para Passivas e os outros tipos vão para a aba do seu espaço do turno.
  - **Dados.** O botão Dados fica na ponta da fileira de abas, no lugar do ☰ do protótipo.
  - **Grade e altura.** As peças ficam numa grade de 3 colunas no celular e 6 a partir de `sm`, com no mínimo 60 px de altura cada. A área das peças tem altura fixa de duas fileiras e rola por dentro, porque no protótipo a aba Ação do Sacerdote nível 20 (13 Habilidades) ocupava metade da tela.
  - **Peça.** Mostra o ícone, o nome escrito (até duas linhas) e uma linha de uso (`1/1`, `10 Fé`, `Ilimitado`, ou `Passiva`). A peça bloqueada fica apagada, e a passiva tem borda tracejada. O protótipo usava a primeira letra do nome como ícone, e ela não diz nada; na tela real o nome escrito vale mais que o ícone, que pode continuar genérico por espaço do turno até haver arte.
  - **Aba escolhida.** Ela se mantém até o jogador trocar; se ficar vazia, cai na primeira aba que tiver conteúdo. Não há troca automática de aba no combate.

  O formato das abas veio do protótipo:

  ```ts
  type Aba = 'action' | 'bonus' | 'reaction' | 'free' | 'itens' | 'passivas';
  // grupos = abas com conteúdo, nesta ordem; rótulo = nome + contagem
  ```
- **Motivo do bloqueio.** Vem das funções do motor que já existem, a disponibilidade (usos e Fé) e depois o bloqueio do efeito (passiva, fora do combate, a 0 PV, turno e espaço do turno), na mesma ordem da visão de combate de hoje. Não entra regra nova nem módulo novo no motor. Fora do combate, as Habilidades sem efeito seguem usáveis como hoje (só gastam o uso e a Fé).
- **Cartão de Habilidade, também do protótipo B.**
  - **Posição.** Abre ancorado logo acima da Hotbar, na largura dela, com no máximo 55 dvh de altura e rolagem própria. O Palco continua à vista e o Cartão não abre dentro do Painel.
  - **Como abre.** Por toque, clique, Enter ou pressionar e segurar (450 ms, com vibração curta onde houver e sem o menu de contexto do sistema). A dica de hover do grill cai, porque o nome já está escrito na peça.
  - **Conteúdo.** Tipo, espaço do turno, custo de Fé, usos e recarga, CD da Habilidade e TR quando houver, alvos e o texto.
  - **Usar.** O botão fica embaixo, desabilitado com o motivo quando bloqueado. Numa Habilidade com efeito, ele troca o conteúdo do Cartão pelo painel de uso de hoje (alvos, Condição a remover).
  - **Fechar.** Fecha pelo ✕, por Esc, por toque fora ou ao trocar de aba. O foco entra no Cartão e volta à peça ao fechar.
  - **Consumíveis.** O consumível abre o mesmo Cartão com o texto e Usar, que consome como o Inventário faz hoje.
- **Espaços do turno.** Ação, Ação Bônus, Reação e Movimento aparecem numa faixa acima das abas, só no combate, com os mesmos marcadores do armazém do combate de hoje.
- **Barra de Status (jogador).** Contém:
  - Retrato e nome;
  - PV em barra e número;
  - Fé com o selo do Estado de Fé;
  - Condições com rodadas;
  - Inspiração (tocar usa, pelo fluxo de hoje);
  - o selo de turno no combate;
  - o chip de dia e período.

  No celular são duas linhas, e tocar na área do personagem abre o Painel Ficha.
- **Palco.**
  - **Retratos.** Mostra os Retratos do grupo, dos NPCs visíveis e dos inimigos em combate, que serão os pins do mapa.
  - **Cartão do Retrato.** Abre num Painel e absorve a lista de participantes e o menu de contexto de token de hoje: PV, Condições, Negociar, Atacar.
  - **No combate.** Há uma faixa de iniciativa no topo e um feed dos 3 últimos eventos do histórico do combate; tocar no feed abre o Painel Histórico.
  - **Mapa.** Uma marca d'água "Mapa" reserva o espaço para ele.
- **Avisos que pedem ação.** Os diálogos de Teste, troca, "É O SEU TURNO!" e Testes de Morte continuam por cima de tudo, como hoje.
- **Mestre.**
  - **Web.** A coluna direita é fixa no combate. Nela ficam a iniciativa, o participante em foco (dano, Condições, controles de morte), os usos de Habilidade pendentes e as Habilidades de inimigo. Fora do combate, a coluna mostra os cartões dos jogadores. Os alertas de Ruptura e Morrendo empilham no topo do Palco.
  - **Barra do Mestre.** Tem os comandos de hoje com os mesmos nomes acessíveis.
  - **Celular.** No combate, o Palco vira a lista de iniciativa com linhas que expandem; o botão "Cena" alterna para os Retratos, e os comandos ficam atrás de "Comandos".
- **Hotbar do NPC jogável.** É o mesmo componente da Hotbar, dentro da Barra do Mestre. Aparece sozinha no turno do NPC e, fora do turno, por um seletor "Agir como: <NPC>". Grava pelo mesmo caminho de uso de Habilidade de hoje, que já aceita o Mestre como dono do NPC; não precisa de migration de schema.
- **`fix:` do NPC jogável, antes da Hotbar dele.** Hoje o NPC é gravado com chaves de atributo em inglês e a CA em `stats`, o que dá modificadores 0, CA 10 e uma CD da Habilidade errada. A ordem:
  1. um teste de caracterização;
  2. gravar as chaves `for/des/con/int/sab/car` sem CA em `stats`, porque a CA vem do equipamento;
  3. uma migration de dados que converte as fichas de NPC existentes, com a confirmação do autor antes de aplicar na produção.
- **Motion** (ADR 0008). Só a dependência `motion`, já aprovada. A configuração global respeita o "reduzir movimento" do usuário: nesse modo fica só opacidade e os números trocam sem contar.
  - **O que anima:**
    - o Painel abre com uma mola curta;
    - no dano e na cura, a barra de PV corre, o número pisca em vermelho ou verde e o delta flutua do Retrato;
    - no turno, a faixa entra, a Hotbar acende e o anel do Retrato pulsa duas vezes e para;
    - no uso, a peça afunda e os contadores contam;
    - o Cartão sobe;
    - o sublinhado da aba desliza.
  - **Proibido:** loop contínuo, tremor, animação nas listas do Mestre e transição acima de cerca de 300 ms que segure o toque.

  Nenhuma cor nova: o vermelho e o verde já estão na paleta.
- **Acessibilidade.**
  - Os alvos de toque têm no mínimo 44 px (48 px na Hotbar e no trilho) e a barra de baixo respeita `env(safe-area-inset-bottom)`.
  - As abas são `tablist`/`tab`/`tabpanel` com setas.
  - O nome acessível da peça é "Nome, espaço do turno, usos" (por exemplo "Golpe Sísmico, Ação, 1 de 1 por combate").
  - O Cartão é `dialog` com nome e com foco gerenciado.
  - O trilho é um `nav` chamado "Painéis".
- **`DESIGN.md`** ganha a seção da tela da sessão na primeira fatia, com as receitas do protótipo: peça, aba, Cartão, trilho e Painel.
- **Fatias** (cada PR deixa o app jogável), atualizadas pelo veredito:
  1. `motion`, a moldura vazia (Barra de Status, Palco, Hotbar e trilho), o Painel responsivo e a seção do `DESIGN.md`; os componentes atuais entram nos Painéis sem mudança.
  2. A Barra de Status do jogador.
  3. A Hotbar em abas, o Cartão de Habilidade e os espaços do turno; as Habilidades saem da lista do combate.
  4. Os consumíveis e a munição na aba Itens.
  5. O Palco: Retratos, cartão do Retrato, faixa de iniciativa e feed.
  6. O Mestre na web: trilho, coluna de combate e Barra do Mestre.
  7. O `fix:` das chaves do NPC jogável e depois a Hotbar do NPC.
  8. O Mestre no celular e o espectador.

## Testing Decisions

- Um bom teste olha o que a pessoa vê e faz: papéis, nomes acessíveis, o que abre e o que é pedido ao tocar em Usar. Ele não olha classes, a estrutura do DOM nem o estado interno. As animações não são testadas; o reduced-motion é testado pelo resultado (o número aparece sem contar).
- **Pontos de teste** (confirmados com o autor):
  1. **E2E** (`e2e/`). As suítes de hoje continuam com os mesmos nomes acessíveis. Um ajudante novo `openPanel(page, nome)` no suporte de UI abre o Painel pelo trilho antes de procurar o que agora mora nele. Um projeto Playwright `mobile` (`devices['Pixel 7']`, sem dependência nova) roda `session`, `ability` e `combat`. Os fluxos novos ganham passos nos specs existentes: usar uma Habilidade pela Hotbar (aba, Cartão, Usar), abrir a Ficha pelo trilho, o Mestre passar o turno pela Barra do Mestre e o NPC jogável usar uma Habilidade. Prior art: `e2e/ability.spec.ts` e `e2e/combat.spec.ts`.
  2. **Página da sessão.** O teste de caracterização que já existe, com os filhos em stubs, cobre a moldura por papel: os ícones do trilho de cada papel, se há Hotbar, qual Painel abre por ícone, se há Barra do Mestre e o espectador sem ações. Ele também cobre que os avisos (Teste, troca, turno) continuam fora dos Painéis. Prior art: `ActiveSessionPage.test.tsx`.
  3. **Hotbar**, um teste novo pela interface pública: recebe as Habilidades, os itens, a munição, o contexto do turno e os usos, e devolve os pedidos de usar a Habilidade e de usar o item. Cobre:
     - quais abas aparecem e em que ordem, com a contagem;
     - o nível 1 (Guerreiro de Judá) e o nível 20 (Sacerdote de Simeão, caminho B);
     - a peça com nome, usos e Fé;
     - o nome acessível;
     - o motivo de bloqueio: fora do turno, espaço usado, Reação fora do turno, sem usos, sem Fé, a 0 PV;
     - abrir o Cartão por clique, Enter e pressionar e segurar;
     - Usar desabilitado com motivo;
     - Usar chamando o pedido uma vez só;
     - o Cartão fechando por Esc e ao trocar de aba;
     - a aba escolhida mantida e o recuo para a primeira aba com conteúdo;
     - a aba Itens com a munição;
     - a aba Passivas sem Usar.

     Prior art: `AbilityCard.test.tsx`, `AbilityUsePanel.test.tsx` e `PlayerCombatView.test.tsx`.
- **Painel**, um teste curto como os outros de `ui/`: abre e fecha por botão e por Esc, tem nome acessível, e um Painel novo troca o conteúdo do anterior. O arrasto fica para o E2E mobile e para o teste à mão no iPhone. Prior art: `progress-bar.test.tsx` e `chip-toggle.test.tsx`.
- **NPC jogável:** o teste de caracterização da gravação das chaves vem antes do `fix:`. Depois, um teste de que o NPC tem modificadores, CA e CD da Habilidade certos. A migration de dados é testada no `npm run test:rls-db`.
- Os testes de componente que já existem não mudam: os componentes só trocam de lugar.
- `npm run check` em toda fatia, incluindo o `check:palette`.

## Out of Scope

- O mapa (pins, grid, iluminação): é o passo seguinte, e só ganha o espaço reservado no Palco.
- Slots da Hotbar fixados ou reordenados pelo jogador (fica para depois).
- A troca automática de aba no combate (por exemplo, Reação quando não é o turno do jogador).
- Arte de ícone por Habilidade; até lá, o nome escrito na peça.
- Qualquer regra de jogo, valor de balanceamento ou conteúdo bíblico.
- O vaul, a menos que o arrasto falhe no iOS (ADR 0008).
- Telas fora da sessão (criação de personagem, lista de sessões, perfil).
- O dano das Habilidades e o ataque dos inimigos pelo app (continuam como estão).

## Further Notes

- O veredito do protótipo muda três decisões do grill de 2026-10-29. `CONTEXT.md`, o ADR 0009 e o `docs/ROADMAP.md` foram atualizados para concordar com esta spec.
  - A Hotbar deixa de rolar na horizontal e passa a usar abas.
  - O Cartão de Habilidade sobe acima da Hotbar em vez de abrir no Painel.
  - No celular, o dock vira um trilho na borda do Palco em vez de uma barra embaixo.
- Ainda falta, à mão, o arrasto do bottom sheet e o pressionar e segurar num iPhone de verdade. Isso pode ser feito no preview da Vercel da branch do protótipo ou no da primeira fatia. Se o arrasto falhar no iOS, a decisão do ADR 0008 reabre.
- A branch `prototype/session-layout` não entra na `main`. Ela fica como fonte primária até a fatia 3 entrar e depois é apagada.
