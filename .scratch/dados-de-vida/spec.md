# Dados de Vida e o Descanso Curto do grupo

Status: ready-for-agent

Onda 5, feature 3. Decisões do autor: Rodada 2, Q6 (2026-10-24), e o grill de 2026-10-27. Termos: `CONTEXT.md` (Dado de Vida, Descanso Curto, Pedido de Descanso, Descanso Longo, Morrendo, Estável, Morto, Rolagem Virtual, PV). Regras: `docs/regras-base.md`, seções 6.3 e 6.4; `docs/vocacoes/*.md` (Dado de Vida de cada Vocação); `docs/tribos/manasses.md` (Sangue Resiliente). ADRs: 0001 (dados físicos, o app registra), 0004 (regras no motor, cliente confiável) e 0006 (o Pedido de Descanso abre o Descanso Curto por uma função no banco, e cada cliente recarrega o próprio personagem).

## Problem Statement

O doc diz que no Descanso Curto o personagem gasta Dados de Vida para recuperar PV e que o Descanso Longo devolve metade dos gastos, mas o app não tem Dados de Vida. Hoje o Mestre aperta "Descanso Curto", digita um número num aviso do navegador e todos os personagens, NPCs inclusive, curam esse mesmo valor. Ninguém escolhe quanto se cura nem guarda cura para depois, e o Guerreiro de nível 5 cura o mesmo que o Sacerdote de nível 1. Também só o Mestre pode começar o descanso: o grupo que quer parar precisa pedir em voz alta, e o celular do jogador nem mostra se o descanso está disponível (o indicador do jogador ainda usa a regra antiga de um Descanso Longo a cada 2 dias).

Três coisas ao redor também divergem do combinado: o 1d4 de Fé do Descanso Longo é rolado pelo app, quando a decisão era o Mestre digitar (ADR 0001); e o personagem não entra "Descansado" numa sessão nova, como manda o `regras-base.md` 6.3 (PV máximo e usos de Habilidade restaurados).

## Solution

Cada personagem com ficha passa a ter uma reserva de Dados de Vida igual ao seu nível, no dado da sua Vocação (d10 para Guerreiro e Caçador, d8 para Batedor e Sacerdote/Sábio). A ficha e o cartão do jogador na tela do Mestre mostram "Dados de Vida 3/5 (d10)".

O Descanso Curto vira um momento aberto da sessão, num cartão igual nas duas telas. Ele abre de dois jeitos: o Mestre o abre, ou todos os jogadores fazem o Pedido de Descanso e ele abre sozinho. O cartão mostra quantos pediram e quem, quantos Descansos Curtos restam no dia e por que o pedido está bloqueado (combate em andamento, nenhum restante hoje). O Mestre pode recusar o pedido, o que zera os pedidos.

Com o descanso aberto, o jogador gasta Dados de Vida um de cada vez: digita o dado físico ou usa a Rolagem Virtual, vê quanto curou (o valor rolado mais o modificador de CON, no mínimo 1, até o PV máximo) e decide se gasta outro. O Mestre gasta pelos NPCs jogáveis. Quando termina, o jogador marca "Terminei"; o descanso fecha quando todos terminam ou quando o Mestre o encerra. O cartão diz quem abriu o descanso (o Mestre ou o grupo) e quem já terminou. As Habilidades que recarregam no Descanso Curto recarregam quando o descanso abre.

O Descanso Longo devolve metade dos Dados de Vida gastos, arredondada para cima, e o Mestre digita o 1d4 de Fé (ou usa a Rolagem Virtual). Uma sessão nova devolve todos os Dados de Vida e deixa o personagem Descansado: PV máximo e usos de Habilidade restaurados.

## User Stories

