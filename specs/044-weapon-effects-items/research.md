# Research: 044-weapon-effects-items

## Decision 1: Gatilho de Ativação do Efeito de Arma

**Decision**: Natural 18+ no d20 (~15% de chance por ataque)

**Rationale**: 
- 15% de chance cria momentos épicos sem tornar a mecânica opressora.
- Alinhado ao D&D 5e onde efeitos de armas geralmente requerem acertos especiais ou críticos.
- Natural 18+ é simples de verificar — o sistema já recebe o `attackRoll` no `PhysicalRollForm`.
- Para verificar "natural 18+", o formulário precisa de um campo separado ou o sistema precisa inferir o dado natural do total. Como o sistema é híbrido (rolagem física), o jogador informa o total (d20 + mod). O mestre pode verificar visualmente, mas o sistema pode pedir o valor do d20 natural como campo opcional.

**Alternatives considered**:
- Todo acerto com Teste de Resistência (alvo faz rolagem): Mais fiel ao D&D 5e, mas exige mais cliques e rolagens, atrasando o fluxo.
- Apenas em Crítico (Natural 20): Muito raro (5%), torna o efeito quase irrelevante.
- Configurável pelo Mestre: Complexidade excessiva para o MVP; pode ser adicionado depois.

## Decision 2: Escopo do Efeito — Por Instância (`character_items`)

**Decision**: Os efeitos ofensivos são armazenados por instância, na tabela `character_items`.

**Rationale**:
- Coerente com o cenário: "esta espada foi untada com veneno" é diferente de "todas as espadas causam veneno".
- O campo `custom_condition_resistances` já existe em `character_items` (resistências de armaduras). Um novo campo `weapon_effects` seguirá o mesmo padrão.
- A coluna `effects` da tabela `items` continua com dados base da arma (slot, damageDie, weaponCategory). Efeitos ofensivos ficam em `character_items`.
- NÃO haverá campo `conditionResistances` em armas. Resistências a condições são exclusivas de armaduras/escudos/elmos. Armas terão apenas `weapon_effects` (efeitos ofensivos que a arma causa).

**Alternatives considered**:
- Global (tabela `items`): Mais simples, mas inflexível — todas as cópias teriam o mesmo efeito.
- Ambos (global + override): Complexidade desnecessária para o MVP.

## Decision 3: Dados das Novas Armas de Duas Mãos

**Decision**: Padrão D&D 5e

| Arma | Dano | Tipo de Dano | Categoria | Preço (SP) | Propriedades |
|------|------|-------------|-----------|-----------|-------------|
| Espada Grande de Ferro | 2d6 | cortante | Marcial | 50 | Duas mãos, Pesada |
| Martelo de Guerra | 2d6 | concussão | Marcial | 50 | Duas mãos, Pesada |
| Clava Grande | 1d10 | concussão | Simples | 5 | Duas mãos, Pesada |

**Rationale**: Valores padrão D&D 5e, amplamente balanceados e testados. A Clava Grande como arma Simples dá uma opção de duas mãos acessível a todas as vocações.

## Decision 4: Componentes UI (shadcn/ui)

**Decision**: Usar componentes shadcn/ui já existentes no projeto.

**Rationale**:
- O projeto já utiliza `Dialog`, `DropdownMenu`, `Select`, `Badge`, `Button`, `Card`, `Tooltip` do shadcn/ui.
- O dropdown de resistências customizadas em `InventoryList.tsx` (linhas 152-183) usa `DropdownMenuCheckboxItem` — será o padrão para o novo dropdown de efeitos de arma.
- Pode ser necessário adicionar o componente `Popover` do shadcn se ainda não estiver instalado.

## Decision 5: Diferenciação entre Resistências (Armaduras) e Efeitos (Armas)

**Decision**: São mecânicas COMPLETAMENTE separadas.

| Aspecto | Resistência (Armaduras) | Efeito Ofensivo (Armas) |
|---------|------------------------|------------------------|
| **Onde fica** | `conditionResistances` no item + `custom_condition_resistances` no `character_items` | Novo campo `weapon_effects` no `character_items` |
| **O que faz** | Protege o portador contra condições recebidas | Faz a arma causar condições no alvo |
| **Níveis** | 1-4 (Vantagem → Imunidade) | Sem níveis — é binário (causa ou não, baseado no gatilho) |
| **Quem aplica** | Automático pelo `combatEngine` ao receber condição | O mestre configura; ativação baseada no gatilho (nat 18+) |
| **Tipos de item** | Armaduras, Escudos, Elmos | Armas (corpo a corpo e distância) |

**IMPORTANTE**: Armas NÃO devem exibir o botão de "Resistências" (ShieldPlus) que aparece no `InventoryList.tsx`. Esse botão é exclusivo para armaduras/escudos/elmos. O novo botão de "Efeitos de Arma" (ex: ícone Zap/Flame) deve aparecer APENAS em itens do tipo "Arma".
