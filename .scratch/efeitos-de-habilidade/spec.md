# Efeitos de Habilidade: Condições aplicadas e removidas, e Habilidades de inimigo

Status: ready-for-agent

Onda 5, feature 4. Decisões do autor no grill de 2026-10-27. Termos: `CONTEXT.md` (Habilidade, CD da Habilidade, Habilidade de inimigo, Recarga, Condição, Resistência a Condição, TR, Teste, Vantagem, Desvantagem, Rolagem Virtual, Ataque). Regras: `docs/regras-base.md` 6.5 (Condições); `docs/tribos/*.md` e `docs/vocacoes/*.md` (texto das Habilidades); `docs/bestiario/*.md`. ADRs: 0001 (dados físicos, o app registra), 0003 (conteúdo no repositório), 0004 (regras no motor, cliente confiável), 0005 (o ataque grava por uma função no banco) e 0007 (o efeito de Habilidade grava por uma função no banco, e o TR do alvo fica pendente até ser lançado).

## Problem Statement

No combate, "Usar" uma Habilidade só gasta o uso e a Fé. Nada acontece no alvo: a Tática do Cântaro Quebrado não deixa ninguém Amedrontado, a Palavra de Autoridade não paralisa, a Purificação não tira o Envenenado do aliado. O jogador anuncia em voz alta, o Mestre lembra a CD (que os docs nem dizem como calcular), rola o TR de cada inimigo e aplica a Condição à mão, sem passar pela Resistência a Condição nem pelas imunidades. Usar a Habilidade também não marca a Ação do turno.

Do outro lado, as Habilidades dos inimigos são só um nome e um texto. O Grito Atormentador do Endemoniado pede um TR de cada jogador e tira Fé de quem falha, mas o app não pede o TR, não aplica nada e não sabe se a Habilidade de Recarga já voltou.

## Solution

As Habilidades de personagem que aplicam ou removem Condição ganham o efeito como dado no conteúdo. No combate, o jogador escolhe a Habilidade, marca os alvos entre os participantes e usa. O app gasta o uso e a Fé, marca o espaço do turno e calcula a CD da Habilidade (8 + Proficiência + o modificador do atributo da Vocação). Sem TR, a Condição entra na hora. Com TR, o uso fica pendente no painel do Mestre, que lança o TR de cada inimigo (digitado ou Rolagem Virtual); a Condição entra só em quem falhou, depois da Resistência a Condição e das imunidades. Quem remove Condição escolhe o aliado e, quando o texto dá opção, qual Condição sai. Tudo fica no histórico do combate, ao lado dos ataques, e o jogador vê o resultado.

O inimigo ganha Habilidades estruturadas: o Mestre escolhe da biblioteca do bestiário (Presença Aterradora, Grito Atormentador, Maldição de Baal, Salto e Bote) ou cria uma personalizada, com TR, Condição, perda de Fé e uso (sem limite, 1 por combate ou Recarga 5-6). Ao usá-la em personagens, cada celular recebe o pedido de TR pelo Teste de sessão; o Mestre rola o dado de Fé de quem falhou e o app aplica a Condição e a perda de Fé. No início do turno do inimigo, o cartão do Mestre lembra a Recarga e aceita o d6.

## User Stories

