# 04: Gastar Dados de Vida no Descanso Curto

**What to build:** com o descanso aberto, o jogador gasta um Dado de Vida por vez (digitado ou Rolagem Virtual). Cada dado cura o rolado + CON, no mínimo 1, até o PV máximo; Sangue Resiliente soma +1. Desabilitado com PV cheio, sem dados ou Morrendo; Estável gasta e acorda. O Mestre gasta pelos NPCs jogáveis e o PV sobe na tela dele.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] Motor: se pode gastar (com motivo) e a cura de um dado, com testes de seed fixa
- [ ] Gasto grava PV novo e gastos + 1 numa só atualização
- [ ] Botões desabilitados com o motivo à vista
- [ ] Mestre gasta pelos NPCs jogáveis
- [ ] Teste de componente e E2E (o PV sobe na tela do Mestre)
