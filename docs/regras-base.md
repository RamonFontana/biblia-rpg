# Regras e Mecânicas Base

Este documento reúne o núcleo das mecânicas do RPG Bíblico, adaptadas do D&D 5e para um cenário histórico focado entre o Reino Unido de Israel (Rei Saul e Davi) até o Cativeiro Babilônico (aprox. 1050 a.C. a 586 a.C.), na Idade do Bronze Final e Idade do Ferro.
Neste período, não há uso de magia arcana ou feitiçaria, sendo severamente proibida pela lei, e o sobrenatural provém estritamente de Deus ou de forças demoníacas hostis.

---

## 1. Atributos e Geração

O sistema utiliza os **6 atributos padrão do D&D**:

| Atributo | Abreviação | Uso Principal |
|---|---|---|
| **Força** | FOR | Combate corpo a corpo, carregar peso, testes de atletismo |
| **Destreza** | DES | Esquiva (CA), furtividade, armas de longo alcance ou de acuidade |
| **Constituição** | CON | Pontos de vida, resistência física, fôlego |
| **Inteligência** | INT | Conhecimento geral, estratégia, investigação |
| **Sabedoria** | SAB | Percepção, intuição, **resistência de Fé**, oração |
| **Carisma** | CAR | Liderança, persuasão, intimidação |

**Método de Geração**:
Na criação do personagem, o jogador escolhe entre dois métodos oficiais para determinar seus atributos base (antes de aplicar bônus da Tribo):
- **Standard Array**: Distribua os valores fixos: 15, 14, 13, 12, 10, 8.
- **Rolagem Clássica (4d6 drop 1)**: Role 4d6, descarte o menor dado e some os 3 restantes. Repita isso 6 vezes e distribua os resultados.

---

## 2. Classe de Armadura (CA)

A Classe de Armadura (CA) define a dificuldade de atingir o personagem.
- A CA base sem armadura é **10 + Modificador de Destreza**.
- Ao usar **armaduras da época** (couro, bronze, ferro), a CA muda conforme o equipamento.
- Armadura leve soma o Modificador de Destreza inteiro; armadura média soma até **+2**; armadura pesada não soma Destreza.
- Escudos (de madeira ou bronze) podem adicionar **+2 na CA**.
- **Sem bônus sobrenaturais**: Não existem itens mágicos no jogo. Nenhum equipamento concede poder sobrenatural; a CA provém de armadura e escudo físicos e do modificador de Destreza.
- **Qualidade do item**: Cada item tem Qualidade de 1 a 5, que representa material e artesanato (bronze melhor, ferro temperado), nunca magia. Cada nível de Qualidade acima de 1 soma **+1 na CA** de armaduras e escudos e fortalece a resistência do item a Condições.

---

## 3. Vocações

A **Vocação** equivale à "classe" no D&D, definindo o treinamento e papel do personagem na sociedade e no combate. Todas progridem em habilidades adicionais nos níveis **2, 6, 10, 14 e 18**.

| Vocação | Papel Principal | Descrição |
|---|---|---|
| **Guerreiro** | Linha de frente | Soldados de Israel, guarda real ou mercenários. Uso de armaduras pesadas e armas de guerra. |
| **Batedor** | Dano furtivo e utilidade | Especialistas em furtividade, espionagem e ataques rápidos e letais. |
| **Caçador / Nômade** | Sobrevivência e longo alcance | Habitantes dos ermos. Rastreio, arqueria ou fundas, e conhecimento da terra. |
| **Sacerdote / Sábio** | Suporte espiritual e cura | Levitas, profetas, médicos e conselheiros. Essenciais para restaurar a Fé e curar ferimentos. |

**A Regra de Levi**:
Qualquer personagem de qualquer Tribo pode escolher a Vocação de Sacerdote/Sábio. No entanto, se um jogador escolher a **Tribo de Levi**, ele é **obrigado** a seguir a Vocação de Sacerdote/Sábio.

*(Veja o detalhamento de cada vocação no diretório [docs/vocacoes](./vocacoes/README.md))*

---

## 4. O Sistema de Fé

