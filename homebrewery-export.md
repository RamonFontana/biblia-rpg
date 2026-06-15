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
   - **Milagre Moderado** (Ex: Curar um veneno mortal instantaneamente): Modificador -20 na Fé.
   - **Milagre Extraordinário** (Ex: Abrir um rio, chuva de fogo, curas em massa): Modificador -50 na Fé.
2. **A Rolagem (Vontade Divina)**: O jogador que fez o clamor rola **1d100**.
3. **Resolução**:
   - **Sucesso**: O resultado do 1d100 deve ser **menor ou igual** à `(Fé Atual) + (Modificador)`. Se for, o milagre ocorre conforme a vontade de Deus.
   - **Falha**: A Vontade Divina não atendeu ao pedido ou disse "agora não". A ação é gasta e o milagre não ocorre. Pedidos frívolos, egoístas ou hereges que falham retiram 1d6 ou mais pontos de Fé como punição espiritual.

---

## 5. Progressão de Nível

Os personagens ganham níveis de 1 a 20 acumulando experiência (XP) ou por marcos da campanha (Milestones).

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
No começo do combate, todos rolam a **Iniciativa** (`1d20 + Modificador de Destreza`). A ordem flui do maior para o menor.
Em seu turno, um personagem pode:
- **Movimento**: Até seu deslocamento (geralmente 9 metros).
- **Ação Principal**: Atacar, Correr (Dash), Desengajar, Esquivar, Ajudar, Esconder, Usar um Item ou Usar habilidade ativa da Tribo/Vocação.
- **Ação Bônus**: Habilidades específicas podem usar uma ação bônus (como ataques com a segunda mão usando armas leves).
- **Reação**: Uma vez por rodada, em resposta a um gatilho específico (ex: Ataque de Oportunidade quando um inimigo sai da sua área de alcance).

### 6.2 Dano e HP
- **Acertando o Alvo**: Rola-se `1d20 + Modificador de Força (ou Destreza para acuidade/distância) + Proficiência`. Se igualar ou superar a CA do alvo, acerta.
- **Dano**: Conforme a arma, mais o Modificador de atributo usado.
- **Ficar a 0 HP**: O personagem cai Inconsciente. Deve fazer **Testes de Morte** (Death Saves) em seus próximos turnos (1d20: 10 ou mais é sucesso, 9 ou menos é falha. 3 sucessos estabiliza, 3 falhas = Morte permanente).

### 6.3 Descansos
- **Descanso Curto (1 hora)**: Permite gastar Dados de Vida para recuperar HP. Algumas habilidades de vocação se recarregam (se especificado).
- **Descanso Longo (8 horas)**: Recupera todo HP, metade dos Dados de Vida gastos, e recarrega habilidades de uso diário. Permite recuperação de Fé (se acompanhado de devoção). É necessário pelo menos 6 horas de sono.

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

\page


# Guia de Criação de Personagem

Este guia detalha o passo a passo para criar o seu personagem no RPG Bíblico. A criação envolve escolher a origem do seu herói, suas habilidades e as ferramentas de que ele precisará para sobreviver. 

**Nota**: Lembre-se do princípio fundamental deste RPG: *Sem magia arcana e sem itens mágicos*. O sobrenatural provém do Sistema de Fé.

---

## Passos para a Criação de Personagem

### 1. Tribo e Vocação
- **Escolha sua Tribo**: As 12 Tribos de Israel (e outras nações da região) definem a "raça" do seu personagem, concedendo passivas únicas e um contexto cultural profundo.
- **Escolha sua Vocação**: É a sua "classe". As opções principais incluem Guerreiro, Caçador, Sábio e Sacerdote.
- **A Regra de Levi**: Se você escolher a Tribo de Levi, está *obrigado* a escolher a Vocação de Sacerdote ou Sábio. Levitas não podem ser Guerreiros ou Caçadores de linha de frente, pois foram separados para o serviço no Tabernáculo.

### 2. Geração de Atributos
Seus atributos principais são Força (FOR), Destreza (DES), Constituição (CON), Inteligência (INT), Sabedoria (SAB) e Carisma (CAR). 
- **Método de Rolagem**: Role 4d6 e descarte o menor dado para cada um dos seis atributos, anotando a soma. Alternativamente, use o Array Padrão: 15, 14, 13, 12, 10, 8.
- **Aplicação**: Distribua os valores rolados entre os 6 atributos da forma que melhor servir à sua vocação. Em seguida, adicione os bônus concedidos por sua Tribo.

### 3. Fortalezas e Tentações
O Sistema de Fé é o cerne deste RPG. 
- Todo personagem de Nível 1 deve obrigatoriamente escolher **1 Fortaleza** (virtude) e **1 Tentação** (falha ou defeito).
- Essas escolhas determinarão como o seu personagem recupera ou perde Pontos de Fé durante a narrativa.
- *Para a lista completa de opções, consulte o documento [Fortalezas e Tentações](fortalezas-tentacoes.md).*

### 4. Cálculos Iniciais
Antes de comprar itens, calcule as estatísticas vitais do seu personagem:
- **Pontos de Vida (PV)**: Baseado no dado de vida da sua Vocação (ex: d10 para Guerreiro) + seu Modificador de Constituição.
- **Classe de Armadura (CA)**: Sem armadura, sua CA inicial é 10 + Modificador de Destreza. Com armadura, siga o cálculo descrito no item.
- **Pontos de Fé Iniciais**: Você começa com um valor base de Fé ditado pela sua Vocação e Tribo.

### 5. Equipamentos Iniciais
Armas e armaduras são limitadas à tecnologia da Idade do Bronze ou início da Idade do Ferro. 
- **Moeda**: Você recebe moedas de Prata (Shekels) ou de Cobre (Geras) para comprar equipamentos na criação. A quantia inicial é *4d4 x 10 Shekels de Prata*.
- Em vez de comprar tudo avulso, você pode escolher um dos **Pacotes Iniciais** sugeridos abaixo, de acordo com a sua vocação.

---

## Pacotes Iniciais Sugeridos

Ao invés de rolar dinheiro, você pode simplesmente pegar o pacote correspondente à sua vocação:

### Guerreiro
- Espada curta de bronze (1d6 cortante) ou Lança (1d6 perfurante).
- Armadura de couro fervido (CA 11 + Mod Des) e um escudo de madeira (+2 CA).
- 5 rações de viagem e um cantil de água.
- Uma faca de osso (1d4 perfurante) e 5 Shekels de prata no bolso.

### Caçador
- Arco curto (1d6 perfurante) com aljava e 20 flechas OU Funda (1d4 concussão) com 20 pedras.
- Adaga de bronze (1d4 perfurante).
- Armadura de couro leve (CA 11 + Mod Des).
- Um kit de armadilhas, corda de cânhamo (15m), e 10 Shekels de prata.

### Sábio
- Cajado robusto (1d6 concussão).
- Manto de linho grosso e sandálias resistentes.
- 5 rolos de pergaminho, tinta e pena.
- Um odre com vinho, um saco de ervas curativas e 15 Shekels de prata.

### Sacerdote (Levita)
- Cajado ou Cetro cerimonial (1d6 concussão).
- Veste de linho fino com o Éfode.
- Óleo de unção e incenso.
- Instrumento musical (ex: harpa, shofar ou tamborim).
- 12 Shekels de prata (representando dízimos iniciais).

\page


# Tribos de Israel — Índice de Raças

> As tribos funcionam como as **raças** do sistema. Cada jogador escolhe uma tribo na criação do personagem e recebe as passivas de nível 1. A partir do nível 4, o jogador escolhe entre dois **Caminhos** de especialização que moldam a progressão até o nível 20.

---

## Tribos de Israel (13 Tribos)

*(Nota: A tribo de José foi dividida historicamente entre seus dois filhos, Efraim e Manassés, resultando em 13 tribos no total contabilizando Levi).*

| Tribo | Símbolo | Tema | Caminhos | Ficha |
|---|---|---|---|---|
| **Judá** | 🦁 Leão | Liderança e Medicina | Liderança / Médico | [juda.md](./juda.md) |
| **Levi** | ⛪ Santuário | Devoção e Oráculo | Oráculo / Intercessão | [levi.md](./levi.md) |
| **Gade** | 🪨 Rocha | Força Bruta | Tanque / Dano Bruto | [gade.md](./gade.md) |
| **Benjamim** | 🐺 Lobo | Furtividade e Precisão | Atirador / Terreno | [benjamim.md](./benjamim.md) |
| **Rúben** | 💨 Vento | Comércio e Feras | Mestre das Feras / Lábia | [ruben.md](./ruben.md) |
| **Issacar** | 🌾 Terra | Mercenários e Lavradores | Mercenário / Lavrador | [issacar.md](./issacar.md) |
| **Simeão** | 🌿 Folha | Boticários | Venenos / Curas | [simeao.md](./simeao.md) |
| **Dã** | 🐍 Víbora | Juízes e Furtividade | Emboscadas / Punição | [da.md](./da.md) |
| **Naftali** | 🦌 Gazela | Rapidez e Persuasão | Mobilidade / Liderança | [naftali.md](./naftali.md) |
| **Aser** | 🥖 Pão/Azeite | Prosperidade e Fartura | Resistência / Suporte | [aser.md](./aser.md) |
| **Zebulom** | ⚓ Navio | Portos e Formação | Fluidez / Falange | [zebulom.md](./zebulom.md) |
| **Efraim** | 🏹 Arco | Orgulho e Guerra | Arqueiro / Investida | [efraim.md](./efraim.md) |
| **Manassés** | ⚔️ Valoroso | Tática e Resiliência | Surpresa / Defensor | [manasses.md](./manasses.md) |

---

## Resumo de Progressão

Todas as tribos seguem a mesma escala de progressão:

| Nível | Marco |
|---|---|
| **1** | Passivas iniciais da tribo (2 habilidades) |
| **4** | Escolha de Caminho (A ou B) |
| **8** | Aprimoramento do caminho escolhido |
| **12** | Habilidade temática intermediária |
| **16** | Habilidade avançada / intervenção |
| **20** | Habilidade Suprema (1x/semana) |

---

## Regras Especiais de Tribo

### A Regra de Levi
Qualquer personagem de qualquer Tribo pode escolher a classe **Sacerdote/Sábio**. No entanto, jogadores que escolhem ser da Tribo de **Levi** são **obrigados** a pertencer à classe Sacerdote/Sábio.

> Consulte as [Regras Base](../regras-base.md) para detalhes completos do sistema.

\page


# Tribo de Rúben — A Árvore do Vento

> **Tema:** Comércio e Feras
> **Descrição:** Comunicação hipnotizadora, exímios negociantes e cultivadores auxiliados por animais.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **A Língua do Comércio** | Compram com **10% de desconto** e vendem com **10% de lucro** em checkers. |
| **Companheiro de Jornada** | Auxiliados por um **animal de carga ou mascote menor** (jumento, macaco, lobo jovem) que carrega o **dobro do peso**. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Mestre das Feras
**Lehakhepil (Domar)**
- **Efeito:** Comanda o animal em **combate**.

### Caminho B — Lábia
**Hashikhenu'a**
- **Efeito:** **Persuade e confunde** inimigos ou negociantes a seu favor.

---

## Nível 8 — Aprimoramento

### Caminho A — Mestre das Feras
- Ataques do animal **ignoram resistências não-mágicas**.

### Caminho B — Lábia
- **Suborna cidades** para obter rotas e milícias.

---

## Nível 12 — Adaptação

### Caminho A — Mestre das Feras
- Animal ganha **resistência** e **protege o rubenita** se ele cair a 0 HP.

### Caminho B — Lábia
- Paga **exércitos inimigos desmotivados** para fugirem (teste de persuasão).

---

## Nível 16 — Intervenção Social / Natural

### Caminho A — Mestre das Feras
- **Uso:** 1x/semana
- **Efeito:** Convoca temporariamente **feras do deserto** (leões, ursos).

