# A tela da sessão tem um Palco central, uma Hotbar e um dock que abre Painéis

A tela da sessão deixa de empilhar tudo numa coluna: a Barra de Status fica fixa no topo, o Palco ocupa o centro, a Hotbar fica embaixo e um dock de ícones, um trilho na borda direita do Palco, abre cada coisa num Painel (bottom sheet no celular, lateral na web, sem cobrir o Palco a partir de `lg`). O Cartão de Habilidade não usa o Painel: sobe acima da Hotbar. Os avisos que pedem ação (Teste, troca, turno, Testes de Morte) continuam por cima de tudo. O motivo é reservar o centro para o mapa (pins, grid e iluminação), que vem logo depois; depois dele, mudar o modelo de navegação mexeria no mapa também.

## Considered Options

- Abas que trocam a tela inteira (Ficha, Combate, Grupo): mais simples, mas não deixam um centro fixo para o mapa.
- Menu radial: visual de jogo, mas ruim para teclado e leitor de tela e difícil de descobrir.
- Dock numa barra embaixo da Hotbar (protótipo A) ou atrás de um botão "Mais" (protótipo B): o autor preferiu o trilho na borda do Palco (protótipo C), que deixa o rodapé só para a Hotbar.

## Consequences

- No celular, o Palco reserva à direita a largura do trilho; o mapa vai herdar essa margem.
- O Mestre usa a mesma moldura: o trilho tem os painéis dele, o combate ganha uma coluna fixa e a Barra do Mestre substitui os botões do cabeçalho.
- O mapa (Onda 6, passo 2) acrescenta o ícone Mapas ao trilho do Mestre, para preparar e mostrar o Mapa atual.
- Os componentes de hoje entram nos Painéis sem mudança; os nomes acessíveis se mantêm, e os E2E ganham o ajudante `openPanel` e um projeto Playwright de celular.
