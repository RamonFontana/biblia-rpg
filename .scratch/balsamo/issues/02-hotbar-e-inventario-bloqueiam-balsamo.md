# 02: Hotbar e Inventário bloqueiam o Bálsamo fora do Descanso Curto

**What to build:** fora do Descanso Curto (e nas outras razões de bloqueio), o Bálsamo aparece bloqueado na aba Itens da Hotbar e no Inventário, com o motivo ("Só no Descanso Curto"). Tocar no item na Hotbar abre o Cartão com o motivo; com o Descanso aberto e sem bloqueio, o Usar do Cartão abre o Painel Descanso sem gastar nada. No Inventário, dentro do Descanso, o botão fica desabilitado com "Use no painel Descanso". O caminho genérico que consome o Bálsamo sem curar deixa de existir.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Hotbar: Bálsamo bloqueado com motivo; Usar do Cartão leva ao Painel Descanso
- [ ] Inventário: botão desabilitado com motivo
- [ ] Caminho genérico de consumir não trata mais itens de uso só no Descanso; teste de caracterização de `consumables` atualizado em commit `fix:` separado
- [ ] Testes de componente (`PlayerHotbar`, inventário) e E2E: ao encerrar o Descanso o item volta bloqueado
- [ ] `npm run check` verde
