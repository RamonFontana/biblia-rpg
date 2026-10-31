# Bálsamo: cura 1d4 só no Descanso Curto

Status: ready-for-agent

Decisões do autor no grill de 2026-10-30 (todas as recomendações aceitas). Termos: `CONTEXT.md` (Bálsamo, Descanso Curto, Dado de Vida, Hotbar, Painel, Cartão de Habilidade, NPC jogável). ADRs: 0001 (dados físicos, o app registra), 0002 (Qualidade não é magia), 0004 (regras no motor, cliente confiável), 0006 (Descanso Curto). Visual: `docs/DESIGN.md`.

## Problem Statement

O Bálsamo está no catálogo e no kit do Sacerdote/Sábio (3 unidades) com a descrição "Cura 1d4 PV em Descanso", mas o app não cura nada: o jogador toca em "Usar", o item some do inventário e o PV não muda, porque o dado de cura nunca é rolado. Pior, o "Usar" funciona a qualquer momento (em pleno combate, por exemplo), o que contradiz a regra do item, que é de Descanso. O jogador perde um item de 5 SP sem benefício e não entende por quê.

## Solution

O Bálsamo continua um item consumível, mas só funciona dentro do Descanso Curto aberto, e passa a curar de verdade. No Painel Descanso, ao lado dos Dados de Vida, o jogador vê um cartão "Bálsamo" com a quantidade que tem e o dado a rolar (1d4; a Qualidade do item sobe o dado, ADR 0002). Ele rola na mesa e digita o resultado (ou usa o dado virtual, como nos Dados de Vida); o app cura esse valor, sem passar do PV máximo, e gasta um Bálsamo. Fora do Descanso Curto o Bálsamo aparece bloqueado na Hotbar e no Inventário, com o motivo "Só no Descanso Curto". Os Dados de Vida seguem como a mecânica de escolher quantos gastar; Ração e Odre seguem como Sustento, sem cura.

## User Stories

1. As a jogador, I want to usar o Bálsamo dentro do Descanso Curto e ver meu PV subir, so that o item que comprei por 5 SP tenha efeito.
2. As a jogador, I want to ver no Painel Descanso o cartão "Bálsamo" com a quantidade e o dado a rolar, so that eu saiba o que rolar na mesa antes de digitar.
3. As a jogador, I want to digitar o resultado do dado físico que rolei, so that a rolagem da mesa valha (ADR 0001).
4. As a jogador sem dado à mão, I want to usar o dado virtual, so that eu não fique impedido de usar o item.
5. As a jogador, I want que o app recuse um resultado fora da faixa do dado (por exemplo 5 num d4), so that um erro de digitação não cure a mais.
6. As a jogador, I want que a cura nunca passe do meu PV máximo, so that o PV fique sempre coerente.
7. As a jogador, I want ver depois do uso quanto curei e meu PV antes e depois, so that eu confirme o efeito.
8. As a jogador, I want que o Bálsamo gasto saia do meu inventário só quando a cura foi gravada, so that eu não perca o item sem curar.
9. As a jogador, I want que a Qualidade do meu Bálsamo suba o dado (1d4, 1d6, 1d8…), so that um item melhor cure mais, como os outros itens de Qualidade.
10. As a jogador com um Bálsamo de Qualidade que rola mais de um dado, I want digitar a soma, so that eu não precise de um campo por dado.
11. As a jogador, I want ver o Bálsamo bloqueado na aba Itens da Hotbar fora do Descanso Curto, com o motivo "Só no Descanso Curto", so that eu não gaste o item por engano.
12. As a jogador, I want que tocar no Bálsamo bloqueado ainda abra o Cartão com o motivo, so that eu entenda a regra em vez de ver um botão morto.
13. As a jogador, I want que, com o Descanso Curto aberto, o Usar do Cartão do Bálsamo me leve ao Painel Descanso, so that haja um só lugar de uso.
14. As a jogador, I want ver o Bálsamo bloqueado no Inventário com o motivo, so that a regra seja a mesma em todas as telas.
15. As a jogador, I want que o Bálsamo não gaste meu turno nem apareça como Habilidade, so that ele não seja confundido com uma ação de combate.
16. As a jogador com PV cheio, I want ver o Bálsamo bloqueado com "PV já está cheio", so that eu não desperdice o item.
17. As a jogador Morrendo (0 PV, não Estável), I want que o Bálsamo fique bloqueado como os Dados de Vida, so that a regra do Morrendo seja uma só.
18. As a jogador Estável, I want que o Bálsamo me acorde ao curar, saindo do Estável e zerando os Testes de Morte, so that ele se comporte como o Dado de Vida.
19. As a jogador Morto, I want que o Bálsamo fique bloqueado, so that um personagem Morto não seja curado por item.
20. As a jogador sem Bálsamo, I want ver o cartão do Bálsamo indicando que não tenho, so that eu entenda por que não posso usar.
21. As a jogador com 3 Bálsamos, I want usar mais de um no mesmo Descanso Curto, so that o único limite seja a quantidade que carrego (decisão do autor, sem teto por descanso).
22. As a jogador, I want gastar Dados de Vida e Bálsamo no mesmo Descanso, em qualquer ordem, so that as duas curas se somem.
23. As a jogador, I want que o Bálsamo não some meu modificador de CON, so that ele seja um extra de item e o Dado de Vida seja a cura do corpo.
24. As a jogador, I want que o Bálsamo só cure a mim mesmo, so that o fluxo seja simples nesta fatia (aliado fica para depois).
25. As a Mestre, I want usar o Bálsamo de um NPC jogável no Painel Descanso, so that o NPC se cure como qualquer personagem, do mesmo jeito que gasto os Dados de Vida dele.
26. As a Mestre, I want ver no Painel Descanso o cartão do Bálsamo de cada NPC jogável que tem o item, so that eu veja quem pode usar.
27. As a Mestre, I want que o Bálsamo de um NPC jogável siga os mesmos bloqueios do jogador, so that eu não precise lembrar exceções.
28. As a Mestre, I want que o Descanso Curto aberto seja o gatilho do Bálsamo, so that eu controle quando o grupo pode usá-lo.
29. As a Mestre, I want que o Bálsamo deixe de funcionar quando eu encerro o Descanso Curto, so that o item não vire cura de combate.
30. As a jogador que usa leitor de tela, I want que o cartão do Bálsamo e o motivo do bloqueio sejam anunciados com nome acessível, so that eu entenda o estado sem ver a tela.
31. As a jogador no celular, I want que o campo do resultado e o botão tenham toque de pelo menos 44 px, so that eu acerte o toque no meio da sessão.
32. As a jogador, I want que o outro jogador veja meu PV subir em tempo real, so that o grupo acompanhe a cura.
33. As a autor, I want que a Ração e o Odre continuem como Sustento sem cura, so that só o Bálsamo mude de comportamento.
34. As a autor, I want que a regra "só no Descanso Curto" seja um dado do item e não um nome fixo no código, so that outro item de descanso possa existir sem mexer na interface.
35. As a autor, I want que o "Usar" antigo, que consome o item sem curar, deixe de existir para o Bálsamo, so that nenhum jogador perca mais o item por esse caminho.

