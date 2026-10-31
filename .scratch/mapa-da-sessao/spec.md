# Mapa da sessão: mapas, Mapa atual, pins, Oculto e luz

Status: ready-for-agent

Onda 6, passo 2. Decisões do autor no grill de 2026-10-31, registradas no `docs/ROADMAP.md` (seção "Onda 6, passo 2"). Termos: `CONTEXT.md`, seções "Tela da sessão" (Palco, Retrato, Painel, Barra do Mestre) e "Mapa" (Mapa, Biblioteca de mapas, Mapa atual, Quadrado, Bandeja, Oculto, Ambiente, Luz plena, Penumbra, Escuridão, Fonte de luz, Visão). ADRs: 0004 e 0005 (cliente confiável), 0008 (motion), 0009 (Palco e trilho), 0010 (imagem do mapa no banco) e 0011 (Oculto e luz só na tela). Regras: `docs/regras-base.md` 6.7 e a Tocha em `docs/itens/consumiveis.md`.

## Problem Statement

O Palco mostra os Retratos numa grade, sem lugar no espaço. O Mestre não tem como mostrar aos jogadores onde a cena acontece, onde cada um está, quem está perto de quem, nem o que a escuridão esconde. As distâncias das regras (deslocamento de 9 m, alcance das armas, a Tocha que ilumina 6 m) só existem na cabeça do Mestre. Para esconder um inimigo, o Mestre não tem controle nenhum: o inimigo aparece para todos assim que entra no combate, e o NPC que ele esconde só some da tela do jogador quando a página é recarregada. À noite, a Tocha não muda nada na tela.

## Solution

O Mestre escolhe os mapas da sessão: terrenos lisos da Biblioteca de mapas ou imagens que ele envia e recorta em Quadrados de 1,5 m. Os mapas enviados são dele e servem a qualquer sessão. Durante o jogo, ele prepara qualquer mapa só para si e o mostra aos jogadores, que passam a ver o Mapa atual no Palco, ao vivo. Os Retratos viram pins: só o Mestre os arrasta, e o pin encaixa no centro do Quadrado; cada mapa guarda as posições. No combate, o pin do turno fica destacado e o painel de Ataque mostra a distância até o alvo.

O Mestre marca qualquer Retrato como Oculto, e ele some da tela dos jogadores, no mapa, na iniciativa e entre os alvos. A luz faz o resto: o Ambiente segue o período (dia claro, noite escura) ou o que o Mestre fixar, e as Fontes de luz (a Tocha que o jogador acende pela Hotbar, as luzes que o Mestre põe) iluminam um raio de Luz plena e uma faixa de Penumbra. Cada jogador vê o mapa pela Visão do próprio personagem: inimigos e NPCs só aparecem na luz, os companheiros sempre aparecem, e quem está Cego não vê inimigos nem NPCs. O Mestre vê tudo e pode olhar pela Visão de um personagem.

## User Stories

**Mapas da sessão**

1. As a Mestre creating a session, I want an optional "Mapas" step in the wizard, so that I can pick the maps I will use before the game.
2. As a Mestre, I want to pick plain terrains (areia, pedra, campo, piso de casa) from the Biblioteca de mapas, so that I can start a scene without an image.
3. As a Mestre adding a plain terrain, I want to choose its size in columns and rows (20×15 by default, 5 to 60 per side), so that the terrain fits the scene.
4. As a Mestre, I want to skip the "Mapas" step, so that sessions without a map keep working as today.
5. As a Mestre during the game, I want a "Mapas" icon in my rail, so that I can manage the session maps without leaving the Palco.
6. As a Mestre during the game, I want to add maps from the Biblioteca or from my own maps, so that I can react to where the players go.
7. As a Mestre, I want to name each session map, so that I can find it quickly in the list.
8. As a Mestre, I want to remove a map from the session, so that the list stays short.
9. As a Mestre, I want the "Mapas" step and the "Mapas" panel to use the same picker, so that I learn it once.

**Envio e recorte**

