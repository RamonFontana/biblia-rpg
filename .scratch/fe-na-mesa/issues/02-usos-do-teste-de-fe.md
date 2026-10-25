# 02: Usos do Teste de Fé e Pedido Egoísta

**What to build:** ao pedir um Teste de Fé, o Mestre escolhe o uso (Clamor, Tentação ou Testemunho), usa atalhos de Punição 0, −20 e −50 (no Clamor com os nomes Pequena Providência, Milagre Moderado e Milagre Extraordinário) ou digita Misericórdia ou Punição livre, e marca "Pedido Egoísta" no Clamor antes de enviar. O cartão do Teste ativo mostra o uso e a marca. A falha custa Fé conforme o doc: o Clamor só com Pedido Egoísta, a Tentação e o Testemunho sempre (1d6); o resultado mostra se houve perda. Corrige a divergência atual em que toda falha custa 1d6. Spec: `../spec.md` (histórias 1 a 11).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Migration em `session_tests` com o uso (Clamor, Tentação, Testemunho; nulo nos outros Testes) e o Pedido Egoísta (falso por padrão), RLS mantido, `gen:types` e `rls.sql` por papel
- [x] O motor diz se a falha custa Fé pelo uso e pelo Pedido Egoísta
- [x] Diálogo do Mestre: uso só para Fé, atalhos, valor livre, Pedido Egoísta só no Clamor
- [x] O serviço de envio aplica a perda conforme a regra nova; o resultado mostra a perda
- [x] Divergência doc × código registrada como resolvida no ROADMAP
- [x] Testes do motor e do serviço, componentes ajustados e um E2E (Clamor com e sem Pedido Egoísta, Tentação), com mutação conferida
- [ ] Migration aplicada na produção, com o autor