## Implementation Decisions

- **Regra (confirmada pelo autor em 2026-10-30):** o Bálsamo cura o resultado do dado do item, sem modificador de CON; sem teto de usos por Descanso (a quantidade em estoque é o limite); só no próprio personagem; o dado vem da descrição/efeito do item e sobe com a Qualidade pela progressão que já existe (ADR 0002). Nenhum valor de balanceamento muda: custo (5 SP), kit (3 para o Sacerdote/Sábio) e dado base (1d4) ficam.
- **Item como dado:** o efeito do Bálsamo no catálogo passa a declarar que só vale no Descanso Curto (um marcador de uso no efeito do item, validado pelo esquema de conteúdo); o motor interpreta o marcador e a interface lê o motivo do motor. O `id` do item não muda. Mudou o catálogo? Regerar o seed e confirmar a migration, como manda o AGENTS.md.
- **Motor (puro):** funções novas, ao lado das do Dado de Vida, para (a) o dado efetivo do Bálsamo a partir do item e da Qualidade; (b) a validação do resultado digitado, com faixa de N a N×faces para N dados; (c) o cálculo da cura: resultado limitado pelo PV máximo, sem CON; (d) o bloqueio, com as razões: Descanso fechado, Morto, Morrendo, PV cheio, sem Bálsamo, reaproveitando a regra de bloqueio do Dado de Vida; (e) a mensagem de cada bloqueio. O dado virtual usa o `Rng` injetado (`systemRng` no app).
- **Cartão no Painel Descanso:** um cartão "Bálsamo" ao lado do gasto de Dados de Vida, com o mesmo molde: quantidade, "Resultado do dX" (ou soma), botão de gastar, botão do dado virtual, mensagem de sucesso e de erro, bloqueio visível com o motivo. Usa os componentes de `docs/DESIGN.md`. O Mestre vê um cartão por NPC jogável que tem o item, no mesmo lugar onde gasta os Dados de Vida dele.
- **Gravação:** PV e inventário são dois efeitos; a ordem é gravar o PV e depois consumir o item, e se o consumo falhar o jogador vê o erro e a tela é ressincronizada (nunca perde o item sem curar). Quem estava Estável acorda na mesma gravação do PV, como no Dado de Vida. Sem função nova no banco e sem migration de schema: o cliente é confiável para regra de jogo (ADR 0004) e a ficha já é do jogador por RLS; o NPC jogável segue o caminho que o Mestre já usa para os Dados de Vida.
- **Hotbar (aba Itens):** o Bálsamo aparece como consumível com quantidade, mas bloqueado fora do Descanso Curto (e pelas outras razões do bloqueio). O Cartão abre com o motivo; com o Descanso Curto aberto e sem bloqueio, o Usar do Cartão abre o Painel Descanso, sem gastar nada. O caminho genérico de consumir da Hotbar deixa de tratar o Bálsamo.
- **Inventário:** o Bálsamo mostra o botão de usar desabilitado com o motivo (fora do Descanso Curto: "Só no Descanso Curto"; dentro: "Use no painel Descanso"). O caminho genérico de consumir deixa de tratar itens de uso só no Descanso.
- **Estado do Descanso na tela:** a Hotbar e o Inventário precisam saber se o Descanso Curto está aberto; essa informação já existe na sessão e é passada para baixo como valor, sem consulta nova ao banco. O tempo real do Descanso já atualiza o estado.
- **Dívida registrada, não implementada:** (1) a passiva do Médico de Judá (caminho B, nível 12, "curas atingem o valor máximo dos dados" no Descanso Curto) segue sem implementação e ganha uma linha no ROADMAP; (2) o Bálsamo em aliado (a Ungido de Aser fala em "aplicar a si ou a um aliado") fica como ideia futura, pois exigiria escrever na ficha alheia por uma função no banco.
- **Glossário:** o termo **Bálsamo** entra em `CONTEXT.md` (feito junto com esta spec). Nenhum ADR novo: a decisão é reversível e não surpreende.