10. As a Mestre on the web, I want to upload an image of any size up to 20 MB, so that I can use battle maps I already have.
11. As a Mestre, I want to see my image under the grid and drag and zoom it until the grid lines match the drawing, so that the squares on the image line up with the app's Quadrados.
12. As a Mestre, I want to choose how many columns and rows the map has, so that the crop is always a whole number of Quadrados.
13. As a Mestre, I want any aspect ratio, so that tall and wide maps both work.
14. As a Mestre, I want the saved image reduced to at most 2048 px on its longest side and compressed, so that it loads quickly on the players' phones.
15. As a Mestre, I want my uploaded maps to belong to me and be available in any of my sessions, so that I do not upload the same map twice.
16. As a Mestre, I want to rename and delete my own maps, so that my list stays tidy.
17. As a Mestre, I want the app to refuse deleting a map that an active session uses, so that no session loses its map in the middle of a game.
18. As a Mestre on a phone, I want to see that upload and cropping are on the web, so that I know where to do it.

**Mapa atual**

19. As a Mestre, I want to open any session map only for me, so that I can prepare pins and lights before the players see it.
20. As a Mestre, I want a "Mostrar aos jogadores" button, so that I decide when the players' map changes.
21. As a Mestre, I want to see which map is the Mapa atual and which one I am preparing, so that I do not confuse them.
22. As a Mestre, I want to go back to the Retratos scene with no map, so that I can run scenes that do not need one.
23. As a jogador, I want the Palco to switch to the Mapa atual as soon as the Mestre shows it, without reloading, so that I follow the scene live.
24. As a jogador, I want to see the Retratos grid of today while no map is shown, so that nothing changes for sessions without a map.
25. As a jogador who reloads the page, I want to land on the current Mapa atual, so that I do not lose the scene.
26. As a espectador, I want to see the Mapa atual too, so that I follow the game.

**Grid e medida**

27. As a jogador, I want to see thin grid lines on the map, so that I can count Quadrados.
28. As a Mestre, I want to turn the grid lines off for a map whose image already has a grid, so that the lines do not double.
29. As a Mestre, I want distances to keep working with the lines turned off, so that measuring does not depend on the drawing.
30. As anyone, I want a diagonal step to count as one Quadrado (1,5 m), so that counting matches the rule.

**Pan e zoom**

31. As a jogador on a phone, I want to drag the map with one finger, so that I can look around.
32. As a jogador on a phone, I want to pinch to zoom, so that I can see details.
33. As a user on the web, I want to zoom with the mouse wheel and drag to pan, so that the map is easy to explore.
34. As a jogador, I want a button that centres the map on my character, so that I find myself quickly.
35. As a jogador whose character is not on the map, I want the centre button disabled, so that I know why it does nothing.
36. As a jogador on a phone, I want the map to keep the rail margin of the Palco, so that no pin hides under the rail.

**Pins**

37. As a Mestre, I want every Retrato of the session (players, playable NPCs, simple NPCs, enemies) to be placeable on the map as a pin, so that the whole scene can be laid out.
38. As a Mestre, I want Retratos without a position on this map to wait in the Bandeja at the map edge, so that I can place them when they arrive.
39. As a jogador, I want Retratos in the Bandeja to be invisible to me, so that I only see who is in the scene.
40. As a Mestre, I want to drag a pin from the Bandeja onto the map and from one Quadrado to another, so that I move characters as the players describe.
41. As a Mestre, I want the pin to snap to the centre of the nearest Quadrado when I release it, so that positions are always clean.
42. As a Mestre dragging a pin, I want to see how many Quadrados and metres it has moved, so that I can check movement against the 9 m of deslocamento.
43. As a Mestre, I want to send a pin back to the Bandeja, so that I can remove someone from the scene.
44. As a Mestre, I want each map to keep its own positions, so that going back to a map puts everyone where they were.
45. As a Mestre, I want to place enemies on the map outside combat, so that I can prepare ambushes and sentinels.
46. As a jogador, I want to be unable to drag any pin, so that only the Mestre moves the scene.
47. As a jogador, I want to see pins move live when the Mestre releases them, with a short animation, so that I notice the change.
48. As anyone, I want to tap a pin to open the cartão of the Retrato, so that I see PV and Condições as on the Palco today.
49. As anyone, I want the pin to show the Retrato's picture or initials, so that I recognise each character.
50. As a Mestre, I want an enemy at 0 PV to stay on the map greyed out until I remove it, so that the battlefield stays readable.
51. As a Mestre on a phone, I want to drag pins with my finger without the map panning, so that moving a pin and panning do not fight.

