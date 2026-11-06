# Presets de inimigo: o Bestiário como conteúdo

Status: ready-for-agent

Decisões do autor no grill de 2026-11-03, registradas em `docs/ROADMAP.md` (seção "Presets de inimigo") e no ADR 0012. Termos: `CONTEXT.md`, seção "Inimigos" (Inimigo, Bestiário, Preset, Template Endemoniado, Endemoniado, Fúria Desumana, Ataque Furtivo) e "Habilidades" (Habilidade de inimigo, Recarga). Regras: `docs/bestiario/`. ADRs: 0001 (dados físicos), 0003 (conteúdo no repositório), 0004 (cliente confiável), 0007 (Habilidade e TR pendente).

## Problem Statement

O Mestre cria cada inimigo à mão. O assistente e o "Criar inimigo" oferecem só 4 dos 10 inimigos do Bestiário, com números que divergem de `docs/bestiario/` (CA, atributos e passivas), e esses presets vivem num arquivo de componente, sem validação nem gate. O inimigo criado guarda só nome, PV, CA, atributos e Habilidades: o Mestre perde de vista os ataques, o deslocamento e as perícias do bloco e precisa abrir o doc durante o jogo. Várias regras do bloco não valem no app: o Endemoniado não é imune a Amedrontado, o TR do Anakim ignora o bônus do bloco, e a Fúria Desumana e o Ataque Furtivo dependem da memória do Mestre. Para um bando, ele cria e renomeia um inimigo por vez, e o Template Endemoniado não existe no app.

## Solution

Todo o Bestiário (10 inimigos) vira conteúdo tipado e validado, com os números dos docs. Ao criar um inimigo, no assistente ou em "Criar inimigo" na sessão, o Mestre escolhe um Preset do Bestiário, liga o Template Endemoniado se quiser, define a quantidade (1 a 8) e cria: os inimigos nascem numerados, prontos e editáveis. Durante o jogo, o cartão do Retrato do inimigo mostra o bloco (ataques, deslocamento, perícias, sentidos, passivas) só ao Mestre. As regras que valem no app passam a funcionar: imunidade a Condição, bônus de TR do bloco, Fúria Desumana (o Mestre rola o TR de CON ao inimigo cair a 0 PV) e o lembrete do Ataque Furtivo no turno do inimigo. O formulário é o mesmo no celular e na web, com o essencial no topo.

## User Stories

**Escolher e criar**
1. Como Mestre, quero escolher um Preset do Bestiário ao adicionar um inimigo no assistente, para começar a sessão com o bando pronto.
2. Como Mestre, quero escolher um Preset em "Criar inimigo" durante a sessão, para pôr uma ameaça nova na cena sem digitar o bloco.
3. Como Mestre, quero que o Preset preencha PV, CA, atributos, ataques, Habilidades, imunidades e detalhes, para não conferir o doc.
4. Como Mestre, quero ver na lista de Presets o nome, o PV e a CA, para escolher rápido.
5. Como Mestre, quero ajustar qualquer campo depois de escolher o Preset, para adaptar o inimigo à cena.
6. Como Mestre, quero criar um inimigo do zero, sem Preset, para as ameaças que o Bestiário não cobre.
7. Como Mestre, quero que os 10 inimigos dos docs estejam no app (Bandido do Deserto, Soldado Filisteu, General de Guerra, Sentinela Amalequita, Sacerdote de Baal, Víbora do Deserto, Leão da Judeia, Urso Pardo Sírio, Guerreiro Anakim e Endemoniado Comum), para não faltar nenhum.
8. Como Mestre, quero que os números do Preset sejam os do doc, para o app e a mesa concordarem.
9. Como autor, quero que o teste falhe quando o conteúdo e o doc divergirem, para não repetir a divergência de hoje.

**Quantidade e nomes**
10. Como Mestre, quero criar de 1 a 8 inimigos do mesmo Preset de uma vez, para montar um bando em poucos toques.
11. Como Mestre, quero que os nomes saiam numerados ("Bandido do Deserto 1", "2"…), para distinguir os alvos.
12. Como Mestre, quero que a numeração continue a da sessão (já há 1 e 2? as novas são 3 e 4), para não repetir nome.
13. Como Mestre, quero que um inimigo sozinho e sem homônimo na sessão fique sem número, para o nome ficar limpo.
14. Como Mestre, quero a mesma criação em lote no assistente e na sessão, para não aprender dois fluxos.