1. As a jogador, I want to see how many Dados de Vida my character has left and which die they are, so that I know how much healing I still have in reserve.
2. As a jogador, I want my number of Dados de Vida to equal my level, so that the reserve grows as my character grows.
3. As a jogador, I want my Dado de Vida to be the die of my Vocação, so that a Guerreiro heals more per die than a Sacerdote, as the doc says.
4. As a Mestre, I want to see each player's Dados de Vida on the player's card, so that I can plan how hard the next scene can hit.
5. As a Mestre, I want to open a Descanso Curto with one button, so that the group can rest when the story allows.
6. As a jogador, I want to make a Pedido de Descanso from my phone, so that the group can ask for a rest without stopping the table.
7. As a jogador, I want to withdraw my Pedido de Descanso, so that I can change my mind before the rest opens.
8. As a jogador, I want to see how many players asked and who, so that I know whether the rest is about to open.
9. As a Mestre, I want to see the Pedidos de Descanso as they come in, so that I know the group wants to stop.
10. As a jogador, I want the Descanso Curto to open by itself when every player asked, so that the group does not depend on the Mestre clicking.
11. As a Mestre, I want to refuse a Pedido de Descanso, so that the group cannot rest in the middle of a chase or an ambush.
12. As a jogador, I want to see that the Mestre refused the request, so that I understand why the rest did not open.
13. As a jogador, I want to see why I cannot ask for a rest (combate em andamento, nenhum Descanso Curto restante hoje, descanso já aberto), so that the button is never a mystery.
14. As a jogador, I want the Pedidos de Descanso to be counted only among players whose characters are not Morto, so that a dead character does not block the rest forever.
15. As a jogador whose character is Morrendo, I want to still be able to ask for a rest, so that I, as a player, take part in the group's decision.
16. As a jogador, I want a rest opened by the group to count as one of the two Descansos Curtos of the day, so that the limit is the same no matter who opened it.
17. As a jogador, I want the Pedidos de Descanso to reset when the rest opens or the day changes, so that an old request does not open a rest later.
18. As a jogador, I want the card to say whether the Mestre or the group opened the rest, so that the interface makes it clear how we got here.
19. As a jogador, I want to spend one Dado de Vida at a time, so that I can see the result before deciding whether to spend another.
20. As a jogador, I want to type the value of my physical die, so that the table keeps rolling real dice (ADR 0001).
21. As a jogador, I want to use the Rolagem Virtual when I do not have the die, so that I can still spend a Dado de Vida.
22. As a jogador, I want the app to add my CON modifier to each die, so that I do not have to do the math.
23. As a jogador with a negative CON modifier, I want each die to heal at least 1 PV, so that spending a die is never worthless.
24. As a jogador, I want healing to stop at my PV máximo, so that I do not waste the die on more than I can hold.
25. As a jogador at PV máximo, I want the spend button disabled, so that I do not spend a die by mistake.
26. As a jogador with no Dados de Vida left, I want the spend button disabled with the reason, so that I know I am out.
27. As a jogador whose character is Morrendo, I want to be unable to spend Dados de Vida, so that the Testes de Morte are resolved first.
28. As a jogador whose character is Estável, I want to spend Dados de Vida and wake up, so that the rest brings my character back.
29. As a jogador of Manassés with Sangue Resiliente, I want 1 extra PV for each Dado de Vida I spend, so that my path B passive works.
30. As a Mestre, I want to see a player's PV rise on my screen when they spend a die, so that the table stays in sync without my input.
31. As a Mestre, I want to spend Dados de Vida for the NPCs jogáveis, so that the companions I control also rest.
32. As a Mestre, I want simple NPCs and enemies left out of the Dados de Vida, so that they keep being healed by my ±PV controls.
33. As a jogador, I want to mark "Terminei", so that the group knows I am done with the rest.
34. As a jogador and as a Mestre, I want to see who has already finished, so that we know who we are waiting for.
35. As a jogador, I want the rest to close by itself when every player marked "Terminei", so that a rest opened by the group does not hang waiting for the Mestre.
36. As a Mestre, I want to close the rest at any moment, so that the story can move on.
37. As a jogador, I want my Habilidades that recharge on a Descanso Curto to recharge when the rest opens, so that the rest does what the doc says.
38. As a jogador, I want my Habilidades to recharge only once per rest, so that opening the app twice does not matter.
39. As a jogador who opens the app while a rest is already open, I want my Habilidades to recharge then, so that a late phone does not lose the recharge.
40. As a Mestre, I want the NPCs jogáveis' Habilidades to recharge when the rest opens, so that they follow the same rule.
41. As a Mestre, I want starting a Descanso Longo to close an open Descanso Curto, so that the two never overlap.
42. As a Mestre, I want advancing the period to close an open Descanso Curto, so that the hour of rest does not stay open into the evening.
43. As a jogador, I want the Descanso Longo to return half of my spent Dados de Vida, rounded up, so that spending one die does not lose it forever.
44. As a Mestre, I want to type the 1d4 de Fé of the Descanso Longo or use the Rolagem Virtual, so that the table's physical die decides, as agreed.
45. As a jogador, I want my indicator to show the Descanso Longo as available on the same days the Mestre can take it, so that our screens agree.
46. As a jogador, I want a new session to return all my Dados de Vida, so that what I spent in one session does not stay spent in the next.
47. As a jogador, I want a new session to start with my PV máximo and my Habilidade uses restored, so that my character enters Descansado, as the doc says.
48. As a jogador who leveled up, I want one more Dado de Vida available, so that the new level counts at once.
49. As a jogador, I want the level-up to keep using the average of my Dado de Vida, so that this feature changes nothing in the level-up result.
50. As a jogador who is not in the session, I want to be unable to make a Pedido de Descanso in it, so that only the table decides.