**Combate**

52. As anyone in combat, I want the pin of whoever has the turn highlighted, so that I know who is acting.
53. As a jogador attacking, I want the Attack panel to show the distance in metres to the chosen target, so that I know if my weapon reaches.
54. As a jogador, I want the attack never blocked by distance, so that the Mestre keeps the last word.
55. As a jogador on a phone in combat, I want the initiative strip to stay over the map, so that I still see the order.
56. As a Mestre on a phone in combat, I want "Cena" to show the map, so that I can switch between initiative and the map.

**Oculto**

57. As a Mestre, I want to mark any enemy, playable NPC or simple NPC as Oculto, so that I control what the players know.
58. As a jogador, I want an Oculto Retrato to disappear from the map, the initiative strip, the combat feed and the attack targets, so that nothing gives it away.
59. As a jogador, I want an Oculto NPC to disappear live when the Mestre hides it, so that I do not keep seeing it until I reload.
60. As a Mestre, I want an enemy placed on a map for the first time to start Oculto, so that I never reveal an ambush by accident.
61. As a Mestre, I want to see Oculto Retratos translucent and marked, so that I know what the players do not see.
62. As a Mestre, I want Oculto to apply to the Retrato in the whole session, not per map, so that revealing someone once is enough.
63. As a Mestre, I want to reveal an Oculto Retrato with one tap from its pin or its cartão, so that the ambush starts fast.

**Luz e Visão**

64. As a Mestre, I want each map's Ambiente to follow the period by default (Manhã and Tarde claro, Noite Escuridão), so that night falls without extra work.
65. As a Mestre, I want to fix a map's Ambiente to claro, Penumbra or Escuridão, so that caves are dark by day and full-moon nights are in Penumbra.
66. As a jogador, I want the map darkened outside the light, so that I feel the night.
67. As a jogador, I want to see enemies and NPCs that stand in Luz plena or Penumbra and not those in Escuridão, so that the map shows what my character sees.
68. As a jogador, I want to always see my companions' pins, even in the dark, so that I know where the group is.
69. As a jogador whose character is Cego, I want enemies and NPCs to vanish from my map while companions stay, so that the Condição feels real.
70. As a Mestre, I want to place fixed lights on the map (fogueira, braseiro, janela) with the radius I choose, so that the scene has its own light.
71. As a Mestre, I want to put a light on an enemy's or NPC's pin, so that a sentinel with a torch is visible from afar and reveals itself.
72. As a Mestre, I want to move and remove fixed lights, so that I can fix mistakes.
73. As a Mestre, I want to see the whole map with a lighter darkness, so that I can run the scene.
74. As a Mestre, I want "Ver como" a character, so that I check exactly what that player sees.
75. As a espectador, I want to see what the whole group sees together, so that I follow the scene without spoilers beyond the party.
76. As a jogador, I want each light drawn as a circle of Luz plena with a ring of Penumbra, so that I understand the radius.

**Tocha**

77. As a jogador, I want to light a Tocha from the Itens tab and from the Livre tab of the Hotbar, so that I find it in and out of combat.
78. As a jogador, I want lighting a Tocha to spend one Tocha from my inventory, so that torches are a resource.
79. As a jogador without a Tocha, I want the button disabled with the reason, so that I know why.
80. As a jogador with a lit Tocha, I want 6 m of Luz plena and 6 m more of Penumbra around my pin, so that the rule shows on the map.
81. As a jogador, I want my lit Tocha to stay lit when the Mestre changes the map, so that the light follows the character.
82. As a jogador, I want the Barra de Status or the Itens tab to show that my Tocha is lit, so that I remember it.
83. As a jogador, I want my Tocha to go out at a Descanso Curto or a Descanso Longo, so that the "queima por 1h" holds without a clock.
84. As a Mestre, I want to light and put out any character's Tocha from the pin, so that I can follow the narrative (wind, water, a lost torch).
85. As a jogador, I want to be unable to put out my own Tocha in the app, so that I ask the Mestre at the table.
86. As a Mestre, I want advancing the period not to put out torches, so that the night does not start in the dark for those who just lit one.

