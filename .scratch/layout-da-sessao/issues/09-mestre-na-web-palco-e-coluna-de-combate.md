# 09: Mestre na web: Palco e coluna de combate

**What to build:** O Palco do Mestre mostra todos os Retratos, com o NPC escondido marcado como tal, e os alertas de Ruptura e Morrendo empilhados no topo.

Na web, no combate, uma coluna direita fixa traz:
- a iniciativa;
- o participante em foco, com dano, Condições e controles de morte;
- os usos de Habilidade pendentes;
- as Habilidades de inimigo.

Fora do combate, a coluna mostra os cartões dos jogadores. Nada anima nas listas do Mestre.

**Blocked by:** 06, 08

**Status:** ready-for-agent

- [ ] Palco do Mestre com todos os Retratos e o NPC escondido marcado
- [ ] Alertas de Ruptura e Morrendo no topo do Palco
- [ ] Coluna de combate com os componentes de hoje (iniciativa, participante em foco, pendentes, Habilidades de inimigo)
- [ ] Cartões dos jogadores na coluna fora do combate
- [ ] Sem animação nas listas do Mestre
- [ ] E2E `combat`, `ability` e `attack` passam do lado do Mestre
