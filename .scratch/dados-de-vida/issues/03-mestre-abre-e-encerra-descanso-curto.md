# 03: O Mestre abre e encerra o Descanso Curto

**What to build:** o Descanso Curto vira um momento aberto da sessão, num cartão igual nas duas telas ("aberto pelo Mestre", Descansos Curtos restantes no dia). As Habilidades que recarregam no Curto recarregam uma vez por descanso, em cada cliente (ADR 0006); o Mestre recarrega os NPCs jogáveis. Iniciar o Descanso Longo ou avançar o período fecha o Descanso Curto aberto. Sai o aviso do navegador com o PV digitado.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Migration: estado do descanso em `game_sessions` (aberto, identidade, quem abriu, pediram, terminaram) e funções de abrir e encerrar (`SECURITY DEFINER`, `search_path` fixo, revoke de public/anon)
- [x] Cartão "Descanso Curto" nas duas telas
- [x] Recarga das Habilidades uma vez por descanso, também para quem abre o app com o descanso aberto
- [x] Descanso Longo e avanço de período fecham o Descanso Curto aberto
- [x] Testes em `rls.sql` por papel, teste de componente e E2E
