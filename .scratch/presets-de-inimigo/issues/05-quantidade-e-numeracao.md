# 05: Quantidade e numeração contínua, com o essencial no topo

Status: ready-for-agent
Blocked by: 02
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

O Mestre cria de 1 a 8 inimigos do mesmo Preset de uma vez, no assistente e em "Criar inimigo". Os nomes saem numerados e a contagem continua a da sessão (já há "Bandido do Deserto 1" e "2"? as novas são 3 e 4); um inimigo sozinho e sem homônimo fica sem número. A numeração é uma função pura do motor. O topo do formulário (celular e web) concentra Preset, quantidade e criar; o ajuste fino fica em seções recolhidas. Um E2E cobre o fluxo.

## Acceptance criteria

- [ ] Testes da função de numeração: um sem homônimo, lote, continuação, lacunas, nome com sufixo.
- [ ] Criar 3 do mesmo Preset grava 3 fichas independentes e as põe na sessão (assistente e sessão).
- [ ] Quantidade fora de 1–8 é recusada.
- [ ] E2E: criar "Bandido do Deserto" × 3 e conferir os nomes no banco e na tela; o teste passa por mutação.
- [ ] `npm run check` e `npm run test:e2e` passam.