1. As a jogador, I want to see which of my Habilidades have an effect the app applies, so that I know which ones do more than spend a use.
2. As a jogador, I want to pick the targets of my Habilidade among the combat participants, so that the effect lands on who I meant.
3. As a jogador, I want to pick several targets for an area Habilidade, so that the Tática do Cântaro reaches every enemy in range.
4. As a jogador, I want to target allies as well as enemies, so that removal Habilidades work on my companions.
5. As a jogador, I want the app to compute the CD da Habilidade for me, so that I do not need to know the formula.
6. As a jogador, I want to see the CD and the TR attribute before using, so that I know what the enemies must beat.
7. As a jogador, I want using the Habilidade to spend the use and the Fé exactly as today, so that the costs stay the same.
8. As a jogador, I want using an Ação Habilidade to mark my Ação, so that the turn's economy is kept.
9. As a jogador, I want a Bonus Action Habilidade to mark my Ação Bônus, so that I can still attack.
10. As a jogador, I want a Reaction Habilidade to be usable outside my turn, so that the Retribuição Divina fires when an ally falls.
11. As a jogador, I want the use button disabled when the turn slot is already used, so that I do not use two Ações.
12. As a jogador, I want an Habilidade without TR to apply at once, so that the Palavra de Autoridade paralyzes immediately.
13. As a jogador, I want an Habilidade with TR to wait for the Mestre's rolls, so that only the enemies who fail are affected.
14. As a jogador, I want to see that my use is waiting for the TR, so that I know the effect is coming.
15. As a jogador, I want to see the result per target ("Filisteu: Amedrontado; Bandido passou"), so that I know what my Habilidade did.
16. As a jogador, I want the duration to follow the text (1 turno = 1 rodada, 1 min = 10 rodadas), so that the Condição expires at the right time.
17. As a jogador, I want a Condição without duration in the text to last until removed, so that the Retribuição Divina keeps the aggressor Amedrontado.
18. As a jogador, I want the target's Resistência a Condição to count, so that armor works against my Habilidade as against weapons.
19. As a jogador, I want an enemy's immunity to stop the Condição, so that the rule is the same for everyone.
20. As a jogador with Calçado de Ferro, Rapidez Divina, Sangue Amargo or Servo Consagrado, I want my immunity to block the Condição automatically, so that my passive works.
21. As a jogador using Purificação, I want to choose which Condição leaves the ally among the ones in the text, so that I cure what matters.
22. As a jogador using O Unificador, I want each ally to lose one Condição of my choice, so that the text is followed.
23. As a jogador using Ungido or Cataplasma de Gileade, I want Envenenado or Sangrando removed from the ally, so that the cure works.
24. As a jogador, I want the parts of the text the app does not apply (cura, dano, Vantagem) still shown, so that I remember to tell the Mestre.
25. As a jogador, I want Habilidades with an effect to work only in an active combat, so that outside combat they stay narrative.
26. As a jogador of Batedor, I want Golpe Incapacitante in my combat list, so that I can use it after a Ataque Furtivo.
27. As a Mestre, I want to see pending Habilidade uses with the TR and CD per target, so that I know what to roll.
28. As a Mestre, I want to type each enemy's d20 or use the Rolagem Virtual, so that the table's physical dice decide (ADR 0001).
29. As a Mestre, I want the app to add each enemy's TR modifier, so that I do not do the math.
30. As a Mestre, I want Vantagem or Desvantagem on a TR to follow the same rules as the Testes, so that the modes are consistent.
31. As a Mestre, I want the Condição applied only to the enemies who failed, so that I do not fix it by hand.
32. As a Mestre, I want to see the Habilidade uses in the combat history next to the attacks, so that the table remembers what happened.
33. As a Mestre, I want a pending use to vanish without effect if the combat ends, so that nothing applies later.
34. As a Mestre, I want to pick an enemy Habilidade from the bestiary library in the enemy form, so that I do not type numbers.
35. As a Mestre, I want the bestiary presets to bring their Habilidades, so that a Anakim comes with Presença Aterradora.
36. As a Mestre, I want to create a custom enemy Habilidade with TR, CD, Condição, duration, Fé die and use, so that I can invent threats.
37. As a Mestre, I want enemy Habilidades to keep their name and description, so that the old text-only Habilidades keep working.
38. As a Mestre, I want to use an enemy Habilidade on one or more characters, so that the Grito Atormentador reaches everyone in range.
39. As a jogador, I want to receive the TR of an enemy Habilidade on my phone, with attribute and CD, so that I roll it like any Teste.
40. As a jogador, I want Vantagem or Desvantagem marked by the Mestre on that TR, so that the Aura de Heresia counts.
41. As a jogador, I want to type my physical d20 or use the Rolagem Virtual, so that I keep rolling real dice.
42. As a Mestre, I want to roll the Fé die (1d4, 1d6) for each character who failed, typed or virtual, so that the Fé loss follows the bestiary.
43. As a jogador, I want the Condição and the Fé loss applied only if I failed, so that a success protects me.
44. As a jogador, I want to see what the enemy Habilidade did to me, so that I understand the new Condição or the lost Fé.
45. As a Mestre, I want to cancel the TR of a player who did not answer, so that the combat does not hang; that player gets no effect.
46. As a Mestre, I want to roll the TR of a NPC jogável myself, so that the companions I control are covered.
47. As a Mestre, I want each enemy Habilidade's use to be unlimited, once per combat or Recarga 5-6, so that the bestiary limits are kept.
48. As a Mestre, I want a once-per-combat Habilidade disabled after use, so that I do not use it twice.
49. As a Mestre, I want the card to remind me of the Recarga at the start of the enemy's turn and accept the d6 (typed or virtual), so that a 5 or 6 brings it back.
50. As a Mestre, I want to see the Desvantagem of the Grito Atormentador as a reminder, so that I apply it on the next attack.
51. As a jogador, I want the damage of an enemy Habilidade to keep coming through the Mestre's "Modificar Vida", so that nothing changes there.
52. As a jogador from another session, I want to be unable to use a Habilidade on this combat, so that only the table acts.

