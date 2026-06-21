# Quickstart: Mobile & Dark Mode Layout

Para testar as mudanças referentes a esta feature:

1. **Responsividade Mobile:**
   - Inicie a aplicação localmente (`npm run dev`).
   - Abra o navegador (Google Chrome, Firefox, etc.) e pressione F12 para abrir o DevTools.
   - Ative o modo "Device Toolbar" (Ctrl+Shift+M / Cmd+Shift+M).
   - Selecione um dispositivo pequeno, como o iPhone SE (375px) ou Galaxy S8 (360px).
   - Navegue pelo Dashboard do Mestre, Lista de Personagens, Combate e Sessões. Nenhuma tela deve apresentar barra de rolagem horizontal quebrada ou conteúdo cortado.

2. **Testando Touch Targets (Hitboxes):**
   - Com o Device Toolbar ativado no modo touch, clique nos botões (ações, rolar dado, menus). Eles devem ter espaço suficiente para não acionar elementos vizinhos sem querer.

3. **Validação de Contraste e Modo Escuro:**
   - Acesse as telas que possuíam fundo branco. Todas devem estar padronizadas com o tema escuro.
   - Execute o Lighthouse (aba Lighthouse no DevTools) para validar a Acessibilidade (Accessibility). A pontuação de contraste deve estar aprovada (relação 4.5:1 exigida pelo WCAG AA).