A **Fé** substitui a magia mecânica no jogo e mede a comunhão do personagem com a Providência Divina e sua sanidade mental/espiritual frente às abominações ou provações. A Fé também é a medida primária usada em rolagens de clamor para Intervenções Divinas (Milagres).

- **Barra de Fé**: Escala de 0 a 100 pontos.
- **Início**: Todos os personagens (exceto levitas) iniciam com **50 pontos de Fé** (Estado Comum).
- **Levitas**: Membros da Tribo de Levi começam com **60 pontos de Fé**.

### 4.1 Fortalezas e Tentações

Na criação de personagem, definem-se dois traços narrativos com peso mecânico (obrigatoriamente 1 de cada no Nível 1):
- **1 Fortaleza**: Ação honrosa natural. Atuar de acordo com a Fortaleza pode conceder bônus (Vantagem) na rolagem ou recuperar **1d4 de Fé**. A Fortaleza também isenta o personagem do Testemunho quando o Mestre julga que ela cobre a situação.
- **1 Tentação**: Um defeito de caráter persistente. Se confrontado por um gatilho, o personagem pode **ceder** (interpreta as consequências, sem rolar e sem perder Fé) ou **resistir** com um **Teste de Fé** (ver 4.4). Em caso de falha, cede e perde **1d6 pontos de Fé**.

*(Consulte o documento [Fortalezas e Tentações](fortalezas-tentacoes.md) para as regras completas e as listas de opções).*

### 4.2 Degradação de Fé

O Estado de Fé é definido pela **Fé Atual** (não pela Fé Efetiva, ver 4.4).

| Faixa de Fé | Estado | Efeito Mecânico |
|---|---|---|
| **100–70** | 🟢 Inabalável | Nenhuma penalidade. Profunda paz. Recebe **Inspiração 1x/dia**. |
| **69–31** | 🟡 Comum | Sem penalidades, sem bônus. Estado mundano. |
| **30–11** | 🟠 Abalado | A "cobertura" divina diminui. **Desvantagem** em testes de resistência de Sabedoria ou Carisma. |
| **10–1** | 🔴 Vulnerável | Risco de surtos ou possessão demoníaca ao testemunhar atrocidades ou heresias: o Mestre exige **Testemunho** (ver 4.4) com frequência. |
| **0** | ⚫ Ruptura | O personagem **sucumbe**. Sofre tragédia (possessão incontrolável, loucura, morte) a menos que o grupo realize um ato massivo de consagração e jejum liderado por um Sacerdote, até o nascer do sol. Habilidades que exigem Fé falham automaticamente. |

### 4.3 Recuperação de Fé

- **Descanso Longo Devocional**: **1d4** de Fé para o grupo inteiro, desde que haja momento de ensino/oração conduzido. Se for por um Sacerdote, recupera **1d4+2**.
- **Eventos e Ações**: Atos heroicos de fidelidade a Deus rendem recuperação instantânea (ex: resistir a uma grande tentação, destruir um altar de ídolos) a critério do Mestre (ex: +10 a +30 pontos).

### 4.4 Testes de Fé: Clamor, Tentação e Testemunho

O **Teste de Fé** é a rolagem que mede a firmeza espiritual do personagem. Quem rola é o jogador, com dados físicos na mesa; o app registra o resultado.

- **Fé Efetiva**: a Fé Atual somada às penalidades dos **Itens Profanos** que o personagem carrega (equipados ou não).
- **Modificador de Fé**: valor com sinal que o Mestre soma à Fé Efetiva. Positivo é Misericórdia; negativo é Punição.
- **Rolagem**: o jogador rola **1d100**. O teste passa se o resultado for **menor ou igual** à `(Fé Efetiva) + (Modificador de Fé)`.

Há três usos:

**Clamor (milagre)**
Milagres nunca são garantidos por decisão narrativa do Mestre. Quando um personagem clama por uma intervenção direta na realidade, o Mestre avalia o pedido e define o Modificador de Fé:
- **Pequena Providência** (Ex: Encontrar água, coincidir um evento menor): Modificador 0.
- **Milagre Moderado** (Ex: Curar um veneno mortal instantaneamente): Modificador −20.
- **Milagre Extraordinário** (Ex: Abrir um rio, chuva de fogo, curas em massa): Modificador −50.

