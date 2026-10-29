# 08: Mestre na web: trilho e Barra do Mestre

**What to build:** O Mestre ganha a mesma moldura. O trilho tem Jogadores, Inimigos, NPCs, Testes, Descanso, Histórico e Sessão, cada um abrindo um Painel com os componentes de hoje sem mudança.

A Barra do Mestre, embaixo, traz os comandos de hoje com os mesmos nomes acessíveis:
- Solicitar Teste;
- Iniciar/Finalizar Combate;
- Próximo Turno;
- Avançar Tempo;
- Descanso;
- Dados.

Ela substitui os botões do cabeçalho.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Trilho do Mestre com os sete Painéis, com o selo de atenção onde fizer sentido (Testes respondidos, pedido de descanso)
- [ ] Barra do Mestre com os comandos de hoje e os mesmos nomes acessíveis
- [ ] O teste da página da sessão cobre o trilho e a Barra do Mestre
- [ ] As suítes E2E de hoje do Mestre passam, com `openPanel` onde algo mudou de lugar
