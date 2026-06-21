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
- Escudos (de madeira ou bronze) podem adicionar **+2 na CA**.
- **Regra da Constituição**: Não existem itens mágicos no jogo (+1, +2, etc). A CA máxima provém apenas da armadura natural, física e modificador de Destreza.

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
- **1 Fortaleza**: Ação honrosa natural. Atuar de acordo com a Fortaleza pode conceder bônus (Vantagem) na rolagem ou recuperar **1d4 de Fé**.
- **1 Tentação**: Um defeito de caráter persistente. Se confrontado por um gatilho, o personagem faz um **Teste de Sabedoria (CD do Mestre)**. Em caso de falha, cede ou perde **1d6 pontos de Fé**.

*(Consulte o documento [Fortalezas e Tentações](fortalezas-tentacoes.md) para as regras completas e as listas de opções).*

### 4.2 Degradação de Fé

| Faixa de Fé | Estado | Efeito Mecânico |
|---|---|---|
| **100–70** | 🟢 Inabalável | Nenhuma penalidade. Profunda paz. Recebe **Inspiração 1x/dia**. |
| **69–31** | 🟡 Comum | Sem penalidades, sem bônus. Estado mundano. |
| **30–11** | 🟠 Abalado | A "cobertura" divina diminui. **Desvantagem** em testes de resistência de Sabedoria ou Carisma. |
| **10–1** | 🔴 Vulnerável | Risco de surtos ou possessão demoníaca ao testemunhar atrocidades ou heregias (Testes de Sabedoria constantes). |
| **0** | ⚫ Ruptura | O personagem **sucumbe**. Sofre tragédia (possessão incontrolável, loucura, morte) a menos que o grupo realize um ato massivo de consagração e jejum liderado por um Sacerdote, até o nascer do sol. Habilidades que exigem Fé falham automaticamente. |

### 4.3 Recuperação de Fé

- **Descanso Longo Devocional**: **1d4** de Fé para o grupo inteiro, desde que haja momento de ensino/oração conduzido. Se for por um Sacerdote, recupera **1d4+2**.
- **Eventos e Ações**: Atos heroicos de fidelidade a Deus rendem recuperação instantânea (ex: resistir a uma grande tentação, destruir um altar de ídolos) a critério do Mestre (ex: +10 a +30 pontos).

### 4.4 Milagres e Intervenção Divina

Milagres nunca são garantidos por decisão narrativa do Mestre. Quando um personagem clama por um verdadeiro milagre (uma intervenção direta na realidade), a resposta divina é determinada pela sorte (rolagem de dado) e pelo nível de Fé atual do personagem.

1. **Julgamento do Mestre**: O Mestre avalia o pedido e define a Dificuldade do milagre, que se traduz em um redutor na Fé do personagem para o teste.
   - **Pequena Providência** (Ex: Encontrar água, coincidir um evento menor): Modificador 0.
   - **Milagre Moderado** (Ex: Curar um veneno mortal instantaneamente): Modificador +20 na Fé.
   - **Milagre Extraordinário** (Ex: Abrir um rio, chuva de fogo, curas em massa): Modificador +50 na Fé.
2. **A Rolagem (Vontade Divina)**: O jogador que fez o clamor rola **1d100**.
3. **Resolução**:
   - **Sucesso**: O resultado do 1d100 deve ser **menor ou igual** à `(Fé Atual) + (Modificador)`. Se for, o milagre ocorre conforme a vontade de Deus.
   - **Falha**: A Vontade Divina não atendeu ao pedido ou disse "agora não". A ação é gasta e o milagre não ocorre. Pedidos frívolos, egoístas ou hereges que falham retiram 1d6 ou mais pontos de Fé como punição espiritual.

---

## 5. Progressão de Nível e XP

Os personagens ganham níveis de 1 a 20 acumulando Pontos de Experiência (XP). O Mestre concede XP no final de cada sessão baseado nos desafios superados (combates, negociações, testes de fé e milestones de história).

**Tabela Básica de Avanço (XP Acumulado):**
- Nível 1: 0 XP
- Nível 2: 300 XP
- Nível 3: 900 XP
- Nível 4: 2.700 XP
- Nível 5: 6.500 XP
*(A escalada segue a progressão padrão do sistema d20).*

Quando um personagem sobe de nível, ocorrem dois ganhos principais de HP e mecânicas, alternando ou combinando a **Tribo (Raça)** e a **Vocação (Classe)**:

1. **Aumento de HP**: Rola-se o dado de vida da Vocação + Modificador de Constituição (ou usa o valor médio + Modificador).
2. **Novas Habilidades**:
   - **Níveis 1, 4, 8, 12, 16, 20**: O personagem ganha habilidades da sua **Tribo** (ver [docs/tribos/](./tribos/README.md)).
   - **Níveis 2, 6, 10, 14, 18**: O personagem ganha habilidades da sua **Vocação**.
   - **Níveis 3, 5, 7, 9, 11, 13, 15, 17, 19**: Aumentos de Proficiência (quando aplicável pelo D&D 5e), melhorias em dano ou usos por dia de habilidades já aprendidas.