**Template Endemoniado**
15. Como Mestre, quero ligar "Endemoniado" sobre qualquer Preset, para ter um "Leão Endemoniado" ou um "Bandido Endemoniado".
16. Como Mestre, quero ligar o Template num inimigo do zero, para possuir uma criatura que inventei.
17. Como Mestre, quero que o formulário mostre os números já transformados (FOR e CON +4, INT 6, PV, ataques), para conferir antes de criar.
18. Como Mestre, quero que o PV siga o dado de vida com a nova CON (Bandido 15, Leão 34), para o inimigo ficar mais duro na medida certa.
19. Como Mestre, quero que o nome concorde em gênero ("Víbora do Deserto Endemoniada"), para a lista ler bem.
20. Como Mestre, quero que o Endemoniado Comum não aceite o Template, para não possuir quem já é possuído.
21. Como Mestre, quero editar o resultado do Template, para ajustar o que o grupo aguenta.
22. Como Mestre, quero que o Endemoniado ganhe Grito Atormentador (CD 12) e Ataque Bestial, para ele agir como no doc.

**Bloco de consulta**
23. Como Mestre, quero abrir o cartão do Retrato do inimigo e ver o bloco, para consultar ataque, deslocamento e passivas no meio da cena.
24. Como Mestre, quero ver cada ataque com bônus, alcance, dano e tipo, para rolar sem abrir o doc.
25. Como Mestre, quero ver perícias, sentidos, ND e contexto, para narrar a criatura.
26. Como jogador, não quero ver o bloco do inimigo, para a mesa manter o mistério.
27. Como Mestre, quero consultar o bloco pelo pin no mapa e pelo Retrato no Palco, no celular e na web.
28. Como Mestre, quero editar ataques, imunidades e bônus de TR no formulário, e perícias, deslocamento e ND em texto livre.

**Regras que valem no app**
29. Como Mestre, quero que o Endemoniado seja imune a Amedrontado, para a Presença Aterradora não funcionar nele.
30. Como Mestre, quero que o TR do inimigo use o bônus do bloco (Anakim: For +7), para ele resistir como no doc.
31. Como Mestre, quero que, ao PV do Endemoniado chegar a 0, o app me peça o TR de CON, para eu não esquecer a Fúria Desumana.
32. Como Mestre, quero digitar o d20 do TR da Fúria ou usar a Rolagem Virtual, para seguir a mesa de dados físicos.
33. Como Mestre, quero que a CD da Fúria suba 5 a cada uso no combate, para seguir o doc.
34. Como Mestre, quero que o inimigo que passa fique com 1 PV, para a Fúria ter efeito.
35. Como Mestre, quero que o contador da Fúria zere no fim do combate, para o próximo começar em CD 10.
36. Como Mestre, quero ver no turno do inimigo com Ataque Furtivo o lembrete "+1d6 disponível", para aplicá-lo quando valer.
37. Como Mestre, quero marcar "usei" no Furtivo e vê-lo bloqueado até o próximo turno desse inimigo, para respeitar "uma vez por turno".
38. Como Mestre, quero que o 1d6 do Furtivo entre no "Modificar Vida", como o dano comum.
39. Como Mestre, quero que as outras passivas (Formação em Parede, Comandar Aliados, Tática de Matilha, Aura de Heresia, Resistência Opressora, Vulnerabilidade Espiritual) apareçam como texto, para eu aplicá-las na mesa.
40. Como Mestre, quero que as Habilidades com efeito dos Presets (Presença Aterradora, Maldição de Baal, Grito Atormentador, Salto e Bote) apareçam no painel de Habilidades de inimigo, para usá-las pelo app.

**Cópia e origem**
41. Como Mestre, quero que o inimigo criado seja independente do Preset, para ajustar um só sem mexer nos outros.
42. Como autor, quero que corrigir o conteúdo não altere os inimigos já criados, para não mudar uma sessão em andamento.
43. Como Mestre, quero que o inimigo guarde de qual Preset veio e se é Endemoniado, para o app rotular e para a regra futura da Vulnerabilidade Espiritual.

**Celular**
44. Como Mestre no celular, quero escolher Preset, Template, quantidade e criar no topo da tela, para criar um bando em poucos toques.
45. Como Mestre no celular, quero o ajuste fino em seções recolhidas, para a tela não ficar longa.
46. Como Mestre no celular, quero poder editar o inimigo como na web, para não depender do computador.

**Manutenção**
47. Como autor, quero um só caminho para criar a ficha de inimigo (assistente e sessão), para não repetir a divergência entre os dois.
48. Como autor, quero que o `id` de um Preset nunca mude, para a origem gravada continuar valendo.

