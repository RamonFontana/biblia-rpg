# Fé na mesa: usos do Teste de Fé, Vantagem e Desvantagem, Estado de Fé, Inspiração e Fortaleza

Status: ready-for-agent

Onda 5, feature 1. Decisões do autor na Rodada 2 da Onda 4 (2026-10-24) e no grill de 2026-10-25. Termos: `CONTEXT.md` (Teste de Fé, Clamor, Pedido Egoísta, Tentação, Testemunho, Modificador de Fé, Estado de Fé, Vantagem, Desvantagem, Inspiração, Fortaleza, Rolagem Virtual). Regras: `docs/regras-base.md`, seção 4. ADRs: 0001 (dados físicos, o app registra) e 0004 (regras no motor, cliente confiável).

## Problem Statement

A Fé é a mecânica central do jogo, mas o app só ajuda numa parte dela. Quando o Mestre pede um Teste de Fé, ele escolhe Misericórdia ou Punição e digita um número; o app não sabe se é um Clamor, uma Tentação ou um Testemunho, então não oferece os atalhos do doc e cobra 1d6 de Fé em **toda** falha, inclusive no Clamor que o doc diz ser só "silêncio divino". Não há como marcar Vantagem ou Desvantagem num Teste (só o aviso de furtividade existe), e o dado virtual sempre rola um dado só. O Estado de Fé (Inabalável, Comum, Abalado, Vulnerável, Ruptura) não aparece em lugar nenhum: o Mestre faz a conta de cabeça para saber quem está Abalado, quem merece Inspiração ou quem caiu em Ruptura. A Inspiração do Inabalável e a Fortaleza não existem no app.

## Solution

O Mestre escolhe o uso do Teste de Fé (Clamor, Tentação ou Testemunho), com atalhos de Punição 0, −20 e −50 e a marca de Pedido Egoísta no Clamor; a falha custa Fé conforme o doc. Ao pedir qualquer Teste, o Mestre marca Vantagem ou Desvantagem por jogador; as Desvantagens automáticas (furtividade com armadura, Abalado em TR de Sabedoria e Carisma) entram sozinhas, e Vantagem e Desvantagem se anulam. O jogador vê o lembrete de rolar dois dados (e qual usar) e o dado virtual rola os dois, destacando o que vale. O Estado de Fé aparece como selo na ficha e no cartão do jogador do Mestre; a Ruptura deixa um aviso fixo para o Mestre. O personagem Inabalável tem Inspiração uma vez por dia da sessão, que o jogador gasta num Teste (ganha Vantagem) ou marca como usada pela ficha. O Mestre aplica a Fortaleza com um botão que dá +1d4 de Fé.

## User Stories

### Pedido do Teste de Fé (Mestre)

1. As a Mestre, I want to choose whether a Faith Test is a Clamor, a Tentação or a Testemunho, so that the app applies the right rules for that use.
2. As a Mestre, I want shortcut buttons for Punição 0, −20 and −50, so that I set the Modificador de Fé without typing the usual values.
3. As a Mestre, I want the Clamor shortcuts labeled Pequena Providência, Milagre Moderado and Milagre Extraordinário, so that I match the doc's milagre sizes at a glance.
4. As a Mestre, I want to keep choosing Misericórdia and typing any value, so that I can reward a player beyond the shortcuts.
5. As a Mestre, I want to type a free Punição value too, so that unusual situations still fit.
6. As a Mestre, I want a "Pedido Egoísta" checkbox that only appears for a Clamor, so that I mark selfish, frivolous or heretical requests before the roll.
7. As a Mestre, I want the Pedido Egoísta mark to be fixed once the Test is sent, so that the judgment comes before the result, as the doc says.
8. As a Mestre, I want to see the use (and the Pedido Egoísta mark) on the active Test card, so that I remember what I asked while results come in.
9. As a Mestre, I want a Clamor failure without Pedido Egoísta to cost no Faith, so that a failed miracle is silêncio divino as the doc says.
10. As a Mestre, I want a failed Pedido Egoísta, Tentação or Testemunho to cost 1d6 of Faith, so that the loss follows the doc.
11. As a Mestre, I want results to show whether Faith was lost, so that I can narrate the consequence.

