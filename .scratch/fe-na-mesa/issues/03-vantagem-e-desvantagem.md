# 03: Vantagem e Desvantagem nos Testes

**What to build:** ao pedir qualquer Teste, o Mestre marca Normal, Vantagem ou Desvantagem por jogador alvo, com a dica da Fortaleza de cada personagem ao lado do nome. As Desvantagens automáticas entram sozinhas: furtividade com armadura e Abalado em TR de Sabedoria e Carisma. Vantagem e Desvantagem no mesmo Teste se anulam. O jogador vê a modalidade e o porquê, e o lembrete do dado físico ("role dois d100 e use o menor" no Teste de Fé com Vantagem; o maior com Desvantagem; o inverso no d20), e digita só o dado que vale. A Rolagem Virtual rola os dois dados, mostra ambos e usa o que vale. O resultado grava a modalidade aplicada. Spec: `../spec.md` (histórias 12 a 26).

**Blocked by:** 01 (Selo do Estado de Fé: o Abalado automático usa o Estado de Fé)

**Status:** ready-for-agent

- [x] Migration em `session_test_results` com a marca do Mestre, a modalidade aplicada e os dois valores da Rolagem Virtual (o `roll_value` segue o dado que vale), `gen:types` e `rls.sql` por papel
- [x] O motor calcula a modalidade (Mestre, automáticas, anulação) e o dado que vale (invertido no Teste de Fé), e rola dois dados pela `Rng` injetada
- [x] Diálogo do Mestre: escolha por alvo e dica da Fortaleza
- [x] Diálogo do jogador: modalidade, motivo, lembrete do dado físico e Rolagem Virtual com dois dados destacando o que vale
- [x] Rolagem normal continua com um dado só
- [x] Testes do motor (todas as combinações), do serviço, componentes ajustados e um E2E (Teste de Fé com Vantagem pela Rolagem Virtual; Abalado em TR de SAB), com mutação conferida
- [ ] Migration aplicada na produção, com o autor