## Implementation Decisions

- **Conteúdo.** O esquema da Habilidade troca o `applyConditions` sem uso por um efeito estruturado, validado por zod: alvo (um inimigo, inimigos, um aliado, aliados, o agressor), TR opcional (atributo), Condições aplicadas com duração em rodadas ou sem duração, e remoção (uma Condição fixa, uma escolhida de uma lista, ou uma escolhida por alvo). Os ids das Habilidades não mudam. As 10 Habilidades da decisão Q14 do grill ganham o efeito: Palavra de Autoridade, Tática do Cântaro Quebrado, Golpe Sísmico (sem TR, como no doc), Grito de Guerra, Retribuição Divina, Golpe Incapacitante, Purificação, O Unificador, Ungido e Cataplasma de Gileade. O texto (`effect`) continua como está.
- **Biblioteca de Habilidades de inimigo** no conteúdo (ADR 0003), com o mesmo formato mais a CD fixa, o dado de perda de Fé e o uso: Presença Aterradora (TR SAB 13, Amedrontado 10 rodadas), Grito Atormentador (TR SAB 12, 1d4 de Fé, lembrete de Desvantagem, Recarga 5-6), Maldição de Baal (TR SAB 13, 1d6 de Fé, Recarga 5-6) e Salto e Bote (TR FOR 13, Caído). Os presets de inimigo que correspondem a esses inimigos passam a trazê-las.
- **Habilidade de inimigo na ficha.** A lista de Habilidades do inimigo continua com nome e descrição e ganha campos opcionais: a referência à biblioteca ou o efeito personalizado (TR com atributo e CD, Condição e duração, dado de Fé, uso). Inimigos antigos, só com texto, seguem funcionando como hoje.
- **Motor** (funções puras, `Rng` injetado):
  - a CD da Habilidade a partir da Vocação, do nível e dos atributos (SAB para Sacerdote/Sábio e Caçador, FOR para Guerreiro, DES para Batedor; vale também nas Habilidades de Tribo);
  - a conversão da duração do conteúdo em rodadas;
  - o resultado do TR por alvo (total contra a CD, com a modalidade dos Testes);
  - as Condições que entram em cada alvo que falhou (ou em todos, sem TR), depois da Resistência a Condição e das imunidades de Habilidade passiva (Calçado de Ferro: Caído; Rapidez Divina: Paralisado; Sangue Amargo: Envenenado; Servo Consagrado: Amedrontado);
  - a remoção (fixa, escolhida de uma lista, uma por alvo);
  - se a Habilidade pode ser usada agora (combate ativo; Ação e Ação Bônus só no próprio turno e com o espaço livre; Reação a qualquer momento; usos e Fé como hoje);
  - a Recarga (5 ou 6 no d6 devolve o uso) e o uso por combate.
- **Banco** (ADR 0007): uma tabela de histórico de usos de Habilidade no combate, legível pelo Mestre e pelos participantes da sessão, sem escrita direta. Funções `SECURITY DEFINER` (`search_path` fixo, `revoke execute ... from public, anon`):
  - registrar o uso de uma Habilidade de personagem (o dono, combate ativo, alvos no mesmo combate, turno conferido para Ação e Ação Bônus): sem TR, aplica e remove as Condições na hora; com TR, grava o uso como pendente com a CD e os alvos;
  - resolver um uso pendente (só o Mestre): recebe quem falhou, aplica as Condições já calculadas pelo motor e marca o uso como resolvido;
  - registrar o uso de uma Habilidade de inimigo (só o Mestre) e o resultado depois dos TRs.
  - As Condições se mesclam como no `apply_attack` (a mesma Condição substitui a anterior). Um uso pendente de um combate encerrado não pode mais ser resolvido.
