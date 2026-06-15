# Research: Itens e Equipamentos

**Feature**: 003-itens-equipamentos

## Decisões Tomadas

### 1. Estrutura de Documentos de Itens
- **Decision**: Modularizar os itens em quatro arquivos distintos dentro de `docs/itens/` (`armas.md`, `armaduras.md`, `utilizaveis.md`, `consumiveis.md`).
- **Rationale**: A pedido do usuário. Além disso, evita que o `regras-base.md` fique inchado com tabelas de equipamento gigantes no futuro.
- **Alternatives considered**: Manter tudo no `regras-base.md` (rejeitado pelo pedido).

### 2. Validação Histórica
- **Decision**: Manter as armas e materiais alinhados à Idade do Bronze/Ferro (bronze, ferro incipiente, madeira, pedra, osso).
- **Rationale**: Princípio Constitucional II exige Materialismo Histórico.
- **Alternatives considered**: N/A, é obrigação.

### 3. Integração com Regras Existentes
- **Decision**: As tabelas manterão o formato do D&D 5e: Dano, Propriedades, Peso (se necessário) e Custo (em SP - Shekels de Prata).
- **Rationale**: O sistema base já introduziu o custo em SP e as propriedades como Acuidade, Distância, etc.
- **Alternatives considered**: Criar um sistema novo de propriedades (rejeitado por ir contra a simplicidade / planaridade proposta no `regras-base.md`).