## Implementation Decisions

- **Conteúdo.** O Preset é conteúdo tipado, validado por esquema e coberto pelo gate de dados, como itens e Habilidades. O `id` é estável (`enemy-preset-<slug>`, a decidir no ticket) e é o valor gravado na origem do inimigo. O arquivo de preset do componente deixa de existir, e `npcPresets.json` não muda.
- **Esquema do Preset.** Identidade e exibição: `id`, nome, gênero do nome (para o Template), descrição curta, tipo/tamanho/tendência, contexto. Mecânica: dado de vida (quantidade, lados, bônus) e PV médio, CA e fonte da CA em texto, os seis atributos, bônus de TR por atributo (opcional), imunidades a Condição, Habilidades (referência à biblioteca de Habilidades de inimigo ou texto), ataques. Consulta: deslocamento (m, com modos), perícias, sentidos, ND e XP, em texto. O XP não soma em nada.
- **Ataque estruturado.** Nome, modalidade (corpo a corpo, distância ou ambas), atributo que o rege (FOR, DES ou Acuidade), bônus de acerto, alcance (em texto), dado de dano e bônus, tipo de dano e um texto extra (veneno da Víbora, 1d6 psíquico da Adaga Cerimonial). Ataques Múltiplos fica como Habilidade em texto.
- **Habilidades da biblioteca.** Anakim usa Presença Aterradora, Sacerdote de Baal usa Maldição de Baal, Endemoniado Comum usa Grito Atormentador e Leão usa Salto e Bote. O Preset referencia pelo id da biblioteca; as demais passivas são texto. As passivas "Ataque Furtivo" e "Fúria Desumana" ganham marcador próprio para o motor.
- **Inimigo criado.** A ficha é uma cópia de tudo; a origem (`presetId`, marca de endemoniado) e o bloco (ataques, detalhes, imunidades, bônus de TR) vão no jsonb que já existe, sem migration. O campo `vocation` do inimigo passa a guardar tipo e tamanho. Fichas antigas, sem esses campos, continuam válidas.
- **Um caminho para criar a ficha.** O assistente e o "Criar inimigo" passam pela mesma montagem de linha e pelo mesmo serviço (refatoração com teste de caracterização, antes da feature).
- **Template Endemoniado.** Função pura do motor: recebe os valores do inimigo (do Preset ou do zero) e devolve os valores transformados, sem estado. FOR e CON +4; INT 6 se maior; tendência Caótico e Mau; Intimidação = mod CAR + 2 se ausente; ataques de FOR +2 no acerto e no dano; Acuidade passa a FOR se ficar maior (ataque de DES não muda); imunidade a Amedrontado; Fúria Desumana, Vulnerabilidade Espiritual (texto), Grito Atormentador (CD 12) e Ataque Bestial (+(mod FOR + 2), 1d6 + mod FOR perfurante). PV = dado de vida com o novo bônus de CON; sem dado de vida, o PV não muda. O nome recebe o sufixo no gênero do Preset. Não se aplica ao Endemoniado Comum. Roda só na criação.
- **Numeração.** Função pura: dado o nome base, a quantidade e os nomes já usados na sessão, devolve os nomes. Um inimigo só, sem homônimo, fica sem número; em lote, ou com homônimo, numera a partir do maior número existente. O sufixo do Template vem antes do número.
- **Imunidade e TR do inimigo.** A proteção do alvo inimigo passa a ler as imunidades da ficha. O TR do inimigo usa o bônus de TR da ficha quando existe para o atributo, senão o modificador. Os dois valem para as Habilidades de jogador e as de inimigo.
- **Fúria Desumana.** Quando o PV de um inimigo marcado com a Fúria chega a 0 (qualquer caminho, visto pelo Realtime), a tela do Mestre abre o pedido de TR de CON com CD 10 + 5 × usos. O Mestre digita o d20 ou usa a Rolagem Virtual (reaproveitando a resolução de TR existente). Passou: PV 1. Falhou: o inimigo segue a 0 PV. O contador de usos fica no estado do participante do combate e zera com ele. O pedido não repete para o mesmo 0 PV.
- **Ataque Furtivo.** No turno de um inimigo com a passiva, o combate do Mestre mostra o lembrete e o botão "usei"; o estado (usado neste turno) fica no estado do participante e libera no próximo turno do inimigo. O dano segue por "Modificar Vida".
- **Interface.** O formulário único passa a ter, no topo, Preset do Bestiário, interruptor Endemoniado, quantidade e criar; abaixo, seções recolhidas: Mecânica (PV, CA, atributos), Ataques, Habilidades, Imunidades e bônus de TR, e Detalhes (texto livre). O cartão do Retrato ganha a seção "Bloco", só para o Mestre. A UI segue `docs/DESIGN.md`.
- **Fatias** (cada PR deixa o app jogável): 0 caminho único de criação; 1 esquema, os 10 Presets e o teste docs ↔ conteúdo, com o formulário lendo do conteúdo; 2 bloco no cartão e editor de ataques/detalhes; 3 quantidade e numeração; 4 imunidade e bônus de TR; 5 Template Endemoniado; 6 Fúria Desumana; 7 Ataque Furtivo.
- **Sem migration.** Todo o estado novo cabe nos jsonb existentes. Se a implementação achar o contrário, volta ao autor.