## Testing Decisions

- **O que é um bom teste aqui:** observa o comportamento pelo que o jogador vê (PV, quantidade, mensagem, botão habilitado ou não) e pelo que o motor devolve; não olha estado interno de componente nem a ordem das chamadas ao banco além do contrato "item só sai depois da cura".
- **Seams (a confirmar com o autor; usam os que já existem):**
  1. **Motor puro** (Vitest, sem React): dado efetivo com Qualidade, validação do resultado (1 e N dados), cura limitada pelo PV máximo, sem CON, cada razão de bloqueio, e a leitura do marcador "só no Descanso". Precedente: os testes de Dado de Vida e de consumíveis do domínio (incluindo o teste de caracterização que hoje documenta que o dado de cura nunca é rolado).
  2. **Painel Descanso** (teste de componente do cartão de descanso, com a camada de dados mockada): cura com o valor digitado, recusa de fora da faixa, dado virtual com semente, bloqueios, Estável que acorda, sucesso que atualiza a ficha, falha de consumo que mostra erro, e a visão do Mestre com NPC jogável. Precedente: os testes de `ShortRestCard` e do gasto de Dados de Vida.
  3. **Hotbar e Inventário** (testes de componente): o Bálsamo bloqueado fora do Descanso com o motivo, o Usar do Cartão que leva ao Painel Descanso, e a ausência do caminho antigo que consome sem curar. Precedente: `PlayerHotbar.test.tsx` e os testes de inventário.
  4. **E2E (Playwright, um fluxo):** Mestre abre o Descanso Curto, o jogador com PV baixo usa o Bálsamo, o PV sobe, a quantidade cai, e o Mestre encerra o descanso e o item volta a aparecer bloqueado. Precedente: o spec de Dados de Vida.
- O teste de `gameData` e o de seed de itens cobrem o marcador novo no catálogo.

## Out of Scope

- Bálsamo em um aliado (função no banco para escrever na ficha alheia).
- A passiva do Médico de Judá e qualquer outro efeito que altere a cura em Descanso.
- Teto de Bálsamos por Descanso, modificador de CON na cura, mudança de preço, de kit ou de dado base.
- Uso do Bálsamo no Descanso Longo ou fora de qualquer Descanso.
- Sustento (Ração e Odre) no Descanso Longo e qualquer cura de Sustento.
- Outros itens de Descanso, apesar de o marcador permitir.
- Mapa e demais passos da Onda 6.

## Further Notes

- O teste de caracterização de `consumables` já registra o problema ("o dado de cura é exibido mas nunca rolado"); ele deve ser atualizado, não apagado, quando o Bálsamo deixar de passar pelo caminho genérico (AGENTS.md: a correção vem num commit `fix:` separado se o comportamento atual parecer errado).
- Docs a atualizar na implementação: `docs/itens/consumiveis.md` (texto do Bálsamo, se divergir), a linha do ROADMAP sobre `heal_dice` (passa a "especificado e implementado") e a dívida do Médico de Judá.
- Lembrete pendente da Onda 6: teste em iPhone real do arrasto do bottom sheet e do pressionar e segurar.