### Vantagem e Desvantagem (Mestre e jogador)

12. As a Mestre, I want to mark Vantagem or Desvantagem for each target player when I request any Test, so that I can reflect the situation and a Fortaleza.
13. As a Mestre, I want a "Fortaleza" hint next to each character's name in the request, showing that character's Fortaleza, so that I remember when it grants Vantagem.
14. As a Mestre, I want the default for every target to be a normal roll, so that marking is opt-in.
15. As a player, I want the stealth Desvantagem from my armor to keep applying automatically, so that I do not have to remember it.
16. As a player who is Abalado, I want Desvantagem applied automatically on Sabedoria and Carisma TRs, so that my Estado de Fé has its mechanical effect.
17. As a player, I want Vantagem and Desvantagem in the same Test to cancel into a single die, so that the rule stays simple.
18. As a player, I want the Test screen to say whether I roll with Vantagem, Desvantagem or normally, and why, so that I know how many dice to roll.
19. As a player rolling physical dice with Vantagem on a d20 Test, I want the reminder "role dois d20 e use o maior", so that I type the right die.
20. As a player rolling a Faith Test with Vantagem, I want the reminder "role dois d100 e use o menor", so that I apply the inverted rule correctly.
21. As a player rolling with Desvantagem, I want the matching reminder (higher d100 for Faith, lower d20 otherwise), so that I type the right die.
22. As a player, I want to type only the die that counts, so that entering the result stays quick.
23. As a player using the Rolagem Virtual with Vantagem or Desvantagem, I want the app to roll two dice and show both, so that I see what happened.
24. As a player using the Rolagem Virtual, I want the die that counts highlighted and used as my value, so that I do not pick by mistake.
25. As a player, I want a normal roll to keep using a single die, so that nothing changes when there is no Vantagem or Desvantagem.
26. As a Mestre, I want the result to record whether the Test had Vantagem or Desvantagem, so that I can check later.

### Estado de Fé

27. As a player, I want a badge with my Estado de Fé on my sheet, so that I know my standing at a glance.
28. As a Mestre, I want the Estado de Fé badge on each player card, so that I see the whole table's Faith.
29. As a player or Mestre, I want the badge tooltip to state the state's effect from the doc, so that nobody needs to open the rules.
30. As a Mestre, I want the Vulnerável badge to remind me to ask for Testemunho, so that I apply the doc's "frequent Testemunho".
31. As a Mestre, I want a fixed warning on my session screen while any character is in Ruptura (Faith 0), so that I narrate the tragedy or the consagração.
32. As a Mestre, I want the Ruptura warning to name the characters, so that I know who is affected.
33. As a Mestre, I want the Ruptura warning to disappear as soon as the character's Faith rises above 0, so that it reflects the current state.
34. As a player, I want the badge to follow my Fé Atual (not the Fé Efetiva), so that Itens Profanos do not change my state, as the doc says.
35. As a player, I want the badge to update in real time when my Faith changes, so that the table always sees the current state.
36. As a player in Ruptura, I want abilities with a Faith cost to stay blocked, so that "abilities that require Faith fail" holds (already true through insufficient Faith).

### Inspiração

37. As a player who is Inabalável, I want to see "Inspiração disponível" on my sheet, so that I know I can use it.
38. As a player, I want to spend my Inspiração on a Test the Mestre requested, so that the Test gains Vantagem.
39. As a player, I want a "usei a Inspiração" button on my sheet, so that I can spend it on any other roll at the table (an attack with physical dice, for example).
40. As a player, I want the Inspiração to be usable only once per session day, so that the "1x/dia" rule holds.
41. As a player, I want the Inspiração to come back when the Mestre starts a new day, so that I can use it again.
42. As a player, I want the Inspiração to disappear while I am not Inabalável and come back when I return to Inabalável (if not used that day), so that it follows my state.
43. As a Mestre, I want to see on the player card whether the Inspiração is available or used today, so that I can follow its use.
44. As a player, I want the Inspiração spent on a Test to count only once the result is sent, so that cancelling does not waste it.

