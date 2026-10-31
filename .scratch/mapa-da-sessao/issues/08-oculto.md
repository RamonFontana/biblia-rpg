# 08: Oculto

**What to build:** o Mestre marca qualquer inimigo, NPC jogável ou NPC simples como Oculto pelo pin ou pelo cartão, e o Retrato some da tela dos jogadores e do espectador: no mapa, na faixa de iniciativa, no feed do combate e na lista de alvos do Ataque. O NPC ocultado some ao vivo. O inimigo posto no mapa pela primeira vez entra Oculto. O Mestre vê os Ocultos translúcidos e marcados e os revela com um toque. Na tela, "escondido" vira "Oculto".

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Migration: a leitura de `session_npcs` passa a entregar a linha a todo participante da sessão (ADR 0011); `rls.sql` atualizado.
- [ ] O Oculto vale por Retrato na sessão, usando a visibilidade que inimigo, NPC jogável e NPC simples já têm; gravar o primeiro pin de um inimigo na sessão o deixa Oculto.
- [ ] A cena do mapa e as listas de iniciativa, feed e alvos filtram o Oculto para jogador e espectador; testes de unidade da cena.
- [ ] Rótulos "escondido" viram "Oculto"; os nomes acessíveis usados no E2E são atualizados.
- [ ] Remove a aresta "NPC escondido em tempo real" do ROADMAP.
- [ ] E2E: o inimigo posto no mapa não aparece para o jogador até ser revelado; o NPC ocultado some sem recarregar.
