# 03: Hotbar em abas e Cartão de Habilidade

**What to build:** As Habilidades do jogador saem da lista do combate e vão para a Hotbar, embaixo da tela, em abas: Ação, Ação Bônus, Reação, Livre e Passivas. Só aparecem as abas com conteúdo, com a contagem no rótulo, e o botão Dados fica na ponta das abas.

Cada peça mostra o ícone, o nome escrito e os usos ou o custo de Fé. A peça bloqueada fica apagada e a passiva tem borda tracejada. A área das peças tem altura fixa de duas fileiras e rola por dentro.

Tocar, clicar, Enter ou segurar uma peça abre o Cartão de Habilidade logo acima da Hotbar. O Cartão mostra o tipo, o espaço do turno, o custo de Fé, os usos e a recarga, a CD da Habilidade e o TR, os alvos e o texto. O Usar fica dentro dele, desabilitado com o motivo quando bloqueado. Numa Habilidade com efeito, Usar mostra a escolha de alvos dentro do mesmo Cartão. Os espaços do turno (Ação, Ação Bônus, Reação, Movimento) ficam numa faixa acima das abas, só no combate. A Hotbar fica visível fora do combate.

Veredito do protótipo B (branch `prototype/session-layout`). O formato das abas veio do protótipo:

```ts
type Aba = 'action' | 'bonus' | 'reaction' | 'free' | 'itens' | 'passivas';
// grupos = abas com conteúdo, nesta ordem; rótulo = nome + contagem
```

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A Hotbar recebe as Habilidades, o contexto do turno e os usos e devolve o pedido de usar; os usos, a Fé e o espaço do turno são gastos como hoje
- [ ] O motivo do bloqueio vem das funções do motor que já existem (disponibilidade e depois bloqueio do efeito), sem regra nova
- [ ] A aba escolhida se mantém; se ficar vazia, a Hotbar cai na primeira aba com conteúdo; não troca sozinha no combate
- [ ] O Cartão fecha por ✕, Esc, toque fora e troca de aba; o foco entra nele e volta à peça
- [ ] O pressionar e segurar abre o Cartão em 450 ms, com vibração curta onde houver e sem o menu de contexto do sistema
- [ ] Acessibilidade:
  - [ ] as abas são `tablist`/`tab`/`tabpanel` com setas;
  - [ ] o nome acessível da peça é "Golpe Sísmico, Ação, 1 de 1 por combate";
  - [ ] o Cartão é `dialog` com nome;
  - [ ] as peças têm no mínimo 48 px.
- [ ] Motion: o sublinhado da aba desliza, o Cartão sobe, a peça afunda ao usar e os contadores contam; o reduced-motion é testado
- [ ] Teste novo da Hotbar. Cobre:
  - [ ] as abas e a ordem no nível 1 (Guerreiro de Judá) e no nível 20 (Sacerdote de Simeão, caminho B);
  - [ ] os motivos de bloqueio: fora do turno, espaço usado, Reação fora do turno, sem usos, sem Fé, a 0 PV;
  - [ ] abrir o Cartão por clique, Enter e segurar;
  - [ ] Usar chamando o pedido uma vez só;
  - [ ] a aba Passivas sem Usar.
- [ ] `DESIGN.md` recebe as receitas da peça, da aba e do Cartão
- [ ] E2E `ability` e `combat` usam a Habilidade pela Hotbar (aba, Cartão, Usar) no desktop e no `mobile`