## Implementation Decisions

- **Dado de Vida no motor.** Um módulo do motor passa a ser a fonte única do dado da Vocação (10 para Guerreiro e Caçador, 8 para Batedor e Sacerdote/Sábio, 8 como padrão). O PV inicial (máximo do dado) e a média do level-up (metade do dado mais 1) passam a ler dele, sem mudar nenhum valor: os testes atuais de PV inicial e de level-up continuam verdes.
- **Interface do motor** (funções puras, sem React nem Supabase):
  - o dado da Vocação;
  - o estado dos Dados de Vida a partir do nível e dos gastos (total, restantes, dado);
  - se o personagem pode gastar, com o motivo quando não pode (descanso fechado, Morrendo, PV cheio, sem dados restantes); Estável pode;
  - a cura de um dado: rolado + modificador de CON, no mínimo 1, mais 1 com Sangue Resiliente, até o PV máximo; devolve o PV novo e quanto curou;
  - a devolução do Descanso Longo: metade dos gastos, arredondada para cima;
  - o estado do Pedido de Descanso: quem conta (jogadores com personagem na sessão que não está Morto), quantos pediram, se o pedido está bloqueado e por quê (combate ativo, sem Descanso Curto restante, descanso já aberto) e se o descanso deve abrir;
  - se o descanso deve fechar porque todos terminaram.
- **Sangue Resiliente.** O motor recebe se o personagem tem a Habilidade desbloqueada (id `tribe-manasses-4-sangue-resilien`, pelo caminho escolhido no nível 4); a camada de cima a resolve com a lista de Habilidades do personagem.
- **Ficha.** `characters` ganha a coluna dos Dados de Vida gastos (inteiro, padrão 0, não negativo) e a do último Descanso Curto em que o personagem recarregou as Habilidades. O jogador grava os dois no próprio personagem pelas políticas atuais (ADR 0004); o Mestre grava nos NPCs jogáveis. O total não é gravado: é o nível.
- **Descanso Curto na sessão.** `game_sessions` ganha o estado do descanso: aberto ou não, a identidade do descanso aberto, quem o abriu (Mestre ou grupo), a lista de quem pediu e a lista de quem terminou. A lista guarda o personagem de cada jogador.
- **Funções no banco** (`SECURITY DEFINER`, `search_path` fixo, `revoke execute ... from public, anon`, ADR 0006):
  - pedir e retirar o Pedido de Descanso: só o dono de um personagem não Morto da sessão; bloqueia com combate ativo, sem Descanso Curto restante no dia ou com descanso aberto; o último pedido abre o descanso (marca aberto pelo grupo, gera a identidade, soma 1 aos Descansos Curtos do dia, zera os pedidos), tudo numa transação;
  - marcar "Terminei": só o dono, com o descanso aberto; o último a terminar fecha o descanso;
  - as ações do Mestre (abrir, recusar o pedido, encerrar) passam pelas mesmas funções, para a regra de abrir e fechar morar num lugar só; o Mestre continua podendo atualizar a sessão como hoje.
  - A contagem de "todos" no banco usa a mesma definição do motor (personagens da sessão, não inimigos, que não estão Mortos); um teste em `rls.sql` fixa essa definição.
- **Recarga das Habilidades** (ADR 0006): cada cliente, ao ver um descanso aberto cuja identidade difere da gravada na ficha, recarrega as Habilidades do próprio personagem e grava a identidade; a tela do Mestre faz o mesmo pelos NPCs jogáveis. Vale para descanso aberto pelo Mestre ou pelo grupo.
- **Gastar um Dado de Vida**: o cliente calcula a cura pelo motor e grava, no personagem, o PV novo e os gastos mais 1, numa só atualização. O PV mostrado ao Mestre chega pelo Realtime que já atualiza as fichas.
- **Fechamentos automáticos**: iniciar o Descanso Longo e avançar o período fecham um Descanso Curto aberto; a virada do dia também zera os pedidos.
- **Cartão "Descanso Curto"**: um componente para as duas telas, com o papel como entrada. Substitui o botão de Descanso Curto e o aviso do navegador de hoje; o "Descanso Longo" continua só do Mestre. O indicador do jogador passa a usar a mesma regra do motor para o Descanso Longo (1 por dia).
- **Descanso Longo**: o Mestre digita o 1d4 de Fé ou usa a Rolagem Virtual, num diálogo no lugar da rolagem automática; o motor aplica PV cheio, a Fé (como hoje) e a devolução de metade dos Dados de Vida gastos.
- **Sessão nova Descansada**: ao criar a sessão, os personagens dos jogadores ficam com PV máximo, usos de Habilidade restaurados e 0 Dados de Vida gastos. A correção do "Descansado" é um commit `fix:` separado, com o teste do comportamento certo; a parte dos Dados de Vida entra junto da feature.
- **Correções separadas**, cada uma num `fix:` com teste vermelho antes: o 1d4 de Fé digitado e o indicador do Descanso Longo.
- Os tipos gerados (`database.types.ts`) mudam com a migration; a aplicação na produção pede a confirmação do autor.

