# Spec: Repreensão Divina no app

Status: ready-for-agent

Origem: grill de 2026-11-06 (decisões R6–R8 em `docs/ROADMAP.md`, seção Presets de inimigo). Termos em `CONTEXT.md`: Repreensão Divina, Vulnerabilidade Espiritual, Endemoniado, Habilidade.

## Problem Statement

O Sacerdote tem a Repreensão Divina (nível 2, 8 de Fé, uma vez por Descanso Curto) para expulsar um Endemoniado, e o Endemoniado tem a Vulnerabilidade Espiritual. No app, as duas são só texto. O jogador não consegue usar a Habilidade no combate, a Fé e o uso não são gastos, o Mestre não recebe o pedido de TR e ninguém fica sabendo quem fugiu. Na mesa, o Mestre precisa lembrar a regra, calcular a CD e conferir a Fé à mão. Os outros poderes com TR (como a Tática do Cântaro Quebrado) já funcionam pelo app.

## Solution

A Repreensão Divina passa a ser uma Habilidade de combate como as outras com TR. No turno dele, o Sacerdote escolhe um Endemoniado como alvo. Só os inimigos com a passiva Vulnerabilidade Espiritual aparecem. O app gasta os 8 de Fé e o uso e manda ao Mestre o pedido de TR de Carisma, com a CD da regra 6.6 (8 + Proficiência + SAB do Sacerdote). O Mestre lança o d20 ou usa a Rolagem Virtual. Se o Endemoniado falhar, o Mestre e o histórico mostram o lembrete "<nome> falhou no TR: foge do combate por 1 min (10 rodadas)", sem Condição aplicada, e o Mestre conduz a fuga na narrativa. Se não houver Endemoniado na mesa, a Habilidade avisa que não há alvo e não gasta nada.

## User Stories

1. Como jogador de um Sacerdote de nível 2 ou mais, quero usar a Repreensão Divina no meu turno pelo app, para não depender do Mestre lembrar a regra.
2. Como jogador, quero ver na lista de alvos só os inimigos que são Endemoniados, para não gastar Fé num alvo em que a Habilidade não funciona.
3. Como jogador, quero ser avisado quando não houver Endemoniado no combate, para saber por que não consigo usar a Habilidade.
4. Como jogador, quero que os 8 de Fé e o uso por Descanso Curto sejam gastos sozinhos ao usar, para minha ficha ficar certa sem conta manual.
5. Como jogador, quero ver que o uso está aguardando o Mestre lançar o TR de Carisma e com qual CD, para acompanhar o que acontece.
6. Como jogador sem Fé suficiente (menos de 8), quero que o app recuse o uso com o motivo, como já faz com as outras Habilidades de custo de Fé.
7. Como jogador, quero que a Repreensão respeite a economia de ação (só no meu turno e se a Ação ainda não foi usada), como as outras Habilidades de Ação.
8. Como Mestre, quero receber o pedido de TR de Carisma do Endemoniado com a CD já calculada, para não fazer a conta na hora.
9. Como Mestre, quero lançar o d20 do TR ou usar a Rolagem Virtual, com Vantagem ou Desvantagem, como nos outros TR de Habilidade.
10. Como Mestre, quero que o TR some o bônus fixo de Carisma do bloco quando existir, e o modificador de CAR quando não existir, como nos outros TR de inimigo.
11. Como Mestre, quero ver, quando o Endemoniado falha, o lembrete de que ele foge do combate por 1 minuto, para conduzir a fuga.
12. Como Mestre, quero que quem passa no TR apareça como "passou no TR" e nada mais aconteça.
13. Como mesa, quero que o histórico de combate registre o uso e o resultado (passou, ou falhou e foge), para todos acompanharem.
14. Como Mestre, quero que o Endemoniado vindo do Preset Endemoniado Comum e o vindo do Template sejam alvos válidos, porque os dois têm a Vulnerabilidade Espiritual.
15. Como Mestre, quero que um inimigo comum (sem a Vulnerabilidade Espiritual) nunca seja alvo, para a regra valer só onde deve.
16. Como Mestre, quero que um inimigo que criei do zero e a quem dei a Habilidade "Vulnerabilidade Espiritual" pelo nome também seja alvo, para eu poder fazer meus próprios Endemoniados.
17. Como Mestre, quero que a fuga não aplique Condição nem tire o inimigo do combate sozinha, porque o Endemoniado é imune a Amedrontado e quem decide a cena sou eu.
18. Como jogador ou Mestre, quero que um uso pendente que fica para depois do fim do combate expire sem efeito, como nos outros usos com TR.
19. Como Mestre no celular, quero o mesmo fluxo de resolução que já uso nos outros TR, sem tela nova.

## Implementation Decisions