*Multiclasse não é permitida por padrão neste sistema base.*

---

## 6. Sistema de Combate

Adaptado do combate de D&D 5e sem uso de magia arcana. O combate se divide em rodadas de 6 segundos.

### 6.1 Iniciativa e Turnos
No começo do combate, o sistema digital rola a **Iniciativa** automaticamente para todos ou o mestre pode determinar a ordem manualmente. A ordem flui do maior para o menor.
Em seu turno, um personagem pode:
- **Movimento**: Até seu deslocamento (geralmente 9 metros).
- **Ação Principal**: Atacar, Correr (Dash), Desengajar, Esquivar, Ajudar, Esconder, Usar um Item ou Usar habilidade ativa da Tribo/Vocação.
- **Ação Bônus**: Habilidades específicas podem usar uma ação bônus (como ataques com a segunda mão usando armas leves).
- **Reação**: Uma vez por rodada, em resposta a um gatilho específico (ex: Ataque de Oportunidade quando um inimigo sai da sua área de alcance).

O turno é encerrado pelo próprio jogador, passando automaticamente para o próximo da lista, mas o Mestre pode forçar a passagem de turno a qualquer momento.

### 6.2 Dano, HP e Morte
- **Acertando o Alvo**: Rola-se `1d20 + Modificador de Força (ou Destreza para acuidade/distância) + Proficiência`. Se igualar ou superar a CA do alvo, acerta.
- **Dano**: Conforme a arma, mais o Modificador de atributo usado.
- **Ficar a 0 HP**: O personagem cai Inconsciente. Deve fazer **Testes de Morte** (Death Saves) em seus próximos turnos (1d20: 10 ou mais é sucesso, 9 ou menos é falha).
  - **3 sucessos**: Estabiliza (vivo, mas inconsciente com 0 HP).
  - **3 falhas**: Morte Permanente. O personagem sofre um **Soft Delete** no sistema, bloqueando o acesso do usuário, mantendo a ficha apenas como um memorial histórico.

### 6.3 Sessões, Descansos e Persistência
- **Fim de Sessão**: Após uma partida encerrada pelo Mestre, o personagem absorve seu XP.
- **Início de Partida**: O personagem entra na nova sessão totalmente "Descansado", com PV Máximo e usos de habilidades restaurados.
- **Persistência da Fé**: A Fé **NÃO reseta**. O valor atual de Fé se mantém entre as sessões. A única forma de restaurá-la é via atos heróicos ou descansos devocionais narrativos na partida.
- **Descanso Curto (1 hora na partida)**: Permite gastar Dados de Vida para recuperar HP. Algumas habilidades de vocação se recarregam (se especificado).
- **Descanso Longo (8 horas na partida)**: Recupera todo HP e metade dos Dados de Vida gastos. Recupera **1d4 de Fé** para o grupo inteiro (ou 1d4+2 se o ensinamento for conduzido por um Sacerdote).

### 6.4 Condições Comuns
- **Sangrando**: Sofre 1d4 de dano no final do seu turno. Acaba se curado ou após teste de Medicina (CD 10) como Ação.
- **Atordoado**: Incapacitado. Falha automaticamente em testes de Força ou Destreza. Ataques contra ele têm Vantagem.
- **Amedrontado**: Desvantagem em rolagens enquanto a fonte do medo estiver visível.
- **Envenenado**: Desvantagem em rolagens de ataque e testes de habilidade.
- **Caído**: Ataques a até 1,5m contra o alvo têm Vantagem; ataques à distância têm Desvantagem. Levantar custa metade do movimento.
- **Agarrado**: Deslocamento cai para 0. Escapar exige uma Ação para teste de Atletismo ou Acrobacias contra o Atletismo do agarrador.
- **Cego**: Falha automática em testes que exijam visão. Seus ataques têm Desvantagem, e ataques contra você têm Vantagem.

> **Nota**: Situações não cobertas por estas condições são resolvidas pelo bom senso do Mestre.

---

## 7. Guia de Criação de Personagem

Para criar seu personagem, siga estes 6 passos exatos:

1. **Escolha sua Tribo**: Selecione uma das [13 tribos de Israel](./tribos/README.md). Anote suas duas passivas de Nível 1.
2. **Defina seus Atributos**: Escolha entre Standard Array ou role 4d6 (descarta o menor) seis vezes. Distribua e depois some eventuais restrições/bônus caso o Mestre as utilize.
3. **Escolha sua Vocação**: Guerreiro, Batedor, Caçador ou Sacerdote. *(Lembre-se: Levitas devem ser Sacerdotes/Sábios).*
4. **Fortaleza e Tentação**: Escolha **obrigatoriamente** 1 Fortaleza e 1 Tentação da [lista oficial](fortalezas-tentacoes.md).
5. **Calcule Dados, CA e Fé**:
   - Calcule seu HP Inicial (Máximo do Dado de Vida da Vocação + Modificador de CON).
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
