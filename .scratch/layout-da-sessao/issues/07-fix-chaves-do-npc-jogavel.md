# 07: fix: chaves de atributo e CA do NPC jogável

**What to build:** O NPC jogável passa a ter modificadores, CA e CD da Habilidade certos. Hoje ele é gravado com chaves de atributo em inglês (`strength`…) e com a CA em `stats`, o que dá modificadores 0, CA 10 e uma CD da Habilidade errada. As fichas de NPC que já existem são convertidas.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Primeiro, um teste de caracterização de como o NPC é gravado hoje
- [x] A gravação passa a usar `for/des/con/int/sab/car` e não grava mais a CA em `stats`, porque a CA vem do equipamento
- [x] Teste de que o NPC tem modificadores, CA e CD da Habilidade certos
- [x] Migration de dados que converte as fichas de NPC existentes, testada no `npm run test:rls-db`; aplicar na produção pede a confirmação do autor
- [x] Commit `fix:` separado
