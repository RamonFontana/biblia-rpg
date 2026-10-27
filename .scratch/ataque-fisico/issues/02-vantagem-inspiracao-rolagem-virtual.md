# 02: Vantagem e Desvantagem no ataque, Inspiração e Rolagem Virtual

**What to build:** a modalidade do ataque vem sozinha das Condições: Envenenado, Cego ou Impedido no atacante dão Desvantagem; Atordoado, Paralisado ou Cego no alvo dão Vantagem; Caído no alvo dá Vantagem no corpo a corpo e Desvantagem à distância. Vantagem e Desvantagem se anulam. O jogador vê a modalidade, o motivo e o lembrete ("role dois d20 e use o maior/menor") e pode gastar a Inspiração no ataque (Vantagem, contada só no envio). A Rolagem Virtual rola o d20 (dois com Vantagem ou Desvantagem, destacando o que vale) e os dados de dano (dobrados no crítico). O ataque grava a modalidade e a Inspiração usada. Spec: `../spec.md` (histórias 13, 22 a 29 e 33).

**Blocked by:** 01 (Ataque básico de ponta a ponta)

**Status:** ready-for-agent

- [ ] O motor de ataque reaproveita o motor de Vantagem e Desvantagem dos Testes, com as fontes das Condições e da Inspiração
- [ ] Painel do jogador: modalidade, motivo, lembrete, "Usar Inspiração" e Rolagem Virtual do d20 e do dano
- [ ] Inspiração marcada na ficha só depois do envio do ataque
- [ ] Testes do motor (cada Condição do atacante e do alvo, Caído nos dois modos, Inspiração, anulação), do serviço, dos componentes e um E2E (ataque com Desvantagem por Condição pela Rolagem Virtual), com mutação conferida
