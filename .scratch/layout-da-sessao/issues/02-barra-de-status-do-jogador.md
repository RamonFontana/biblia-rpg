# 02: Barra de Status do jogador

**What to build:** O jogador vê sempre, no topo:
- o Retrato e o nome;
- o PV em barra e número (`12/18`);
- a Fé Atual com o selo do Estado de Fé;
- as Condições com as rodadas que faltam;
- a Inspiração (tocar usa, pelo fluxo de hoje);
- o selo de turno no combate;
- o chip de dia e período.

No celular a barra tem duas linhas, e tocar na área do personagem abre o Painel Ficha. No dano e na cura, a barra de PV corre e o número pisca em vermelho ou verde.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Barra de Status com tudo o que está listado acima, com os valores de hoje (nenhuma regra muda)
- [x] Tocar no personagem abre o Painel Ficha
- [x] Motion no dano e na cura; com "reduzir movimento", só opacidade e o número troca sem contar (testado pelo resultado)
- [x] Alvos de toque de no mínimo 44 px; só cores da paleta
- [x] Teste de componente da Barra de Status (Condições com rodadas, Estado de Fé, Inspiração e selo de turno)
- [x] E2E (`faith` e `session`) acha PV, Fé e Condições na Barra de Status no desktop e no `mobile`
