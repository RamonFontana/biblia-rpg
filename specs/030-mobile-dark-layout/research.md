# Research: Mobile & Dark Mode Layout Redesign

## Global Dark Theme Implementation
- **Decision**: Forçar tema dark globalmente no Tailwind e CSS raiz, aplicando o visual da tela de Criação de Personagem.
- **Rationale**: A especificação FR-001 pede "Tema Dark Global". Como o jogo será primariamente escuro para imersão, a melhor abordagem é fixar a cor de fundo do `body` e os textos no `index.css` e utilizar a paleta escura como o padrão (`bg-slate-950` / `text-slate-100`, etc), evitando a necessidade de colocar o prefixo `dark:` em cada componente, ou forçar o `class="dark"` na tag html se a aplicação já estiver configurada para suportar light/dark mode, alterando o default para sempre dark.
- **Alternatives considered**: Manter o prefixo `dark:` em todos os componentes (rejeitado por gerar código verboso), criar um Theming Engine customizado (excessivo para este escopo).

## Responsividade (Mobile Layout)
- **Decision**: Utilizar utilitários do Tailwind (`md:`, `lg:`) para ajustar a exibição. Colapsar dashboards em colunas simples (`flex-col` ou `grid-cols-1`) no formato mobile e expandir em Desktop.
- **Rationale**: Tailwind já é o padrão do projeto e permite implementar os requisitos FR-003 facilmente.
- **Alternatives considered**: CSS Media Queries manuais (rejeitado por desviar do padrão Tailwind).

## Acessibilidade (Touch Targets & Contraste)
- **Decision**: Aplicar `min-h-[44px] min-w-[44px]` (via Tailwind classes como `p-2` ou `min-h-11`) para inputs e botões em views mobile (FR-004 e SC-003). Alterar cores fracas para passar no limite de 4.5:1 (FR-002).
- **Rationale**: Alinha-se diretamente com o WCAG 2.1 Target Size (SC 2.5.5) e Contrast (SC 1.4.3).
