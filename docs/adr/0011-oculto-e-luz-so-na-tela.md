# O Oculto e a luz escondem os Retratos só na tela

O mapa esconde inimigos e NPCs de duas formas: o Mestre marca o Retrato como Oculto, e a luz decide o que a Visão de cada personagem alcança. Decidimos que **a posição e o estado de todos os Retratos chegam a todos os aparelhos da sessão, e o motor (`src/domain`) calcula em cada aparelho o que desenhar**. Nada disso é segredo no servidor. É a mesma mesa de amigos dos ADRs 0004 e 0005: o jogo é presencial, o Mestre narra o que cada um vê, e as fichas dos inimigos já são legíveis por qualquer jogador logado.

## Considered Options

- **Calcular a visibilidade no Postgres** e filtrar pelo RLS: a geometria da luz iria para SQL, longe dos testes do motor, e duplicaria a regra.
- **O aparelho do Mestre calcular e gravar "quem vê quem"**: depende do Mestre online, atrasa cada movimento e cria mais uma tabela por personagem.
- **Manter o filtro do NPC simples no servidor e avisar por Broadcast do Realtime**: o Realtime não avisa quem perde o direito de ler a linha, então o NPC ocultado não some ao vivo; o Broadcast resolveria, mas seria o único caso de segredo de verdade num app que não o tem.

## Consequences

- O RLS de `session_npcs` passa a entregar a linha a todo participante da sessão, e a tela filtra o Oculto, como já faz com o NPC jogável. Isso fecha a aresta "NPC escondido que não some em tempo real".
- Quem abrir as ferramentas do navegador vê onde estão os Retratos Ocultos e os que estão no escuro.
- O Oculto vale fora do mapa (iniciativa, feed e alvos); a luz só escurece o mapa.
- Se o app um dia tiver partidas entre desconhecidos, esta decisão deve ser revista com a do ADR 0004.
