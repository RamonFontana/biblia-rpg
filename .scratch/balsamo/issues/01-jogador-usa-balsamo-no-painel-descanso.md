# 01: O jogador usa o Bálsamo no Painel Descanso

**What to build:** com o Descanso Curto aberto, o jogador vê no Painel Descanso, ao lado dos Dados de Vida, o cartão "Bálsamo" com a quantidade e o dado a rolar (1d4, subindo com a Qualidade). Digita o resultado da mesa (ou usa o dado virtual), o app cura esse valor sem passar do PV máximo e sem CON, acorda quem estava Estável, grava o PV e só então gasta um Bálsamo. O catálogo declara, como dado do item, que ele só vale no Descanso Curto. Bloqueios: Descanso fechado, Morto, Morrendo, PV cheio e sem Bálsamo, com o motivo visível. Spec: `.scratch/balsamo/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Marcador "só no Descanso Curto" no efeito do Bálsamo, validado pelo esquema; seed e migration de itens regerados (`npm run gen:items-seed`)
- [x] Motor puro: dado efetivo com Qualidade, validação do resultado (1 e N dados), cura limitada pelo PV máximo sem CON, razões e mensagens de bloqueio, com testes
- [x] Cartão "Bálsamo" no Painel Descanso: resultado digitado, dado virtual, mensagem de cura (PV antes → depois), recusa fora da faixa
- [x] Grava o PV (Estável acorda) e depois consome o item; se o consumo falhar, mostra erro e ressincroniza
- [x] Mais de um Bálsamo no mesmo Descanso; Dados de Vida e Bálsamo se somam
- [x] Teste de componente (precedente: `ShortRestCard`) e E2E: Mestre abre o Descanso, jogador usa, PV sobe e quantidade cai
- [x] `npm run check` verde
