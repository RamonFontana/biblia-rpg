<!--
  ══════════════════════════════════════════════════════════
  SYNC IMPACT REPORT
  ══════════════════════════════════════════════════════════
  Version change    : (new) → 1.0.0
  Modified principles: N/A — first ratification
  Added sections    :
    - Principle I   : Fidelidade Bíblica (Sem Magia Arcana)
    - Principle II  : Materialismo Histórico (Sem Itens Mágicos)
    - Principle III : Sistema de Fé como Núcleo
    - Principle IV  : Tribos como Raças
    - Principle V   : A Regra de Levi
    - Principle VI  : Documentação como Fonte de Verdade
    - Section       : Restrições de Cenário
    - Section       : Fluxo de Desenvolvimento
  Removed sections  : N/A
  Templates status  :
    ✅ plan-template.md — sem referências desatualizadas
    ✅ spec-template.md — sem referências desatualizadas
    ✅ tasks-template.md — sem referências desatualizadas
  Follow-up TODOs   :
    - Nenhum placeholder pendente
  ══════════════════════════════════════════════════════════
-->

# RPG Bíblico — Constituição do Projeto

## Core Principles

### I. Fidelidade Bíblica — Sem Magia Arcana

O sistema **NÃO** possui magia arcana de nenhum tipo. Todo e qualquer
efeito sobrenatural no jogo é mediado exclusivamente pelo **Sistema de
Fé**, que representa a conexão do personagem com a Providência Divina.

- Nenhuma classe, item ou habilidade DEVE conceder poderes arcanos.
- Milagres NÃO são automáticos; dependem de rolagem de dados com
  o valor de Fé como modificador.
- Pedidos egoístas ou pecaminosos que falham DEVEM retirar pontos
  de Fé; pedidos alinhados à proteção do povo resultam apenas em
  silêncio divino (sem penalidade).

**Rationale**: O cenário bíblico trata o sobrenatural como intervenção
divina, não como recurso controlável pelo jogador.

### II. Materialismo Histórico — Sem Itens Mágicos

Todas as armas, armaduras e equipamentos do jogo DEVEM pertencer ao
período da **Idade do Bronze/Ferro**. Não existem itens mágicos,
encantamentos ou artefatos sobrenaturais.

- A Classe de Armadura (CA) é determinada exclusivamente por
  armaduras e escudos da época.
- Nenhum equipamento DEVE conceder bônus sobrenaturais.
- Materiais permitidos: bronze, ferro, couro, madeira, pedra, osso.

**Rationale**: Coerência histórica e temática com o período bíblico;
o poder vem da Fé, não de objetos.

### III. Sistema de Fé como Núcleo

A **Fé** (barra de 0 a 100) é a mecânica central que substitui
a magia tradicional e governa a saúde espiritual do personagem.

- Todo personagem DEVE possuir 1 Fortaleza e 1 Tentação
  definidas na criação.
- A tabela de degradação (Inabalável → Comum → Abalado →
  Vulnerável → Ruptura) DEVE ser respeitada em todas as sessões.
- Fé 0 (Ruptura) DEVE resultar em tragédia automática, a menos
  que o grupo realize ato massivo de consagração liderado por
  um Sacerdote antes do nascer do sol.
- Recuperação de Fé segue exclusivamente os métodos definidos:
  Devocional (1d4 via Sacerdote) e Eventos de História (20–30 pts).

**Rationale**: A Fé é o que torna este RPG único; ela DEVE ser
tratada como a mecânica mais importante do sistema.

### IV. Tribos como Raças

As **12 Tribos de Israel** funcionam como as raças do sistema.
Cada tribo possui identidade mecânica própria.

- Cada tribo DEVE conceder 2 passivas iniciais no nível 1.
- No nível 4, o jogador DEVE escolher entre 2 Caminhos de
  especialização (A ou B).
- A progressão segue marcos nos níveis 1, 4, 8, 12, 16 e 20.
- Nível 20 concede uma Habilidade Suprema (1x/semana).
- Toda tribo DEVE ter sua ficha documentada em
  `docs/tribos/<tribo>.md`.

