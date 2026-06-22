# Feature Specification: Análise e Melhorias no Sistema de Itens

**Feature Branch**: `[035-analise-sistema-itens]`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "faça uma analise rigorosa e realista relacionado aos itens na documentação e no sistema e veja o que falta implementar ou melhorar o q ja temos no sistema. E crie um documento listando o que podeia ser feito."

## Análise Atual do Sistema vs Documentação

Após análise entre a pasta `docs/itens/` e a implementação em `src/data/itemsDb.ts` e `src/components/inventory/InventoryList.tsx`, o sistema de itens atual cobre a listagem básica dos itens, mas apresenta lacunas significativas na aplicação de suas regras mecânicas:

1. **Armas (Propriedades)**: Propriedades como *Acuidade* (uso de Destreza), *Versátil* (uso com duas mãos alterando dano para 1d10 ou 1d8), *Arremesso* e *Distância* constam apenas em texto (description), sem reflexo mecânico durante o combate ou rolagens.
2. **Munição**: A documentação menciona que Arcos usam "Munição", porém não existem `Flechas` no `itemsDb.ts` nem em `consumiveis.md` (apenas "Saco de Pedras para Funda" está implementado, enquanto o kit "Caçador" menciona 20 flechas).
3. **Penalidades de Armadura**: Armaduras como "Cota de Escamas" e "Lorica" têm a descrição "Desvantagem em Furtividade" ou "Requer For 13", mas não há imposição mecânica no sistema de testes (`session_tests`) nem na verificação de atributos no inventário.
4. **Itens Faltantes**: O `Amuleto/Símbolo (Proibido)` consta na documentação como item que diminui a Fé, mas inexiste em `itemsDb.ts`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Suporte a Propriedades Especiais de Armas (Priority: P1)

Como jogador e mestre, quero que propriedades como Versátil e Acuidade afetem os modificadores de ataque e dano automaticamente.

**Why this priority**: É a mecânica central do combate de D&D; sem ela, atributos perdem o sentido e armas diferentes não se distinguem.

**Independent Test**: Pode ser testado equipando uma arma Versátil com as duas mãos e observando o dano mudar de 1d8 para 1d10, ou equipando uma Adaga e notando que o ataque usa Destreza em vez de Força.

**Acceptance Scenarios**:

1. **Given** um personagem com uma Espada Longa, **When** ele a equipa com ambas as mãos, **Then** o dado de dano exibido passa para 1d10.
2. **Given** um personagem com mais Destreza do que Força, **When** ataca com uma Adaga (Acuidade), **Then** a rolagem usa o modificador de Destreza.

---

### User Story 2 - Gerenciamento de Munições (Priority: P1)

Como jogador, quero conseguir comprar, equipar e gastar flechas/pedras quando utilizar ataques à distância.

**Why this priority**: Impede uso infinito de ataques à distância, uma limitação mecânica importante de sobrevivência.

**Independent Test**: Pode ser testado atirando com um arco e vendo o contador de flechas no inventário diminuir automaticamente.

**Acceptance Scenarios**:

1. **Given** um personagem com Arco Curto equipado, **When** ele realiza um ataque, **Then** o sistema deve consumir 1 Flecha do inventário.

---

### User Story 3 - Penalidades e Restrições de Armadura (Priority: P2)

Como mestre, quero que personagens que usam armaduras pesadas sem a Força necessária ou tentando furtividade sofram desvantagens reais.

**Why this priority**: Balanceia o uso de armaduras pesadas (que garantem CA alta) aplicando suas desvantagens narrativas.

**Independent Test**: Pode ser testado equipando uma Lorica e tentando realizar um teste de Destreza (Furtividade), verificando se a interface de teste impõe desvantagem automática.

**Acceptance Scenarios**:

1. **Given** um personagem com Força 10, **When** tenta equipar uma "Lorica de Escamas Pesada", **Then** o sistema exibe um aviso e/ou impede de equipar ou reduz o deslocamento.
2. **Given** armadura com Desvantagem em Furtividade equipada, **When** um teste de furtividade é chamado, **Then** a desvantagem é aplicada por padrão.

---

### User Story 4 - Implementação do Símbolo Proibido (Priority: P3)

Como jogador, quero que a posse de um Amuleto Proibido diminua minha Fé enquanto estiver em meu inventário.

**Why this priority**: Reforça o "Sistema de Fé" exclusivo deste RPG bíblico.

**Independent Test**: Testado adicionando o item ao inventário e verificando a redução passiva no atributo Fé ou pontuação máxima.

**Acceptance Scenarios**:

1. **Given** um personagem com um Símbolo Proibido no inventário, **When** o item permanece ali, **Then** há um debuff ativo na sua Fé.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST implementar lógica de "duas mãos" no `InventoryList` para aplicar dano Versátil, desequipando a mão secundária (escudo/outra arma).
- **FR-002**: O sistema MUST calcular bônus de ataque usando Força ou Destreza baseado na propriedade `Acuidade`.
- **FR-003**: O banco de dados (`itemsDb.ts`) MUST ser atualizado com a adição de "Flechas" na categoria Consumível.
- **FR-004**: O banco de dados MUST ser atualizado com o "Amuleto/Símbolo (Proibido)" aplicando `effects` negativos em Fé.
- **FR-005**: O formulário de Testes (`session_tests`) MUST consultar os itens equipados para impor Desvantagem caso o equipamento exija.
- **FR-006**: Armas de `Distância` MUST ser impedidas de atacar (ou emitir alerta) se a respectiva munição não estiver no inventário do personagem.

### Key Entities

- **Weapon/Equipment Effects**: Precisam de novas chaves como `properties: ["Finesse", "Versatile", "Ammunition", "Thrown"]`.
- **ItemDb**: Novos IDs de itens (e.g. `flechas`, `simbolo_proibido`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos itens descritos nos arquivos `.md` existem no `itemsDb.ts`.
- **SC-002**: A UI de inventário permite escolher empunhadura simples/dupla para armas aplicáveis.
- **SC-003**: A aplicação de "Desvantagem em Furtividade" em armaduras funciona mecanicamente (visível em alertas/UI) e não é apenas um texto estático.
- **SC-004**: Munições são corretamente deduzidas na rolagem ou botão de ataque.

## Assumptions

- O controle de testes e as janelas de ataque estão num estado onde injetar variáveis como "Vantagem/Desvantagem" ou "Atributo Base" é possível com refatorações pontuais.
- As Flechas serão vendidas em pacotes de 20 (assim como as pedras da funda), possuindo um preço similar de 0.5 a 1 SP.
