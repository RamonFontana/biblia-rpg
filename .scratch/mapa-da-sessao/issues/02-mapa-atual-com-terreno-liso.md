# 02: Mapa atual com terreno liso

**What to build:** o Mestre abre o novo Painel **Mapas** no trilho, soma um terreno liso da Biblioteca de mapas (areia, pedra, campo, piso de casa) com nome e tamanho em colunas × linhas, prepara qualquer mapa da sessão só para ele e toca "Mostrar aos jogadores". O Palco dos jogadores e do espectador troca ao vivo para o Mapa atual, com o grid de Quadrados de 1,5 m, ajustado à tela. O Mestre pode voltar à cena sem mapa, e aí todos veem os Retratos de hoje.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Biblioteca de mapas como conteúdo validado por zod (id estável, nome, tipo, textura, licença), coberta pelo gate de dados; terrenos lisos sem arquivo de imagem.
- [x] Motor do mapa, parte de grid: Quadrado de 1,5 m, distância com diagonal = 1, metros, encaixe no centro do Quadrado, limites de 5 a 60 por lado; testes de unidade.
- [x] Migration: mapas da sessão (referência à Biblioteca ou, no futuro, a um mapa do Mestre; nome, colunas, linhas, linhas do grid ligadas, Ambiente fixado nulo, ordem) e a coluna do Mapa atual na sessão, com RLS (Mestre escreve, participantes leem) e Realtime; `gen:types`; guarda da publicação atualizado.
- [x] `rls.sql` cobre os mapas da sessão e o Mapa atual por papel.
- [x] Painel Mapas no trilho do Mestre (ADR 0009): somar terreno (20×15 por padrão), renomear, remover da sessão, ligar e desligar as linhas do grid, preparar, mostrar, voltar à cena; mostra qual é o Mapa atual e qual está em preparo. O preparo fica só na tela do Mestre.
- [x] Palco: com Mapa atual mostra o mapa em SVG com o grid; sem ele, os Retratos de hoje; recarregar a página cai no Mapa atual; o nome do mapa é anunciado ao leitor de tela.
- [x] E2E `e2e/map.spec.ts` (também no projeto `mobile`): o Mestre soma um terreno e o mostra, e o jogador vê o Palco trocar sem recarregar.
