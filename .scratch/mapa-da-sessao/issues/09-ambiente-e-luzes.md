# 09: Ambiente e luzes

**What to build:** cada mapa tem um Ambiente que segue o período (Manhã e Tarde claro, Noite Escuridão) ou que o Mestre fixa (claro, Penumbra, Escuridão). O Mestre põe, move e tira luzes fixas no mapa com os raios que escolhe e põe luz no pin de um inimigo ou NPC. O mapa do jogador escurece fora da luz, com círculos de Luz plena e anéis de Penumbra, e inimigos e NPCs só aparecem na Luz plena ou na Penumbra. Os companheiros do grupo aparecem sempre.

**Blocked by:** 08

**Status:** ready-for-agent

- [x] Motor do mapa, parte de luz: Ambiente efetivo (fixado ou pelo período) e nível de luz num ponto pelas Fontes de luz, com distância euclidiana; testes nos limites exatos dos raios.
- [x] Migration: luzes fixas (mapa da sessão, coluna, linha, raios, rótulo) e a luz no pin (raios), com RLS (Mestre escreve, participantes leem) e Realtime; `gen:types`; `rls.sql`.
- [x] Painel Mapas: Ambiente do mapa; colocar, mover e tirar luzes fixas; luz no pin pelo cartão ou pelo pin.
- [x] A cena do mapa devolve o nível de luz de cada Retrato e se o jogador o vê (companheiros sempre; inimigos e NPCs só em Luz plena ou Penumbra); o Oculto continua valendo por cima; testes de unidade.
- [x] Máscara SVG de escuridão no Palco do jogador.
- [x] A luz não filtra a iniciativa, o feed nem os alvos.