O Mestre pode usar outro valor quando a situação pedir.
- **Sucesso**: o milagre ocorre conforme a vontade de Deus.
- **Falha**: a Vontade Divina disse "agora não". A ação é gasta e o milagre não ocorre, sem perda de Fé (silêncio divino).
- **Pedido Egoísta**: antes da rolagem, o Mestre pode marcar o pedido como egoísta, frívolo ou herege. Se um Pedido Egoísta falhar, o personagem perde **1d6** de Fé como punição espiritual.

**Tentação**
Quando o gatilho da Tentação aparece, o personagem cede ou resiste (ver 4.1). Ao resistir, faz um Teste de Fé com o Modificador de Fé definido pelo Mestre. Falha: cede à Tentação e perde **1d6** de Fé.

**Testemunho**
Quem presencia algo sobrenatural (um endemoniado, um prodígio, um culto pagão com manifestação) faz um Teste de Fé, a menos que sua **Fortaleza** cubra a situação. Falha: perde **1d6** de Fé, e o Mestre pode deixar o personagem Amedrontado.

---

## 5. Progressão de Nível

Os personagens vão do nível 1 ao 20. O jogo **não usa XP**: ao encerrar a sessão, o Mestre marca quem sobe de nível (**Marco**), segundo os desafios superados (combates, negociações, testes de fé e marcos de história).

Quando um personagem sobe de nível, ocorrem os ganhos abaixo, alternando ou combinando a **Tribo (Raça)** e a **Vocação (Classe)**:

1. **Aumento de PV**: Rola-se o dado de vida da Vocação + Modificador de Constituição (ou usa o valor médio + Modificador).
2. **Novas Habilidades**:
   - **Níveis 1, 4, 8, 12, 16, 20**: O personagem ganha habilidades da sua **Tribo** (ver [docs/tribos/](./tribos/README.md)).
   - **Níveis 2, 6, 10, 14, 18**: O personagem ganha habilidades da sua **Vocação**.
3. **Aumento de Atributo** (níveis **4, 8, 12, 16 e 19**): 2 pontos de atributo, +1 em cada escolha (+2 em um só atributo ou +1 em dois), com limite de 20.
4. **Bônus de Proficiência**: +2 nos níveis 1–4, +3 nos níveis 5–8, +4 nos níveis 9–12, +5 nos níveis 13–16 e +6 nos níveis 17–20.

*Multiclasse não é permitida por padrão neste sistema base.*

---

## 6. Sistema de Combate

Adaptado do combate de D&D 5e sem uso de magia arcana. O combate se divide em rodadas de 6 segundos.

### 6.1 Iniciativa e Turnos
No começo do combate, cada jogador rola a própria **Iniciativa** na mesa e o Mestre registra os valores no app (o Mestre rola pelos NPCs e inimigos). A ordem flui do maior para o menor.
Em seu turno, um personagem pode:
- **Movimento**: Até seu deslocamento (geralmente 9 metros).
- **Ação Principal**: Atacar, Correr (Dash), Desengajar, Esquivar, Ajudar, Esconder, Usar um Item ou Usar habilidade ativa da Tribo/Vocação.
- **Ação Bônus**: Habilidades específicas podem usar uma ação bônus (como ataques com a segunda mão usando armas leves).
- **Reação**: Uma vez por rodada, em resposta a um gatilho específico (ex: Ataque de Oportunidade quando um inimigo sai da sua área de alcance).

Quem passa o turno é o Mestre, no app, quando o jogador avisa que terminou.