### Fortaleza

45. As a Mestre, I want a "Fortaleza" button on each player card, so that I reward a player acting on their virtue.
46. As a Mestre, I want the button to add 1d4 Faith, typing the physical die or using the Rolagem Virtual, so that it follows the doc and the physical-dice principle.
47. As a Mestre, I want the Faith gained from a Fortaleza to respect the 0–100 cap, so that Faith never exceeds 100.
48. As a Mestre, I want to see the character's Fortaleza name on the button or its dialog, so that I recall what the virtue is.
49. As a Mestre, I want no daily limit on the Fortaleza, so that it stays at my judgment as the doc leaves it.
50. As a player, I want my Faith and Estado de Fé to update right after a Fortaleza, so that I see the effect.

## Implementation Decisions

- **Motor (`domain`), funções puras novas:**
  - Estado de Fé a partir da Fé Atual: `inabalavel` (70–100), `comum` (31–69), `abalado` (11–30), `vulneravel` (1–10), `ruptura` (0), com o efeito em texto para a dica.
  - Modalidade do Teste: recebe a marca do Mestre (`vantagem` | `desvantagem` | nenhuma), as Desvantagens automáticas (furtividade, Abalado em TR de Sabedoria ou Carisma) e se a Inspiração foi usada, e devolve `vantagem`, `desvantagem` ou `normal`; Vantagem e Desvantagem juntas dão `normal`.
  - Dado que vale: recebe a modalidade, o tipo de Teste e os dois resultados; no Teste de Fé a Vantagem fica com o menor e a Desvantagem com o maior; no d20, o contrário.
  - Rolagem virtual de dois dados pela `Rng` injetada (`rollDie`), sem `Math.random`.
  - Se a falha custa Fé: recebe o uso e o Pedido Egoísta; Clamor só com Pedido Egoísta, Tentação e Testemunho sempre.
  - Inspiração disponível: Inabalável e não usada no dia atual da sessão.
  - Fortaleza: Fé depois de somar o 1d4, pelo `addFaith` existente (teto e piso).
- **Atalhos de Punição:** 0, −20, −50 nos três usos; no Clamor com os nomes do doc (Pequena Providência, Milagre Moderado, Milagre Extraordinário). Misericórdia e valor livre continuam. O modelo de dificuldade gravada (positivo Misericórdia, negativo Punição) não muda.
- **Schema (uma migration, RLS mantido nas tabelas existentes):**
  - `session_tests`: o uso do Teste de Fé (texto restrito a Clamor, Tentação, Testemunho; nulo nos outros Testes) e o Pedido Egoísta (booleano, falso por padrão).
  - `session_test_results`: a marca de Vantagem ou Desvantagem do Mestre para aquele alvo (nula = normal), a modalidade final aplicada e se a Inspiração foi usada; e, se a Rolagem Virtual rolou dois dados, os dois valores (o `roll_value` existente continua sendo o dado que vale).
  - `characters`: o dia da sessão em que a Inspiração foi usada (nulo = nunca).
  - Depois da migration, `gen:types`, o teste da publicação do Realtime (se uma tabela nova for assinada) e o `rls.sql` com as colunas novas por papel. Aplicar na produção com o autor.
