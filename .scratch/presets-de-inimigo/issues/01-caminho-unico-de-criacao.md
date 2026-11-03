# 01: Um só caminho para criar a ficha de inimigo

Status: ready-for-agent
Blocked by: None (can start immediately)
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

Prefatoração. Hoje o assistente (`buildEnemyRow`) e o "Criar inimigo" da sessão montam a linha de `characters` do inimigo cada um à sua maneira. Escreva primeiro um teste de caracterização da linha que cada caminho grava hoje; depois faça os dois passarem pela mesma montagem de linha e por um serviço que cria a ficha e põe o inimigo na sessão. Sem mudança visível para o Mestre.

## Acceptance criteria

- [ ] Teste de caracterização da linha gravada pelos dois caminhos, escrito antes da mudança.
- [ ] O assistente e o "Criar inimigo" usam a mesma montagem de linha; a duplicação some.
- [ ] A camada de dados única é respeitada (componente não importa `@/lib/supabase`).
- [ ] Se o comportamento atual parecer errado, registrar no ROADMAP e perguntar; correção em commit `fix:` separado.
- [ ] `npm run check` passa; E2E de sessão e combate continuam verdes.
