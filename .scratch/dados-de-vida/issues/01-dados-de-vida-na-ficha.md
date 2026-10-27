# 01: Dados de Vida na ficha e no cartão do Mestre

**What to build:** o personagem passa a ter uma reserva de Dados de Vida igual ao nível, no dado da Vocação. A ficha e o cartão do jogador na tela do Mestre mostram "Dados de Vida 5/5 (d10)". Prefatoração: o dado da Vocação fica num lugar só do motor, e o PV inicial e a média do level-up passam a ler dele, sem mudar nenhum valor.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] O motor tem o dado da Vocação (10 Guerreiro/Caçador, 8 demais) e o estado dos Dados de Vida (total = nível, restantes, dado)
- [ ] PV inicial e média do level-up leem do motor; os testes atuais continuam verdes
- [ ] Migration: coluna de Dados de Vida gastos em `characters` (inteiro, padrão 0, não negativo) e a do último Descanso Curto recarregado
- [ ] Ficha e cartão do jogador do Mestre mostram "Dados de Vida restantes/total (dX)"
- [ ] Teste de componente e E2E da exibição