- **Serviço de envio do resultado:** a perda de 1d6 passa a depender do uso e do Pedido Egoísta (regra do motor); grava a modalidade e a Inspiração usada; ao gravar com Inspiração, marca o dia na ficha. A leitura da ficha continua interrompendo o envio se falhar (passo 9c).
- **Criação do pedido:** a camada de dados de Testes de sessão recebe o uso, o Pedido Egoísta e a marca por alvo.
- **Tela do Mestre:** o diálogo de pedir Teste ganha o uso (só para Fé), os atalhos, o Pedido Egoísta (só Clamor) e, por jogador alvo, a escolha Normal / Vantagem / Desvantagem com a dica da Fortaleza. O cartão do jogador ganha o selo do Estado de Fé, o estado da Inspiração e o botão Fortaleza. A tela da sessão do Mestre ganha o aviso fixo de Ruptura.
- **Tela do jogador:** o diálogo do Teste mostra a modalidade e o porquê, o lembrete do dado físico, a opção "usar Inspiração" quando disponível e a Rolagem Virtual com dois dados. A ficha ganha o selo do Estado de Fé e a Inspiração com o botão "usei".
- **Dia novo:** a Inspiração volta pela comparação com o dia atual da sessão; nada precisa ser zerado ao avançar o dia.
- **Cores:** selos dentro da paleta (`docs/DESIGN.md`): Inabalável verde de sucesso, Comum pedra, Abalado âmbar, Vulnerável e Ruptura vermelho; o nome do estado sempre em texto (a cor só reforça).
- **Cliente confiável (ADR 0004):** o dono do resultado consegue, pela API, gravar outra modalidade; aceito, como nas demais regras.

## Testing Decisions

- **Bom teste:** comportamento externo nas camadas combinadas (motor, serviço, banco por papel, tela de ponta a ponta), sem olhar detalhes internos; nomes e expectativas em português, como o resto da suíte; tests-first, com mutação conferida em cada regra nova.
- **Motor (camada principal):** Estado de Fé nas fronteiras (0, 1, 10, 11, 30, 31, 69, 70, 100); modalidade com todas as combinações (Mestre, automáticas, Inspiração, anulação); dado que vale no d20 e no d100 nos dois sentidos; perda de Fé pelos três usos com e sem Pedido Egoísta; Inspiração disponível por estado e dia; Fortaleza no teto. Rolagem com `createSeededRng`. Prior art: os testes atuais de Fé, de Testes de sessão e de dados do motor.
- **Serviço de envio:** perda de Fé por uso e Pedido Egoísta, gravação da modalidade e da Inspiração (o dia na ficha), com o Supabase falso. Prior art: os testes atuais do serviço de Testes de sessão.
- **Banco:** `rls.sql` com as colunas novas: o Mestre da sessão cria o pedido com uso, Pedido Egoísta e marca por alvo; o jogador não cria pedido; o dono grava o próprio resultado com modalidade e Inspiração; o dono grava o dia da Inspiração na própria ficha. Prior art: o `rls.sql` atual.
- **Tela (E2E):** Mestre e jogador em navegadores separados: o Mestre pede um Clamor Milagre Moderado com Vantagem e Pedido Egoísta; o jogador vê "role dois d100 e use o menor", usa a Rolagem Virtual com dois dados e envia; o resultado e a Fé no banco seguem a regra (falha custa 1d6; sem Pedido Egoísta, não custa). Fortaleza dá +1d4 e respeita o teto. Inspiração usada some e volta no dia novo. Selos de Estado na ficha e no cartão; aviso de Ruptura aparece com Fé 0 e some ao subir. Prior art: as specs atuais de sessão e de Testes no E2E.
- **Componentes:** só ajustar os testes existentes dos diálogos de Teste, do cartão do jogador e da ficha para os pontos que mudam.

## Out of Scope

- Dados de Vida nos descansos (feature 3 da Onda 5).
- Aplicar Amedrontado automaticamente na falha do Testemunho (o Mestre aplica a Condição como hoje).
- Automatizar a tragédia da Ruptura ou o ato de consagração (narrativos).
- Vantagem e Desvantagem em ataques e outras rolagens que o app não registra (a Inspiração tem o botão "usei" para elas).
- Limite diário para a Fortaleza.
- Impedir pela API que o cliente grave outra modalidade (ADR 0004).
- Rolagem obrigatória pelo app: o dado físico continua sendo o padrão (ADR 0001).

## Further Notes

- A regra da falha do Clamor corrige uma divergência entre doc e código (o código cobra 1d6 em toda falha). Registrar no ROADMAP ao implementar.
- A migration precisa ser aplicada na produção; na Onda 4 o `supabase db push` exigiu permissão explícita no Claude Code.
- Os testes E2E da feature entram na suíte semanal do CI.
