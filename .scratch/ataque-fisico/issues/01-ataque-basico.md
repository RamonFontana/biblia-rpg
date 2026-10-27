# 01: Ataque básico de ponta a ponta

**What to build:** no próprio turno e com a Ação livre, o jogador abre o painel "Atacar", escolhe o alvo entre os inimigos, NPCs e aliados do combate e ataca com a arma da mão principal ou desarmado (1 + FOR). Digita o d20 natural; o app soma o atributo (FOR no corpo a corpo, DES com arma de munição, o maior com Acuidade) e a Proficiência só quando a Vocação é proficiente com a arma, com o aviso "Não proficiente". O 20 natural é Acerto Crítico (acerta sempre; o lembrete pede os dados de dano dobrados) e o 1 natural é Falha Crítica (erra sempre). O jogador vê só "Acertou" ou "Errou". No acerto, digita o dano e o app soma o modificador uma vez; o PV do alvo cai de forma atômica e muda em tempo real nos dois navegadores. O ataque marca a Ação. O Mestre recebe o aviso com o d20, o total e a CA, e vê a lista dos últimos ataques no painel do combate. Spec: `../spec.md` (histórias 1 a 21, 30 a 37, 43, 44, 47, 49 e 50).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Motor de ataque puro: atributo por tipo de arma, Proficiência (regra de proficiência de arma levada para o motor), acerto na fronteira da CA, Acerto Crítico, Falha Crítica, lembrete do dano e dano com o modificador uma vez
- [x] Migration com `combat_attacks` (RLS: leitura para quem está na sessão, escrita só pela função) e a função de ataque `SECURITY DEFINER` (ADR 0005: atacante controlado pelo chamador, mesmo combate, turno do atacante, dano atômico, registro); tabela na publicação do Realtime; `gen:types`
- [x] `rls.sql`: atacante no turno aplica o dano e registra; fora do turno, fora do combate, anon e estranho recusados; aliado como alvo funciona; dois ataques seguidos somam; ninguém grava em `combat_attacks` direto
- [x] Serviço de ataque e painel do jogador (alvo, arma, d20, resultado, dano), só no próprio turno, marcando a Ação; aviso e lista de ataques no painel do Mestre
- [x] O `PhysicalRollForm` sai, com as 4 supressões de lint (`npm run lint:prune`)
- [x] `docs/regras-base.md` 6.2 com o Acerto Crítico, a Falha Crítica e a ressalva da Proficiência
- [x] Testes do motor, do serviço, dos componentes e um E2E (acerto com dano nos dois navegadores, 20 natural, ataque a aliado, registro do Mestre), com mutação conferida
- [ ] Migration aplicada na produção, com o autor
