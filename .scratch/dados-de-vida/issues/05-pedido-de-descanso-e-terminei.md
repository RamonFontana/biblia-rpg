# 05: Pedido de Descanso e "Terminei"

**What to build:** o jogador pede e retira o Pedido de Descanso; o cartão mostra "2 de 4 pediram (nomes)" e o motivo do bloqueio (combate ativo, sem Descanso Curto restante, descanso já aberto). O último pedido abre o descanso "a pedido do grupo", contando 1 dos 2 do dia. O Mestre pode recusar. "Terminei" lista quem acabou e o último a terminar fecha o descanso.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Motor: quem conta no "todos" (sem Morto, Morrendo conta), motivo de bloqueio, abrir no último pedido, fechar no último "Terminei"
- [x] Funções no banco para pedir, retirar e terminar; as ações do Mestre usam as mesmas; pedidos zeram ao abrir e na virada do dia
- [x] Testes em `rls.sql` por papel (anon, jogador, jogador de fora, Mestre)
- [x] Cartão com pedir/retirar/recusar/Terminei
- [x] Teste de componente e E2E com dois jogadores
