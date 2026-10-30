# 06: Combate no Palco

**What to build:** No combate, o Palco mostra:
- a faixa de iniciativa no topo, com quem age agora e quem vem depois;
- o feed dos 3 últimos eventos do histórico do combate; tocar no feed abre o Painel Histórico.

Quando chega o turno do jogador, a faixa "É o seu turno" entra, a Hotbar acende e o anel do Retrato pulsa duas vezes e para.

**Blocked by:** 05

**Status:** ready-for-agent

- [x] Faixa de iniciativa com quem age agora marcado
- [x] Feed com os 3 últimos eventos (ataques e usos de Habilidade); tocar abre o Histórico
- [x] Motion do turno: a faixa, a Hotbar acendendo e o anel que pulsa duas vezes e para. Nada em loop e nenhuma transição acima de cerca de 300 ms segura o toque
- [x] O reduced-motion é testado
- [x] E2E `combat`: a iniciativa e o feed aparecem e o turno chega ao jogador, no desktop e no `mobile`
