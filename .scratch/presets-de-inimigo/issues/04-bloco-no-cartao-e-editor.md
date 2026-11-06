# 04: Bloco no cartão do Retrato e editor de ataques e detalhes

Status: ready-for-agent
Blocked by: 02
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

O Mestre toca no Retrato (Palco) ou no pin (mapa) de um inimigo e vê uma seção "Bloco" com ataques (bônus, alcance, dano, tipo), deslocamento, perícias, sentidos, ND e passivas em texto. Só o Mestre vê; os jogadores continuam vendo o que veem hoje. O formulário ganha as seções recolhidas Ataques (lista editável) e Detalhes (deslocamento, perícias, sentidos, ND/XP, tipo e contexto em texto), mais imunidades e bônus de TR. Funciona no celular e na web, seguindo `docs/DESIGN.md`.

## Acceptance criteria

- [ ] O cartão do inimigo mostra o Bloco ao Mestre e não o mostra ao jogador nem ao espectador (teste de comportamento).
- [ ] Inimigo sem bloco (criado do zero ou antigo) mostra o cartão como hoje, sem seção vazia.
- [ ] O Mestre edita ataques e detalhes no formulário; o que ele edita é o que o cartão mostra.
- [ ] Layout conferido no celular e na web; paleta passa em `npm run check:palette`.
- [ ] `npm run check` passa.
