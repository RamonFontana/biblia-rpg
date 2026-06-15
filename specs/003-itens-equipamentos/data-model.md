# Data Model: Itens e Equipamentos

Este documento define os "contratos" (formatos de tabela) que serão utilizados nos arquivos Markdown para os itens, garantindo padronização.

## 1. Armas (`docs/itens/armas.md`)

Formato de Tabela:
| Arma | Dano | Propriedades | Peso (Opcional) | Preço (SP) |
|---|---|---|---|---|

- **Arma**: Nome do item.
- **Dano**: Dado de rolagem (ex: 1d6) e tipo (cortante, perfurante, concussão).
- **Propriedades**: Keywords baseadas no 5e (Acuidade, Leve, Distância, Duas Mãos, Versátil, etc).
- **Preço**: Valor em Shekels de Prata (SP).

## 2. Armaduras (`docs/itens/armaduras.md`)

Formato de Tabela:
| Armadura | Tipo | Classe de Armadura (CA) | Requisitos / Penalidades | Peso (Opcional) | Preço (SP) |
|---|---|---|---|---|---|

- **Tipo**: Leve, Média, Pesada ou Escudo.
- **CA**: Fórmula de defesa (ex: 11 + Des, 14, +2).
- **Requisitos / Penalidades**: Exigência de Força e/ou Desvantagem em Furtividade.

## 3. Itens Utilizáveis (`docs/itens/utilizaveis.md`)

Formato de Tabela:
| Item | Descrição / Uso | Preço (SP) |
|---|---|---|

- Equipamentos não consumíveis que facilitam a vida dos personagens (cordas, sacos, ferramentas, algemas de bronze, etc.).

## 4. Itens Consumíveis (`docs/itens/consumiveis.md`)

Formato de Tabela:
| Item | Efeito Mecânico / Uso | Duração (se aplicável) | Preço (SP) |
|---|---|---|---|

- Itens que são destruídos ou gastos no uso (rações, tochas, óleos, bálsamos, flechas, pedras de funda).
