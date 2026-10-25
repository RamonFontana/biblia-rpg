# 04: Inspiração

**What to build:** o personagem Inabalável tem Inspiração uma vez por dia da sessão. A ficha mostra "Inspiração disponível"; o jogador a usa num Teste pedido pelo Mestre (o Teste ganha Vantagem, que anula uma Desvantagem) ou marca "usei a Inspiração" na ficha para qualquer outra rolagem da mesa. No Teste, ela só conta quando o resultado é enviado. Ela some enquanto o personagem não está Inabalável e volta no dia novo da sessão. O Mestre vê no cartão do jogador se a Inspiração está disponível ou usada hoje. Spec: `../spec.md` (histórias 37 a 44).

**Blocked by:** 01 (Selo do Estado de Fé), 03 (Vantagem e Desvantagem nos Testes)

**Status:** ready-for-agent

- [ ] Migration em `characters` com o dia da sessão em que a Inspiração foi usada, `gen:types` e `rls.sql` (o dono grava a própria ficha)
- [ ] O motor diz se a Inspiração está disponível (Inabalável e não usada no dia atual) e a modalidade conta a Inspiração usada
- [ ] Diálogo do jogador: "usar Inspiração" quando disponível; o envio grava a Inspiração usada no resultado e o dia na ficha
- [ ] Ficha: estado da Inspiração e botão "usei"; cartão do Mestre: disponível ou usada hoje
- [ ] O dia novo devolve a Inspiração sem zerar nada
- [ ] Testes do motor e do serviço, componentes ajustados e um E2E (usar no Teste, sumir, voltar no dia novo), com mutação conferida
- [ ] Migration aplicada na produção, com o autor
