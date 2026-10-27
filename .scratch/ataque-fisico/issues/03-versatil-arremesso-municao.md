# 03: Versátil, arremesso e munição

**What to build:** com arma Versátil e a outra mão livre, o jogador ataca com as duas mãos e o dado de dano maior. Nas armas de arremesso (Lança, Adaga, Dardo), ele escolhe "Corpo a corpo" ou "Arremesso", e o atributo e a regra do alvo Caído seguem a escolha. Funda e arco contam sempre como ataque à distância, gastam 1 munição por ataque e bloqueiam o ataque com o motivo quando a munição acaba; o arremesso não gasta munição. Spec: `../spec.md` (histórias 8, 10, 11, 40 a 42).

**Blocked by:** 01 (Ataque básico de ponta a ponta)

**Status:** ready-for-agent

- [ ] Motor: dado do Versátil, modo de arremesso (atributo e à distância), arma de munição sempre à distância
- [ ] Serviço: munição gasta pela regra existente, ataque bloqueado com 0, arremesso sem gasto
- [ ] Painel do jogador: escolha do Versátil e do modo, aviso de munição
- [ ] Testes do motor, do serviço, dos componentes e um E2E (arco gasta munição; sem munição bloqueia), com mutação conferida
