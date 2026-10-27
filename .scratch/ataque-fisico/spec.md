# Ataque físico: acerto, dano, crítico e registro

Status: ready-for-agent

Onda 5, feature 2. Decisões do autor no grill de 2026-10-25. Termos: `CONTEXT.md` (Ataque, Acerto Crítico, Falha Crítica, CA, Vantagem, Desvantagem, Inspiração, Condição, Resistência a Condição, Proficiência de armadura, Morrendo, Rolagem Virtual). Regras: `docs/regras-base.md`, seção 6; `docs/itens/armas.md`. ADRs: 0001 (dados físicos, o app registra), 0004 (regras no motor, cliente confiável) e 0005 (o ataque grava o dano por uma função no banco).

## Problem Statement

No combate, o jogador não tem como atacar pelo app. A tela de rolagem física existe, mas está parada: não sabe o alvo, não compara com a CA, não aplica dano e só mexe no efeito de arma. Hoje cada jogador faz a conta de cabeça (d20, atributo, Proficiência), pergunta ao Mestre se acertou, e o Mestre digita o dano em "Modificar Vida". Isso atrasa a mesa, gera erros (atributo errado, Proficiência somada sem ser proficiente) e não deixa registro do que aconteceu. O doc também não diz o que acontece num 20 ou num 1 natural.

## Solution

No próprio turno, o jogador escolhe o alvo (inimigo, NPC ou aliado do combate) e ataca com a arma da mão principal, com a Versátil a duas mãos ou desarmado. Ele digita o d20 natural do dado físico (ou usa a Rolagem Virtual). O app soma o atributo certo e a Proficiência quando cabe, aplica a Vantagem ou a Desvantagem das Condições (e a Inspiração, se ele quiser) e diz "Acertou" ou "Errou", sem revelar a CA. No acerto, ele digita o dano com o lembrete do dado. O app soma o modificador, tira o PV do alvo, aplica o efeito de arma no 18+ natural e gasta a munição. O 20 natural é Acerto Crítico (dados de dano rolados duas vezes); o 1 natural é Falha Crítica. O Mestre recebe o aviso, vê os números e o histórico dos ataques no painel; o aliado atingido também é avisado.

## User Stories

### Escolher o ataque

1. As a player, I want an "Atacar" panel in my combat screen during my turn, so that I attack without asking the Mestre to do the math.
2. As a player, I want the panel to be unavailable outside my turn, so that the turn order is respected.
3. As a player, I want the attack to mark my Ação as used, so that the turn checklist stays correct.
4. As a player, I want the attack blocked when my Ação is already used, so that I do not attack twice by mistake.
5. As a player, I want to be able to unmark my Ação by hand, so that abilities that grant extra attacks or the Mestre's call still work.
6. As a player, I want to pick the target from the enemies, NPCs and allies in the current combat, so that I can hit anyone at the table, as in a tabletop game.
7. As a player, I want to see my main-hand weapon with its damage die and properties, so that I know what I am attacking with.
8. As a player with a Versátil weapon and a free off hand, I want to choose to attack with two hands, so that I use the bigger die.
9. As a player without a weapon in the main hand, I want an unarmed attack (1 + FOR), so that I can still fight.
10. As a player with a thrown weapon (Lança, Adaga, Dardo), I want to choose "Corpo a corpo" or "Arremesso", so that the rules for the attack follow how I used it.
11. As a player with a sling or a bow, I want the attack always treated as ranged, so that I do not need to choose.

### Acertar

12. As a player, I want to type the natural d20 I rolled, so that the physical die stays the source of truth.
13. As a player without dice, I want the Rolagem Virtual for the d20, so that I can still attack.
14. As a player, I want the app to add FOR in melee, DES with ammunition weapons and the higher of the two with Acuidade, so that the right attribute is used.
15. As a player, I want the screen to show which attribute entered the sum, so that I understand the total.
16. As a player, I want my Proficiência added only when my Vocação is proficient with the weapon, so that the rule is right.
17. As a player, I want a "Não proficiente" notice on the weapon, so that I know why the bonus is missing.
18. As a player, I want to see only "Acertou" or "Errou", so that the enemy's CA stays a secret.
19. As a player, I want a natural 20 to always hit as an Acerto Crítico, so that the best roll is rewarded.
20. As a player, I want a natural 1 to always miss as a Falha Crítica, so that the rule is clear.
21. As a Mestre, I want to see the natural d20, the total and the target's CA of each attack, so that I can check the result.

### Vantagem e Desvantagem

