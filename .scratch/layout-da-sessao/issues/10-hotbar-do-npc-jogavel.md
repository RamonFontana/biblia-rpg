# 10: Hotbar do NPC jogável

**What to build:** O Mestre usa as Habilidades do NPC jogável como um jogador. No turno do NPC, a Barra do Mestre mostra a Hotbar dele: as mesmas abas, o mesmo Cartão e o mesmo Usar com motivo. Fora do turno, um seletor "Agir como: <NPC>" abre essa Hotbar para Reações e para uso fora do combate. Na web, os comandos do Mestre ficam ao lado da Hotbar. O uso grava pelo mesmo caminho de hoje, que já aceita o Mestre como dono do NPC; não há migration de schema.

**Blocked by:** 03, 07, 08

**Status:** ready-for-agent

- [ ] Hotbar do NPC na Barra do Mestre no turno dele
- [ ] Seletor "Agir como: <NPC>" fora do turno, com Reações e uso fora do combate
- [ ] A CD da Habilidade do NPC usa os atributos corrigidos no 07
- [ ] Teste da página da sessão: a Hotbar do NPC aparece no turno dele e pelo seletor
- [ ] E2E: o Mestre usa uma Habilidade do NPC jogável no turno dele
