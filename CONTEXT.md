# RPG Bíblico

RPG de mesa baseado em D&D 5e, ambientado no período bíblico (Idade do Bronze/Ferro). Joga-se presencialmente, com dados físicos; o app é a ficha e o guia de cada jogador no celular e a mesa de controle do Mestre.

## Pessoas e papéis

**Mestre**:
Quem conduz a sessão, define as CDs e os modificadores e decide a narrativa.
_Avoid_: GM, narrador, DM

**Personagem**:
A ficha de um jogador ou um NPC controlado pelo Mestre, com Tribo, Vocação, atributos, PV e Fé.
_Avoid_: char, ficha (quando se fala da entidade)

## Origem do personagem

**Tribo**:
Uma das 13 tribos jogáveis de Israel (José aparece dividido em Efraim e Manassés); faz o papel da raça do D&D.
_Avoid_: raça

**Vocação**:
O ofício do personagem (Guerreiro, Batedor, Caçador, Sacerdote); faz o papel da classe do D&D.
_Avoid_: classe

**Sacerdote**:
A Vocação ligada à Fé, exibida como "Sacerdote/Sábio". "Sábio" é o mesmo ofício, não uma Vocação separada.
_Avoid_: Sábio (como vocação própria), Nobre

**Caminho**:
A especialização A ou B que o personagem escolhe dentro da sua Tribo ou Vocação.
_Avoid_: path, especialização, subclasse

## Vida e Fé

**PV**:
Pontos de vida do personagem.
_Avoid_: HP, vida

**Fé Atual**:
O valor de Fé do personagem agora, de 0 a 100. O teto é 100 para todos.
_Avoid_: fé (sem qualificador), current_faith

**Fé Inicial**:
A Fé com que o personagem começa: 50, ou 60 para levitas. É só o ponto de partida, não um teto.
_Avoid_: fé máxima, max_faith

**Fé Efetiva**:
A Fé Atual somada às penalidades dos Itens Profanos que o personagem carrega; é o valor usado nos Testes de Fé.

**Item Profano**:
Item que, só por estar com o personagem (equipado ou não), reduz a sua Fé Efetiva.
_Avoid_: item amaldiçoado, item mágico

**Estado de Fé**:
A faixa em que a Fé Atual (não a Efetiva) está: Inabalável (100–70), Comum (69–31), Abalado (30–11), Vulnerável (10–1) ou Ruptura (0). Cada faixa tem efeito mecânico próprio.
_Avoid_: nível de fé, degradação (para o estado em si)

**Inspiração**:
Recurso do Estado Inabalável, uma vez por dia da sessão: o jogador a gasta para ter Vantagem numa rolagem que escolher. Some enquanto o personagem não estiver Inabalável e volta no dia seguinte.
_Avoid_: bênção, bônus divino

**Fortaleza**:
A virtude escolhida na criação (Coragem, Zelo, Compaixão…). Agir conforme ela pode render Vantagem (o Mestre marca no pedido do Teste) ou 1d4 de Fé (o Mestre aplica), e ela isenta o personagem do Testemunho quando o Mestre julga que cobre a situação.
_Avoid_: fortificação, virtude (como termo de regra)

**Tentação**:
O defeito de caráter escolhido na criação (Ira, Avareza, Luxúria…). Diante do gatilho, o personagem cede sem rolar (sem perder Fé) ou resiste com um Teste de Fé; se falhar, cede e perde 1d6 de Fé.
_Avoid_: vício, fraqueza

## Rolagens

**Teste**:
Rolagem de d20 com modificadores contra uma CD definida pelo Mestre.
_Avoid_: check, dificuldade (no lugar de CD)

**TR**:
Teste de resistência.
_Avoid_: saving throw, salvaguarda

**Teste de Fé**:
Rolagem de 1d100 que passa se o resultado for menor ou igual à Fé Efetiva mais o Modificador de Fé. Tem três usos: Clamor, Tentação e Testemunho.
_Avoid_: teste de Sabedoria (para tentação ou sobrenatural)

**Modificador de Fé**:
Valor com sinal que o Mestre soma à Fé Efetiva num Teste de Fé: positivo é Misericórdia, negativo é Punição.
_Avoid_: dificuldade, redutor, CD (num Teste de Fé)

**Clamor**:
Teste de Fé de um personagem que pede um milagre. Atalhos de Modificador de Fé: Pequena Providência 0, Milagre Moderado −20, Milagre Extraordinário −50. A falha só custa Fé se for um Pedido Egoísta; senão é silêncio divino.
_Avoid_: milagre (para a rolagem), oração

**Pedido Egoísta**:
Clamor que o Mestre marca, antes da rolagem, como egoísta, frívolo ou herege; falhar nele custa 1d6 de Fé.
_Avoid_: pedido frívolo

**Testemunho**:
Teste de Fé de quem presencia algo sobrenatural, a menos que sua Fortaleza cubra a situação. A falha custa 1d6 de Fé e pode deixar o personagem Amedrontado; no Estado Vulnerável os Testemunhos ficam frequentes.
_Avoid_: teste de sanidade, teste de medo

**Vantagem**:
Rolar dois dados e ficar com o melhor: o maior num Teste de d20, o **menor** num Teste de Fé (que passa com resultado baixo). Vantagem e Desvantagem no mesmo Teste se anulam.
_Avoid_: bônus (para a Vantagem), rolagem dupla