**Celular, web e acessibilidade**

87. As a Mestre on a phone, I want to show maps, move pins, mark Oculto, light and put out lights and change the Ambiente, so that I can run the map without a computer.
88. As a keyboard user, I want pins to be buttons with the Retrato's name, so that I can open the cartão without a mouse.
89. As a screen reader user, I want the map to announce the Mapa atual's name, so that I know where the scene is.
90. As a user who prefers reduced motion, I want pin moves without the slide animation, so that the map does not move on its own.

**Imagem do inimigo (fatia 0)**

91. As a Mestre, I want enemy images compressed and reduced like character portraits, so that the pins load fast on the players' phones.

## Implementation Decisions

**Conteúdo e motor**
- A **Biblioteca de mapas** é conteúdo tipado e validado por zod, como os itens: cada entrada tem `id` (nunca renomeado), nome, tipo (terreno liso ou imagem), textura ou caminho da imagem estática, colunas e linhas quando fixas, linhas do grid ligadas e a licença com a origem. Os terrenos lisos são gerados pelo app (cor e textura), sem arquivo de imagem.
- Um **motor do mapa** puro, sob as regras de pureza do motor (só importa de domínio, conteúdo e tipos; sem `Math.random`), com três partes:
  - **Grid:** Quadrado de 1,5 m; distância em Quadrados com a diagonal valendo 1 (o maior dos dois deslocamentos); metros = Quadrados × 1,5; encaixe de um ponto no centro do Quadrado; limites de colunas e linhas.
  - **Transformação de vista:** escala e deslocamento; conversão de tela para mapa e de mapa para tela; zoom em torno de um ponto (pinça e roda); limites de escala e de pan. É a mesma conta no Palco, no arrasto do pin e no editor de recorte.
  - **Luz e Visão:** dado o Ambiente efetivo, as Fontes de luz (posição, raio de Luz plena, raio de Penumbra) e um ponto, devolve o nível de luz no ponto (Luz plena, Penumbra ou Escuridão), com distância euclidiana (a luz é um círculo). Dado quem olha, devolve se um Retrato é visível: companheiros sempre; inimigos e NPCs só em Luz plena ou Penumbra; quem está Cego não vê inimigos nem NPCs; o Oculto nunca aparece para jogador nem espectador; o Mestre vê tudo; o espectador vê a soma da Visão do grupo.
  - **Ambiente efetivo:** o fixado no mapa ou, se não houver, o do período (Manhã e Tarde claro, Noite Escuridão).
- A **Tocha** ganha no motor os números da regra (6 m de Luz plena e mais 6 m de Penumbra) e as regras de acender (precisa de ao menos uma Tocha no inventário, gasta uma, Ação Livre) e de apagar (Descanso Curto, Descanso Longo ou o Mestre; o avanço de período não apaga).

**Cena do mapa (a costura principal)**
- A função que hoje monta os Retratos para quem olha passa a montar também a cena do mapa: para cada Retrato, a posição no mapa mostrado (ou Bandeja), se está Oculto, o nível de luz no seu Quadrado, se quem olha o vê e se é o do turno. Ela recebe quem olha (jogador e o personagem dele, Mestre, Mestre em "Ver como", espectador), os pins do mapa, as luzes, o Ambiente efetivo e as Condições. A tela só desenha o que ela devolve.
- A mesma filtragem do Oculto vale para a faixa de iniciativa, o feed do combate e a lista de alvos do Ataque dos jogadores (ADR 0011). A luz não filtra nada fora do mapa.

