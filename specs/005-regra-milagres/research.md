# Research & Decisions: Regra de Milagres

Este documento resolve as questões de design mecânico para a regra de milagres solicitada na especificação.

## 1. Mecânica Base para Milagres

**Decision**: O jogador envolvido (que fez o clamor) rola um d100. O alvo da rolagem é tirar um valor **menor ou igual à sua Fé atual** modificada pela Dificuldade estipulada pelo Mestre.

**Rationale**: O sistema de Fé já utiliza uma escala de 0 a 100. Ao invés de criar uma nova mecânica d20 complexa, usar o próprio valor da Fé como "porcentagem de chance de milagre" faz com que a Barra de Fé seja extremamente valiosa em momentos de crise.
- Quem define a dificuldade? O Mestre.
- Qual a Dificuldade? O mestre aplica um redutor temporário no limite do jogador.
  - Exemplo: Milagre Menor (Água da rocha) -> -0 na Fé para o teste.
  - Milagre Moderado (Cura instantânea de veneno mortal) -> -20 na Fé para o teste.
  - Milagre Maior (Abrir um mar, chuva de fogo) -> -50 na Fé para o teste.
- Quem rola o dado? O jogador que fez a oração.

**Alternatives considered**: 
- Rolar 1d20 + Sabedoria contra CD (15, 20, 25). Rejeitado porque desconecta a chance do milagre do valor exato da barra de Fé de 0-100 (embora pudesse dar bônus como +1 ou -1, rolar d100 contra a barra atual é mais direto e dramático).

## 2. Revisão da Vocação de Sacerdote

**Decision**: Alterar descrições para indicar que os efeitos são de "Incentivo" e "Fortificação do Espírito" (bênçãos), não poderes mágicos ativados à vontade. A habilidade de "Intervenção Divina Maior" deve exigir rolagem (removendo a garantia de "Não há necessidade de rolar").

**Rationale**: Cumpre com o critério de sucesso SC-002 e a User Story 2. O Sacerdote não é um mago, ele é um intercessor que possui ritos abençoados, mas milagres grandiosos dependem da Vontade Divina.