22. As a player who is Envenenado, Cego or Impedido, I want my attacks to have Desvantagem automatically, so that my Conditions apply.
23. As a player attacking a target that is Atordoado, Paralisado or Cego, I want Vantagem automatically, so that the target's Conditions apply.
24. As a player attacking a Caído target in melee, I want Vantagem; at range, Desvantagem, so that the doc's rule holds.
25. As a player, I want Vantagem and Desvantagem in the same attack to cancel into a single die, so that the rule matches the Tests.
26. As a player, I want the screen to say whether I roll with Vantagem or Desvantagem, why, and "role dois d20 e use o maior/menor", so that I roll the right dice.
27. As a player using the Rolagem Virtual with Vantagem or Desvantagem, I want two d20 rolled and the one that counts used, so that I do not choose by mistake.
28. As a player who is Inabalável with Inspiração available, I want to spend it on the attack for Vantagem, so that I use it where it matters.
29. As a player, I want the Inspiração spent on an attack to count only when the attack is sent, so that cancelling does not waste it.

### Dano

30. As a player who hit, I want to type the damage dice I rolled, so that the physical dice decide the damage.
31. As a player, I want the reminder of the dice to roll ("role 1d8", "role 2d8" in a critical), so that I roll the right dice.
32. As a player, I want the app to add my attribute modifier once to the damage, so that the critical does not double the modifier.
33. As a player without dice, I want the Rolagem Virtual to roll the right damage dice, so that I can finish the attack.
34. As a player, I want the damage taken from the target's PV right away, so that the table does not wait for the Mestre.
35. As a player, I want the damage never to take PV below 0, so that the rules for 0 PV take over.
36. As a Mestre, I want to correct a wrong damage in "Modificar Vida", so that mistakes are easy to fix.
37. As a Mestre, I want two attacks in a row on the same target to both count, so that no damage is lost.

### Efeito de arma e munição

38. As a player with a weapon effect, I want it applied when I hit with a natural 18 or more, so that the doc's trigger works.
39. As a player, I want the target's Resistência a Condição to reduce or cancel the weapon effect, so that armor matters.
40. As a player with a sling or a bow, I want one ammunition spent per attack, so that I do not track it by hand.
41. As a player with no ammunition left, I want the attack blocked with the reason, so that I know I must recover or buy more.
42. As a player throwing a weapon, I want no ammunition spent, so that thrown weapons are not treated as ammunition.

### Avisos e registro

43. As a Mestre, I want a notice for every attack ("Eliabe acertou o Filisteu: 7 de dano" or "Eliabe errou o Filisteu"), so that I follow the fight.
44. As a Mestre, I want the latest attacks listed in the combat panel, so that I can review what happened.
45. As a player hit by an ally, I want a notice "Você foi atingido por Eliabe: 5 de dano", so that I know what happened to me.
46. As a Mestre, I want a notice when the target was already Morrendo, so that I mark the Teste de Morte failure myself.
47. As a Mestre, I want every attack recorded with attacker, target, dice, total, hit, critical, damage and mode, so that the app keeps the record.
48. As a Mestre, I want the weapon effect activation in the notice, so that I narrate it.

### Segurança

49. As a Mestre, I want only a player in the same combat, during their turn, to be able to apply an attack, so that no one changes PV outside the rules.
50. As a Mestre, I want attacks from outside the combat or from anonymous users refused, so that the table is safe.

## Implementation Decisions

- **Motor (`domain`), módulo puro de ataque:**
  - Entrada: atributos e Vocação do atacante, a arma (dano, propriedades, categoria; ou desarmado), Versátil a duas mãos, o modo (corpo a corpo ou arremesso, que define se o ataque é à distância), as Condições do atacante e do alvo, se a Inspiração foi gasta, o d20 natural (ou os dois) e a CA do alvo.
  - Saída: o atributo usado e o modificador, a Proficiência somada (ou não, e por quê), o total, acerto, Acerto Crítico, Falha Crítica, a modalidade com os motivos, o lembrete dos dados de dano (dobrados no crítico) e o dano final a partir dos dados digitados (mais o modificador uma vez, mínimo 0 no alvo pelo cálculo de PV que já existe).
  - Atributo: FOR no corpo a corpo e no arremesso sem Acuidade; DES com arma de munição; o maior com Acuidade. Desarmado: dano 1 + FOR, sem dado.
  - Proficiência: pela regra de proficiência de arma da Vocação que já existe, levada para o motor.
  - Modalidade: reaproveita o motor de Vantagem e Desvantagem dos Testes (anulação, dado que vale no d20, Rolagem Virtual de dois dados), com as fontes das Condições: Envenenado, Cego e Impedido no atacante dão Desvantagem; Atordoado, Paralisado e Cego no alvo dão Vantagem; Caído no alvo dá Vantagem no corpo a corpo e Desvantagem à distância; a Inspiração dá Vantagem.
  - 20 natural acerta sempre; 1 natural erra sempre; o efeito de arma dispara com acerto e natural 18 ou mais.
  - A aleatoriedade da Rolagem Virtual entra pela `Rng` injetada.