**Banco (migrations versionadas, RLS em toda tabela nova, funções com `revoke execute ... from public, anon`)**
- **Mapas do Mestre:** dono, nome, colunas, linhas, linhas do grid ligadas por padrão e data. Lê e escreve só o dono; os participantes de uma sessão que usa o mapa leem.
- **Imagem do mapa do Mestre:** tabela própria, uma linha por mapa, webp em base64, apagada em cascata com o mapa, **fora da publicação do Realtime** (ADR 0010). Mesmas regras de leitura do mapa.
- **Mapas da sessão:** sessão, referência ao mapa da Biblioteca **ou** ao mapa do Mestre (exatamente um), nome, colunas e linhas (para o terreno liso), linhas do grid ligadas, Ambiente fixado (nulo = segue o período) e ordem. O Mestre da sessão escreve; os participantes leem. Entra no Realtime.
- **Mapa atual:** coluna nova na sessão apontando para um mapa da sessão, nula quando não há mapa mostrado. O mapa que o Mestre prepara é estado só da tela dele, não vai ao banco.
- **Pins:** mapa da sessão, Retrato (personagem ou NPC simples, exatamente um), coluna, linha e a luz no pin (raios, nula sem luz). Um Retrato tem no máximo um pin por mapa. O Mestre escreve; os participantes leem. Entra no Realtime. Sem pin = Bandeja.
- **Luzes fixas:** mapa da sessão, coluna, linha, raio de Luz plena, raio de Penumbra e rótulo. O Mestre escreve; os participantes leem. Entra no Realtime.
- **Oculto:** por Retrato na sessão. Inimigo e NPC jogável usam a visibilidade que o personagem já tem; o NPC simples, a que ele já tem. "Entra Oculto" é feito ao gravar o primeiro pin de um inimigo na sessão. Na tela, a palavra "escondido" vira "Oculto".
- **`session_npcs`:** a política de leitura passa a entregar a linha a todo participante da sessão, sem olhar a visibilidade (ADR 0011). Isso faz o NPC Oculto sumir ao vivo.
- **Tocha acesa:** estado no personagem (acesa ou não). Acender é uma função que confere o dono, tira uma Tocha do inventário e marca a Tocha acesa numa transação. O Mestre acende e apaga qualquer uma. As funções do Descanso Curto e do Descanso Longo apagam as Tochas dos personagens da sessão.
- Bloquear a exclusão de um mapa do Mestre usado por uma sessão ativa.
- Depois de cada migration, `gen:types`; as tabelas novas do Realtime entram no guarda de publicação.

**Camada de dados**
- Funções novas na camada de dados para mapas do Mestre, imagem, mapas da sessão, Mapa atual, pins, luzes e Tocha, lançando o erro do Supabase. A imagem é lida por id, com cache imutável no React Query (a imagem de um id nunca muda).
- As assinaturas do Realtime da sessão ganham mapas da sessão, pins e luzes; a troca do Mapa atual chega pela assinatura que já existe da sessão.

**Tela**
- **Palco:** com Mapa atual, mostra o mapa; sem ele, os Retratos de hoje. Grid e luz desenhados em SVG (grade como padrão; a escuridão como máscara com círculos de Luz plena e anéis de Penumbra), pins como botões com o `CharacterAvatar`. Pan e zoom próprios com Pointer Events e CSS transform; sem dependência nova. O Palco mantém a margem do trilho no celular (ADR 0009).
- **Pin:** só o Mestre arrasta; ao soltar, encaixa e grava; durante o arrasto mostra Quadrados e metros desde a origem. Arrastar sobre um pin move o pin; arrastar fora dele move o mapa. Os outros aparelhos animam a mudança com `motion`, e o movimento reduzido deixa só o salto.
- **Painel "Mapas"** no trilho do Mestre (novo ícone): lista dos mapas da sessão, preparar e "Mostrar aos jogadores", voltar à cena, somar da Biblioteca ou dos mapas dele, linhas do grid, Ambiente e luzes fixas; na web, enviar e recortar. O passo "Mapas" do assistente reaproveita o seletor.
- **Bandeja** na borda do mapa do Mestre, com os Retratos sem pin naquele mapa.
- **Editor de recorte (web):** imagem por baixo do grid, arrastar e ampliar a imagem, escolher colunas e linhas, salvar como webp de até 2048 px no lado maior. A compressão reaproveita a do retrato do personagem, extraída na fatia 0.
- **Ataque:** o painel mostra a distância em metros até o alvo quando os dois têm pin no Mapa atual; nada trava.
- **Hotbar:** a Tocha aparece em Itens e em Livre, com o Cartão de Habilidade de hoje; desabilitada com o motivo quando não há Tocha ou ela já está acesa.
- **Mestre:** vê todos os pins, com o Oculto translúcido e marcado, e a escuridão mais leve; "Ver como" troca a cena pela Visão de um personagem; acende e apaga a Tocha e marca Oculto pelo pin ou pelo cartão.
- **Celular:** o Mestre faz tudo menos enviar, recortar e cuidar dos mapas dele, que aparecem como "na web".

