# Feature Specification: Itens e Equipamentos

**Feature Branch**: `003-itens-equipamentos`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "defina as armas, armaduras e itens utilizaveis e consumiveis"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulta e Seleção de Armas (Priority: P1)

Como um jogador, quero consultar a lista de armas disponíveis (com seus danos, propriedades e preços em Shekels) para equipar adequadamente o meu personagem durante a criação ou em mercados.

**Why this priority**: É essencial para o núcleo do combate e progressão do personagem possuir as ferramentas de ataque devidamente documentadas.

**Independent Test**: Pode ser testado verificando se todas as armas da Idade do Bronze/Ferro (adagas, espadas, lanças, arcos, fundas) estão descritas com o dano e propriedades corretas em uma tabela.

**Acceptance Scenarios**:

1. **Given** um jogador criando um personagem, **When** ele verifica a seção de equipamentos, **Then** ele encontra armas que se encaixam no período histórico sem atributos mágicos.

---

### User Story 2 - Consulta de Armaduras e Defesa (Priority: P1)

Como um jogador, quero entender as armaduras disponíveis, seus bônus de CA (Classe de Armadura), os requisitos e penalidades (ex: furtividade), para calcular a defesa do meu personagem.

**Why this priority**: A sobrevivência do personagem depende de conhecer e adquirir armaduras apropriadas para sua Vocação.

**Independent Test**: Pode ser testado calculando a CA final de um personagem utilizando as informações de defesa e limites de destreza detalhados no documento.

**Acceptance Scenarios**:

1. **Given** um personagem com destreza alta, **When** ele escolhe uma armadura leve, **Then** ele aplica corretamente o seu modificador integral de Destreza à CA.

---

### User Story 3 - Utilização de Consumíveis e Itens Gerais (Priority: P2)

Como um jogador, quero ter acesso à lista de itens comuns e consumíveis (como rações, bálsamos, odres e tochas) para me preparar para viagens e explorações.

**Why this priority**: Ajuda na narrativa de sobrevivência e recuperação de HP fora de combate (como o uso de Bálsamo Curativo no descanso).

**Independent Test**: Testado pela presença de itens com regras claras de uso, como a cura de 1d4 do Bálsamo Curativo ou a duração de 1h da tocha.

**Acceptance Scenarios**:

1. **Given** um personagem ferido após um combate, **When** ele utiliza um Bálsamo Curativo durante o Descanso Curto, **Then** ele recupera 1d4 pontos de vida.

### Edge Cases

- O que acontece se um personagem de vocação sem proficiência em armaduras pesadas tentar usá-las?
- Como o sistema lida com o uso de armas e propriedades que não se encaixam no escopo histórico (ex: uma besta pesada)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST documentar uma lista de armas de ataque corpo a corpo e à distância, incluindo dano (dados baseados em D&D 5e), propriedades (acuidade, distância, pesada) e preço em Shekels de Prata (SP).
- **FR-002**: O sistema MUST documentar armaduras leves, médias e pesadas, definindo seu cálculo de CA, limite de bônus de Destreza e possíveis desvantagens em Furtividade.
- **FR-003**: O sistema MUST detalhar itens consumíveis específicos do período, definindo seus efeitos mecânicos claros (ex: cura de HP, iluminação, hidratação).
- **FR-004**: O sistema MUST respeitar a restrição histórica e mecânica de ausência de itens mágicos (+1, +2, etc.).

### Key Entities

- **Arma**: Representa o meio de ataque. Possui tipo de dano (perfurante, cortante, concussão), propriedades e custo.
- **Armadura / Escudo**: Concede CA base, impondo regras de destreza máxima e penalidades.
- **Item Comum/Consumível**: Equipamentos de sobrevivência ou cura utilizados no dia a dia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O documento de regras de itens é compreensível e permite a um jogador montar seu inventário inicial em menos de 10 minutos.
- **SC-002**: Todas as Vocações possuem pelo menos 2 opções de armas e armaduras otimizadas para suas características.
- **SC-003**: Inexistência de menção a itens que fujam da temática da Idade do Bronze/Ferro, validando 100% de precisão de setting.

## Assumptions

- O cenário econômico baseia-se em Shekels (Siclós) de Prata e Peças de Cobre.
- Nenhuma arma ou armadura é mágica.
- As regras de propriedades (acuidade, versátil, etc.) funcionam de forma idêntica à 5e original.