- **Conteúdo.** A Repreensão Divina ganha um efeito de combate: alvo um inimigo, TR de Carisma e, em vez de aplicar Condição, um lembrete para quem falha ("foge do combate por 1 min (10 rodadas)"). Também exige que o alvo tenha a passiva Vulnerabilidade Espiritual. O texto da Habilidade e o do `sacerdote.md` já dizem "TR CAR ou foge do combate por 1 min".
- **Esquema do efeito de Habilidade.** Hoje o efeito precisa aplicar ou tirar Condição. Ele passa a aceitar dois campos opcionais:
  - um **lembrete** para quem falha, no mesmo padrão do lembrete das Habilidades de inimigo (o Grito Atormentador);
  - uma **exigência de passiva do alvo**: o nome da Habilidade que o alvo precisa ter.
  A validação passa a ser "aplica, tira ou lembra". O gate de dados confere que o lembrete só aparece num efeito com TR.
- **Alvos possíveis.** O cálculo puro dos alvos do efeito passa a filtrar pela passiva exigida. Ele lê as Habilidades da ficha do alvo pelo nome, sem acento nem caixa, reusando o reconhecimento de passiva que a Fúria Desumana e o Ataque Furtivo já usam. Sem alvo possível, o painel de uso mostra que não há alvo e não deixa usar, então nada é gasto. Para isso, a lista de alvos do jogador precisa carregar as Habilidades do inimigo, ou só o fato de ele ter a passiva. As fichas dos inimigos já chegam ao cliente do jogador. A narrativa do inimigo continua fora das listas de jogador e espectador.
- **Revelar o Endemoniado.** O autor aceitou que a lista de alvos revele ao jogador quais inimigos são Endemoniados.
- **Uso e TR.** Seguem o fluxo de Habilidade com TR que já existe (ADR 0007). O uso fica pendente com o atributo e a CD da regra 6.6. O Mestre resolve, e o TR do inimigo usa o bônus fixo do bloco ou o modificador. Ninguém recebe Condição. Quem falha fica marcado como falhou, e o lembrete entra no resultado.
- **Frase do uso.** A frase do histórico e do aviso ganha o caso do lembrete: "<nome> falhou no TR: <lembrete>". Hoje sairia "falhou no TR, mas resistiu à Condição", o que está errado. O caso de quem passa não muda.
- **Banco.** Sem migration. A função do banco já aceita alvos sem Condição, e o uso pendente já grava o atributo e a CD. Confirmar no ticket que a resolução com `conditions` vazio para quem falhou é aceita. Se não for, a mudança vira migration com RLS e `revoke`, e o autor confirma antes.

## Testing Decisions

- Um bom teste olha só o comportamento externo: quem pode ser alvo, o que é gravado e gasto, o resultado do TR e a frase que o Mestre e o histórico mostram. Não olha a forma interna dos dados.
- **Motor do efeito de Habilidade** (testes unitários puros):
  - o filtro de alvos com a passiva exigida: Endemoniado do Preset, do Template, do zero com a passiva pelo nome; inimigo comum fora; aliados fora;
  - a frase do uso com o lembrete;
  - o esquema: o lembrete só vale com TR.
  - Precedente: os testes do efeito de Habilidade e o teste da passiva da Fúria.
- **Serviço de uso e resolução de Habilidade** (Supabase falso):
  - o uso grava o pedido com o TR de CAR e a CD 8 + 2 + SAB e gasta 8 de Fé e o uso;
  - na resolução, quem falha volta como falhou, sem Condição, com o lembrete; quem passa, como passou;
  - o bônus fixo de CAR do bloco vale quando existe.
  - Precedente: os testes do serviço de Habilidade e o caso do bônus de TR do bloco.
- **Gate de dados**: a Repreensão Divina continua batendo com o `sacerdote.md`, e o efeito novo passa no esquema.
- **E2E** (Playwright, desktop e Pixel 7): um Sacerdote de nível 2 contra um Endemoniado e um inimigo comum.
  - Só o Endemoniado aparece como alvo.
  - Ao usar, a Fé cai 8.
  - O Mestre vê o pedido de TR de Carisma com a CD certa, lança um d20 que falha e vê o lembrete de fuga no histórico.
  - Sem Endemoniado na mesa, o jogador vê o aviso de que não há alvo.
  - Precedente: os E2E de Habilidade com TR e o da Fúria.

## Out of Scope

- Tirar o Endemoniado do combate ou do mapa sozinho quando ele foge. O Mestre conduz.
- Dano Espiritual, ou qualquer dano da Repreensão. O autor decidiu que não há.
- Exorcismo como regra própria, e o efeito da Repreensão sobre a Fúria Desumana.
- Outras Habilidades de Fé contra o Endemoniado (Purificação, Retribuição Divina).
- Ataque do inimigo pelo app.

## Further Notes

- A passiva é reconhecida pelo nome "Vulnerabilidade Espiritual". Um inimigo antigo, ou criado do zero sem essa Habilidade, não é alvo. O Mestre pode acrescentar a Habilidade pelo formulário.
- A CD usa a SAB do Sacerdote (regra 6.6), e o TR do alvo é de CAR. Não confundir os dois atributos na tela.
