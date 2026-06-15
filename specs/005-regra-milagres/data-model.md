# Data Model & Mechanics: Regra de Milagres

Esta não é uma aplicação de software, mas as "entidades" da mecânica do jogo se comportam como o modelo de dados deste sistema.

## Entidade: Teste de Milagre (Mecânica)

Quando um personagem clama por um milagre genuíno, segue-se o fluxo:

1. **Julgamento do Mestre**: O Mestre avalia o peso do pedido. É algo grandioso?
2. **Definição da Dificuldade (Modificador de Fé)**:
   - *Pequena Providência*: Modificador 0. (A chance é a Fé atual).
   - *Milagre Moderado*: Modificador -20. (O personagem precisa ter muita fé).
   - *Milagre Extraordinário*: Modificador -50.
3. **A Rolagem (Sorte Divina)**:
   - O Jogador rola **1d100**.
   - **Sucesso**: Resultado for **menor ou igual** a `[Fé Atual] + [Modificador da Dificuldade]`. O milagre ocorre de forma adequada à narrativa.
   - **Falha**: A Vontade Divina negou o pedido ou disse "agora não". O milagre não ocorre e a ação é perdida. Se o pedido for algo egoísta ou vaidoso, a Falha retira pontos de Fé.

## Entidade: Habilidades do Sacerdote (Revisão)

- **Imposição de Mãos**: Bênção de fortificação física.
- **Oração de Proteção**: Incentivo moral que melhora a esquiva.
- **Súplica Curativa**: Prece que fortalece a esperança (restaura HP e Fé).
- **Intervenção Divina Menor**: Rola d100 e testa contra Nível x 2 + Modificador. Permanece similar, mas clarificando que a sorte decide.
- **Intervenção Divina Maior**: Agora não é automática. Deve usar a regra padrão de Milagre (rolagem de d100 modificada) para definir se Deus atende ao clamor catastrófico ou de cura em massa.
