# 11: Tocha

**What to build:** o jogador acende uma Tocha pela Hotbar, na aba Itens e na aba Livre (Ação Livre), gasta uma Tocha do inventário e passa a iluminar 6 m de Luz plena e mais 6 m de Penumbra em volta do pin, em qualquer mapa. A Tocha acesa aparece para ele. Ela apaga no Descanso Curto, no Descanso Longo ou quando o Mestre a apaga pelo pin; o avanço de período não a apaga, e o jogador não apaga a própria. O Mestre também acende a Tocha de qualquer personagem.

**Blocked by:** 09

**Status:** ready-for-agent

- [ ] Motor: números da Tocha e regras de acender (precisa de Tocha, gasta uma) e apagar; testes de unidade.
- [ ] Migration: estado de Tocha acesa no personagem; função de acender (dono ou Mestre, tira uma Tocha e acende numa transação, recusa sem Tocha) e de apagar (só o Mestre); as funções do Descanso Curto e do Descanso Longo apagam as Tochas da sessão; `revoke execute ... from public, anon`; `gen:types`; `rls.sql` por papel.
- [ ] A Tocha acesa vira Fonte de luz no pin do personagem na cena do mapa.
- [ ] Hotbar: Tocha em Itens e em Livre, com o Cartão de hoje; desabilitada com o motivo quando não há Tocha ou já está acesa; indicação de Tocha acesa.
- [ ] Mestre acende e apaga pelo pin ou pelo cartão.
- [ ] Descrição do item atualizada no conteúdo, `npm run gen:items-seed` e a migration do seed; a divergência da Tocha sai do ROADMAP.
- [ ] E2E: o jogador acende a Tocha e o inventário perde uma.