### 6.2 Dano, PV e Morte
- **Acertando o Alvo**: Rola-se `1d20 + Modificador de Força (ou Destreza para acuidade/distância) + Proficiência`. Se igualar ou superar a CA do alvo, acerta. A Proficiência só entra com arma em que a Vocação é proficiente. O alvo pode ser inimigo, NPC ou aliado.
- **Acerto Crítico e Falha Crítica**: Um **20 natural** sempre acerta e os dados de dano da arma são rolados duas vezes (o modificador entra uma vez só). Um **1 natural** sempre erra.
- **Dano**: Conforme a arma, mais o Modificador de atributo usado. Desarmado, 1 + Modificador de Força.
- **Ficar a 0 PV**: O personagem cai Inconsciente e fica **Morrendo**. Deve fazer **Testes de Morte** em seus próximos turnos (1d20: 10 ou mais é sucesso, 9 ou menos é falha; um 1 natural conta como duas falhas e um 20 natural devolve o personagem com 1 PV).
  - **3 sucessos**: Estabiliza (vivo, mas inconsciente com 0 PV). Um aliado também pode estabilizar o personagem com um teste de Medicina (CD 10) como Ação.
  - **3 falhas**: Morte Permanente. O personagem sofre um **Soft Delete** no sistema, bloqueando o acesso do usuário, mantendo a ficha apenas como um memorial histórico.
  - **Fim do combate**: o personagem continua Morrendo, e o Mestre pede os Testes de Morte restantes, um por vez, até ele ficar Estável ou Morto.

### 6.3 Sessões, Descansos e Persistência
- **Fim de Sessão**: Ao encerrar a partida, o Mestre marca quem sobe de nível (Marco). Nenhum personagem pode estar Morrendo nesse momento: o Mestre resolve os Testes de Morte antes de encerrar.
- **Início de Partida**: O personagem (inclusive o que estava Estável) entra na nova sessão totalmente "Descansado", com PV Máximo e usos de habilidades restaurados.
- **Persistência da Fé**: A Fé **NÃO reseta**. O valor atual de Fé se mantém entre as sessões. A única forma de restaurá-la é via atos heróicos ou descansos devocionais narrativos na partida.

### 6.4 Consumíveis e Munição
- **Gastar Munição**: Munições (como Flechas e Pedras para Funda) são tratadas como itens consumíveis com cargas. Ao atacar com armas à distância, o jogador pode consumir a munição respectiva reduzindo sua quantidade.
- **Recuperar Munição**: Após o combate, munições recuperáveis (como Flechas) podem ser recuperadas. O jogador testa sua sorte tentando recuperá-las; há uma chance automática de 50% de sucesso de recuperação por cada flecha gasta.
- **Munição Não-Recuperável**: Munições mais simples, como Pedras para Funda, não possuem mecânica de chance de recuperação automática, devendo o mestre repor manualmente as cargas caso o jogador reabasteça coletando do ambiente.
- **Descanso Curto (1 hora na partida)**: Até 2 por dia. Permite gastar Dados de Vida para recuperar PV. Algumas habilidades de vocação se recarregam (se especificado), mesmo que ninguém se cure.
- **Descanso Longo (8 horas na partida)**: 1 por dia. Recupera todo PV e metade dos Dados de Vida gastos. Recupera **1d4 de Fé** para o grupo inteiro (ou 1d4+2 se o ensinamento for conduzido por um Sacerdote). Exige **Sustento**.
- **Sustento**: Cada personagem consome **1 Ração e 1 Odre** no Descanso Longo. Quem descansa sem Sustento acorda **Exausto**. O Mestre pode dispensar o Sustento quando a história der comida e água ao grupo (uma caçada, um poço, a hospitalidade de um NPC).

