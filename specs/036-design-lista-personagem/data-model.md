# Data Model: Character List Design

*Nota: Esta feature é puramente visual e não altera o modelo de dados do backend ou banco de dados.*

## UI View Model (CharacterCard Props)

O componente de listagem consome a entidade de Personagem (Character) que já existe no sistema:

- **Name** (string)
- **Tribe** (string) - ex: "Aser", "Judá"
- **Class** (string) - ex: "Batedor", "Guerreiro"
- **PV** (number) - Pontos de Vida
- **CA** (number) - Classe de Armadura
- **Fé** (number) - Nível de Fé (0-100)

As propriedades serão passadas inalteradas para o componente de renderização, que utilizará os estilos Tailwind (como definidos na pesquisa) para apresentá-los.