### Caminho B — Lábia
- **Uso:** 1x/dia
- **Efeito:** **Acerto Crítico automático** em Persuasão para governantes.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Mestre das Feras
**O Beemote**
- O animal fica tamanho **Enorme**, dobrando HP e causando **terror em área**.

### Caminho B — Lábia
**Embaixador da Paz**
- **Encerra guerras inteiras** na lábia, sem derramar sangue.

\page


# Tribo de Simeão (Subtribo) — A Árvore da Folha

> **Tema:** Boticários
> **Tipo:** Subtribo
> **Descrição:** Exímios em boticário, usando as plantas para criar venenos ou curas.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Mestre Boticário** | Cria **curas ou venenos** se tiver as plantas necessárias. |
| **Dose Extra** | Produz **dose extra** ao usar **5+ reagentes** na criação. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Venenos
**Lâmina Tóxica**
- **Efeito:** Aplica **veneno em armas** de combate.

### Caminho B — Curas
**Cataplasma de Gileade**
- **Efeito:** **Cura** e **estanca sangramento**.

---

## Nível 8 — Aprimoramento

### Caminho A — Venenos
- Veneno também **reduz a velocidade** do alvo.

### Caminho B — Curas
- Cria um **antídoto universal** contra qualquer veneno.

---

## Nível 12 — Domínio Alquímico

### Caminho A — Venenos
**Sangue Amargo**
- **Imune a veneno**.
- Causa **dano ao ser mordido** (o veneno está no sangue).

### Caminho B — Curas
**Nuvem Calmante**
- Cria nuvem em área que torna aliados **imunes a medo**.

---

## Nível 16 — Intervenção Alquímica

### Caminho A — Venenos
**Nuvem Asfixiante**
- Cria uma nuvem de **veneno em área** que causa dano contínuo.

### Caminho B — Curas
**Cura Massiva**
- Cura todos os aliados e restaura a **Fé para 100**.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Venenos
**A Praga**
- Toxina **letal** que se **espalha** entre inimigos.

### Caminho B — Curas
**Sopro da Criação**
- **Levanta aliados caídos** em raio de **9 metros**.

\page


# Tribo de Levi — A Árvore do Santuário