**Rationale**: As tribos são a identidade cultural e mecânica
dos personagens; cada uma DEVE ser distinta e equilibrada.

### V. A Regra de Levi

Qualquer personagem de qualquer Tribo PODE escolher a classe
Sacerdote/Sábio. No entanto, jogadores que escolhem a **Tribo
de Levi** são **OBRIGADOS** a pertencer à classe Sacerdote/Sábio.

- Esta regra é inviolável e DEVE ser aplicada na criação de
  personagem.
- Nenhuma exceção, homebrew ou variante DEVE ignorar esta
  restrição.

**Rationale**: Fidelidade ao papel histórico-bíblico dos Levitas
como a tribo sacerdotal de Israel.

### VI. Documentação como Fonte de Verdade

Toda mecânica, regra, classe, tribo e balanceamento do jogo
DEVE estar documentada na pasta `docs/` antes de ser considerada
oficial.

- `docs/regras-base.md` é o documento autoritativo para
  mecânicas gerais.
- `docs/tribos/README.md` é o índice autoritativo de tribos.
- `docs/tribos/<tribo>.md` contém a ficha completa de cada tribo.
- Nenhuma regra DEVE existir apenas em código ou em conversa;
  ela DEVE ser formalizada em documentação.

**Rationale**: A documentação é o contrato entre o design do
jogo e qualquer implementação futura (app, VTT, site).

## Restrições de Cenário

O RPG Bíblico opera sob restrições rígidas que DEVEM ser
respeitadas em toda criação de conteúdo:

- **Período**: Idade do Bronze / Idade do Ferro.
- **Sobrenatural**: Exclusivamente via Sistema de Fé.
- **Tecnologia**: Sem pólvora, sem mecânicas modernas.
- **Classes (Vocações)**: Guerreiro, Batedor, Caçador/Nômade,
  Sacerdote/Sábio.
- **Atributos**: FOR, DES, CON, INT, SAB, CAR (padrão D&D 5e).
- **Base mecânica**: Adaptação do D&D 5e, com modificações
  documentadas no `regras-base.md`.

Qualquer novo conteúdo (NPCs, aventuras, encontros, itens) DEVE
ser verificado contra estas restrições antes de ser incorporado.

## Fluxo de Desenvolvimento

O projeto segue um fluxo incremental de design de RPG:

1. **Documentar primeiro**: Toda regra ou mecânica DEVE ser escrita
   em `docs/` antes de qualquer implementação.
2. **Revisar consistência**: Novas regras DEVEM ser validadas contra
   os princípios desta constituição.
3. **Iterar abertamente**: O sistema está em construção ativa;
   mudanças são bem-vindas desde que documentadas e versionadas.
4. **Planaridade**: Manter o sistema simples e acessível; evitar
   complexidade desnecessária que afaste novos jogadores.

> **Nota do autor**: "Ainda vamos melhorar, mas a base é essa."
> Esta constituição DEVE evoluir conforme o sistema amadurece.

## Governance

Esta constituição é o documento de mais alta autoridade no projeto.
Toda decisão de design, conteúdo e implementação DEVE estar
alinhada com os princípios aqui declarados.

### Emendas

- Qualquer alteração nos Core Principles DEVE ser documentada com
  justificativa e registrada no Sync Impact Report.
- Versão segue **Semantic Versioning**:
  - **MAJOR**: Remoção ou redefinição de princípio existente.
  - **MINOR**: Adição de novo princípio ou seção material.
  - **PATCH**: Clarificações, correções de redação.

### Compliance

- Todo PR ou revisão DEVE verificar conformidade com esta
  constituição.
- O arquivo `AGENTS.md` na raiz do projeto DEVE refletir os
  princípios desta constituição.
- Complexidade adicional DEVE ser justificada explicitamente.

**Version**: 1.0.0 | **Ratified**: 2026-06-14 | **Last Amended**: 2026-06-14
