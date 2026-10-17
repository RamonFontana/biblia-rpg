# Os dados são físicos; o app registra o resultado

O jogo é presencial: cada jogador rola os próprios dados na mesa e usa o app no celular como ficha e guia, enquanto o Mestre usa o app como mesa de controle. Por isso o resultado de uma rolagem de jogador (d20, d100, d6 de penalidade, testes de morte) entra no app como um valor digitado, e o motor de regras recebe esse valor como entrada em vez de sorteá-lo. A rolagem virtual existe só como conveniência para quem estiver sem dados.

## Consequences

- O motor do jogo (`src/domain/`) não sorteia o que o jogador rola: recebe o número e aplica a regra. A aleatoriedade injetável (`Rng`) serve só às rolagens que o sistema faz sozinho e à rolagem virtual opcional.
- Toda tela de rolagem precisa aceitar digitação manual; um botão "rolar" é opcional.
