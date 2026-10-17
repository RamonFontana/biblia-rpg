# RPG Bíblico

RPG baseado em D&D 5e ambientado no período bíblico (Idade do Bronze/Ferro, 1050–586 a.C.).
SPA React (Vite) na Vercel; Supabase como backend.

## Regras do jogo

`docs/` é a fonte da verdade das regras. Leia antes de criar ou alterar conteúdo, classe, NPC, item, habilidade ou balanceamento:

- `docs/regras-base.md`: atributos, vocações, Sistema de Fé, degradação e recuperação.
- `docs/tribos/README.md` e `docs/tribos/<tribo>.md`: tribos (raças), passivas e progressão 1–20.
- `docs/vocacoes/`, `docs/itens/`, `docs/bestiario/`, `docs/criacao-de-personagem.md`.

Quando código e doc divergirem, registre a divergência em `docs/ROADMAP.md` e pergunte qual vale. Mudança de regra, valor de balanceamento ou conteúdo bíblico só entra com confirmação do autor.

### Princípios do cenário
- **O sobrenatural vem só do Sistema de Fé.** Não há magia arcana; milagres dependem de rolagem com a Fé como modificador.
- **Equipamento é histórico.** Armas e armaduras da Idade do Bronze/Ferro (bronze, ferro, couro, madeira, pedra, osso), sem itens mágicos nem bônus sobrenaturais. A CA vem de armadura e escudo.
- **A Fé (0–100) é a mecânica central.** Todo personagem tem 1 Fortaleza e 1 Tentação; a degradação Inabalável → Comum → Abalado → Vulnerável → Ruptura vale em toda sessão.
- **Tribos são as raças.** Cada tribo tem 2 passivas no nível 1, escolhe entre os caminhos A e B no nível 4 e tem marcos nos níveis 1, 4, 8, 12, 16 e 20. Toda tribo tem ficha em `docs/tribos/<tribo>.md`.
- **Regra de Levi.** Qualquer tribo pode ser Sacerdote/Sábio; a tribo de Levi é obrigatoriamente Sacerdote/Sábio.
- **Vocações:** Guerreiro, Batedor, Caçador/Nômade, Sacerdote/Sábio. Atributos FOR, DES, CON, INT, SAB, CAR.
- **Simplicidade.** O sistema deve continuar acessível a jogadores novos.

## Arquitetura

O código está migrando por ondas; o plano, as decisões tomadas e a dívida registrada estão em `docs/ROADMAP.md`. Leia a seção da onda em andamento antes de refatorar.

Arquitetura alvo:
- **`src/domain/`: motor do jogo puro.** Regras (atributos, CA, PV, Fé, condições, descanso, testes de morte) sem React, Supabase nem estado global. A aleatoriedade entra como parâmetro (`Rng`), e os testes usam seed fixa. O lint garante a pureza.
- **`src/content/`: itens, habilidades e condições como dados** tipados e validados por zod. O efeito de um item ou habilidade é um dado que o motor interpreta.
- **Camada de dados única** para o Supabase (hoje `src/services/` e `src/features/*/api/`; alvo `src/data-access/`), com os tipos gerados em `src/types/database.types.ts`. Componentes, hooks e stores consomem essa camada; o lint bloqueia novos imports de `@/lib/supabase` fora dela.
- **UI segue `docs/DESIGN.md`**, cujo padrão de referência é a criação de personagem. Tela nova ou refatorada usa a paleta e os componentes de lá.

Ao refatorar uma regra, escreva antes um teste de caracterização do comportamento atual. Se o atual parecer errado, registre no ROADMAP e pergunte; a correção vem num commit `fix:` separado.

## Gates

`npm run check` roda todos os gates bloqueantes. O pre-commit roda format + lint; o pre-push e o CI (`.github/workflows/ci.yml`) rodam `check`. A Vercel bloqueia o deploy se o build falhar.

| Gate | Comando | Dívida existente |
|---|---|---|
| Formatação | `npm run format:check` (corrigir: `npm run format`) | — |
| Lint | `npm run lint` | Congelada em `eslint-suppressions.json`. Erro novo falha; ao corrigir um antigo, rode `npm run lint:prune` (o lint falha enquanto houver supressão órfã) |
| Tipos | `npm run typecheck` (`strict`) | 5 arquivos com `@ts-nocheck`, listados no ROADMAP |
| Testes | `npm test` | — |
| Dados do jogo | `npm run test:data` (`src/data/gameData.test.ts`) | `src/data/known-violations.json`. Violação nova falha; ao corrigir, apague a entrada |
| RLS | `npm run check:rls` | Tabelas criadas fora das migrations (`characters`) não são cobertas |

Cobertura (`npm run coverage`) e Dependabot são só informativos.

Dívida existente só diminui: para um gate passar, corrija a causa. Supressão nova, `any`, `@ts-ignore`/`@ts-nocheck`, regra desligada ou teste pulado não entram.

**Testes de um módulo** (o loop do tdd): `npx vitest run <caminho>`, por exemplo `npx vitest run src/domain/combat`. Modo watch: `npx vitest <caminho>`.

## Fluxo de trabalho

Feature ou mudança de regra: `/grill-with-docs` (atualiza `CONTEXT.md` e os ADRs em `docs/adr/`) → `/to-spec` → `/to-tickets` → `/tdd`. Uma feature só começa depois que a área que ela toca foi refatorada (ver ROADMAP).

Commits seguem Conventional Commits em inglês (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`), um commit por mudança. Dependência nova só com aprovação do autor.

Schema do banco muda só por migration versionada em `supabase/migrations/`, sempre com `enable row level security` para tabela nova.

## Agent skills

### Issue tracker

Issues e specs são arquivos markdown em `.scratch/<feature>/` (versionados no repo). See `docs/agents/issue-tracker.md`.

### Triage labels

Os cinco papéis padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), gravados na linha `Status:` de cada issue. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` na raiz, criados sob demanda pelo `/grill-with-docs`. See `docs/agents/domain.md`.