- **Schema (uma migration):**
  - Tabela `combat_attacks` com RLS: combate, atacante e alvo (participantes), d20 natural (e os dois, se rolados), total, CA do alvo, acerto, crítico, falha crítica, dano aplicado, modalidade, Inspiração usada, se o efeito de arma disparou, e a data. Leitura para quem está na sessão do combate; escrita só pela função.
  - Função `SECURITY DEFINER` de ataque (ADR 0005), com `search_path` fixo e `revoke execute ... from public, anon`: confere que o chamador controla o atacante, que atacante e alvo estão no mesmo combate e que é o turno do atacante; aplica o dano no PV do participante alvo de forma atômica (sem ler o PV do cliente), mescla as Condições do efeito de arma já resolvidas pela Resistência e grava o ataque.
  - A tabela entra na publicação do Realtime (o teste de publicação acompanha). Depois, `gen:types` e o `rls.sql`. Aplicar na produção com o autor.
- **Serviço de ataque:** monta a chamada a partir do resultado do motor, resolve as Condições do efeito de arma pela Resistência a Condição do alvo, gasta a munição pela regra existente e, com a Inspiração, marca o dia na ficha depois do envio.
- **Tela do jogador:** o painel "Atacar" substitui o `PhysicalRollForm` (sai o código e as suas 4 supressões de lint). Alvo, arma, Versátil, modo do arremesso, d20 (digitado ou virtual), modalidade com motivo e lembrete, "Usar Inspiração", resultado "Acertou/Errou", dano (digitado ou virtual) e o envio. Só no próprio turno e com a Ação livre; marca a Ação.
- **Tela do Mestre:** aviso de cada ataque (com os números e o efeito de arma) e a lista dos últimos ataques no painel do combate. O aviso de alvo Morrendo.
- **Aliado atingido:** aviso na tela dele.
- **Doc:** `docs/regras-base.md` 6.2 ganha o Acerto Crítico, a Falha Crítica e a ressalva de que a Proficiência só entra com arma em que a Vocação é proficiente.
- **Cliente confiável (ADR 0004):** a função não recalcula o acerto nem o dano; ela confere quem pode gravar.

## Testing Decisions

- **Bom teste:** comportamento externo nas camadas combinadas (motor, serviço, banco por papel, tela de ponta a ponta), sem olhar detalhes internos; nomes e expectativas em português; tests-first, com mutação conferida em cada regra nova.
- **Motor (camada principal):** atributo por tipo de arma (corpo a corpo, Acuidade com FOR ou DES maior, munição, arremesso com e sem Acuidade, desarmado); Proficiência com e sem proficiência; acerto na fronteira da CA (igual acerta, um a menos erra); 20 e 1 naturais contra qualquer CA; modalidade por cada Condição do atacante e do alvo, Caído nos dois modos, Inspiração e anulação; lembrete e dano no crítico com o modificador uma vez; Versátil; gatilho do efeito de arma (17 não, 18 sim, só no acerto). Prior art: os testes do motor de Vantagem e Desvantagem e da Fé.
- **Serviço:** chamada da função com o resultado do motor, munição gasta e bloqueada com 0, arremesso sem munição, efeito de arma pela Resistência, Inspiração marcada só no envio, com o Supabase falso. Prior art: os testes do serviço de Testes de sessão.
- **Banco:** `rls.sql`: o atacante no próprio turno aplica o dano e o ataque fica registrado; fora do turno, quem não está no combate, anon e estranho são recusados; aliado como alvo funciona; dois ataques seguidos somam; quem está na sessão lê os ataques; ninguém grava em `combat_attacks` direto. Prior art: o `rls.sql` atual.
- **Tela (E2E):** Mestre e jogador em navegadores separados: o Mestre inicia o combate e passa o turno; o jogador ataca um inimigo e acerta, o PV muda nos dois navegadores e o Mestre vê o aviso e o registro; um 20 natural pede os dados dobrados; ataque a um aliado avisa o atingido; arco gasta munição. Prior art: as specs atuais de combate no E2E.
- **Componentes:** testes do painel novo de ataque e ajustes dos testes existentes da tela de combate do jogador e do painel do Mestre.

## Out of Scope

- Ataque dos inimigos e dos NPCs controlados pelo Mestre (o Mestre segue digitando o dano em "Modificar Vida").
- Falha automática no Teste de Morte quando um golpe atinge quem está Morrendo (o Mestre marca).
- Segunda arma como Ação Bônus.
- Conferência de alcance em metros (o Mestre julga).
- Tipos de dano com resistência a dano.
- Habilidades que concedem ataques extras ou bônus (feature 4, efeitos de Habilidade).

## Further Notes

- O PV de combate é o `hp_current` do participante, como no "Modificar Vida"; o fim do combate continua levando o PV para a ficha como hoje.
- A espera de 1,5 s do "Modificar Vida" (dois danos seguidos) pode ser revista depois que a função atômica existir.
- Os testes E2E da feature entram na suíte semanal do CI.