**Fatias**
0. `fix:` comprimir a imagem do inimigo como o retrato do personagem.
1. Mapa atual com terreno liso.
2. Pins.
3. Envio e recorte em Quadrados.
4. Oculto.
5. Luz e Visão.
6. Tocha.

## Testing Decisions

- Um bom teste olha o comportamento de fora: dada uma cena (mapa, pins, luzes, período, quem olha), o que aparece e onde; dada uma política, quem lê e quem escreve. Nada de testar o estado interno de componentes nem o SVG gerado linha a linha.
- **Costura principal: a cena do mapa.** Testes de unidade da função que monta os Retratos, estendida, cobrindo jogador, Mestre, "Ver como" e espectador; Oculto; Bandeja; luz do Ambiente e das Fontes; Cego; companheiros. Prior art: os testes que já existem dessa função.
- **Motor do mapa** com Vitest: distância com diagonal, metros, encaixe, limites; transformação de vista (ida e volta tela ↔ mapa, zoom em torno de um ponto); nível de luz nos limites exatos dos raios (6 m e 12 m da Tocha); Ambiente efetivo por período e fixado; regras de acender e apagar a Tocha. Prior art: os testes do motor de ataque, de munição e do relógio da sessão.
- **Conteúdo:** a Biblioteca entra no gate de dados (esquema válido, ids únicos, licença presente).
- **RLS por papel** em `supabase/tests/rls.sql` (anon, jogador, outro jogador, Mestre, Mestre de outra sessão): mapas do Mestre e imagem (só o dono escreve; participante de sessão que usa o mapa lê; estranho não lê), mapas da sessão, pins e luzes (só o Mestre da sessão escreve), Mapa atual, a leitura aberta de `session_npcs`, a função de acender a Tocha (dono ou Mestre, gasta uma, recusa sem Tocha) e o apagar no Descanso. Roda com `npm run test:rls-db`.
- **Componentes** só nos gestos: arrastar o pin do Mestre (encaixe e régua), jogador sem arrasto, pin como botão que abre o cartão, editor de recorte que devolve colunas e linhas inteiras. Prior art: os testes do Palco e do `dock-panel`.
- **E2E** em `e2e/map.spec.ts`, também no projeto `mobile`: o Mestre soma um terreno, mostra o mapa e o jogador o vê trocar; o Mestre arrasta um pin e o jogador o vê mudar; o inimigo posto no mapa não aparece para o jogador até ser revelado; o NPC ocultado some ao vivo; o jogador acende a Tocha. O envio de imagem tem um caso só, na web.
- **À mão:** pinça e arrasto num iPhone e num Android reais.

## Out of Scope

- Paredes, linha de visão, portas e névoa de guerra com memória (nível 2 e 3 da iluminação).
- Segredo no servidor: posições e estados chegam a todos os aparelhos (ADR 0011).
- Visão no escuro de jogadores (nenhuma tribo tem) e Lamparina de azeite ou outro item de luz.
- Automatizar a Desvantagem da Penumbra em Percepção ou de atacar quem não se vê; travar o Ataque pelo alcance.
- O jogador mover o próprio pin; conferir o deslocamento pelo app.
- Mapas desenhados na Biblioteca: entram num PR de conteúdo quando o autor trouxer as imagens.
- Armadilhas no mapa, desenho livre, anotações e régua livre fora do arrasto.
- Recomprimir as imagens de inimigo já gravadas.
- Storage do Supabase (ADR 0010).

## Further Notes

- A descrição da Tocha em `src/content/items.ts` ainda diz "Ilumina 6m. Queima por 1h"; a fatia 6 a atualiza, com `npm run gen:items-seed` e a migration do seed.
- A ordem das fatias foi escolhida pelo autor: pins antes do envio, para o mapa ser útil já com terreno liso.
- O autor confirmou a regra nova (grid de 1,5 m, luz, Ambiente, Tocha) no grill; `docs/regras-base.md` 6.7 é a fonte da verdade.
- Os tickets do passo 1 (`.scratch/layout-da-sessao/issues/`) ainda dizem `ready-for-agent`, embora entregues.
