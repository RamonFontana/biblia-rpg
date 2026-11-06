# 01: Repreensão Divina pede o TR de Carisma e o Mestre vê o lembrete de fuga

Status: done
Blocked by: None (can start immediately)
Spec: `.scratch/repreensao-divina/spec.md`

## What to build

O Sacerdote (nível 2 ou mais) usa a Repreensão Divina pelo app, no turno dele, contra um inimigo. O app gasta os 8 de Fé e o uso por Descanso Curto e deixa o uso pendente com o TR de Carisma e a CD da regra 6.6 (8 + Proficiência + SAB do Sacerdote). O Mestre resolve o TR como nas outras Habilidades: d20 digitado ou Rolagem Virtual, com o bônus fixo de CAR do bloco ou o modificador. Quem falha aparece no resultado e no histórico como "<nome> falhou no TR: foge do combate por 1 min (10 rodadas)", sem Condição aplicada. Quem passa aparece como "passou no TR". Nesta fatia, qualquer inimigo ainda pode ser alvo; o filtro de Endemoniado vem no ticket 02.

O efeito de Habilidade passa a aceitar um lembrete para quem falha, no lugar de aplicar ou tirar Condição. Ele segue o padrão do lembrete das Habilidades de inimigo.

## Acceptance criteria

- [ ] O esquema do efeito aceita "aplica, tira ou lembra". O gate de dados recusa um lembrete sem TR.
- [ ] O efeito da Repreensão Divina no conteúdo tem: alvo um inimigo, TR de CAR e o lembrete de fuga. O texto continua batendo com o `sacerdote.md`.
- [ ] Testes do motor: a frase do uso com o lembrete para quem falha; quem passa não muda.
- [ ] Testes do serviço (Supabase falso): o uso grava o pedido com CAR e a CD 8 + 2 + SAB e gasta 8 de Fé e o uso. Na resolução, quem falha volta como falhou, sem Condição e com o lembrete. O bônus fixo de CAR do bloco vale quando existe.
- [ ] A resolução com Condições vazias para quem falhou é aceita pela função do banco, sem migration. Se exigir migration, parar e perguntar ao autor.
- [ ] `npm run check` passa.
