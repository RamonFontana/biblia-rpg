# 03: Pan e zoom do mapa

**What to build:** qualquer pessoa explora o Mapa atual: um dedo arrasta, dois dedos ampliam (pinça), na web a roda do mouse amplia e o arrasto move. O mapa respeita a margem do trilho no celular. Sem dependência nova.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Motor do mapa, parte de transformação de vista: escala e deslocamento, conversão tela → mapa e mapa → tela, zoom em torno de um ponto, limites de escala e de pan; testes de unidade (ida e volta, ponto fixo no zoom).
- [ ] Gestos com Pointer Events e CSS transform: um dedo, pinça, roda do mouse e arrasto; `touch-action` correto para não rolar a página.
- [ ] O mapa começa ajustado ao Palco e não esconde nada sob o trilho no celular.
- [ ] Teste de componente dos gestos que dá para simular (roda e arrasto).
- [ ] Testado à mão num iPhone e num Android (registrar no ROADMAP).