## Testing Decisions

- **O que é um bom teste:** entrada e saída observáveis, sem olhar a implementação. O motor se testa com o `Rng` semeado e funções puras; o conteúdo, pelo gate e pelos docs; a tela, pelo que o Mestre vê e faz.
- **Seams (confirmados pelo autor):** (1) o motor em `src/domain`: Template Endemoniado, numeração, Fúria Desumana, Ataque Furtivo e o TR e a imunidade do inimigo; (2) o conteúdo: gate de dados e o teste docs ↔ Preset; (3) um E2E do fluxo de criar com Preset, quantidade e Endemoniado. Componentes só ganham teste de comportamento onde já há (formulário, cartão do Retrato).
- **Casos obrigatórios do motor:** Template sobre Bandido (15 PV, FOR 15, CON 16, INT 6) e sobre Leão (34 PV); Víbora (gênero feminino, DES não muda o ataque de Acuidade); inimigo sem dado de vida (PV intacto); Endemoniado Comum recusa o Template; numeração com nomes existentes e em lote; Fúria com CD 10, 15 e 20, sucesso e falha; Furtivo travado e liberado; imunidade bloqueando Amedrontado; TR com e sem bônus do bloco.
- **Teste docs ↔ conteúdo:** lê `docs/bestiario/*.md` e confere PV, CA, atributos, bônus de acerto e dano de cada bloco; verificado mutando um número.
- **Caracterização antes da fatia 0:** a linha de `characters` que `buildEnemyRow` e o "Criar inimigo" gravam hoje.
- **Prior art:** `src/content/abilitiesDocs.test.ts` (docs ↔ conteúdo), `src/content/gameData.test.ts` (gate), `src/domain/enemyAbility.test.ts` e `abilitySave.test.ts` (motor), `src/components/session/enemy-form/UnifiedEnemyForm.test.tsx` (formulário), `e2e/session.spec.ts` e `e2e/combat.spec.ts` (fluxos).
- **Gates:** `npm run check` por PR; `npm run e2e:up` e `npm run test:e2e` ao mexer em tela e fluxo.

## Out of Scope

- O inimigo atacar pelo app (escolher ataque e alvo, rolar o d20 e gravar o dano). Feature futura, com grill próprio.
- A regra da Vulnerabilidade Espiritual (dano espiritual e TR de CAR): pendente do autor; hoje só texto e marca.
- Aplicar o Template a um inimigo já criado, no meio do jogo.
- Editor de Presets pelo Mestre, e Presets próprios da campanha.
- Somar XP, ND ou balancear encontros.
- Mover deslocamento ou perícias para o mapa ou para o motor (ficam como consulta).
- Migrar `npcPresets.json` para o conteúdo (dívida registrada no ROADMAP).
- Corrigir o doc do Endemoniado Comum ou do template (decisão do autor, depois).

## Further Notes

- Números dos docs que o autor preencheu no grill: Grito Atormentador CD 12 (também no Endemoniado Comum), Ataque Bestial +(mod FOR + 2) e 1d6 + mod FOR, Intimidação = mod CAR + 2.
- Todos os blocos usam Proficiência +2; o bônus de TR do bloco já inclui isso (Anakim For +7, Con +5).
- Divergência registrada: o Endemoniado Comum (30 PV) não bate com Bandido + Template (15 PV). O Preset segue o doc do Comum.
- Pendência anterior ainda aberta no ROADMAP: o TR do Teste de sessão soma a Proficiência só quando o atributo é o da Vocação do personagem; não faz parte desta feature.
