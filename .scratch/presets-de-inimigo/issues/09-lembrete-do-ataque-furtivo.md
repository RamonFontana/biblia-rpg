# 09: Lembrete do Ataque Furtivo

Status: ready-for-agent
Blocked by: 03
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

No turno de um inimigo com Ataque Furtivo (Bandido do Deserto, Endemoniado Comum), o combate do Mestre mostra "+1d6 disponível (Vantagem ou aliado a 1,5 m do alvo)" e o botão "usei", que trava o lembrete até o próximo turno desse inimigo. O estado fica no `ability_state` do participante. O 1d6 entra no "Modificar Vida". O ataque do inimigo pelo app está fora do escopo.

## Acceptance criteria

- [ ] Testes do motor: disponível no turno, travado depois do "usei", liberado no próximo turno, sem lembrete em inimigo sem a passiva.
- [ ] O lembrete só aparece para o Mestre.
- [ ] Sem migration; `db diff` vazio.
- [ ] `npm run check` passa; teste manual no combate.
