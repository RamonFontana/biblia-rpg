# 01: Moldura do jogador com trilho e Painel

**What to build:** A tela do jogador deixa de empilhar tudo numa coluna. Ela ganha a moldura do ADR 0009: Barra de Status no topo, Palco no centro, Hotbar embaixo (ainda vazias, só o lugar) e o trilho de ícones na borda direita do Palco. O trilho tem Ficha, Inventário, Grupo, Histórico e Descanso, e cada ícone abre um Painel: bottom sheet com arrasto abaixo de `md`, por cima do Palco de `md` a `lg` e ao lado do Palco a partir de `lg`.

Os componentes de hoje entram nos Painéis sem mudança:
- Ficha: a ficha;
- Grupo: a lista de participantes;
- Combate: a visão de combate do jogador.

Um selo âmbar marca o ícone que pede atenção (descanso aberto, pedido recusado, troca pendente). Os avisos que pedem ação (Teste, troca, turno, Testes de Morte) continuam por cima de tudo.

Spec: `.scratch/layout-da-sessao/spec.md`, que se apoia nos ADRs 0008 e 0009.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Dependência `motion` (aprovada no ADR 0008); a configuração global respeita o "reduzir movimento" do usuário
- [ ] Painel em `ui/` sobre o Dialog do Radix, com os pontos de quebra de cima:
  - [ ] dois pontos de parada (meia altura e tela cheia);
  - [ ] fecha por arrasto, botão, toque fora e Esc;
  - [ ] abrir outro Painel troca o conteúdo;
  - [ ] abre com uma mola curta.
- [ ] Trilho como `nav` "Painéis", com ícones de 48 px de nome acessível; a barra de baixo respeita `env(safe-area-inset-bottom)`
- [ ] Teste curto do Painel, como os outros de `ui/`: abre, fecha por botão e Esc, tem nome acessível e troca de conteúdo
- [ ] O teste da página da sessão cobre o trilho do jogador, o Painel que cada ícone abre e os avisos fora dos Painéis
- [ ] Ajudante `openPanel(page, nome)` no suporte de UI dos E2E; as suítes de hoje passam com os mesmos nomes acessíveis
- [ ] Projeto Playwright `mobile` (`devices['Pixel 7']`) rodando `session`, `ability` e `combat`
- [ ] `DESIGN.md` ganha a seção da tela da sessão (moldura, trilho, Painel); `check:palette` passa
- [ ] O autor testa o arrasto do bottom sheet num iPhone pelo preview da Vercel. Se falhar, a decisão do ADR 0008 reabre