### 6.5 Condições Comuns
- **Sangrando**: Sofre 1d4 de dano no final do seu turno. Acaba se curado ou após teste de Medicina (CD 10) como Ação.
- **Atordoado**: Incapacitado. Falha automaticamente em testes de Força ou Destreza. Ataques contra ele têm Vantagem.
- **Amedrontado**: Desvantagem em rolagens enquanto a fonte do medo estiver visível.
- **Envenenado**: Desvantagem em rolagens de ataque e testes de habilidade.
- **Caído**: Ataques a até 1,5m contra o alvo têm Vantagem; ataques à distância têm Desvantagem. Levantar custa metade do movimento.
- **Agarrado**: Deslocamento cai para 0. Escapar exige uma Ação para teste de Atletismo ou Acrobacias contra o Atletismo do agarrador.
- **Cego**: Falha automática em testes que exijam visão. Seus ataques têm Desvantagem, e ataques contra você têm Vantagem.
- **Impedido**: Deslocamento cai para 0 e seus ataques têm Desvantagem. É diferente de Agarrado, que exige um agarrador.
- **Paralisado**: Não pode agir nem se mover. Falha automaticamente em testes de resistência de Força e Destreza, e ataques contra ele têm Vantagem.
- **Exausto**: Desvantagem em testes de atributo e deslocamento pela metade. Sai com um Descanso Longo com Sustento.

> **Nota**: Situações não cobertas por estas condições são resolvidas pelo bom senso do Mestre.

### 6.6 CD das Habilidades

Quando uma Habilidade de Tribo ou de Vocação pede um Teste de Resistência (TR) ao alvo, a **CD** é **8 + Proficiência + Modificador do atributo da Vocação** do personagem que a usa: **Sabedoria** para Sacerdote/Sábio e Caçador, **Força** para Guerreiro e **Destreza** para Batedor. Vale também para as Habilidades de Tribo. O alvo rola 1d20 + o modificador do atributo do TR contra essa CD (o personagem do jogador soma também a Proficiência quando o atributo do TR é um dos dois **Testes de Resistência** da Vocação dele, a linha de mesmo nome em `docs/vocacoes`); quem falha sofre a Condição da Habilidade, e quem passa não sofre nada. A Resistência a Condição do alvo ainda pode reduzir a duração ou anular a Condição.

---

## 7. Guia de Criação de Personagem

Para criar seu personagem, siga estes 6 passos exatos:

1. **Escolha sua Tribo**: Selecione uma das [13 tribos de Israel](./tribos/README.md). Anote suas duas passivas de Nível 1.
2. **Defina seus Atributos**: Escolha entre Standard Array ou role 4d6 (descarta o menor) seis vezes. Distribua e depois some eventuais restrições/bônus caso o Mestre as utilize.
3. **Escolha sua Vocação**: Guerreiro, Batedor, Caçador ou Sacerdote. *(Lembre-se: Levitas devem ser Sacerdotes/Sábios).*
4. **Fortaleza e Tentação**: Escolha **obrigatoriamente** 1 Fortaleza e 1 Tentação da [lista oficial](fortalezas-tentacoes.md).
5. **Calcule Dados, CA e Fé**:
   - Calcule seu PV Inicial (Máximo do Dado de Vida da Vocação + Modificador de CON).
   - Calcule a sua CA Base (10 + DES) ou a CA com armadura.
   - Anote sua Fé inicial: 50 (se Levi, 60).
6. **Compre seus Equipamentos**: Anote os pacotes iniciais ou compre os itens sugeridos no [Guia de Criação de Personagem](criacao-de-personagem.md).

---

## 8. Equipamentos da Época

O cenário ocorre entre a Idade do Bronze e Ferro. As moedas padrões são **Shekels (Siclós) de Prata** (SP) ou pedaços de bronze/cobre pesado. *(1 SP = 10 Peças de Cobre).*

### 8.1 Armas

*(Movido para o catálogo oficial: [Catálogo de Armas](itens/armas.md))*

### 8.2 Armaduras e Escudos

*(Movido para o catálogo oficial: [Catálogo de Armaduras e Escudos](itens/armaduras.md))*

### 8.3 Itens Comuns

*(Movido para o catálogo oficial: [Itens Utilizáveis](itens/utilizaveis.md) e [Itens Consumíveis](itens/consumiveis.md))*

---

## 9. Guias Adicionais

- **Para Jogadores**: Consulte as regras expandidas em [Guia de Criação de Personagem](criacao-de-personagem.md).
- **Para Mestres**: Consulte as diretrizes de aventura, combate e fé no **[Guia do Mestre](guia-do-mestre.md)** e a versão resumida no **[Guia Rápido do Mestre](guia-rapido-mestre.md)**.