## Testing Decisions

- Um bom teste olha o comportamento visível de fora (o valor devolvido pelo motor, o que a função do banco deixa e grava por papel, o que o cartão mostra e manda), nunca a forma interna. Cada regra com aleatoriedade usa `createSeededRng`.
- **Motor**: testes de unidade do Dado de Vida e do estado do pedido (dado por Vocação; restantes; Morrendo, Estável, PV cheio, sem dados; mínimo 1 com CON negativa; teto no PV máximo; +1 do Sangue Resiliente; metade arredondada para cima com 0, 1, 3 e 5 gastos; quem conta no "todos"; cada motivo de bloqueio; abrir no último pedido; fechar no último "Terminei"). Prior art: os testes de `attack`, `inspiration` e `rest` do motor. Os testes atuais de PV inicial e de level-up ficam verdes sem mudança.
- **Banco**: `supabase/tests/rls.sql` com cada função por papel (anon, jogador da sessão, jogador de fora, Mestre): pedir, retirar, abrir no último pedido, contar os Descansos Curtos do dia, bloquear com combate ativo, sem restante e com descanso aberto, ignorar o personagem Morto na contagem, terminar e fechar no último, recusar e encerrar só pelo Mestre. Prior art: os testes de `apply_attack`.
- **Cartão**: teste de componente nos dois papéis, com a camada de dados simulada: textos de "2 de 4 pediram", motivos de bloqueio, "aberto pelo Mestre" ou "pelo grupo", gastar um dado digitado e pela Rolagem Virtual, botão desabilitado com PV cheio, Morrendo e sem dados, "Terminei" e a lista de quem terminou, ações do Mestre. Prior art: `AttackPanel.test.tsx`.
- **Camada de dados e serviço**: as chamadas às funções do banco e a gravação do gasto, com o cliente Supabase simulado. Prior art: os testes de `data-access/combat` e `attackService`.
- **E2E** (`e2e/rest.spec.ts`, Supabase local): dois jogadores pedem e o descanso abre sozinho; um gasta um Dado de Vida e o PV sobe na tela do Mestre; os dois terminam e o descanso fecha; o Mestre recusa um pedido; o Descanso Longo devolve metade dos dados com o 1d4 digitado; uma sessão nova devolve todos e restaura o PV. Prior art: `e2e/attack.spec.ts`.
- **Correções**: o 1d4 digitado e o indicador do Descanso Longo ganham, cada um, o teste do comportamento certo no commit `fix:`; o "Descansado" da sessão nova também.
- A verificação de mutação de sempre: cada regra nova é alterada à mão e algum teste tem de falhar.

## Out of Scope

- Rolar o Dado de Vida no level-up (o app continua com a média).
- Implacável (Manassés, nível 12) e qualquer outro efeito de Habilidade sobre Dados de Vida em combate: feature 4.
- Pedido de Descanso para o Descanso Longo: continua só do Mestre.
- Sustento no Descanso Longo (Ração, Odre, Exausto automático).
- Dados de Vida para NPC simples e inimigo.
- Gastar Dados de Vida fora de um Descanso Curto aberto.
- Esconder a lista de pedidos de outro jogador (todos da sessão leem a sessão, como hoje).

## Further Notes

- Comparação com o D&D 5e, mostrada ao autor: o 5e (2014) devolve no Descanso Longo até metade do **total**, para baixo, no mínimo 1; a nossa regra devolve metade dos **gastos**, para cima. O autor manteve a nossa (2026-10-27).
- Suposições do grill confirmadas pelo autor ao seguir para a spec: o Descanso Longo segue só do Mestre; iniciar o Descanso Longo e avançar o período fecham um Descanso Curto aberto.
- Divergências achadas no grill (registrar no ROADMAP com a feature): o 1d4 de Fé rolado pelo app contra a decisão da Onda 2 (bloco B); o indicador do jogador com a regra antiga de 2 dias; o "Descansado" da sessão nova (`regras-base.md` 6.3) que o código não aplica.
- Hoje o Descanso Curto também cura os NPCs simples pelo valor digitado; com o fim do aviso do navegador, eles passam a ser curados só pelos controles ±PV do Mestre.
