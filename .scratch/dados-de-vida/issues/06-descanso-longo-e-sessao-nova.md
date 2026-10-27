# 06: Descanso Longo devolve Dados de Vida e sessão nova Descansada

**What to build:** o Descanso Longo devolve metade dos Dados de Vida gastos, arredondada para cima. A sessão nova devolve todos os Dados de Vida e deixa o personagem Descansado (PV máximo e usos de Habilidade restaurados, `regras-base.md` 6.3).

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Motor: devolução de metade dos gastos (0, 1, 3 e 5 gastos)
- [x] Descanso Longo aplica a devolução
- [x] `fix:` sessão nova restaura PV máximo e usos de Habilidade, com teste do comportamento certo; zera os Dados de Vida gastos
- [x] E2E do Longo e da sessão nova
