# 04: Aba Itens: consumíveis e munição

**What to build:** A Hotbar ganha a aba Itens com os consumíveis usáveis do jogador e a quantidade de cada um. Tocar num consumível abre o mesmo Cartão das Habilidades, com o texto e o Usar, que consome como o Inventário faz hoje. A munição da arma equipada aparece na aba como um contador.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Aba Itens só com os consumíveis usáveis, cada um com a quantidade; ela some quando não há nada
- [x] Cartão do consumível com Usar, que consome pelo mesmo caminho do Inventário (nenhuma regra muda)
- [x] Contador de munição da arma equipada, com nome acessível ("Flechas: 12")
- [x] O teste da Hotbar cobre a aba Itens, o uso de um consumível e a munição
- [x] E2E: o jogador usa um consumível pela Hotbar
