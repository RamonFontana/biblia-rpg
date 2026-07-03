# Resolução de Usabilidade da Munição e Sistema de Comércio

## O Que Foi Feito

1.  **Ajuste no Banco de Itens (`itemsDb.ts`)**:
    *   Renomeei a munição de `Flechas` para `Flecha` (singular) e `Saco de Pedras para Funda` para `Pedra para Funda` (singular).
    *   Atualizei a descrição para indicar que 1 SP (Shekel de Prata) compra 20 unidades. Ex: `Munição para arcos (1 SP = 20 un)`.
    *   Fiz o custo fracionário equivalente (`0.05` para Flecha, `0.025` para Pedras). Assim, comprar 20 na lojinha do Mestre soma 1 SP.

2.  **Melhoria de Usabilidade no Sistema de Trocas (`TradeItemSelector.tsx`)**:
    *   Substituí a interface de seleção de quantidade (que antes usava apenas botões de `+` e `-` que exigiam muitos cliques) por um `<input type="number">`.
    *   Agora, ao comprar da loja ou de outro jogador, você pode simplesmente clicar em "Adicionar", apagar o "1" e digitar diretamente a quantidade desejada (ex: `20`), seja na compra (se você quiser comprar mais unidades da lojinha) ou na venda (se você tiver 15 e quiser vender apenas 5).

## Conclusão

Essa alteração resolve a confusão das caixas e nomes misturados:
- A "Flecha" não é mais um "pacote de flechas que gera 1 flecha". A descrição informa corretamente que o preço original na regra (1 SP) equivale a 20 unidades.
- Agora, tanto o sistema de comércio quanto o sistema de recuperação (com a chance de 50% para quem usar *Gastar* durante o combate) lidam perfeitamente com a lógica de unidade individual e facilitam o processo do usuário poder colocar quantidades grandes com um único input no comércio.
