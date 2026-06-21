# Feature Specification: Mobile & Dark Mode Layout Redesign

**Feature Branch**: `030-mobile-dark-layout`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "ajuste erros de contraste e configure para mobile o projeto. Se possivel altere tudo para deixar mais dar como a criação de personagem. Mexa no design e layuot"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acessibilidade e Contraste (Priority: P1)

Usuários devem poder ler e interagir com a interface do aplicativo sem dificuldades causadas por baixo contraste, em todas as telas, mas especialmente durante o combate e a visualização de fichas de personagens.

**Why this priority**: Acessibilidade e legibilidade são fundamentais para a usabilidade do sistema. Contraste ruim impede o uso adequado.

**Independent Test**: Pode ser testado independentemente verificando as proporções de contraste entre as cores de texto e de fundo (WCAG) nas telas principais.

**Acceptance Scenarios**:

1. **Given** um usuário navegando pela interface principal, **When** ele tenta ler textos em botões ou painéis, **Then** as cores do texto e fundo possuem contraste adequado, facilitando a leitura.
2. **Given** o usuário visualizando elementos do combate, **When** ele confere seus atributos e equipamentos, **Then** as informações são destacadas sem cansar a vista.

---

### User Story 2 - Experiência Mobile Completa (Priority: P1)

O sistema deve estar totalmente responsivo, funcionando perfeitamente em dispositivos móveis. A experiência do mestre e dos jogadores deve se adaptar ao tamanho reduzido de tela, agrupando menus ou colapsando colunas quando necessário.

**Why this priority**: Mesas presenciais frequentemente contam com jogadores e mestres utilizando seus celulares durante o jogo.

**Independent Test**: Pode ser testado redimensionando o navegador ou abrindo o sistema num dispositivo móvel e usando todas as funções principais sem quebra de layout.

**Acceptance Scenarios**:

1. **Given** um usuário num celular, **When** ele abre o dashboard de combate, **Then** o layout se adapta numa coluna única, evitando rolagem horizontal desnecessária.
2. **Given** o mestre do jogo controlando NPCs num tablet ou celular, **When** ele expande as ações, **Then** os botões têm tamanho adequado para o toque (touch-friendly).

---

### User Story 3 - Tema Dark Global (Priority: P2)

O design global de toda a aplicação deve seguir a identidade visual sombria ("dark mode") já estabelecida na tela de Criação de Personagem.

**Why this priority**: Traz imersão temática e reduz o cansaço visual, unificando a estética da aplicação.

**Independent Test**: Navegar por todas as páginas (Dashboard, Combate, Personagem) para garantir que nenhuma página fuja do padrão escuro e das cores temáticas.

**Acceptance Scenarios**:

1. **Given** a aplicação configurada, **When** o usuário acessa as telas da sessão e painéis, **Then** as janelas e fundos seguem tons escuros consistentes com a tela de criação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST usar uma paleta de cores global que estabeleça o modo escuro como padrão, semelhante à criação de personagem.
- **FR-002**: O sistema MUST garantir taxa de contraste de pelo menos 4.5:1 (WCAG AA) para textos em relação aos seus fundos.
- **FR-003**: O layout de todas as páginas MUST ser responsivo, exibindo os elementos adequadamente para resoluções de telas móveis (ex: 320px a 768px).
- **FR-004**: Menus e botões MUST ser adaptados para interação via toque (hitboxes maiores, espaçamento adequado).
- **FR-005**: Tabelas e grids complexos (como a lista de equipamentos) MUST utilizar scroll horizontal próprio ou reestruturar-se em formato de cards quando vistos no mobile.

### Key Entities

- **UI Theme**: Tokens de design, variáveis de cor, espaçamentos e fontes.
- **Layout Grid**: Estruturas responsivas de containers e alinhamentos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O projeto alcança uma pontuação de 100% de Acessibilidade no Lighthouse (ou semelhante) devido a melhorias de contraste.
- **SC-002**: Nenhuma quebra de quebra de página ou "overflow" horizontal ocorre no viewport de 360px de largura.
- **SC-003**: Os botões e campos de interação possuem pelo menos 44x44 CSS pixels de tamanho em dispositivos móveis.
- **SC-004**: O usuário consegue utilizar as ferramentas da sessão inteira pelo celular.

## Assumptions

- A tela atual de Criação de Personagem já serve como guia e "source of truth" para a paleta Dark a ser estendida para as outras telas.
- As mudanças são primariamente de interface gráfica (CSS, Tailwind, componentes layout React) e não alteram a lógica de negócios e regras do RPG por baixo da interface.