**Desvantagem**:
Rolar dois dados e ficar com o pior: o menor num Teste de d20, o **maior** num Teste de Fé.
_Avoid_: penalidade (para a Desvantagem)

**Rolagem Virtual**:
Sorteio feito pelo app no lugar dos dados físicos, sempre opcional para rolagens de jogador.

**Ataque**:
Rolagem de 1d20 + modificador de atributo (FOR; DES com arma de munição; o maior dos dois com Acuidade) + Proficiência (só com arma em que a Vocação é proficiente), que acerta se igualar ou superar a CA do alvo. O alvo pode ser inimigo, NPC ou aliado. No acerto, o dano é o dado da arma mais o mesmo modificador.
_Avoid_: golpe, rolagem física

**Acerto Crítico**:
Ataque com 20 natural: acerta sempre, e os dados de dano da arma são rolados duas vezes (o modificador entra uma vez só).
_Avoid_: crit

**Falha Crítica**:
Ataque com 1 natural: erra sempre, qualquer que seja a CA do alvo.

## Condições e dano

**Condição**:
Estado temporário que afeta o personagem (Sangrando, Envenenado, Atordoado, Cego, Caído, Agarrado, Amedrontado, Impedido, Paralisado, Exausto), sempre nomeado em português. Abalado é um Estado de Fé e Possessão é consequência narrativa; nenhum dos dois é Condição.
_Avoid_: status, efeito, nomes em inglês (poisoned, bleeding…), Doença (usar Envenenado)

**Amedrontado**:
Condição de medo: desvantagem em testes e ataques enquanto a fonte do medo estiver visível.
_Avoid_: Assustado

**Impedido**:
Condição em que o personagem não se desloca e ataca com desvantagem, distinta de Agarrado.
_Avoid_: restrained, preso

**Paralisado**:
Condição em que o personagem não age nem se move, falha automaticamente em TR de FOR e DES, e ataques contra ele têm vantagem.
_Avoid_: paralisia

**Exausto**:
Condição de nível único: desvantagem em testes de atributo e deslocamento pela metade. Sai com um Descanso Longo.
_Avoid_: exaustão em níveis, cansado

**Tipo de dano**:
A natureza de um dano (Corte, Perfuração, Concussão); não é uma Condição.

**Resistência a Condição**:
Proteção de um item contra uma Condição. O nível de cada resistência é o nível da tabela do item (docs/itens/armaduras.md) mais 1 por nível de Qualidade acima de 1, no máximo 4; entre os itens equipados vale o maior nível, Condição por Condição, sem somar. Nível 1: vantagem no teste de resistência; 2: metade da duração (para cima); 3: as duas; 4: imunidade. Ao aplicar uma Condição, o Mestre vê o efeito e pode ignorá-lo.

## Equipamento

**CA**:
Classe de Armadura. Sem armadura, 10 + modificador de DES; armadura leve soma a DES inteira, média soma até +2, pesada não soma DES; escudo dá +2. Armadura e escudo ganham +1 por nível de Qualidade acima de 1. Elmo não dá CA. É sempre calculada para personagens com ficha; o Mestre a digita só para inimigos e NPCs simples.
_Avoid_: AC, defesa

**Elmo**:
Proteção de cabeça que dá só Resistência a Condição, nunca CA.
_Avoid_: capacete (como termo de regra)

**Proficiência de armadura**:
Os tipos de armadura e escudo que a Vocação sabe usar. Equipar sem proficiência é permitido, com aviso.

**Qualidade**:
O nível de forja de um item (1 a 5): material e artesanato, nunca magia. Cada nível acima de 1 soma +1 de CA em armaduras e escudos e fortalece a Resistência a Condição.
_Avoid_: nível mágico, encantamento, item +1

## Morte

**Morrendo**:
Personagem com 0 PV que ainda faz Testes de Morte. Continua Morrendo depois do fim do combate, mas não atravessa o fim da sessão: o Mestre resolve os testes antes de encerrar.
_Avoid_: morto (enquanto ainda rola), caído (que é Condição)

**Teste de Morte**:
Rolagem de 1d20 de quem está Morrendo: 10 ou mais é sucesso, 9 ou menos é falha, 1 conta duas falhas, 20 volta com 1 PV.
_Avoid_: death save

**Estável**:
Personagem com 0 PV, inconsciente, que já não faz Testes de Morte (3 sucessos ou estabilizado por um aliado).

**Morto**:
Personagem que acumulou 3 falhas em Testes de Morte. A ficha vira memorial e o jogador perde o acesso.

## Progressão

**Marco**:
A decisão do Mestre, ao encerrar a sessão, de que um personagem sobe de nível. O jogo não usa XP.
_Avoid_: XP, experiência

## Descanso

**Descanso Curto**:
Pausa de 1 hora no jogo; até 2 por dia.

**Descanso Longo**:
Pausa de 8 horas no jogo; 1 por dia. Recupera todos os PV e, com ensino ou oração, Fé ao grupo. Exige Sustento.

**Sustento**:
1 Ração e 1 Odre consumidos por personagem num Descanso Longo. Quem descansa sem Sustento acorda Exausto.
_Avoid_: comida, provisões (como termo de regra)

**Ração**:
Consumível de Sustento, usado só no Descanso Longo.