- **TR do jogador contra inimigo**: o pedido de TR vai pelo Teste de sessão já existente (atributo, CD, Vantagem ou Desvantagem marcadas pelo Mestre), ligado ao uso da Habilidade de inimigo. Quando os resultados chegam, a tela do Mestre lista quem falhou, pede o dado de Fé de cada um (digitado ou Rolagem Virtual) e aplica a Condição e a perda de Fé. O Mestre pode cancelar o TR de quem não respondeu (sem efeito para esse jogador). O NPC jogável tem o TR rolado pelo Mestre.
- **Estado de uso das Habilidades de inimigo no combate** (usada neste combate, aguardando Recarga) fica no participante do combate, gravado pelo Mestre.
- **Interface**:
  - jogador: na lista de Habilidades do combate, as que têm efeito abrem um painel de uso (alvos, CD, Condição a remover, aviso do que fica como texto); o resultado aparece por alguns segundos e no histórico;
  - Mestre: painel de usos pendentes com o TR por alvo; no cartão do inimigo, as Habilidades com botão de usar, alvos e o lembrete de Recarga no início do turno dele; no formulário do inimigo, a escolha da biblioteca ou o efeito personalizado;
  - o histórico do combate passa a mostrar ataques e usos de Habilidade juntos, em ordem.
- A economia do turno usa os mesmos marcadores do ataque (Ação, Ação Bônus, Reação) do armazém do combate.
- Os tipos gerados mudam com a migration; a aplicação na produção pede a confirmação do autor.

## Testing Decisions

- Um bom teste olha o comportamento visível de fora: o que o motor devolve, o que a função do banco deixa e grava por papel, o que o painel mostra e manda. Toda aleatoriedade usa `createSeededRng`.
- **Motor**: CD por Vocação e nível; duração (1 turno, 1 min, sem duração); TR por alvo com Vantagem e Desvantagem; Resistência a Condição e cada uma das quatro imunidades; remoção fixa, escolhida e uma por alvo; uso permitido ou bloqueado (fora do turno, espaço usado, Reação fora do turno, sem combate, sem usos, sem Fé); Recarga com 4, 5 e 6; uso por combate. Prior art: `attack.test.ts` (`resolveWeaponEffect`) e `abilityUse.test.ts`.
- **Conteúdo**: o gate de dados valida o efeito das 10 Habilidades e das 4 da biblioteca (Condições existentes, durações, atributo do TR, CD); os ids não mudam. Prior art: `gameData.test.ts`.
- **Banco**: `supabase/tests/rls.sql` por papel (anon, jogador da sessão, jogador de fora, Mestre): uso sem TR aplica; uso com TR fica pendente e só o Mestre resolve; remoção em aliado; fora do turno recusado para Ação e aceito para Reação; alvo de outro combate recusado; combate encerrado não resolve; uso de inimigo só pelo Mestre; histórico legível pelos participantes. Prior art: os testes de `apply_attack`.
- **Componentes**: painel de uso do jogador, painel de pendentes e Habilidades de inimigo do Mestre (biblioteca, personalizada, Recarga), pedido de TR no celular. Prior art: `AttackPanel.test.tsx`, `AttackLog.test.tsx` e os testes do pedido de Teste.
- **E2E** (`e2e/ability.spec.ts`): o jogador usa a Tática do Cântaro, o Mestre lança os TRs e o Amedrontado entra só em quem falhou; a Purificação remove uma Condição escolhida; a Palavra de Autoridade paralisa na hora; o Grito Atormentador manda o TR ao celular e quem falha perde Fé; a Recarga volta com 5 ou 6. Prior art: `e2e/attack.spec.ts`.
- A checagem de mutação de sempre em cada regra nova.

## Out of Scope

- Cura, dano, PV temporários, bônus e Vantagem das Habilidades (seguem como texto; o Mestre aplica).
- Auras e efeitos contínuos (Espírito Irrefreável, Nuvem Calmante, Aura de Heresia como regra automática).
- Conferência de alcance e de área em metros.
- Condições fora do catálogo (Possessão, Surdo, "abalado", empurrar).
- Repetir o TR no fim do turno (Presença Aterradora): o Mestre remove a Condição.
- O dano das Habilidades de inimigo (3d6 psíquico, 2d4 de veneno): continua pelo "Modificar Vida".
- O ataque dos inimigos pelo app.
- Implacável (Manassés 12) e outras Habilidades passivas com gatilho automático.

## Further Notes

- O Golpe Incapacitante do Batedor já trazia a CD "8 + Proficiência + Modificador de DES" no doc, o que confirma a fórmula escolhida para a CD da Habilidade.
- Correção feita no grill: O Unificador remove **uma** Condição de cada aliado, não todas.
- Suposições aceitas pelo autor ao seguir para a spec: o uso pendente cai sem efeito se o combate acabar (o uso e a Fé ficam gastos); o TR do NPC jogável é do Mestre; o Mestre pode cancelar o TR de quem não respondeu.
- `docs/regras-base.md` não diz como se calcula a CD de uma Habilidade; a regra nova entra no doc (com a confirmação do autor dada no grill) no primeiro ticket.
