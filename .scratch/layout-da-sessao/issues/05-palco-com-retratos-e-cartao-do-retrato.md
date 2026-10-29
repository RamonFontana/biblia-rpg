# 05: Palco com Retratos e o cartão do Retrato

**What to build:** O Palco do jogador mostra os Retratos de quem está na cena: o grupo, os NPCs visíveis e os inimigos em combate. Esses Retratos serão os pins do mapa. Tocar num Retrato abre o cartão dele num Painel, com PV, Condições, Negociar e Atacar. Esse cartão absorve a lista de participantes e o menu de contexto de token de hoje. No celular, o Palco reserva à direita a largura do trilho, para que nenhum Retrato fique embaixo dele. Uma marca d'água "Mapa" reserva o espaço do mapa.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Retratos do grupo, dos NPCs visíveis e dos inimigos em combate, cada um com nome acessível
- [x] Cartão do Retrato com PV, Condições, Negociar e Atacar, usando os fluxos de hoje (troca e ataque)
- [x] A lista de participantes e o menu de token deixam de aparecer à parte, e os testes de componente deles continuam passando
- [x] No celular, a margem do trilho garante que nenhum Retrato fique coberto
- [x] O delta de dano ou de cura flutua do Retrato; o reduced-motion é testado
- [x] E2E `trades` e `attack` abrem a troca e o ataque pelo cartão do Retrato