> **Tema:** Devoção e Oráculo
> **Descrição:** Guardiões da Lei de Deus, encarregados do templo e imunes à fome no deserto.
> **Restrição de Classe:** Levitas são **obrigados** a pertencer à classe Sacerdote/Sábio (ver [Regra de Levi](../regras-base.md#a-regra-de-levi)).

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Jejum do Deserto** | Fica **3 dias sem comer** e **2 sem beber** sem debuffs ou perda de status. |
| **Guardiões da Lei** | Proficiência em **Religião** e **Intuição**. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Oráculo / Juízo
**Shel Hashegakhah 'Eleyonah**
- **Uso:** 1x/dia
- **Efeito:** Usa **Urim e Tumim** para fazer uma pergunta de **"Sim/Não"** ao Mestre.

### Caminho B — Intercessão
**Hitepalel Lael Hagadol**
- **Uso:** 1x/dia
- **Efeito:** Cura um aliado em **3d8 + Sabedoria** e retira debuffs.

---

## Nível 8 — Aprimoramento

### Caminho A — Oráculo / Juízo
- A pergunta do Urim/Tumim pode ser **complexa** 1x/semana, revelando **visões curtas**.

### Caminho B — Intercessão
- A prece também restaura **1d4+1 pontos de Fé** de aliados em área.

---

## Nível 12 — Resiliência Espiritual

### Caminho A — Oráculo / Juízo
**Visão Além do Véu**
- **Imune** a ilusões e enganações.
- **Vantagem** em testes de Intuição.

### Caminho B — Intercessão
**Manto da Paz**
- Inimigos precisam passar em **teste de Sabedoria** para atacar o levita **corpo a corpo**.

---

## Nível 16 — Intervenção Direta

### Caminho A — Oráculo / Juízo
**Palavra de Autoridade**
- **Uso:** 1x/combate
- **Efeito:** Paralisa um inimigo por **1 turno** pelo peso da culpa.

### Caminho B — Intercessão
**Sacrifício de Louvor**
- Sofre dano **intencional** e cura um aliado no **dobro do valor recebido**.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Oráculo / Juízo
**O Juízo Divino**
- Inimigos em **15 metros** perdem **resistência a dano** e sofrem **-2 na CA**.

### Caminho B — Intercessão
**A Glória do Tabernáculo**
- Restaura a Fé de **todos os aliados** para **100**.
- Aplica um **Descanso Curto instantâneo**.

\page


# Tribo de Judá — A Árvore do Leão

> **Tema:** Liderança e Medicina
> **Descrição:** Focados em estratégias, política e bem-estar do povo. Costumam ser líderes natos e excelentes médicos.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Aura de Autoridade** | Ao discursar ou negociar com 2+ pessoas, ganha **+2** em testes baseados em Carisma. |
| **Resistência Sólida** | Recebe apenas **metade do dano** de debuffs (sangramentos, venenos fracos). |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Liderança
**Qeriatt Haqerav (Grito de Guerra)**
- **Tipo:** Ação Bônus
- **Efeito:** Aliados visíveis ganham **+2 em rolagens de Força** e **+1 de movimentação (energia)** no próximo turno.

### Caminho B — Médico
**Conhecimento da Saúde**
- **Efeito:** Estabiliza aliados caídos e cura **2d8 + Sabedoria**.

---

## Nível 8 — Aprimoramento

### Caminho A — Liderança
- Se um aliado estiver com **menos de 20% do HP total**, os bônus do Grito de Guerra são **dobrados** (+4 em Força).

### Caminho B — Médico
**Merape Miadi (Cura Imediata)**
- **Uso:** 1x/dia
- **Efeito:** Cura **6d8 + Sabedoria** e remove qualquer ferimento a longo prazo, maldição ou envenenamento.

---

## Nível 12 — Presença do Líder

### Caminho A — Liderança
**Coração de Leão**
- Aliados a até **9 metros** ganham **vantagem** contra medo e perda de Fé.

### Caminho B — Médico
**Bálsamo de Gileade**
- Durante **descanso curto**, curas nos aliados atingem o **valor máximo** dos dados.

---

## Nível 16 — Tática Avançada

### Caminho A — Liderança
**Estandarte de Judá**
- **Uso:** 1x/combate
- **Efeito:** Permite que um aliado use sua **reação** para atacar ou se mover.

### Caminho B — Médico
**Cirurgia de Trincheira**
- **Uso:** 1x/dia
- **Efeito:** Reanima um aliado com **1/4 do HP máximo** em combate.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Liderança
**O Rugido de Judá**
- Inimigos em **18 metros** fogem amedrontados.
- Aliados ganham **HP Temporário** e **+15 de Fé**.

### Caminho B — Médico
**O Sopro da Vida**
- Restaura **100% do HP**.
- **Ressuscita** um alvo morto há menos de 2 rodadas.

\page


# Tribo: Dã

*"Dã julgará o seu povo, como uma das tribos de Israel. Dã será serpente junto ao caminho, uma víbora junto à vereda, que morde os calcanhares do cavalo, e faz cair o seu cavaleiro por detrás."* (Gênesis 49:16-17)

A tribo de Dã é astuta, associada a emboscadas, julgamento severo e oportunismo. Habituados a patrulhar as margens e a viver muitas vezes em tensão com povos vizinhos (como os filisteus na história de Sansão), desenvolveram táticas de guerrilha.

## Passivas Iniciais (Nível 1)
- **Instinto da Víbora**: Você ganha Vantagem em jogadas de Iniciativa e seus ataques de Oportunidade causam 1d4 de dano extra (do mesmo tipo da arma).
- **Herança do Juiz**: Você tem Proficiência na perícia Intimidação. Você ganha Vantagem em Testes de Sabedoria (Intuição) para perceber se alguém está mentindo ou escondendo intenções maliciosas.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: A Serpente do Caminho
*Foco em emboscadas, mobilidade e dano furtivo.*

- **Nível 4 - Ataque Ofuscante (1/Descanso Curto)**: Como Ação Bônus, seu próximo ataque bem-sucedido ofusca o inimigo. Ele tem Desvantagem no próximo ataque que fizer antes do fim do seu próximo turno.
- **Nível 8 - Rastejar Furtivo**: Movimentar-se furtivamente não custa deslocamento extra. Você tem Vantagem em testes de Furtividade em terrenos rochosos ou vegetação rasteira.
- **Nível 12 - Reflexos Peçonhentos**: Se um inimigo errar um ataque corpo a corpo contra você, você pode usar sua Reação para realizar um ataque corpo a corpo imediato contra ele.
- **Nível 16 - Bote Fatal**: Se você atacar uma criatura que ainda não agiu no combate, o ataque se torna um Acerto Crítico se acertar.

### Caminho B: O Juiz Severo
*Foco em punir agressores e liderança por intimidação (como Sansão).*

- **Nível 4 - Força de Leão (1/Descanso Curto)**: Você invoca uma força repentina. Por 1 minuto, você ganha Vantagem em testes de Força e seus ataques corpo a corpo empurram o alvo 1,5m para trás se você desejar.
- **Nível 8 - Veredito**: Se um aliado cair a 0 HP a até 9 metros de você, você tem Vantagem em todos os ataques contra o agressor até que ele seja derrotado.
- **Nível 12 - Pele Intratável**: Você resiste a dano de concussão provindo de armas não-metálicas (clavas, pedras, etc) ou ataques desarmados de feras.
- **Nível 16 - Destruidor de Pilares (1/Descanso Longo)**: Seus ataques contra estruturas causam dano máximo. Além disso, uma vez ao dia, um ataque corpo a corpo seu que acerte causa atordoamento no alvo até o final do próximo turno dele, sem direito a teste.

## Habilidade Suprema (Nível 20)
- **Vingança de Dã**: Se o seu HP cair a 0, mas você não morrer na hora, você realiza imediatamente um turno completo antes de cair inconsciente. Você tem Vantagem em todos os ataques neste turno e causa dano duplo. Ao final desse turno extra, você cai a 0 HP normalmente.

\page


# Tribo: Naftali

*"Naftali é uma gazela solta; ele profere palavras formosas."* (Gênesis 49:21)

A tribo de Naftali concentra-se na rapidez, agilidade e excelência na comunicação. Costumam ser mensageiros, batedores montanheses, diplomatas e poetas guerreiros. Seus guerreiros, como Baraque, notabilizaram-se por descer rapidamente das montanhas para surpreender oponentes no vale (como o exército de Sísera).

## Passivas Iniciais (Nível 1)
- **Passos de Gazela**: O seu deslocamento base aumenta em 3 metros. Você não sofre penalidade de movimento em terrenos difíceis não mágicos compostos por montanhas ou colinas.
- **Palavras Formosas**: Você ganha Proficiência na perícia Persuasão. Se você passar 1 minuto ou mais conversando com um NPC neutro ou amigável, você ganha Vantagem no próximo Teste de Carisma feito contra ele.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: O Corredor das Colinas
*Foco em altíssima mobilidade e manobras de reposicionamento em combate.*

- **Nível 4 - Evasão Rápida**: Ao sofrer um ataque de oportunidade, o inimigo tem Desvantagem no ataque.
- **Nível 8 - Carga de Baraque (1/Descanso Curto)**: Se você se mover pelo menos 6 metros em linha reta em direção a um alvo e acertar um ataque corpo a corpo, você causa 1d8 de dano extra e pode forçar o alvo a fazer um Teste de Força ou cair caído.
- **Nível 12 - Impulso Vertiginoso**: Você pode usar uma Ação Bônus no seu turno para dobrar o seu deslocamento até o final do turno.
- **Nível 16 - Inalcançável**: Reações usadas contra você (como feitiços ou ataques) têm 50% de chance de falhar automaticamente (jogue 1d20, de 1 a 10 falha) devido à sua movimentação imprevisível.

### Caminho B: O Poeta Guerreiro
*Foco em liderança, inspiração no campo de batalha e habilidades de diplomacia/grito de guerra.*

- **Nível 4 - Cântico de Débora (1/Descanso Curto)**: Como Ação Bônus, você declama um verso encorajador. Um aliado a até 9 metros ganha 1d6 que pode adicionar a uma rolagem de ataque, teste de habilidade ou teste de resistência no próximo minuto.
- **Nível 8 - Repreensão Elegante**: Quando um inimigo a até 9 metros erra um ataque contra você, você pode usar sua Reação para ridicularizá-lo e instigar dúvida nele, dando-lhe Desvantagem no próximo ataque dele.
- **Nível 12 - Espírito Irrefreável**: Você e aliados num raio de 4,5 metros não podem ser Amedrontados enquanto você estiver consciente.
- **Nível 16 - Palavras de Retirada/Avanço**: Como Ação, você comanda seus aliados. Todo aliado a até 18 metros que puder ouvi-lo pode usar a Reação para se mover até a metade de seu deslocamento sem provocar ataques de oportunidade.

## Habilidade Suprema (Nível 20)
- **Rapidez Divina**: Você está sob o efeito permanente equivalente à magia *Movimentação Livre* (sempre ignora penalidades de velocidade, não pode ser paralisado ou contido fisicamente por efeitos não-mágicos, e correntes ou cordas se soltam de você automaticamente).

\page


# Tribo de Gade — A Árvore da Rocha

> **Tema:** Força Bruta
> **Descrição:** Guerreiros inabaláveis com força descomunal, acostumados a grandes pesos.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Muralha Humana** | Não caem com pesos ou golpes (salvo situações sobre-humanas). |
| **Resgate Pesado** | Podem lutar com **metade dos atributos** enquanto carregam um ferido. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Tanque
**Hafekhadah**
- **Uso:** 1x/luta
- **Efeito:** Dá um grito intimidando inimigos a **atacá-lo** (provoca).

### Caminho B — Dano Bruto
**Hakokha shel Shimeshonn**
- **Uso:** 1x/dia
- **Efeito:** Ganha **+10 de Força** e **+15 de Fé** em um turno extremo.

---

## Nível 8 — Aprimoramento

### Caminho A — Tanque
- O grito concede **resistência a dano físico cortante e de concussão** por 1 turno.

### Caminho B — Dano Bruto
- Pode realizar um **ataque extra** como **Ação Bônus**.

---

## Nível 12 — Vigor Inabalável

### Caminho A — Tanque
**Guarda-Costas**
- Troca de lugar com aliado **adjacente** para receber o dano no lugar dele.

### Caminho B — Dano Bruto
**Mãos Calejadas**
- Adiciona **Constituição** ao dano físico de concussão.

---

## Nível 16 — Intervenção Física

### Caminho A — Tanque
**Bastião de Israel**
- Ao cair a **0 HP**, faz um **teste de Fé** para ficar com **1 HP**.

### Caminho B — Dano Bruto
**Golpe Sísmico**
- **Uso:** 1x/descanso
- **Efeito:** Atinge o chão para **derrubar** inimigos em cone.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Tanque
**Escudo de Deus**
- **Imune a dano físico** por 1 minuto.
- Converte dano recebido em **HP Temporário para aliados**.

### Caminho B — Dano Bruto
**Espírito de Sansão**
- **Força 30** por 3 turnos.
- **Críticos automáticos**.
- ⚠️ Perde **metade da Fé** após o uso.

\page


# Tribo: Aser

*"O pão de Aser será excelente, e ele dará delícias reais."* (Gênesis 49:20)
*"Bendito seja Aser... banhe ele o seu pé em azeite. O teu calçado será de ferro e de metal."* (Deuteronômio 33:24-25)

A tribo de Aser é próspera, ocupando terras férteis no litoral e no norte, especializando-se na produção de azeite e colheitas abundantes. São hospitaleiros, vigorosos e têm vastos recursos.

## Passivas Iniciais (Nível 1)
- **Fartura da Terra**: Durante um Descanso Longo ou Curto, qualquer ração ou refeição preparada por você recupera 1d4 HP adicional de quem a consumir. Você tem Proficiência com Ferramentas de Cozinheiro (ou equivalente).
- **Vigor do Azeite**: Você tem Vantagem em Testes de Resistência contra venenos, doenças e exaustão.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: O Protetor Farto
*Foco em resistência física contínua e proteção natural.*

- **Nível 4 - Calçado de Ferro**: Sua postura é como rocha. Você não pode ser derrubado (prono) ou empurrado contra a sua vontade se estiver de pé e consciente em terra firme.
- **Nível 8 - Corpo Nutrrido**: O seu HP máximo aumenta em 8 e passa a aumentar em +1 em cada nível subsequente.
- **Nível 12 - Ungido (1/Descanso Longo)**: Você pode aplicar azeite/bálsamo a si ou a um aliado como Ação Bônus. O alvo recupera 3d8 de HP e se cura de uma condição de envenenamento ou doença.
- **Nível 16 - Muralha Inabalável**: Todo o dano não-mágico de concussão, cortante ou perfurante que você recebe é reduzido em 3.

### Caminho B: O Emissário Real
*Foco em suporte, comércio, persuasão e garantir que os aliados rendam no ápice.*

- **Nível 4 - Delícias Reais (1/Descanso Longo)**: Durante um descanso curto, você reparte porções de iguarias/azeite. Até 4 pessoas ganham HP Temporário igual ao seu nível + seu Modificador de Carisma ou Constituição (sua escolha).
- **Nível 8 - Mercador Hábil**: Você tem Vantagem em todos os testes de Carisma para negociações, comércio e apaziguar tensões entre grupos neutros/hostis.
- **Nível 12 - Banquete do Acampamento**: O benefício do HP adicional (Passiva do Nível 1) aumenta para 1d8 HP e concede também a remoção de 1 nível de exaustão aos membros do grupo em cada Descanso Curto que fizerem uma refeição com você.
- **Nível 16 - A Favor dos Reis**: A sua influência e aura de prosperidade afetam aliados. Uma vez por combate (1/Descanso Curto), você pode dar o comando de ação para um aliado. Ele pode realizar um Ataque ou uma Ação imediatamente como Reação.

## Habilidade Suprema (Nível 20)
- **A Benção Eterna de Aser**: A abundância da tribo flui em você. No final de todo turno seu em combate, se você estiver com HP menor que a metade, você recupera 10 HP passivamente.

\page


# Tribo de Issacar (Subtribo) — A Árvore da Terra

> **Tema:** Mercenários e Lavradores
> **Tipo:** Subtribo
> **Descrição:** Povo agrícola que pode agir como mercenários letais.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Emboscada Rústica** | **+1 em Força e Destreza** no acerto/dano ao matar furtivamente. |
| **Resistência Solar** | Imune a **exaustão solar**. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Mercenário
**Contrato de Sangue**
- **Efeito:** Marca um alvo. Bônus ofensivos contra o alvo marcado.

### Caminho B — Lavrador
**Raízes Profundas**
- **Efeito:** Bônus de **CA** enquanto estiver **imóvel**.

---

## Nível 8 — Aprimoramento

### Caminho A — Mercenário
- Ganha um **ataque bônus** se um aliado estiver perto do alvo.

### Caminho B — Lavrador
- **Cura máxima** durante descanso.

---

## Nível 12 — Especialização

### Caminho A — Mercenário
- **Acerto crítico** zera a **velocidade do inimigo**.

### Caminho B — Lavrador
- **Resistência** a armas **não-metálicas**.

---

## Nível 16 — Intervenção

### Caminho A — Mercenário
- Pode **esconder-se** imediatamente após abater um alvo.

### Caminho B — Lavrador
- **Dano máximo automático** quando estiver com **menos de 50% do HP**.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Mercenário
**A Ceifa**
- **Morte letal** em furtividade. Ataque devastador que ignora defesas.

### Caminho B — Lavrador
**Guardião do Vale**
- **Cura e escudo** em área para todos os aliados.

\page


# Tribo: Zebulom

*"Zebulom habitará ao porto dos mares, e será como porto dos navios, e o seu termo irá até Sidom."* (Gênesis 49:13)
*"De Zebulom, os que saíam à peleja, providos de todas as armas de guerra..."* (1 Crônicas 12:33)

Os zebulonitas são um povo adaptado às águas, ventos e ao comércio costeiro, frequentemente servindo como marinheiros ou mercenários fortemente armados. Têm a fama de serem bravos soldados unidos e de mentalidade inquebrável.

## Passivas Iniciais (Nível 1)
- **Guerreiros dos Portos**: Você ganha Proficiência com veículos aquáticos e ferramentas de navegador. Além disso, você sabe nadar naturalmente sem consumir deslocamento extra e pode prender a respiração pelo dobro do tempo.
- **Ombro a Ombro**: Quando você está adjacente (1,5m) a um aliado em combate, ambos ganham um bônus de +1 na CA contra ataques de longa distância.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: O Marinheiro de Tempestades
*Foco na agilidade no campo de batalha, adaptação ao terreno e fluidez nos ataques.*

- **Nível 4 - Reflexo das Ondas (1/Descanso Curto)**: Se você for atingido por um ataque corpo a corpo, você pode usar sua Reação para reduzir o dano pela metade e dar um passo de 1,5m sem provocar ataque de oportunidade.
- **Nível 8 - Visão Além do Horizonte**: Nevoeiro, chuvas fortes ou escuridão penumbrosa não afetam a sua visão nem causam desvantagem nos seus testes de Percepção.
- **Nível 12 - Equilíbrio Perfeito**: Você tem Vantagem para evitar ser derrubado (prono) ou desarmado. Pode se mover e lutar na água sem sofrer penalidades mecânicas.
- **Nível 16 - Tempestade de Golpes**: No seu turno, se você acertar mais de um ataque num mesmo alvo, você causa 1d10 de dano extra devido à fluidez brutal dos seus golpes.

### Caminho B: O Pelotão de Ferro
*Foco em lutar em formação, prover defesa aos aliados e organização tática (como os guerreiros providos de todas as armas em 1 Crônicas).*

- **Nível 4 - Treinamento Bélico Avançado**: Escolha uma arma marcial. Quando usar essa arma, suas rolagens de dano menores que 3 contam como 3.
- **Nível 8 - Coração Intrépido**: "Não tinham coração dobre" (não eram inconstantes). Você tem Imunidade à condição Encantado e vantagem em resistência de Fé contra heresias que tentem corromper suas lealdades.
- **Nível 12 - Formação Focada**: Inimigos não ganham Vantagem contra você ou aliados adjacentes caso tentem flanqueá-los (ataques pelas costas/lados).
- **Nível 16 - Retribuição da Milícia (1/Descanso Curto)**: Se você ou um aliado adjacente receber dano de um ataque, você pode usar sua Reação para ordenar um revide. Você e o aliado realizam um ataque de corpo a corpo contra o atacante imediatamente.

## Habilidade Suprema (Nível 20)
- **Mestre dos Mares e do Ferro**: Você torna-se uma força incontrolável. Seus ataques ignoram qualquer Resistência à dano de concussão, cortante e perfurante de criaturas mundanas (exceto Demônios e Anjos). Além disso, você tem resistência automática contra o frio e nunca se perde se puder ver as estrelas ou o mar.

\page


# Tribo de Benjamim — A Árvore do Lobo

> **Tema:** Furtividade e Precisão
> **Descrição:** Esguios e rápidos, com visão excelente para emboscadas.

---

## Nível 1 — Passivas Iniciais

| Passiva | Efeito |
|---|---|
| **Mira e Furtividade** | **+2** em Percepção e Equilíbrio. Mestre em camuflagem. |
| **Ambidestria Tática** | Ambidestros. Recuperam arremessáveis com **sorte bônus**. |

---

## Nível 4 — Escolha de Caminho

### Caminho A — Atirador
**Yeriah Neqiah**
- **Uso:** 1x/dia
- **Efeito:** Tiro **100% certeiro** até 400 metros. Dano letal acima de 100m decidido por **sorteio do Mestre**.

### Caminho B — Terreno
**Litemonn Malekodett**
- **Efeito:** Prepara **armadilhas** para inimigos ou animais.

---

## Nível 8 — Aprimoramento

### Caminho A — Atirador
- **Tiro Certeiro** triplica o dano se o alvo estiver **furtivo** (a menos de 100m).

### Caminho B — Terreno
- **Vantagem** em furtividade quando perto das armadilhas.

---

## Nível 12 — Agilidade Superior

### Caminho A — Atirador
**Olhos de Águia**
- Ignora **meia-cobertura** e **penumbra**.

### Caminho B — Terreno
**Passos Leves**
- Pode **Correr/Esconder-se** como ação bônus.
- **Não aciona** armadilhas por peso.

---

## Nível 16 — Intervenção Tática

### Caminho A — Atirador
**Chuva da Morte**
- Atira em **3 alvos simultâneos**.

### Caminho B — Terreno
**Garganta Cortada**
- **Acerto crítico garantido** em alvos presos em armadilhas.

---

## Nível 20 — Habilidade Suprema (1x/semana)

### Caminho A — Atirador
**Flecha do Livramento**
- **Ignora armadura**, causa dano massivo.
- Chance de **morte instantânea** para inimigos gigantes.

### Caminho B — Terreno
**Emboscada Divina**
- Transforma área de **18×18 metros** em campo de **armadilhas mortais** e terreno letal.

\page


# Tribo: Efraim

*"Efraim, os seus filhos armados, atiradores de arcos..."* (Salmo 78:9)
*"O seu touro primogênito tem majestade, e os seus chifres são chifres de boi selvagem; com eles rechaçará os povos..."* (Deuteronômio 33:17)

A tribo de Efraim sempre assumiu uma postura de liderança militar e orgulho, especialmente entre as tribos do norte. Seus guerreiros são notáveis por sua destreza com arcos e sua determinação inabalável na batalha. No entanto, o orgulho frequentemente testava sua Fé.

## Passivas Iniciais (Nível 1)
- **Orgulho do Norte**: Você tem Vantagem em Testes de Resistência contra ser Amedrontado. A sua confiança inspira, garantindo +1 no dano de ataques corpo a corpo ou à distância se você for o primeiro a agir na rodada.
- **Treino com Arcos**: Você tem Proficiência com Arco Curto e Arco Longo. Se sua Vocação já lhe der essa proficiência, você ganha +1 nas rolagens de ataque com arcos.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: O Arqueiro Feroz
*Foco em combate à distância agressivo e domínio da saraivada.*

- **Nível 4 - Tiro Penetrante (1/Descanso Curto)**: O seu próximo tiro com arco ignora a armadura física (trata o alvo como se tivesse apenas a CA base + Destreza).
- **Nível 8 - Disparo Evasivo**: Ao atirar com um arco enquanto um inimigo está a até 1,5m de você, você não sofre Desvantagem no ataque.
- **Nível 12 - Flecha Marcada**: Como ação bônus, você foca em um alvo. Seus próximos dois ataques com arco contra ele têm Vantagem.
- **Nível 16 - Chuva de Efraim**: Uma vez por combate, você pode gastar uma Ação para realizar um ataque com arco contra até três alvos diferentes que estejam dentro de um cone de 18 metros à sua frente.

### Caminho B: O Chifre do Boi Selvagem
*Foco na força bruta de linha de frente, investidas e liderança autoritária.*

- **Nível 4 - Investida Majestosa**: Se você se mover 6 metros em linha reta e atacar com arma corpo a corpo, você pode realizar um ataque de Empurrão (Shove) como Ação Bônus.
- **Nível 8 - Vigor Orgulhoso**: Quando um ataque reduziria você a 0 HP, você pode fazer um Teste de Constituição (CD 15). Se passar, você fica com 1 HP em vez disso (uma vez por Descanso Longo).
- **Nível 12 - Grito de Comando**: Uma vez por Descanso Curto, como ação bônus, você ordena um aliado adjacente a atacar. Ele usa a Reação dele para fazer um ataque corpo a corpo.
- **Nível 16 - Impacto do Touro**: Se você acertar um ataque corpo a corpo após mover-se pelo menos 4,5 metros, você rola o dado de dano duas vezes.

## Habilidade Suprema (Nível 20)
- **A Liderança Inquestionável**: Seu Carisma natural e aura de liderança atingem o ápice. Aliados a até 9 metros de você adicionam seu Modificador de Carisma nas rolagens de dano, e inimigos nessa área têm Desvantagem para atacá-lo caso você não os tenha atacado no turno atual.

\page


# Tribo: Manassés

*"Porque a Maquir, o primogênito de Manassés, o pai de Gileade, que era homem de guerra, lhe caiu em sorte Gileade e Basã."* (Josué 17:1)
O Senhor diz de Gideão (da tribo de Manassés): *"O Senhor é contigo, homem valoroso."* (Juízes 6:12)

Manassés foi dividida em duas "meias-tribos", habitando ambos os lados do rio Jordão, cobrindo territórios férteis e inóspitos. Essa divisão moldou-os como um povo altamente resiliente, tático e de valor comprovado sob situações extremas e escassez numérica.

## Passivas Iniciais (Nível 1)
- **Homem Valoroso**: Você ganha Vantagem em ataques corpo a corpo se estiver lutando contra um oponente cujo tamanho seja maior que o seu, ou se você estiver com o HP abaixo da metade.
- **Guerreiro de Fronteira**: Você ganha Proficiência na perícia Sobrevivência e Atletismo.

## Especializações (Nível 4)
*Ao atingir o Nível 4, o jogador deve escolher um destes caminhos para sua progressão tribal.*

### Caminho A: O Tático de Gideão
*Foco em aproveitar o elemento surpresa, lutar com poucas tropas e desestabilizar os inimigos.*

- **Nível 4 - Surpresa Tática (1/Descanso Curto)**: Durante a primeira rodada de um combate, se você atacar antes do alvo agir, você causa 1d6 de dano de concussão extra e o alvo fica Surdo até o fim do próximo turno dele.
- **Nível 8 - Força na Fraqueza**: Quando você ou um aliado adjacente sofre um Acerto Crítico, você pode usar uma Reação para forçar o inimigo a rolar o ataque novamente. Ele deve usar o novo resultado (pode não ser mais crítico).
- **Nível 12 - Tática do Cântaro Quebrado**: Uma vez por dia, como Ação Bônus, você pode fazer um barulho e flash ofuscante com tochas e escudos/armas batendo. Inimigos num raio de 9 metros fazem Teste de Sabedoria. Falha os deixa Amedrontados por 1 minuto.
- **Nível 16 - Destruidor de Altares**: Seus ataques causam dano duplo contra criaturas místicas/demoníacas (se aplicável na campanha) ou hereges fanáticos declarados.

### Caminho B: O Senhor de Gileade
*Foco em sobrevivência, robustez extrema (defesa de terras agrestes de Basã e Gileade) e combate pesado.*

- **Nível 4 - Sangue Resiliente**: O seu HP máximo aumenta na quantidade igual ao dobro do seu Modificador de Constituição e você recupera 1 ponto de HP extra por cada Dado de Vida que gasta em Descansos Curtos.
- **Nível 8 - Guardião da Fronteira**: Se você for alvo de um ataque corpo a corpo, você pode usar uma Reação para empurrar o inimigo 1,5m para trás antes do dano ser rolado (se ele falhar num Teste de Força).
- **Nível 12 - Implacável**: Se você estiver sob efeitos das condições Envenenado, Surdo ou Sangrando, você rola um dado de Vida no início de cada um de seus turnos para se curar.
- **Nível 16 - A Muralha do Jordão (1/Descanso Longo)**: Você pode plantar os pés firmemente no chão como Ação Bônus. Por 1 minuto, qualquer inimigo que tentar passar pela sua área de ameaça tem o deslocamento reduzido a 0.

## Habilidade Suprema (Nível 20)
- **O Unificador**: Uma vez por combate, você pode proclamar o triunfo sob pressão. Você e todos os aliados num raio de 18 metros removem uma condição negativa atual de si mesmos (Exceto Ruptura de Fé) e ganham Resistência a todos os tipos de dano mundano por 1 minuto.

\page


# Índice de Vocações

A Vocação (equivalente a "classe" no D&D) define o papel mecânico e narrativo do seu personagem dentro do grupo e perante a sociedade israelita e povos vizinhos. Em conjunto com a sua **Tribo** (que fornece passivas e melhorias), a Vocação molda suas habilidades ativas e opções táticas, progredindo nos níveis 2, 6, 10, 14 e 18.

## Vocações Disponíveis

- **[Guerreiro](./guerreiro.md)**: Combatentes de linha de frente, especialistas em armas e escudos da época (espadas, lanças). Linha de defesa e ataque direto.
- **[Batedor](./batedor.md)**: Especialistas em infiltração, ataques furtivos e armamento leve/distância. Úteis para emboscadas e reconhecimento.
- **[Caçador / Nômade](./cacador.md)**: Sobreviventes, rastreadores e especialistas em terreno selvagem, atiradores exímios com arco ou funda.
- **[Sacerdote / Sábio](./sacerdote.md)**: Especialistas em fé, diplomacia, purificação e cura. Indispensáveis para guiar o grupo espiritualmente. *(Obrigatório para membros da tribo de Levi)*

> **Nota de Design:** Diferente do D&D, as vocações no RPG Bíblico não possuem magias arcanas. Todo poder sobrenatural emana da conexão do grupo com Deus através da Fé (e, frequentemente, através dos Sacerdotes).

\page


# Vocação: Guerreiro

Os Guerreiros formam a espinha dorsal dos exércitos de Israel (ou de exércitos mercenários vizinhos). Com o advento das armas de ferro, sua capacidade de impacto e defesa aumentou significativamente. Eles são peritos em aguentar o castigo físico e proteger o grupo.

## Características Base
- **Dado de Vida (HP)**: 1d10 por nível.
- **Proficiências**: Todas as armaduras, escudos, e armas simples e marciais (espadas, lanças, machados).
- **Testes de Resistência**: Força e Constituição.

## Progressão da Vocação

Além das passivas que você ganha com a sua Tribo, ser um Guerreiro lhe concede habilidades nos níveis seguintes:

### Nível 2: Postura de Batalha e Surto de Ação
- **Postura de Batalha (Estilo de Luta)**: Escolha um estilo:
  - *Defesa*: +1 na CA se usar armadura.
  - *Duelo*: +2 nas rolagens de dano com arma de uma mão.
  - *Proteção*: Se usar escudo, pode usar sua Reação para impor desvantagem a um ataque contra um aliado a até 1,5m de você.
- **Surto de Ação (1/Descanso Curto)**: No seu turno, você pode realizar uma Ação adicional. 

### Nível 6: Ataque Extra e Determinação
- **Ataque Extra**: Você pode atacar duas vezes, em vez de uma, sempre que usar a Ação de Ataque no seu turno.
- **Determinação (1/Descanso Longo)**: Se rolar um Teste de Sabedoria (para resistir a medo/Tentações) e falhar, você pode usar uma Reação para re-rolar e deve usar o novo resultado.

### Nível 10: Vigor do Defensor
- **Vigor do Defensor (1/Descanso Curto)**: Como ação bônus, você recupera HP equivalente a 1d10 + seu nível.
- **Bloqueio Inabalável**: Se estiver empunhando um escudo, ataques de oportunidade contra você têm desvantagem.

### Nível 14: Ataque Extra Superior
- **Ataque Extra (3 ataques)**: Você passa a poder atacar três vezes quando usa a Ação de Ataque no seu turno.

### Nível 18: Presença do General
- **Grito de Guerra (1/Descanso Longo)**: Como Ação, você emite um comando ou grito encorajador. Até 6 aliados que puderem ouvi-lo ganham Vantagem nos ataques até o fim do próximo turno deles e recuperam imediatamente 2d6 de HP. Inimigos a até 9 metros que ouvirem devem passar num Teste de Sabedoria ou ficarão Amedrontados por 1 minuto.

\page


# Vocação: Sacerdote / Sábio

Membros dessa vocação são eruditos, profetas, médicos e clérigos. Em um sistema sem magia arcana, são eles quem têm a conexão mais pura com Deus e lideram o combate às heresias, curam moléstias severas e erguem a Fé do grupo.
*(Se você é da tribo de Levi, esta é sua Vocação obrigatória).*

## Características Base
- **Dado de Vida (HP)**: 1d8 por nível.
- **Proficiências**: Armaduras leves, médias e escudos (para os combativos), armas simples.
- **Testes de Resistência**: Sabedoria e Carisma.
- **Uso de Relíquias e Fé**: Pode carregar o Efode, o Urim e Tumim, ou incenso do tabernáculo para aprimorar clamores divinos. A Fé do Sacerdote é usada para realizar Ritos e Bênçãos de incentivo aos aliados.

## Progressão da Vocação

### Nível 2: Súplica Curativa e Autoridade Espiritual
- **Súplica Curativa (3/Descanso Longo)**: Como Ação, você encoraja e abençoa um aliado. Com o espírito fortificado, ele recupera HP equivalente a 1d8 + Modificador de Sabedoria, e também recupera **1d4 pontos de Fé**.
- **Autoridade Espiritual**: Você ganha Vantagem em testes de persuasão contra indivíduos tementes a Deus. 

### Nível 6: Purificação e Jejum
- **Purificação (1/Descanso Curto)**: Com uma prece fervente (Ação), você encerra um efeito no alvo: Amedrontado, Atordoado, Envenenado, ou cancela uma Possessão Demoníaca em estágio inicial.
- **Jejum Protetivo**: Ao liderar um Descanso Longo Devocional, o grupo recupera HP completo e você rola **1d4+2** para recuperar a Fé do grupo. Além disso, todos começam o próximo dia com 5 HP Temporários.

### Nível 10: Intervenção Divina Menor e Súplica Aprimorada
- **Intervenção Divina Menor (1/Semana)**: Você clama por um milagre. Conforme as *Regras Base de Milagres*, você rola **1d100** e precisa tirar um valor menor ou igual à sua **Fé Atual** modificada pela Dificuldade do Mestre. Se bem-sucedido, o milagre ocorre (surgir água da rocha, um relâmpago oportuno, pragas menores num acampamento inimigo). Se falhar, seu limite de Fé cai em 10 até o próximo descanso longo.
- **Súplica Curativa Aprimorada**: A cura aumenta para 3d8 + Modificador de SAB e cura **1d6+2 de Fé**.

### Nível 14: Barreira de Fé e Retribuição Divina
- **Barreira de Fé**: Aliados a até 6 metros de você possuem Resistência contra dano psíquico/espiritual e ganham +2 em testes de resistência de Sabedoria.
- **Retribuição Divina (1/Descanso Curto)**: Ao ver um aliado cair a 0 HP, você pode orar como Reação. O agressor recebe dano radiante/trovejante igual a 2d10 + seu Modificador de Sabedoria e fica Amedrontado.

### Nível 18: Intervenção Divina Maior e Servo Consagrado
- **Intervenção Divina Maior (1/Campanha ou à critério do Mestre)**: Você roga por um milagre extraordinário (chuva de meteoros/fogo, colapso de muralhas de Jericó, curas em massa absolutas). Siga as *Regras Base de Milagres* rolando **1d100** contra a sua Fé Atual. Devido à magnitude, o Mestre aplica um modificador de no mínimo -50 na sua Fé para esta rolagem. Se bem-sucedido, a Vontade de Deus atende ao seu clamor.
- **Servo Consagrado**: Sua Fé não pode cair abaixo de 30 (Estado Comum/Abalado no máximo), e você é permanentemente imune a Amedrontado, Encantado e Possessão.

---

## Bênçãos e Incentivos

Sacerdotes não possuem o poder de criar eventos sobrenaturais à vontade. Em vez disso, eles usam Pontos de Fé para **fortificar o espírito**, incentivar aliados ou curá-los através da convicção em Deus.

> **Regra de Milagres**: Quando uma situação exige algo que "só Deus pode fazer" (um verdadeiro milagre), o sacerdote realiza um **Clamor**. O Mestre NUNCA decide arbitrariamente se o milagre ocorrerá ou não; ele define a dificuldade (um redutor na sua Fé) e você deve rolar 1d100. Se o resultado for menor ou igual à sua Fé Atual ajustada, o milagre acontece. (Consulte o documento principal de Regras Base para os detalhes completos).

> **Nota**: Todas as bênçãos e incentivos falham automaticamente quando a Barra de Fé está em Ruptura (0 pontos).

| Nome | Nível Min. | Custo de Fé | Ação | Usos | Efeito |
|---|---|---|---|---|---|
| Imposição de Mãos | 1 | 3 | Ação | 2 / D. Longo | Bênção que fortifica o corpo: Cura 1d6 HP fora de combate. |
| Oração de Proteção | 1 | 5 | Ação | 1 / D. Longo | Aliado recebe +2 CA temporário por 1 minuto, como incentivo moral. |
| Guia Espiritual | 1 | 2 | Ação Bônus | 3 / D. Longo | Aliado recebe Vantagem no próximo teste de Sabedoria. |
| Repreensão Divina | 2 | 8 | Ação | 1 / D. Curto | Endemoniado faz teste SAB (CD 12+SAB) ou foge abalado por 1 minuto. |
| Súplica Curativa | 2 | - | Ação | 3 / D. Longo | Fortalece o ânimo: Cura 1d8+SAB HP e recupera 1d4 Fé do aliado. |
| Purificação | 6 | - | Ação | 1 / D. Curto | Encerra Amedrontado, Atordoado, Envenenado ou Possessão inicial. |
| Consagração | 6 | 10 | 10 Minutos | 1 / D. Longo | Área de 9m se torna segura para descanso contra influências malignas (8h). |
| Clamor a Deus | 10 | Variável | Ação | 1 / Semana | Pede um milagre direto. O Mestre define a CD e o jogador rola a Fé para a resposta. |
| Barreira de Fé | 14 | - | Passiva | Constante | A mera presença do sacerdote dá resistência psíquica/espiritual e +2 em SAB a até 6m. |
| Retribuição Divina| 14 | - | Reação | 1 / D. Curto | Ao ver um aliado cair, o grito do sacerdote causa 2d10+SAB dano e Amedronta o agressor. |
| Clamor Maior | 18 | Variável | Ação | 1 / Campanha | Clama por intervenção definitiva (curas em massa, queda de muralhas). O Mestre julga a viabilidade e a CD. |

\page


# Vocação: Batedor

O Batedor é o especialista em espreitar, coletar informações e realizar eliminações cirúrgicas. Podem ser espiões enviados para sondar a Terra Prometida, ou assassinos mercenários. Eles não dependem de força bruta, mas sim de precisão, agilidade e astúcia.

## Características Base
- **Dado de Vida (HP)**: 1d8 por nível.
- **Proficiências**: Armaduras leves, armas simples, espadas curtas, arcos curtos, facas de bronze. Ferramentas de ladrão (se aplicável).
- **Testes de Resistência**: Destreza e Inteligência.

## Progressão da Vocação

### Nível 2: Ataque Furtivo e Agilidade Enganosa
- **Ataque Furtivo (1d6)**: Uma vez por turno, você pode causar 1d6 de dano extra em uma criatura se você tiver Vantagem no ataque, ou se houver um aliado seu a até 1,5m do alvo e você não tiver Desvantagem. O ataque deve ser feito com arma com Acuidade ou de Distância.
- **Agilidade Enganosa**: Você pode usar uma Ação Bônus para realizar a ação de Esconder-se, Desengajar ou Correr.

### Nível 6: Ataque Furtivo Aprimorado e Evasão
- **Ataque Furtivo (3d6)**: Seu dano do Ataque Furtivo aumenta para 3d6.
- **Evasão**: Se você for alvo de um efeito que permite um Teste de Destreza para sofrer apenas metade do dano, em vez disso não sofre dano se passar, e metade se falhar.

### Nível 10: Ataque Furtivo (5d6) e Mente Escorregadia
- **Ataque Furtivo (5d6)**: Seu dano do Ataque Furtivo aumenta para 5d6.
- **Mente Escorregadia**: Você ganha Vantagem em Testes de Sabedoria contra Tentações ou para resistir a medo/possessões.

### Nível 14: Ataque Furtivo (7d6) e Golpe Incapacitante
- **Ataque Furtivo (7d6)**: Seu dano do Ataque Furtivo aumenta para 7d6.
- **Golpe Incapacitante**: Quando você acerta o Ataque Furtivo, pode abdicar de 3d6 do dano para forçar o alvo a fazer um Teste de Constituição (CD 8 + Proficiência + Modificador de DES). Se falhar, o alvo fica Atordoado até o final do próximo turno dele.

### Nível 18: Ataque Furtivo (9d6) e Lâmina Fantasma
- **Ataque Furtivo (9d6)**: Seu dano do Ataque Furtivo aumenta para 9d6.
- **Lâmina Fantasma (1/Descanso Longo)**: Se errar um ataque que qualificaria para Ataque Furtivo, você pode rolar novamente com Vantagem. Se acertar, o dano do Ataque Furtivo para esse acerto é maximizado (trate todos os dados de Ataque Furtivo como 6).

\page


# Vocação: Caçador / Nômade

O Caçador (ou Nômade) vive no limiar entre a civilização e os ermos agrestes do deserto e das montanhas. Excelentes atiradores (com arcos ou fundas, reminiscência dos fundibulários de Benjamim) e rastreadores inigualáveis.

## Características Base
- **Dado de Vida (HP)**: 1d10 por nível.
- **Proficiências**: Armaduras leves e médias, escudos, armas simples e marciais.
- **Testes de Resistência**: Força e Destreza.

## Progressão da Vocação

### Nível 2: Inimigo Favorecido e Estilo de Combate
- **Inimigo Favorecido (Humanóides/Feras)**: Você ganha Vantagem em testes de Sabedoria (Sobrevivência) para rastrear o tipo de criatura escolhida, e Vantagem em testes de Inteligência para lembrar informações sobre elas.
- **Estilo de Luta**: Escolha entre:
  - *Arquearia*: +2 nas rolagens de ataque com armas à distância.
  - *Duas Armas*: Quando ataca com arma leve nas duas mãos, você pode adicionar seu modificador de habilidade ao dano do segundo ataque.

### Nível 6: Ataque Extra e Especialidade em Terreno
- **Ataque Extra**: Você pode atacar duas vezes quando usa a Ação de Ataque.
- **Explorador Rústico**: Você ignora terreno difícil não mágico. Viagens em ambientes agrestes não diminuem a velocidade do seu grupo. Você tem Vantagem em testes de Percepção para evitar emboscadas.

### Nível 10: Tiro Multiplicado ou Besta Companheira
*Escolha um dos dois focos:*
- **Foco do Atirador**: Como ação, você pode realizar um ataque à distância contra qualquer número de criaturas a até 3 metros de um ponto que você possa ver dentro do alcance da arma (limitado à munição). Você rola um ataque separado para cada alvo.
- **Besta Companheira**: Você treinou um cão selvagem, leão pequeno ou ave de rapina. Tem CA 14 + sua Proficiência, HP igual a 4x seu nível. Ela age no seu turno se você gastar uma Ação Bônus para comandá-la.

### Nível 14: Ataque Rápido e Fuga
- **Fuga Engenhosa**: Você pode usar a Ação de Esconder-se como ação bônus. Inimigos atacando você têm Desvantagem se você estiver em cobertura (mesmo que seja parcial).

### Nível 18: Sentidos de Predador
- **Sentidos Aguçados**: Você não sofre desvantagem em ataques por não enxergar o alvo (desde que o alvo não esteja invisível magicamente). Se você acertar um Inimigo Favorecido, o dano é dobrado.

\page


# Fortalezas e Tentações

O Sistema de Fé é o pilar central do RPG Bíblico. Para conectar a personalidade do seu personagem a esse sistema, utilizamos as **Fortalezas** e **Tentações**. 

**Regra Base**: Todo personagem deve, obrigatoriamente, escolher **1 Fortaleza e 1 Tentação no Nível 1**.

---

## Fortalezas (Virtudes)

Fortalezas são traços virtuosos de caráter. Quando o seu personagem agir de forma alinhada à sua Fortaleza (especialmente se isso lhe trouxer alguma desvantagem tática ou pessoal), o Mestre pode recompensá-lo com:
- **Recuperação de Fé**: 1d4 de Fé (ou mais, dependendo da magnitude da ação).
- **Vantagem**: Vantagem em um teste que reflita essa virtude.

### Lista de Fortalezas

1. **Compaixão**: Você não consegue ignorar o sofrimento dos vulneráveis (órfãos, viúvas, estrangeiros pobres). *Gatilho: Sacrificar seus próprios recursos ou segurança para ajudar um necessitado.*
2. **Coragem**: Você é o primeiro a se colocar na linha de frente contra ameaças esmagadoras, confiando na providência. *Gatilho: Enfrentar uma ameaça que faria homens comuns recuarem.*
3. **Zelo**: Você não tolera que o nome do Criador ou o Tabernáculo sejam desrespeitados. *Gatilho: Confrontar idolatria, injustiça declarada ou desrespeito ao sagrado.*
4. **Temperança**: Você é capaz de resistir facilmente a apelos carnais, luxos e festins desmedidos. *Gatilho: Recusar excessos (vinho, banquetes) quando isso lhe traria ganho social ou diplomático.*
5. **Humildade**: Você reconhece que sua força e vitórias vêm do Alto e não busca glória pessoal. *Gatilho: Transferir o crédito de um grande feito heroico a Deus ou a seus companheiros.*
6. **Justiça**: Você age com imparcialidade, recusando subornos e não favorecendo nem o rico nem o pobre indevidamente. *Gatilho: Tomar uma decisão judicial ou tática que o prejudique pessoalmente para manter a equidade.*
7. **Generosidade**: Você é mão-aberta com os frutos do seu trabalho. *Gatilho: Doar uma quantia significativa de seu dinheiro ou saque de guerra para ajudar outros.*
8. **Prudência (Sabedoria)**: Você busca sempre o conselho dos mais velhos e reflete antes de empunhar a espada. *Gatilho: Resolver um conflito pela diplomacia ou paciência quando a violência seria o caminho mais fácil.*
9. **Lealdade**: Você valoriza a aliança com seus irmãos de tribo ou companheiros acima da própria vida. *Gatilho: Colocar-se em perigo mortal para cobrir a retaguarda ou salvar um aliado.*
10. **Perseverança**: Você mantém a esperança mesmo quando todas as evidências apontam para a ruína. *Gatilho: Animar as tropas ou o grupo após uma derrota devastadora.*

---

## Tentações (Falhas)

Tentações são defeitos de caráter ou fraquezas carnais que assombram o personagem. Quando o Mestre apresentar uma situação que ative sua Tentação, você deve:
- **Ceder à Tentação**: E interpretar as consequências de sua falha moral; ou
- **Resistir**: Fazer um Teste de Sabedoria com a Dificuldade (CD) definida pelo Mestre. Se falhar, você não apenas cede à tentação contra a sua vontade, mas sofre um abalo espiritual perdendo **1d6 pontos de Fé**.

### Lista de Tentações

1. **Ira**: Você tem um pavio muito curto e perde a cabeça com insultos. *Gatilho: Alguém desafia sua honra ou insulta sua tribo/família.*
2. **Avareza**: Você é fascinado por espólios de guerra, prata e riquezas. *Gatilho: A oportunidade de saquear riquezas (mesmo proibidas ou amaldiçoadas) se apresenta.*
3. **Luxúria**: Você é facilmente seduzido pelos encantos da carne ou festas pagãs. *Gatilho: Uma oferta de prazer carnal, vinho ou luxo estrangeiro.*
4. **Soberba/Orgulho**: Você acredita que sua habilidade no combate ou inteligência são méritos inteiramente seus. *Gatilho: Uma situação exige que você peça ajuda ou admita que não é capaz de vencer sozinho.*
5. **Inveja**: Você não suporta ver aliados ou líderes recebendo mais glória, terras ou bênçãos que você. *Gatilho: Um NPC ou jogador é publicamente exaltado enquanto você é ignorado.*
6. **Covardia/Hesitação**: Você preza pela autopreservação e seu coração treme diante de oponentes gigantes ou em maior número. *Gatilho: Um combate claramente desvantajoso ou contra criaturas monstruosas se inicia.*
7. **Curiosidade Idólatra**: Você é fascinado pelas práticas mágicas, rituais e costumes de outras nações (como egípcios, filisteus ou cananeus). *Gatilho: A oportunidade de examinar ou guardar um artefato pagão ou ídolo.*
8. **Vingança**: Você não perdoa ofensas e a justiça divina lhe parece lenta demais; você prefere resolver com sangue. *Gatilho: Um inimigo que o feriu no passado se rende ou pede clemência.*
9. **Gula**: Você encontra conforto exagerado na comida e bebida (especialmente vinho), perdendo os sentidos. *Gatilho: Um grande banquete (mesmo antes da batalha ou no acampamento inimigo).*
10. **Dúvida/Desespero**: Você constantemente questiona a Providência quando as coisas dão errado e acha que foram abandonados no deserto. *Gatilho: O grupo sofre uma grande derrota ou uma oração/ritual parece não ser respondida imediatamente.*

\page


# Armas (Idade do Bronze / Ferro)

Este documento lista as armas disponíveis no cenário, com foco histórico e mecânico. Sem propriedades mágicas.

| Arma | Dano | Propriedades | Preço (SP) |
|---|---|---|---|
| **Faca/Adaga de Bronze** | 1d4 perfurante | Acuidade, Leve, Arremesso (6/18m) | 2 |
| **Espada Curta (Ferro)** | 1d6 cortante | Acuidade, Leve | 10 |
| **Espada Longa / Khopesh** | 1d8 cortante | Versátil (1d10) | 15 |
| **Lança Comum** | 1d6 perfurante | Arremesso (6/18m), Versátil (1d8) | 5 |
| **Machado de Batalha** | 1d8 cortante | Versátil (1d10) | 10 |
| **Cajado de Pastor** | 1d6 concussão | Versátil (1d8) | 1 |
| **Funda** | 1d4 concussão | Distância (9/36m), Munição | 1 |
| **Arco Curto** | 1d6 perfurante | Distância (24/96m), Duas mãos, Munição | 25 |
| **Arco Longo** | 1d8 perfurante | Distância (45/180m), Duas mãos, Pesada | 50 |
| **Dardo / Azagaia** | 1d6 perfurante | Arremesso (9/36m) | 3 |

\page


# Armaduras e Escudos

Este documento lista as opções de proteção da Idade do Bronze/Ferro, bem como seus impactos em furtividade e mobilidade. Sem bônus sobrenaturais.

| Armadura | Tipo | Classe de Armadura (CA) | Requisitos / Penalidades | Preço (SP) |
|---|---|---|---|---|
| **Túnica Grossa (Acolchoada)** | Leve | 11 + Des | Desvantagem em Furtividade | 5 |
| **Couro Cru** | Leve | 11 + Des | - | 10 |
| **Couro Batido (com tachas)** | Leve | 12 + Des | - | 45 |
| **Cota de Escamas de Bronze** | Média | 14 + Des (máx +2) | Desvantagem em Furtividade | 50 |
| **Peitoral de Bronze/Ferro** | Média | 14 + Des (máx +2) | - | 400 |
| **Cota de Malha de Anéis** | Pesada | 14 | Desvantagem em Furtividade | 30 |
| **Lorica de Escamas Pesada** | Pesada | 16 | Desvantagem em Furtividade, Requer For 13 | 75 |
| **Escudo (Madeira/Bronze)** | Escudo | +2 na CA | Ocupa uma mão | 10 |

\page


# Itens Consumíveis

Recursos que se desgastam ou são consumidos com o uso.

| Item | Efeito Mecânico / Uso | Duração (se aplicável) | Preço (SP) |
|---|---|---|---|
| **Odre (Água)** | Sobrevivência no deserto (1 dia) | 1 dia de hidratação | 1 |
| **Tocha** | Ilumina 6m | Queima por 1h | 0.5 (5 cobre) |
| **Bálsamo Curativo / Óleo** | Uso para curar 1d4 HP em Descanso | Único | 5 |
| **Ração de Viagem (1 dia)** | Pão seco, tâmaras, queijo duro | 1 dia de nutrição | 1 |
| **Saco de Pedras para Funda**| 20 pedras adequadas | - | 0.5 |

\page


# Itens Utilizáveis (Comuns)

Equipamentos não consumíveis que facilitam viagens, resolução de problemas e exploração.

| Item | Descrição / Uso | Preço (SP) |
|---|---|---|
| **Corda de Cânhamo (15m)** | Escalada, amarras | 1 |
| **Mochila de Lona** | Carregar itens extras | 2 |
| **Tenda Comum** | Abrigo para 2 pessoas | 10 |
| **Amuleto/Símbolo (Proibido)**| Ídolo herege, abaixa Fé se mantido | - |
| **Pederneira e Isqueiro** | Iniciar fogo | 2 |

\page


# Guia do Mestre

Este documento fornece as ferramentas narrativas e mecânicas completas para conduzir uma campanha no RPG Bíblico.

## 1. A Regra de Ouro do Cenário
O RPG Bíblico não é alta fantasia. É um cenário *low magic* onde o sobrenatural é divino ou demoníaco, e nunca é mundano. Como Mestre, seu papel principal é preservar esse clima:
- **Sem magos ou itens brilhantes**: Espadas não disparam fogo. Armaduras não concedem voo. A força bruta e o aço são as moedas do combate.
- **O milagre é escasso**: Sacerdotes usam Fé, não "slots de magia". Se a Fé zerar, não há salvação fácil. Milagres devem parecer intervenções celestiais e não truques de salão.
- **Consequências importam**: Ações profanas ou hereges afetam ativamente o grupo, minando suas forças e atraindo corrupção e desespero.

## 2. Usando Fé, Fortalezas e Tentações
O Sistema de Fé não é apenas uma barra de recurso, mas o motor narrativo do jogo. Os jogadores possuem Fortalezas (virtudes) e Tentações (falhas). Use-as ativamente:
- **Gatilhos de Tentação**: Coloque um baú de prata não vigiado perto de alguém com "Avareza". Provoque a fúria do inimigo na frente de alguém com "Ira".
- **Testes de Resistência**: Quando um gatilho ocorrer, peça um Teste de Sabedoria.
  - **Fácil (CD 10)**: Oportunidade leve de desvio (ex: mentir para guardar um trocado).
  - **Médio (CD 13)**: Confronto direto com o defeito (ex: ignorar um ferido para garantir lucro).
  - **Difícil (CD 16)**: Risco de corrupção total (ex: idolatria extrema ou traição letal).
  - *Falha = Perde 1d6 de Fé.*
- **Cenas de Fortaleza**: Quando o jogador abraçar ativamente sua Fortaleza em sacrifício próprio (ex: proteger um inocente sendo "Protetor" e sofrer dano por isso), conceda-lhe Vantagem em sua próxima ação ou recupere **1d4 de Fé** para o grupo.

## 3. Recompensas por Nível de Desafio
O saque de corpos ou tesouros em cavernas deve refletir o contexto histórico (Idade do Bronze/Ferro). As riquezas vêm em gado, ovelhas, ou moedas rústicas.
- **ND 1/8 a 1/4**: 1d4 Siclos de Prata (SP), comida para 1 dia, flechas velhas.
- **ND 1/2 a 1**: 2d6 SP, armas de bronze em bom estado, pequenos adornos.
- **ND 2 a 3**: 4d10 SP, armas/peitorais de ferro, relíquias profanas ou textos.
- **ND 4+**: 10d10+50 SP, ovelhas/gado no valor equivalente, equipamentos obra-prima.

## 4. Ganchos de Aventura Prontos
Use estes 5 ganchos rápidos para iniciar uma sessão sem muita preparação:

1. **Os Ladrões de Gado Amalequitas**
   - *Premissa*: A tribo local de Benjamim perdeu pastores e ovelhas. Rastros indicam que mercenários estão escondidos num vale próximo.
   - *ND Sugerido*: 1 (Encontro com 4 bandidos e 1 sentinela). *Pilares*: Exploração / Combate.
2. **O Altar Escondido**
   - *Premissa*: O poço da aldeia secou. Uma criança diz ter visto uma fumaça roxa nas colinas à noite. Há um ritual a deuses antigos sendo formado.
   - *ND Sugerido*: 2 (Sacerdote de Baal e 3 aldeões enfeitiçados). *Pilares*: Investigação / Fé.
3. **O Rugido do Deserto**
   - *Premissa*: A viagem de Hebrom até Betel foi interrompida. Há corpos de mercadores destroçados, e algo muito grande e feroz ronda as dunas.
   - *ND Sugerido*: 2 (Leão da Judeia e 2 leoas). *Pilares*: Sobrevivência / Combate.
4. **O Endemoniado das Tumbas**
   - *Premissa*: Uma caverna tumular nas montanhas está uivando à noite. Viajantes que passam por lá voltam marcados com arranhões e aterrorizados.
   - *ND Sugerido*: 2 (1 Endemoniado Comum). *Pilares*: Combate / Fé.
5. **O Relatório do Espião**
   - *Premissa*: Um batedor filisteu foi capturado com mapas das muralhas. Alguém na cidade é um traidor e deve ser descoberto antes do sol se pôr.
   - *ND Sugerido*: 1/2 (Interrogatório e confronto com capangas). *Pilares*: Investigação (Social).

## 5. Dicas de Combate para Iniciantes
- Use capangas ND 1/8 ou 1/4 em grupos para fazer os jogadores se sentirem fortes, sem o risco de matá-los num hit.
- Introduza ND 1/2 ou 1 apenas como mini-chefes no Nível 1.
- Sempre dê cobertura aos arqueiros. Inimigos agem de forma inteligente, tentando cercar ou derrubar personagens vulneráveis primeiro (focar ataques).
- Se os jogadores estiverem perdendo, permita que o terreno desabe, ou sugira uma rota de fuga. Fuga é melhor que TPK (Total Party Kill).

\page


# Guia Rápido do Mestre

Este documento serve como um sumário e guia de consulta rápida durante a sessão. O RPG Bíblico foca em um combate realista (sem magia arcana) e na gestão constante do Sistema de Fé.

---

## 1. Preparação da Sessão
- **Revisão de Fichas**: Verifique se todos os jogadores escolheram 1 Fortaleza e 1 Tentação da lista oficial.
- **Barra de Fé**: Anote a Fé atual de todos os jogadores (Iniciam em 50, Levitas em 60).
- **Sem Magia Arcana**: Lembre os jogadores de que curas e incentivos dependem estritamente de Pontos de Fé gastos por Sacerdotes/Sábios.
- **Intervenções Divinas**: O Mestre nunca decide narrativamente ou gasta Fé para invocar um milagre. O jogador deve fazer um Clamor, e a Vontade Divina é resolvida com **1d100** contra a Fé Atual modificada pela Dificuldade que o Mestre impuser (ex: 0, -20, -50).

## 2. Consulta Rápida: Sistema de Fé
A Fé dita o estado mental e espiritual do grupo.

| Faixa de Fé | Estado | Efeito |
|---|---|---|
| **100–70** | Inabalável | Inspiração 1x/dia. |
| **69–31** | Comum | Estado normal, sem penalidades. |
| **30–11** | Abalado | Desvantagem em resistência de SAB/CAR. |
| **10–1** | Vulnerável | Risco de possessão demoníaca e loucura. |
| **0** | Ruptura | Morte espiritual ou possessão inevitável sem exorcismo. |

**Recuperação**:
- Ações Honrosas / Resistir Tentação: +1d4 de Fé.
- Descanso Longo Devocional: +1d4 para o grupo (+1d4+2 se liderado por Sacerdote).

## 3. Gestão de Combate e Condições
O combate segue as mecânicas tradicionais de D&D 5e adaptadas (6 segundos por turno: Movimento + Ação + Bônus + Reação). 
- **[Catálogo de Armas e Armaduras](./itens/README.md)**: As armas são de bronze/ferro. CA máxima depende da destreza e do tipo de armadura (sem itens +1/+2).
- **Condições Específicas**:
  - *Caído*: Ataques a 1,5m contra o alvo têm Vantagem; à distância têm Desvantagem. Levantar custa 1/2 movimento.
  - *Agarrado*: Deslocamento 0. Escapar exige Ação (Atletismo/Acrobacias vs Atletismo).
  - *Cego*: Falha em testes visuais. Ataques com Desvantagem, e contra ele com Vantagem.

> *Lembrete*: Situações não cobertas pelas regras formais devem ser resolvidas com o Bom Senso do Mestre.

## 4. Estruturando Encontros (Guia de ND)
O Nível de Desafio (ND) indica que a criatura é um desafio adequado para 4 jogadores daquele nível.
- **ND 1/8 a 1/4**: Capangas menores (ex: Bandidos, Sentinelas Amalequitas). Use em grupos (3-6) para o Nível 1.
- **ND 1/2 a 1**: Tropas bem treinadas ou feras (ex: Soldados Filisteus, Leões). Perigosos para Nível 1.
- **ND 2+**: Chefes locais, oficiais de elite, seres corrompidos (ex: Sacerdotes de Baal, Endemoniados, Generais). 
- Consulte o **[Bestiário Completo](./bestiario/README.md)** para os stat blocks oficiais de inimigos humanos, animais e ameaças sobrenaturais.

## 5. Atalhos Úteis
- [Regras e Mecânicas Base](./regras-base.md)
- [Criação de Personagem](./criacao-de-personagem.md)
- [Fortalezas e Tentações](./fortalezas-tentacoes.md)

\page


# Bestiário do RPG Bíblico

Este diretório contém os perfis mecânicos (*stat blocks*) dos diversos inimigos e ameaças que os personagens podem encontrar durante suas jornadas na Idade do Bronze/Ferro.

Neste cenário, **não existem monstros fantásticos ou criaturas mágicas** típicas de outros RPGs (dragões, elfos negros, mortos-vivos padronizados). As ameaças são calcadas em três pilares principais:

1. **Ameaças Humanas**: Nações inimigas (Filisteus, Amalequitas, etc), bandidos, generais.
2. **Ameaças Naturais**: Feras que habitam os desertos, montes e florestas (leões, ursos).
3. **Ameaças Sobrenaturais (Guerra Espiritual)**: Gigantes (descendentes dos Nephilim/Anakim) e homens ou bestas corrompidos por demônios (Endemoniados).

---

## Como ler as estatísticas

Cada entrada segue um bloco de estatísticas padrão:

- **Nível de Desafio / XP**: O ND determina a dificuldade do inimigo. Um ND 1 significa que a criatura é um desafio adequado para um grupo de 4 personagens de Nível 1.
- **Passivas / Habilidades**: Efeitos constantes ou engatilhados.
- **Ações**: Os ataques padrão usando armas de bronze, ferro ou garras/presas.

## Categorias (10 inimigos + 1 template)

- [Inimigos Humanos](inimigos-humanos.md): Bandidos, Soldados Filisteus, Generais, Sentinelas Amalequitas, Sacerdotes de Baal.
- [Animais Selvagens](animais-selvagens.md): Víboras, Leões, Ursos.
- [Gigantes](gigantes.md): Guerreiros Anakim (Golias).
- [Template: Endemoniado](template-endemoniado.md): Um modificador mecânico para aplicar possessão em outros inimigos.
  - *Exemplo pronto:* [Endemoniado Comum](endemoniado-comum.md)

\page


# Inimigos Humanos

Homens e mulheres formam a vasta maioria das ameaças enfrentadas. Desde salteadores de beira de estrada até exércitos treinados das nações vizinhas.

---

### Bandido do Deserto
*Médio, Humano, Neutro e Mau*

- **Classe de Armadura (CA)**: 12 (Couro cru)
- **Pontos de Vida (PV)**: 11 (2d8 + 2)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 11 (+0) | 12 (+1) | 12 (+1) | 10 (+0) | 10 (+0) | 10 (+0) |

- **Perícias**: Furtividade +3, Sobrevivência +2
- **Sentidos**: Percepção passiva 10
- **Nível de Desafio / XP**: 1/8 (25 XP)

**Passivas / Habilidades**
- **Ataque Furtivo**: Uma vez por turno, o bandido causa 1d6 de dano extra se tiver vantagem na jogada ou se outro inimigo do alvo estiver a até 1,5m do alvo.

**Ações**
- **Adaga de Bronze**: *Ataque Corpo a Corpo ou à Distância:* +3 para acertar, alcance 1,5m ou arremesso 6/18m, um alvo. *Dano*: 3 (1d4 + 1) perfurante.
- **Funda**: *Ataque à Distância:* +3 para acertar, alcance 9/36m, um alvo. *Dano*: 3 (1d4 + 1) concussão.

---

### Soldado Filisteu
*Médio, Humano, Leal e Mau*

- **Classe de Armadura (CA)**: 14 (Cota de escamas de bronze, Escudo)
- **Pontos de Vida (PV)**: 16 (3d8 + 3)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 14 (+2) | 11 (+0) | 13 (+1) | 10 (+0) | 10 (+0) | 11 (+0) |

- **Perícias**: Atletismo +4
- **Sentidos**: Percepção passiva 10
- **Nível de Desafio / XP**: 1/2 (100 XP)

**Passivas / Habilidades**
- **Formação em Parede**: O soldado tem Vantagem em testes de resistência de Força e Destreza enquanto estiver a até 1,5m de um aliado não-incapacitado que também use escudo.

**Ações**
- **Lança**: *Ataque Corpo a Corpo:* +4 para acertar, alcance 1,5m, um alvo. *Dano*: 5 (1d6 + 2) perfurante.
- **Espada Curta (Ferro)**: *Ataque Corpo a Corpo:* +4 para acertar, alcance 1,5m, um alvo. *Dano*: 5 (1d6 + 2) cortante.

---

### General de Guerra
*Médio, Humano, Leal e Neutro/Mau*

- **Classe de Armadura (CA)**: 16 (Peitoral de ferro, Escudo)
- **Pontos de Vida (PV)**: 52 (8d8 + 16)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 16 (+3) | 12 (+1) | 14 (+2) | 14 (+2) | 12 (+1) | 15 (+2) |

- **Testes de Resistência**: For +5, Con +4
- **Perícias**: Atletismo +5, História +4, Intimidação +4
- **Sentidos**: Percepção passiva 11
- **Nível de Desafio / XP**: 3 (700 XP)

**Passivas / Habilidades**
- **Comandar Aliados**: Com uma ação bônus, o general pode ordenar que um aliado a até 9m dele faça um ataque com arma usando sua reação.

**Ações**
- **Ataques Múltiplos**: O general faz dois ataques corporais.
- **Espada Longa**: *Ataque Corpo a Corpo:* +5 para acertar, alcance 1,5m, um alvo. *Dano*: 7 (1d8 + 3) cortante.

---

### Sentinela Amalequita
*Médio, Humano, Caótico e Mau*

- **Classe de Armadura (CA)**: 13 (Couro leve)
- **Pontos de Vida (PV)**: 16 (3d8 + 3)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 11 (+0) | 14 (+2) | 12 (+1) | 10 (+0) | 12 (+1) | 9 (-1) |

- **Perícias**: Percepção +3, Sobrevivência +3
- **Sentidos**: Percepção passiva 13
- **Nível de Desafio / XP**: 1/4 (50 XP)
- **Contexto**: Batedores cruéis que atacam a retaguarda e disparam de pontos altos.

**Passivas / Habilidades**
- **Ataque Furtivo de Emboscada**: No primeiro turno do combate, tem Vantagem em ataques contra alvos que ainda não agiram.

**Ações**
- **Arco Curto**: *Ataque à Distância:* +4 para acertar, alcance 24/96m, um alvo. *Dano*: 5 (1d6 + 2) perfurante.
- **Faca de Osso**: *Ataque Corpo a Corpo:* +4 para acertar, alcance 1,5m, um alvo. *Dano*: 4 (1d4 + 2) perfurante.

---

### Sacerdote de Baal
*Médio, Humano, Neutro e Mau*

- **Classe de Armadura (CA)**: 12 (Vestes cerimoniais)
- **Pontos de Vida (PV)**: 33 (6d8 + 6)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 10 (+0) | 14 (+2) | 12 (+1) | 13 (+1) | 16 (+3) | 14 (+2) |

- **Testes de Resistência**: SAB +5
- **Perícias**: Enganação +4, Religião +3
- **Sentidos**: Percepção passiva 13
- **Nível de Desafio / XP**: 2 (450 XP)
- **Contexto**: Líder herege que invoca maldições demoníacas para enfraquecer a Fé dos heróis.

**Passivas / Habilidades**
- **Aura de Heresia**: Alvos a até 6m têm Desvantagem em testes para resistir a Amedrontado.

**Ações**
- **Adaga Cerimonial**: *Ataque Corpo a Corpo:* +4 para acertar, alcance 1,5m, um alvo. *Dano*: 4 (1d4 + 2) perfurante mais 3 (1d6) dano psíquico.
- **Maldição de Baal (Recarga 5-6)**: O Sacerdote clama aos seus deuses contra um alvo a até 18m. O alvo deve passar em um Teste de Sabedoria (CD 13). Se falhar, sofre 10 (3d6) de dano psíquico e perde 1d6 pontos de Fé. Se passar, sofre metade do dano e não perde Fé.

\page


# Animais Selvagens

As feras das terras ermas são ameaças reais aos pastores, viajantes e mensageiros. Os leões dos matagais do Jordão e os ursos das florestas de Betel são lendas por sua ferocidade.

---

### Víbora do Deserto
*Miúdo, Fera, Imparcial*

- **Classe de Armadura (CA)**: 13 (Armadura Natural)
- **Pontos de Vida (PV)**: 2 (1d4)
- **Deslocamento**: 9 m, Natação 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 2 (-4) | 16 (+3) | 11 (+0) | 1 (-5) | 10 (+0) | 3 (-4) |

- **Perícias**: Furtividade +5
- **Sentidos**: Visão no escuro 3 m, Percepção passiva 10
- **Nível de Desafio / XP**: 1/8 (25 XP)

**Passivas / Habilidades**
- **Bote Surpresa**: Tem vantagem nas rolagens de ataque contra criaturas surpresas.

**Ações**
- **Mordida Peçonhenta**: *Ataque Corpo a Corpo:* +5 para acertar, alcance 1,5m, um alvo. *Dano*: 1 perfurante, e o alvo deve ser bem sucedido num Teste de Resistência de Constituição CD 10 ou sofrerá 5 (2d4) de dano de veneno (metade em caso de sucesso).

---

### Leão da Judeia
*Grande, Fera, Imparcial*

- **Classe de Armadura (CA)**: 12 (Armadura Natural)
- **Pontos de Vida (PV)**: 26 (4d10 + 4)
- **Deslocamento**: 15 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 17 (+3) | 15 (+2) | 13 (+1) | 3 (-4) | 12 (+1) | 8 (-1) |

- **Perícias**: Furtividade +6, Percepção +3
- **Sentidos**: Percepção passiva 13
- **Nível de Desafio / XP**: 1 (200 XP)

**Passivas / Habilidades**
- **Tática de Matilha**: O leão tem vantagem nas rolagens de ataque corpo a corpo contra uma criatura se houver pelo menos um aliado do leão a até 1,5m da criatura e este aliado não estiver incapacitado.
- **Salto e Bote**: Se o leão se mover pelo menos 6m em linha reta em direção a um alvo e, logo em seguida, acertar um ataque de garra no mesmo turno, o alvo deve ser bem sucedido num Teste de Resistência de Força CD 13 ou ficará caído. Se o alvo cair, o leão pode realizar um ataque de mordida contra ele usando uma Ação Bônus.

**Ações**
- **Mordida**: *Ataque Corpo a Corpo:* +5 para acertar, alcance 1,5m, um alvo. *Dano*: 7 (1d8 + 3) perfurante.
- **Garra**: *Ataque Corpo a Corpo:* +5 para acertar, alcance 1,5m, um alvo. *Dano*: 6 (1d6 + 3) cortante.

---

### Urso Pardo Sírio
*Grande, Fera, Imparcial*

- **Classe de Armadura (CA)**: 11 (Armadura Natural)
- **Pontos de Vida (PV)**: 34 (4d10 + 12)
- **Deslocamento**: 12 m, Escalada 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 19 (+4) | 10 (+0) | 16 (+3) | 2 (-4) | 13 (+1) | 7 (-2) |

- **Perícias**: Percepção +3
- **Sentidos**: Percepção passiva 13
- **Nível de Desafio / XP**: 1 (200 XP)

**Passivas / Habilidades**
- **Faro Aguçado**: O urso tem vantagem em testes de Sabedoria (Percepção) que dependam do olfato.

**Ações**
- **Ataques Múltiplos**: O urso faz dois ataques: um com sua mordida e um com suas garras.
- **Mordida**: *Ataque Corpo a Corpo:* +6 para acertar, alcance 1,5m, um alvo. *Dano*: 8 (1d8 + 4) perfurante.
- **Garras**: *Ataque Corpo a Corpo:* +6 para acertar, alcance 1,5m, um alvo. *Dano*: 11 (2d6 + 4) cortante.

\page


# Gigantes (Nephilim e Anakim)

Nas terras de Canaã e Filístia habitam descendentes dos antigos gigantes (os filhos de Anaque). Eles possuem proporções aterrorizantes (frequentemente ultrapassando os 2,70 metros de altura), seis dedos em cada membro, e uma força monstruosa.

---

### Guerreiro Anakim (Ex: Golias)
*Enorme, Humanoide (Gigante), Leal e Mau*

- **Classe de Armadura (CA)**: 15 (Cota de malha pesada adaptada, Desvantagem em Furtividade)
- **Pontos de Vida (PV)**: 85 (9d12 + 27)
- **Deslocamento**: 12 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 21 (+5) | 10 (+0) | 16 (+3) | 10 (+0) | 10 (+0) | 12 (+1) |

- **Testes de Resistência**: For +7, Con +5
- **Perícias**: Atletismo +7, Intimidação +5
- **Sentidos**: Percepção passiva 10
- **Nível de Desafio / XP**: 5 (1800 XP)

**Passivas / Habilidades**
- **Presença Aterradora**: Qualquer criatura hostil de tamanho Médio ou menor que iniciar seu turno a até 9 metros do Anakim e puder vê-lo deve fazer um Teste de Sabedoria CD 13. Se falhar, fica Amedrontada por 1 minuto. A criatura pode repetir o teste no final de seus turnos.
- **Resistência Opressora**: Armas comuns parecem não penetrar fundo. Ele subtrai 3 pontos de qualquer dano contundente, cortante ou perfurante não-crítico que sofra.

**Ações**
- **Ataques Múltiplos**: O Anakim faz dois ataques com sua lança ou espada imensa.
- **Lança Imensa**: *Ataque Corpo a Corpo:* +7 para acertar, alcance 3m, um alvo. *Dano*: 14 (2d8 + 5) perfurante.
- **Espada Pesada de Ferro**: *Ataque Corpo a Corpo:* +7 para acertar, alcance 1,5m, um alvo. *Dano*: 16 (2d10 + 5) cortante.
- **Arremesso de Rocha / Dardo Gigante**: *Ataque à Distância:* +7 para acertar, alcance 18/54m, um alvo. *Dano*: 15 (3d6 + 5) concussão ou perfurante.

\page


# Endemoniado Comum
*Médio, Humano (Sobrenatural), Caótico e Mau*

- **Classe de Armadura (CA)**: 12 (Couro cru rasgado)
- **Pontos de Vida (PV)**: 30 (4d8 + 12)
- **Deslocamento**: 9 m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 15 (+2) | 12 (+1) | 16 (+3) | 6 (-2) | 10 (+0) | 10 (+0) |

- **Perícias**: Furtividade +3, Intimidação +2
- **Imunidades de Condição**: Encantado, Amedrontado
- **Vulnerabilidades**: Vulnerabilidade Espiritual (orações, rituais de Fé)
- **Sentidos**: Percepção passiva 10
- **Nível de Desafio / XP**: 2 (450 XP)
- **Contexto**: Um homem levado à loucura, cujos ossos e músculos foram torcidos pela entidade que o habita.

**Passivas / Habilidades**
- **Fúria Desumana**: O endemoniado ignora dores mortais. Quando cair a 0 PV, faz um Teste de Constituição (CD 10). Se passar, sobrevive com 1 PV. O CD aumenta em 5 a cada uso.
- **Ataque Furtivo**: Uma vez por turno, causa 1d6 de dano extra se tiver vantagem no ataque ou aliado a 1,5m do alvo.

**Ações**
- **Ataque Bestial (Garras/Mordida)**: *Ataque Corpo a Corpo:* +4 para acertar, alcance 1,5m, um alvo. *Dano*: 5 (1d6 + 2) perfurante.
- **Grito Atormentador (Recarga 5-6)**: A criatura emite um ruído inumano. Inimigos a até 9m que possam ouvi-lo fazem um Teste de Sabedoria (CD 12) ou perdem **1d4 pontos de Fé** e sofrem Desvantagem na próxima jogada de ataque.

\page


# Template: Endemoniado

Neste cenário, a possessão e o tormento espiritual são ameaças mecânicas diretas. Demônios não possuem forma física (salvo exceções raras de manifestações extremas); eles habitam corpos humanos ou de animais (como os porcos em Gadara), distorcendo-os fisicamente e concedendo poder sobrenatural.

**Como aplicar**: Você pode aplicar este "Template" a qualquer criatura do Bestiário (Bandido, General, Leão) para transformá-la num Endemoniado. A criatura base retém suas estatísticas originais, exceto pelas alterações a seguir.

---

## Modificadores Mecânicos

- **Atributos Físicos**: A Força e a Constituição da criatura base são aumentadas em **+4** (Aumentando os modificadores em +2). Aumente os pontos de vida máximos (HP) e ataques que dependem destes atributos de acordo.
- **Inteligência e Carisma**: A Inteligência cai para 6 (se for maior), tornando-se puramente instintiva/animalesca na maioria dos casos. O Carisma, no entanto, é modificado por uma aura macabra: ganha Proficiência em Intimidação (se não tiver).
- **Alinhamento**: Muda imediatamente para Caótico e Mau.

## Novas Habilidades (Passivas)

- **Imunidade Psicológica**: O endemoniado é **imune** às condições Encantado e Amedrontado.
- **Fúria Desumana**: O endemoniado ignora dores mortais. Quando cair a 0 Pontos de Vida, ele faz um Teste de Constituição (CD 10). Se passar, ele sobrevive com 1 Ponto de Vida. O CD aumenta em 5 a cada uso até ele descansar ou ser exorcizado.
- **Vulnerabilidade Espiritual**: O endemoniado possui vulnerabilidade a ataques ou rituais baseados no **Sistema de Fé** (como orações exorcistas de Sacerdotes). Caso um personagem gaste Pontos de Fé para invocar repreensão, o demônio sofre Dano Espiritual diretamente ou é forçado a fazer um Teste de Resistência de Carisma para não fugir/abandonar o corpo.

## Novas Ações

- **Grito Atormentador**: *Recarga (5-6 no d6)*. A criatura emite um ruído inumano. Todos os inimigos a até 9 metros que possam ouvi-lo devem fazer um Teste de Sabedoria ou perderão **1d4 pontos de Fé** e sofrerão Desvantagem na próxima jogada de ataque.
- **Ataque Bestial**: A criatura usa as próprias mãos nuas (ou quebra suas armas para atacar com selvageria). Ela ganha um ataque de garra/mordida desarmado que causa dano perfurante igual a `1d6 + Força`.

\page
