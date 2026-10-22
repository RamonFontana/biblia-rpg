# Roadmap — RPG Bíblico

> Documento vivo. Gerado na análise de 2026-10-16 e atualizado ao fim de cada onda.
> Para continuar numa sessão nova: leia **Status** e a seção da próxima onda; não refaça a análise.

## Status
| Onda | Estado |
|---|---|
| 1 — Fundação | concluída (PR #1 mesclado). Falta só proteger a `main` no GitHub (o sistema bloqueou a minha tentativa via `gh api`; o autor configura no GitHub) |
| 2 — Rede de segurança | concluída: grill, glossário, ADRs 0001–0002, correções de doc (PR #9), caracterização das regras (PRs #10, #11 e #13) e correções do bloco B (PR #14). O que sobrou do bloco B (Teste de Fé unificado, CA, Resistência a Condição) entrou nos passos da Onda 3 |
| 3 — Motor e dados | concluída em 2026-10-18: passos 1 a 7 feitos (CLI e schema-base, `src/domain`, Fé, conteúdo, CA, Resistência a Condição e RLS). Resta só o que cada passo registrou como pendência |
| 4 — Restante + padronização visual | em andamento desde 2026-10-18 (passos abaixo, um PR cada) |
| 5+ — Features novas | pendente (lista de features ainda vazia) |


## Contexto
O projeto foi construído com modelos mais fracos e o Spec Kit. Hoje as regras estão duplicadas e às vezes contraditórias, e há lógica de jogo dentro de componentes. O acesso ao Supabase está espalhado e as políticas RLS são permissivas. As 49 specs não refletem o código. O objetivo é trocar o Spec Kit pelas skills do Matt Pocock, criar poucos gates que bloqueiem de verdade e montar um roadmap persistente. As ondas são executadas uma por vez, cada uma em sua branch/PR.

Decisões já tomadas (perguntas desta sessão):
- **Dependências aprovadas:** `prettier`, `simple-git-hooks`, `@vitest/coverage-v8`. O CLI do `supabase` fica para a Onda 3, com nova aprovação.
- **Morte:** com PV 0 o personagem fica *morrendo* até resolver os testes de morte, inclusive depois do fim do combate. O `endCombat` atual está errado.
- **Proficiência:** vale a tabela 5e do código; o doc é que será corrigido.
- **Teste de Fé (cliente com penalidade × serviço sem):** fica para o grill. A caracterização registra as duas fórmulas.
- **Design:** o padrão visual de referência é o da **criação de personagem**. Todo o sistema converge para ele aos poucos, durante a refatoração.

---

## 1. Resumo inferido
| Item | Estado |
|---|---|
| Stack | SPA Vite 8 + React 19 + TS 6 (`strict` ligado), npm, Tailwind 3 + shadcn/Radix, zustand (4 stores) + react-query (usado em 1 tela), zod 4, vitest 4/jsdom |
| Vercel | Só hosting estático (`vercel.json` = rewrite SPA). Sem API routes nem edge functions |
| Supabase | Client direto com anon key (`src/lib/supabase.ts`). 30 migrations versionadas, mas `characters` foi criada pelo dashboard e não tem migration. `supabase/dump.sql` tem 0 bytes. Tipos gerados por `supabase gen types` (`src/types/database.types.ts`) e à frente das migrations (`weapon_effects` não tem migration). Sem `config.toml`. `supabase/.temp/` está commitado |
| Gates hoje | `tsc` 0 erros, mas 5 arquivos com `// @ts-nocheck` (toda a criação de personagem). ESLint com 279 problemas: 223 `no-explicit-any`, 22 unused-vars, 8 set-state-in-effect, **1 `rules-of-hooks`**, 5 ban-ts-comment. 3 arquivos de teste (34 testes). Sem formatador, sem hooks, sem CI |
| Spec Kit | `.specify/` (com extensão git de auto-commit), `specs/001–049`, 9 skills `.claude/skills/speckit-*`, blocos SPECKIT em CLAUDE.md (truncado) e AGENTS.md |
| Skills Pocock | Instaladas globalmente (grill-me, grill-with-docs, **to-spec** = antigo to-prd, **to-tickets** = antigo to-issues, tdd, domain-modeling, triage). `setup-matt-pocock-skills` **não rodou** (sem `docs/agents/`, `CONTEXT.md`, `docs/adr/`) e é `disable-model-invocation`, então você roda `/setup-matt-pocock-skills` |
| Commits | Conventional Commits em inglês (`feat:`, `fix:`, `refactor:`, `chore:`) |
| Remote | github.com/RamonFontana/biblia-rpg |

## 2. Mapa do domínio (principais pontos)
**Regras**
- **Modificador `floor((v-10)/2)`:** escrito em 4 lugares, com a mesma fórmula: `characterMath.ts:43`, `InitialStats.tsx:7`, `LevelUpWizard.tsx:27`, `EnemySheet.tsx:67`.
- **Proficiência:** `characterMath.ts:48` usa 5e; `regras-base.md:120` diz outra coisa. Decidido: vale o 5e.
- **PV inicial:** `InitialStats.tsx:15` (10 ou 8 + CON).
- **PV por nível:** `LevelUpWizard.tsx:13-21` (médias, sem opção de rolar). A tela mostra `hpGained` com o mod antigo (`:48`) mas grava com o novo (`:93`).
- **ASI** `[4,8,12,16,19]`: não está no doc.
- **XP:** não existe. A progressão é por marco (`EndSessionDialog`, `pending_level_up`).
- **CA**
  - Base `10+DES` gravada na criação (`InitialStats.tsx:18`) e nunca recalculada.
  - Sem teto de DES.
  - **Duas fórmulas:** `equipmentUtils.ts:133` usa precedência; `EquipmentSlots.tsx:47` soma os três campos.
  - Telas que ignoram `getCombatStats`: `CharacterCard.tsx:45`, `EnemyCard.tsx:16`.
  - +1 de CA por nível de item (`equipmentUtils.ts:146`), o que contradiz "sem itens +1" (constitution II).
- **Combate**
  - Iniciativa manual.
  - Ataque e dano não implementados (`PhysicalRollForm` comentado em `PlayerCombatView.tsx:226`).
  - Dano digitado pelo mestre: `characterVitalsService.applyDamageOrHealing`.
- **Morte**
  - Testes de morte em `DeathSavesModal.tsx:27-35` (nat 1/20 extras ao doc).
  - `endCombat`, via `deriveDeathState` (`vitalsUtils.ts:43`), mata quem tem PV ≤ 0. **Bug**, pela decisão acima.
- **Condições:** decrementam por rodada (`combatStore.ts:236`). Sangramento: o doc diz "final do turno", `conditions.ts:13` diz "início".
- **Resistência de armadura** (`combatEngine.ts:50-117`): nunca funciona.
  - Busca `ITEMS_DB` por UUID.
  - Usa 3 vocabulários de IDs (inglês em `itemsDb`, português em `conditions.ts`, tipos de dano em `InventoryList.tsx:24`).
  - Aplica o nível máximo de resistência a todas as condições.
- **Descanso** (`SessionRestControls.tsx`)
  - Curto: PV digitado; recarga de habilidade só se PV > 0 (bug, `:53`); sem dados de vida.
  - Longo: regra "a cada 2 dias" que não está no doc.
- **Munição:** 50% de recuperação (`useAmmunition.ts:49`), igual ao doc.
- **Fé**
  - Tiers de degradação (Inabalável → Ruptura) **não existem no código**.
  - Teste de Fé com 2 fórmulas: `PlayerTestDialog.tsx:179` × `sessionTestService.ts:83`. A tela pode mostrar reprovação enquanto o banco grava aprovação.
  - Máximo de Fé com 4 valores diferentes (100 / `stats.faith||100` / `||0` / `max_faith`).
  - `current_faith ?? faith ?? 0` repetido 16× em 10 arquivos.
- **Aleatoriedade:** `Math.random` inline em 7 pontos de regra (`AttributeGeneration:48`, `DeathSavesModal:52`, `DiceRollerDialog:50`, `SessionRestControls:109`, `sessionTestService:112`, `PlayerTestDialog:260-304`, `useAmmunition:49`). Nada é injetável.
- **NPC jogável:** gravado com `strength/dexterity` e `stats.armor_class` (`sessionService.ts:31-42`), mas todos os leitores esperam `for/des` e `stats.ca`. Resultado: modificadores 0 e CA 10.

**Itens**
- A fonte real é `src/data/itemsDb.ts` (35 itens).
- Seeds desatualizados: `seed_items*.sql` têm 32 itens; `seed_items.sql` insere slug em coluna UUID; os preços são arredondados para inteiro.
- Itens também são criados em runtime (`syncInventory.ts:118`), com significado diferente para `category`.
- Efeitos são `jsonb` livre: o código lê chaves fora do tipo `ItemEffects` (`combat.ts:43`).
- `heal_dice` nunca é rolado: Bálsamo e Ração curam 0.
- Elmos caem no slot `body` (`syncInventory.ts:62`).
- Kits iniciais divergem entre `KITS_DB`, `VOCATION_KIT_ITEMS` e o doc.
- Proficiências de vocação divergem do doc (`itemsDb.ts:87-93`).

**Habilidades**
- São 193 em `abilities.ts`, gerados dos docs.
- `effect` é texto livre e nenhuma tem `applyConditions`, então o motor não aplica efeito de habilidade.
- `maxUses` não é aplicado. `usageType:'faith_cost'` não é usado.
- `tribeSkills.ts` é código morto e contradiz `abilities.ts`.
- IDs truncados em 15 caracteres são chaves de `ability_uses` no banco, então **não podem ser regenerados**.
- Condições citadas no texto não existem em `CONDITIONS`: Amedrontado, Paralisia, Encantado, Exaustão.
- A vocação "Sábio" pode ser escolhida mas não tem habilidades. "Nobre" existe só no código.

**Conteúdo bíblico (só para sua revisão; nada foi alterado)**
1. `efraim.md:3`: Sl 78:9 está cortado, e o versículo inverte o sentido.
2. `efraim.md:4`: Dt 33:17 é a bênção de José, não só de Efraim.
3. `manasses.md:4`: em Jz 6:12 quem fala é o anjo do Senhor.
4. `zebulom.md:4`: 1Cr 12:33 pode ser 12:34 dependendo da versão.
5. "Espírito de Sansão" é habilidade de Gade (`abilities.ts:642`), mas Sansão era danita.
6. "Cântico de Débora" é habilidade de Naftali; Débora não era naftalita.
7. Issacar e Simeão são chamados de "Subtribo".
8. `levi.md`: transliteração duvidosa; Urim e Tumim aparecem para todo levita.
9. Anacronismos:
   - "Lorica", cota de malha, arco longo, martelo de guerra, couro batido e corda de cânhamo (`itemsDb.ts`).
   - Siclo como moeda.
   - "Túnica Sagrada… Abençoada" (`itemsDb.ts:10`), que esbarra na constitution II.
10. "O Beemote" como animal invocável (`ruben.md:64`).
11. `gigantes.md`: "seis dedos" generalizado a todos os gigantes; Nefilim igualados a Anakim.
12. Temas de tribo sem base bíblica: Gade "Rocha", Rúben "Vento", Simeão "Boticários". "Flecha do Livramento" vem de Joás/Eliseu, não de Benjamim.
13. Figuras do período dos Juízes, embora o cenário declare 1050–586 a.C.

## 3. Divergências spec × código (resumo)
| Spec | Status | Divergência |
|---|---|---|
| 001/004 | parcial | XP e tiers de Fé estão no doc, não no código. Nobre existe só no código |
| 005 milagres | parcial | Doc: tiers fixos (0/+20/+50). Código: o mestre escolhe um valor de 0–100 e toda falha custa 1d6 de Fé |
| 026 combate | parcial | Rolagem física (FR-009) comentada; iniciativa manual |
| 037 nível de item | parcial | +CA por nível contradiz a constitution; nível de arma altera dano, contra o FR-009 da spec |
| 040 habilidades | parcial | A spec pede `{current,max}`; o código guarda só a contagem de usos. Lógica duplicada |
| 043 resistência | parcial (tasks marcadas) | `requiredVocation` não implementado; arredonda para cima em vez de para baixo; bug do nível máximo |
| 044 | quase | `weapon_effects` sem migration |
| 008, 021 | implementadas | Com 0 tasks marcadas |
| 010 | superada | Pela migration de `game_sessions` |
| 014/015 | duplicadas | Mesmo prefixo de branch |

O resto (≈25 specs) está implementado com tasks fechadas. Conclusão: as specs servem como histórico, não como fonte de verdade.

**Constitution: classificação**
- **(a) Durável, migra para AGENTS.md:**
  - Sem magia arcana.
  - Sem itens mágicos (materiais da Idade do Bronze/Ferro).
  - Fé como mecânica central.
  - Tribos = raças (2 passivas no nível 1; caminhos A/B no nível 4; marcos 1/4/8/12/16/20).
  - Regra de Levi.
  - Restrições de cenário.
  - `docs/` é a fonte da regra. Divergência entre código e doc deve ser registrada e perguntada, nunca corrigida em silêncio.
- **(b) Workflow do Spec Kit, descartado:** Sync Impact Report, semver da constitution, "todo PR verifica conformidade", "AGENTS.md deve refletir a constitution", o fluxo "documentar → revisar", que passa a ser grill-with-docs → to-spec → to-tickets → tdd.
- **(c) Vira gate** (validação de dados):
  - Cada tribo tem exatamente 2 habilidades sem caminho no nível 1.
  - Cada tribo tem caminhos A e B a partir do nível 4.
  - Cada tribo tem `docs/tribos/<tribo>.md`.
  - Regra de Levi no schema de criação (`characterSchema.ts:57`).
  - Nenhum item com efeito de Fé ou sobrenatural fora de lista explícita.

## 4. Dívidas, por impacto
1. **Segurança RLS** (não mexo no schema na Onda 1; fica documentado):
   - `character_items` FOR ALL para qualquer usuário autenticado (`20260616200900:8`).
   - O dono pode alterar qualquer coluna de `characters` (`20260703145200`): nível, `is_dead`, PV.
   - `session_tests`/`session_test_results` com políticas `true`; resultado forjável, porque `is_approved` vem do cliente.
   - `items` INSERT aberto.
   - RPCs `SECURITY DEFINER` sem `search_path` e sem checar dono (`use_consumable_item`, `add_kit_to_character`, `create_game_session`, `execute_trade`).
   - `cancel_session_trades` sem checagem de mestre.
   - `characters` sem migration, então o RLS dela não é verificável pelo repo. Conferido no banco ao vivo em 2026-10-17: as 14 tabelas de `public` têm RLS ativo (`characters` com 7 políticas). O conteúdo dessas políticas ainda não foi revisado.
   - Security Advisor (2026-10-17): `anon` e `authenticated` executam as 9 funções `SECURITY DEFINER` de `public` (inclusive `is_session_gm` e `cancel_session_trades`); 4 delas sem `search_path` fixo; proteção contra senhas vazadas desligada no Auth. A função `rls_auto_enable()` existe no banco e não tem migration no repo.
2. **Regras contraditórias:** teste de Fé, CA, morte no fim do combate, resistências que nunca funcionam, NPC jogável com chaves erradas.
3. **Regras declaradas e não implementadas:** tiers de Fé, cura de consumíveis, `maxUses`, efeitos de habilidade.
4. **Acesso ao Supabase espalhado:** ~30% das chamadas vêm de 13 componentes e páginas; `(supabase as any)` nos services.
5. **Tipagem:** 5 arquivos `@ts-nocheck`, 223 `any`, 1 violação de `rules-of-hooks`.
6. **Dados:** seeds quebrados, 3 vocabulários de condição, IDs de habilidade frágeis.
7. **Estado:** 3 paradigmas (zustand, react-query, useState + realtime). `combatStore` faz escrita no banco. Componentes de 600 linhas.
8. **Design inconsistente:** dois sistemas visuais convivem.
   - **Referência (criação de personagem):** Tailwind fixo `stone`/`amber`, 360 usos e 0 tokens. Fundo `bg-stone-900`, cartão `bg-stone-800 border-stone-700 rounded-xl`, títulos `font-serif text-amber-500`, barra de progresso âmbar, chips `bg-amber-600 text-stone-900` (`WizardLayout.tsx`).
   - **Resto:** session/combat/pages misturam esse padrão com tokens shadcn (`bg-primary`, `bg-card`: 50 em session, 32 em combat) e cores avulsas (`slate`/`gray`/`blue`: ~55 usos).
   - Os tokens shadcn (`tailwind.config.js:19`, variáveis CSS) não correspondem à paleta da referência.
9. **Código morto:** `ActiveSession/index.tsx`, `WelcomeCard.tsx`, `tribeSkills.ts`, `store/index.ts`, `PhysicalRollForm` (comentado), `add_kit_to_character`, `scripts/check-sessions.js`.

## 5. Roadmap em ondas

### Onda 1: fundação
Um commit por item, nesta ordem:
1. **`docs/ROADMAP.md`**: este plano, com as decisões e as dívidas.
2. **Higiene do repo**
   - `.gitignore` passa a ter `!.env.example` e `supabase/.temp/`; `git rm --cached supabase/.temp`.
   - Remover o `supabase/dump.sql` vazio.
   - Corrigir o link quebrado do README.
3. **Saída do Spec Kit**
   - Criar a tag `speckit-final` (preserva tudo no histórico).
   - Remover `.specify/`, `specs/`, `.claude/skills/speckit-*` e os blocos SPECKIT.
   - Constitution: itens (a) para AGENTS.md, (b) descartados, (c) viram gate no passo 7.
   - CLAUDE.md passa a conter só `@AGENTS.md`.
4. **Prettier**
   - Adicionar a dependência e um `.prettierrc` que siga o estilo atual (aspas simples, ponto e vírgula).
   - Commit de formatação geral, separado, com o hash em `.git-blame-ignore-revs`.
   - Scripts `format` e `format:check`.
5. **Lint como gate (ratchet)**
   - Usar a supressão em massa nativa do ESLint 10 (`eslint --suppress-all`), que gera `eslint-suppressions.json`: os 279 problemas atuais ficam registrados como dívida, e qualquer violação **nova** bloqueia.
   - Entrada órfã (dívida já corrigida) também falha, até rodar `--prune-suppressions`. Nenhuma regra é desligada.
   - Duas regras novas de arquitetura via `no-restricted-imports`:
     - `src/domain/**` não importa React nem Supabase.
     - Fora da camada de dados, ninguém importa `@/lib/supabase`; os pontos atuais entram na supressão.
6. **Typecheck como gate**
   - Script `typecheck` = `tsc -b --noEmit` (app + node).
   - Os 5 `@ts-nocheck` ficam registrados como dívida em `docs/ROADMAP.md` e congelados pela regra `ban-ts-comment` suprimida.
   - Um tsconfig mais estrito para `src/domain/` (`noUncheckedIndexedAccess`) entra na Onda 3, quando a pasta existir.
7. **Validação de dados como gate**
   - `src/data/gameData.test.ts` (vitest, ambiente node, sem dependência nova) com schemas zod que descrevem o formato **atual** de `ITEMS_DB`, `KITS_DB`, `ABILITIES` e `CONDITIONS`.
   - Verifica IDs únicos, limites (CA 0–30, nível 1–20, custo ≥ 0, `maxUses` > 0), referências cruzadas (resistências e `applyConditions` existem em `CONDITIONS`; itens dos kits existem) e as regras (c) da constitution.
   - Violações já conhecidas (ex.: resistências em inglês) ficam em `src/data/known-violations.json`, uma lista que só pode diminuir: a entrada sai quando você aprovar a correção do dado. O teste falha com violação nova e também com entrada obsoleta.
8. **Checagem de RLS como gate**
   - `scripts/check-rls.mjs` (node puro): para cada `create table` em `supabase/migrations/*.sql`, exige `enable row level security` no mesmo conjunto de migrations e falha se houver `disable row level security`.
   - Documentar que `characters` está fora do alcance (sem migration) até a Onda 3.
9. **Scripts agregados e hooks**
   - `npm run check` = format:check + lint + typecheck + test + rls.
   - `simple-git-hooks`: pre-commit = format:check + lint; pre-push = `npm run check`.
   - `test` passa a ser `vitest run`; `test:watch` para o modo interativo; `coverage` com `@vitest/coverage-v8`, só como aviso.
10. **CI**
    - `.github/workflows/ci.yml`: um job em PR e em push na main com `npm ci && npm run check` e um passo de cobertura com `continue-on-error`.
    - O build fica com a Vercel.
    - `.github/dependabot.yml` semanal (npm + actions).
11. **AGENTS.md** (canônico; CLAUDE.md o importa) com:
    - Princípios do jogo.
    - Arquitetura alvo.
    - Tabela de gates e comandos.
    - "Rodar os testes de um módulo: `npx vitest run src/domain/<modulo>`" (o comando que o tdd usa).
    - Fluxo grill-with-docs → to-spec → to-tickets → tdd.
    - Proibições (sem `@ts-ignore`/`any` novos; regra e conteúdo só mudam com confirmação).
12. **`docs/DESIGN.md`**: descreve o padrão da criação de personagem como ele é hoje: paleta, tipografia, superfícies, botões, chips, progresso, espaçamento e layout mobile (`p-0 sm:p-4`, borda só a partir de `sm`), com exemplos de classes tirados de `WizardLayout.tsx` e dos steps. Só documentação, sem mudar código. O AGENTS.md ganha a regra: "UI nova ou refatorada segue `docs/DESIGN.md`; não introduzir cores fora da paleta". Você revisa se o documento captura o que gostou.
13. **Pausa:** você roda `/setup-matt-pocock-skills` (tracker GitHub Issues, `CONTEXT.md` + `docs/adr/` na raiz) e eu confiro o resultado.

Em cada gate novo, provo que ele **falha** com uma violação temporária (um `any` novo, um arquivo mal formatado, um ID duplicado, uma tabela sem RLS, um erro de tipo) e reverto sem commitar.

**Arquivos:** `docs/DESIGN.md`, `package.json`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `eslint-suppressions.json`, `.git-blame-ignore-revs`, `src/data/gameData.test.ts`, `src/data/known-violations.json`, `scripts/check-rls.mjs`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `AGENTS.md`, `CLAUDE.md`, `docs/ROADMAP.md`, `.gitignore`, `README.md`. Remoções: `.specify/`, `specs/`, `.claude/skills/speckit-*`, `supabase/dump.sql`.
**Risco:** baixo. O commit de formatação é grande mas mecânico, e o build após ele confirma que nada mudou.
**Pronto quando:** `npm run check` passa; cada gate foi visto falhando; o CI está verde no PR; não sobra referência ao Spec Kit; o ROADMAP está commitado.

### Onda 2: rede de segurança
**Já feito:** grill-with-docs de 2026-10-17. Vocabulário em `CONTEXT.md`; ADRs em `docs/adr/`. As decisões estão na próxima seção.

**Ordem:**
1. Correções de doc (bloco A abaixo), um commit por documento.
2. Testes de caracterização do comportamento ATUAL, inclusive dos bugs, marcados `// CARACTERIZAÇÃO: comportamento atual; decisão: ROADMAP#decisões-do-grill`.
3. Correções de comportamento (bloco B), cada uma como `fix:` com o teste de caracterização virando vermelho → verde.

- **Alvos dos testes:** `getTestModifiers`, `getCombatStats` (as duas fórmulas de CA), `combatEngine` (resistências), `abilityUtils` (recarga), a matemática do LevelUpWizard, os descansos, os testes de morte, a munição, o teste de Fé (as duas fórmulas).
- **Técnica:** onde a lógica está num componente, primeiro extrair uma função pura sem alterar comportamento (refactor mecânico) e testar a função. Valores rolados entram como parâmetro (ADR 0001).
- **Risco:** médio (extrações de componentes grandes).
- **Pronto quando:** toda regra do mapa §2 tem pelo menos um teste e cada divergência tem a decisão aplicada ou registrada como pendente.

#### Caracterização: situação (2026-10-17)
Cada regra foi extraída sem mudar comportamento (commit `refactor:`) e fixada em teste (commit `test:`). Os testes marcados "BUG conhecido" descrevem comportamento que o bloco B vai mudar; quando a correção entrar, o teste vira vermelho de propósito e é reescrito na mesma mudança.

| Regra | Módulo extraído | Teste |
|---|---|---|
| Teste de Fé (2 fórmulas que divergem) | `src/lib/faithTest.ts` | `faithTest.test.ts` |
| CA total, Qualidade, precedência de campos, fórmula do slot | `src/lib/equipmentUtils.ts` (`getSlotAcBonus`) | `equipmentUtils.test.ts` |
| Resistência a Condição da armadura (nunca se aplica) | `src/lib/armorResistance.ts` | `armorResistance.test.ts` |
| Filtro e recarga de habilidades | `src/utils/abilityUtils.ts` (já puro) | `abilityUtils.test.ts` |
| Modificadores de Teste, TR e detalhamento da rolagem | `characterMath.ts` (já puro) | `testModifiers.test.ts` |
| PV do level-up e níveis de Aumento de Atributo | `utils/levelUp.ts` | `levelUp.test.ts` |
| Testes de Morte (resultado do d20, contadores) | `src/lib/deathSaves.ts` | `deathSaves.test.ts` |
| Descansos Curto e Longo | `src/lib/rest.ts` | `rest.test.ts` |
| Munição (RNG injetável) | `src/lib/ammo.ts` | `ammo.test.ts` |
| PV, CA e Fé iniciais; geração de atributos (RNG injetável) | `character-creation/utils/` | `initialStats.test.ts`, `attributeGeneration.test.ts` |
| Lista de Condições (mesclar, remover, tique, limpeza) | `conditionsService` (puro, com mock do Supabase) | `conditionsService.test.ts` |
| Consumíveis: cura, Qualidade, Fé | `src/lib/consumables.ts` | `consumables.test.ts` |
| Criação de NPC jogável e de inimigo (chaves inconsistentes) | `src/lib/sessionEntities.ts` | `sessionEntities.test.ts` |
| Sinal do Modificador de Fé, aprovação de Teste comum, perda de Fé | `src/lib/sessionTests.ts` | `sessionTests.test.ts` |
| Nível do personagem e teto 20 | `utils/levelUp.ts` | `levelUp.test.ts` |
| Combate: ordem de turnos, tique de Condições por rodada, início e fim do combate | `combatStore` (com Supabase falso, `src/test/fakeSupabase.ts`) | `combatStore.test.ts` |
| Troca de itens e moedas (não a transferência, que é SQL) | `tradeService` | `tradeService.test.ts` |
| Criar e encerrar sessão | `sessionService` | `sessionService.test.ts` |
| Morte por PV ≤ 0 ao fim do combate | `vitalsUtils.deriveDeathState` | já coberto em `vitalsUtils.test.ts` (o teste "marks dead when hp drops to 0" é o comportamento a mudar) |

**Ainda sem teste de caracterização**
- O máximo de Fé com 4 valores diferentes e o `current_faith ?? faith ?? 0` repetido 16 vezes (será `getCurrentFaith` na Onda 3).
- As funções SQL `execute_trade`, `cancel_session_trades` e `create_game_session` (a transferência de itens e moedas e a criação da sessão em si). Os testes do serviço só provam o que o app envia a elas.
- A assinatura em tempo real do combate (`initSubscriptions`).

**Achados desta etapa (combate, troca e sessão)**
- O turno é guardado como índice de posição, não como participante: se alguém sai do combate, a vez passa a apontar para outro participante.
- `nextTurn` desconta a duração das Condições antes de gravar o novo turno, sem transação: se gravar o turno falhar, as Condições já foram descontadas. Ninguém é pulado, nem quem está com 0 PV.
- `endCombat` junta os personagens mortos numa lista (`deadCharIds`) que nunca é usada: só inimigos com PV 0 saem da lista (`is_deleted`). Jogador com PV 0 vira Morto (BUG conhecido, decisão: Morrendo).
- `startCombat` não preenche o estado local; quem mostra o combate é a assinatura em tempo real. Inimigos não herdam Condições da ficha.
- `tradeService` não valida nada: aceita moedas negativas ou fracionadas, quantidade acima do que o personagem tem e Qualidade fracionada. Qualquer validação depende da função SQL.
- `createGameSession` cria as fichas de NPC e inimigo antes de chamar a função SQL: se ela falhar, as fichas ficam órfãs.
- `endSession` ignora erros de apagar NPCs e de conceder nível e encerra mesmo assim; não olha PV nem Testes de Morte (a regra do Morrendo ainda não existe).

**Por que a correção do Teste de Fé não entrou agora**: o serviço que grava `is_approved` não conhece a penalidade de Item Profano (quem a calcula é a tela, lendo os itens). Unificar exige que a camada de dados leia os itens do personagem, então a correção nasce junto com `src/domain/faith` na Onda 3. O mesmo vale para a resistência de armadura (depende do vocabulário de condições e de ler `items.condition_resistances` do banco).

**Achados novos desta etapa**
- ~~A lista de perícias tem **Arcanismo**~~ Removida (decisão do autor, 2026-10-17). O gate de dados agora também falha se uma Vocação listar uma perícia que não existe.
- ~~O `LevelUpWizard` mostrava o ganho de PV com o modificador antigo~~ Corrigido: o passo de PV agora vem depois da escolha de atributo e mostra o valor que será gravado, com o retroativo.
- `calculateModifier` tinha 4 cópias; 2 já foram unificadas (`LevelUpWizard`, `InitialStats`). Resta uma, em `EnemySheet.tsx:85`.

#### Direção registrada pelo autor (2026-10-17, ainda não decidida em detalhe)
- **Dados de jogo no banco**: itens, habilidades e condições estão hoje espalhados entre arquivos (`itemsDb.ts`, `abilities.ts`, `conditions.ts`) e o banco (`items`), com vocabulários diferentes. O autor sugere migrar **tudo para o banco, populado por seeds**. Isso muda o plano da Onda 3 (hoje: `src/content/` em código, validado por zod). A decidir em um `/grill-with-docs` antes da Onda 3, pesando: o gate de validação precisa continuar rodando sobre os seeds no repo; os IDs de habilidade (chaves em `ability_uses`) e os UUIDs de itens precisam ser estáveis; a resistência de armadura só passa a funcionar quando o catálogo e o banco falarem a mesma língua. Provável ADR.
- **Detalhamento da rolagem**: deve mostrar também o dado, para saber quanto saiu no d20. Exige gravar o valor do dado (hoje só o total é gravado em `session_test_results.result_value`), ou seja, uma coluna nova no banco. Aguarda aprovação da migração (ver pendências).

#### Decisões do grill (2026-10-17)
Termos canônicos: `CONTEXT.md`. Decisões de arquitetura: `docs/adr/`.

**A. Correções nos docs de regra** (FEITO em 2026-10-17; conteúdo aprovado, um commit por documento. Os guias do Mestre também foram ajustados.)
1. `docs/regras-base.md`
   - Proficiência no padrão 5e (+1 nos níveis 5, 9, 13 e 17).
   - "Sem itens +1/+2" passa a proibir bônus *sobrenaturais*; a Qualidade de item é permitida (ADR 0002).
   - XP sai; entra o Marco. Aumentos de atributo nos níveis 4, 8, 12, 16 e 19.
   - Iniciativa: o jogador rola na mesa e o Mestre digita; só o Mestre passa o turno.
   - Morrendo continua depois do combate; a sessão não encerra com alguém Morrendo. Estável volta descansado na sessão seguinte.
   - Descanso Curto até 2 por dia; Longo 1 por dia, com Sustento (1 Ração + 1 Odre por personagem, senão Exausto).
   - Sangrando: dano no final do turno.
   - Fé: Clamor com atalhos 0 / −20 / −50 (sinal corrigido) e Pedido Egoísta marcado antes da rolagem; Vulnerável vira Testemunho.
2. `docs/fortalezas-tentacoes.md`: Tentação usa Teste de Fé (não de Sabedoria); ceder sem rolar não custa Fé; Fortaleza isenta do Testemunho.
3. `docs/criacao-de-personagem.md`: 50 siclos fixos; kits iguais ao que o jogador recebe (+20 flechas para o Caçador); Sábio usa o kit do Sacerdote.
4. `docs/itens/consumiveis.md` e `utilizaveis.md`: Odre e Ração são Sustento (não curam); Bálsamo cura 1d4.
5. `docs/regras-base.md` §condições (ou arquivo próprio): Amedrontado (no lugar de Assustado), Impedido, Paralisado, Exausto; Encantado removido.
6. Tribos e vocações: Zebulom nível 8 (vantagem em Testes de Fé de Tentação e contra heresia, no lugar de imune a Encantado); Aser níveis 1 e 12 (a refeição vira habilidade do Descanso Curto, sem consumir ração: +1d4 PV, depois +1d8 e remove Exausto); Sacerdote nível 18 e Endemoniado perdem Encantado.
7. `docs/vocacoes/*.md`: o Batedor e o Sacerdote seguem como o doc está; só o código muda (bloco B).

**B. Correções de comportamento no código** (sempre depois do teste de caracterização)
- Teste de Fé numa função única, incluindo a penalidade do Item Profano. Perda de 1d6 só em Tentação, Testemunho e Pedido Egoísta.
- ~~`endCombat` deixa o personagem Morrendo em vez de matar.~~ FEITO: inimigo com PV 0 morre; jogador e NPC com PV 0 ficam Morrendo (`stats.status = 'Morrendo'`, `is_dead` intacto, Testes de Morte preservados). O fim da sessão também: a tela de encerrar fica **bloqueada** enquanto alguém (jogador ou NPC aliado) estiver Morrendo (decisão do autor; `isDying` em `src/lib/deathSaves.ts`). Limite: durante um combate ativo o PV da ficha só é sincronizado no fim do combate.
- ~~Descanso Longo 1 por dia. Descanso Curto recarrega habilidades mesmo sem cura.~~ FEITO. Nota: o banco cria a sessão com `last_long_rest_day = 1`, então no dia 1 o Longo continua indisponível (mesmo comportamento de antes).
- ~~`conditionResistances` do catálogo em português; `assustado` vira `amedrontado`; Impedido, Paralisado e Exausto entram.~~ FEITO no catálogo (`known-violations.json` está vazio; nenhum dado gravado usava `assustado`). **Resolvido pelo seed do passo 4(a)** (10 das 35 linhas de `items` no banco guardavam as resistências em inglês; os seeds antigos `supabase/seed_items*.sql` foram removidos). Vale depois de aplicar a migration `seed_items`.
- ~~Sangrando: descrição diz final do turno.~~ FEITO (só a descrição; o dano automático continua não existindo).
- ~~"Sábio" é alias de Sacerdote; Nobre e `tribeSkills.ts` são removidos.~~ FEITO (`canonicalVocation` em `src/lib/vocation.ts`, usado nas regras de Vocação e nas habilidades).
- ~~Itens: textos de Odre e Ração perdem "Cura"; Caçador recebe 20 flechas; textos dos kits iguais ao doc.~~ FEITO no catálogo e nos kits do app. As linhas de `items` já gravadas no banco (efeitos de cura de Odre e Ração) não foram tocadas.
- **Precisam de lista de fichas afetadas antes de aplicar:** CA com teto de DES (média +2, pesada sem DES, aviso de FOR em vez de bloqueio) e proficiências de armadura conforme os docs de vocação.
  - Lista levantada em 2026-10-17 (leitura no banco, autorizada): 6 fichas não inimigas (5 de jogadores, 1 NPC jogável). **Nenhuma muda de CA nem perde proficiência**: todas usam Couro Cru (leve) ou nenhuma armadura, e nenhuma tem escudo equipado. O `stats.ca` gravado na criação ainda bate com a DES atual de todas (todas estão no nível 1).
  - Achados para a Onda 3: a tabela `items` guarda `category = 'Armadura'`, sem leve/média/pesada (o tipo só existe no catálogo `itemsDb.ts`, achado pelo nome); o NPC jogável não tem `stats.ca` e tem atributos em inglês (bug conhecido do NPC).
  - Divergências doc × código ainda abertas: elmos dão +1/+2 de CA no código e o doc não dá número; proficiências de armadura no código (`VOCATION_PROFICIENCIES`) diferem dos docs (Caçador sem escudo no código; Batedor com média no código e só leve no doc; Sacerdote com leve e Sagrada no código, leve, média e escudo no doc).
  - Implementação vai junto do `src/domain/armorClass` na Onda 3, que também unifica as duas fórmulas de CA.
- Recuperação de munição segue automática (50%); o 1d4 de Fé do Descanso Longo é digitado pelo Mestre; rolagens de jogador são digitadas, com Rolagem Virtual opcional (ADR 0001).

**C. Features novas** (Onda 5, via `/to-spec` → `/to-tickets` → `/tdd`)
1. Tipos de Teste de Fé no app: Clamor (atalhos + Pedido Egoísta), Tentação e Testemunho.
2. Sustento no Descanso Longo: tela de confirmação do Mestre (inclui NPCs aliados, desmarcável), aviso no celular de cada jogador e Exausto automático.
3. Efeitos do Estado de Fé: Inspiração (Inabalável), desvantagem (Abalado), Ruptura.
4. Dados de Vida nos descansos.

**Sincronizar o código com os docs já corrigidos** (feito no passo 4(b) da Onda 3)
- ~~`abilities.ts`: efeito de Zebulom nível 8 (sem Encantado; vantagem em Testes de Fé de Tentação), de Aser níveis 1 e 12 (refeição sem ração; Exausto no lugar de "exaustão") e de Sacerdote nível 18 (sem Encantado).~~ FEITO.
- ~~`itemsDb.ts`: descrições de Odre e Ração; 20 Flechas no kit do Caçador; textos de `KITS_DB`.~~ FEITO.
- ~~`bestiario`: o endemoniado não tem mais imunidade a Encantado (campo de condição no preset, se existir).~~ Não existe campo no preset (`npcPresets.json` não cita Encantado).

**Pendências (nenhuma decisão ainda)**
- **Vantagem e Desvantagem num Teste de Fé** (1d100, passa se ≤ Fé Efetiva + Modificador): como o teste passa com resultado BAIXO, Vantagem deve usar o **menor** dos dois dados e Desvantagem o **maior**. Assumido assim, mas confirme antes de implementar. Afeta Fortaleza (Vantagem), Zebulom nível 8 e Abalado.
- **Valores do Modificador de Fé** para Tentação e Testemunho: os guias descrevem níveis (Misericórdia / sem modificador / Punição), sem números. Só o Clamor tem atalhos (0 / −20 / −50).
- **"TR de Fé"** aparece nas habilidades (ex.: Aser "Vigor do Azeite", Juda "Coração de Leão"). Decidir se é Teste de Fé ou um teste de resistência de Sabedoria.
- Efeito exato de Vulnerável além do Testemunho frequente.
- Definição de Ruptura em termos de app (hoje só texto de doc).
- Dados de Vida: o doc os cita nos descansos, o código não os implementa (feature C4).
- **Testes de Morte**: o 1 natural contar duas falhas e o 20 natural voltar com 1 PV já estavam no código e passaram para o `regras-base.md` e o glossário sem pergunta explícita. Confirmar que valem.

### Onda 3: motor e dados
Decisões do grill de 2026-10-17 (glossário em `CONTEXT.md`; ADR 0003: conteúdo no repositório, banco por seed; ADR 0004: regras no motor, cliente confiável):
- **Conteúdo:** itens, kits, habilidades e Condições em `src/content/`, tipados e validados por zod. Habilidades e Condições não ganham tabela; os ids são preservados (chaves gravadas nas fichas).
- **Itens no banco:** `items` ganha `slug` (único, obrigatório) igual ao id do conteúdo; a linha guarda só identidade e exibição; o seed é uma migration `upsert ... on conflict (slug)` gerada do conteúdo. O app para de inserir em `items`, e `items.effects` deixa de ser lido.
- **CA:** sempre calculada para personagens com ficha (o `stats.ca` digitado fica só para inimigos e NPCs simples); elmo não dá CA, e a Resistência a Condição dele aparece no item e na hora de equipar; equipar sem proficiência é permitido, com aviso; proficiências de armadura conforme os docs de vocação.
- **Fé:** teto 100 para todos (os 4 "máximos de Fé" viram um; sai o rótulo de BUG do teste do Descanso Longo).
- **Confiança:** o motor decide aprovação e efeitos; o banco aceita o resultado do cliente, e o RLS garante só quem escreve.
- **Dependência aprovada:** CLI do `supabase` como devDependency (o autor fornece a senha do banco uma vez para o `db pull`).

Passos, um PR cada:
1. ~~**CLI e schema-base.**~~ FEITO: o `db pull` não funcionava (a primeira migration já dependia de `characters`, criada pelo dashboard), então as 31 migrations viraram uma base única gerada por `supabase db dump`, mais a publicação do Realtime e o gatilho `ensure_rls`, que o dump não traz. `supabase db diff --linked` sai vazio contra produção. Script `gen:types`; o gate de RLS cobre as 14 tabelas e passou a ignorar SQL entre aspas e corpos de função. O registro remoto foi ajustado com `supabase migration repair`.
2. ~~**`src/domain/`.**~~ FEITO: `rng.ts` (`Rng` e `createSeededRng`), `dice.ts` (`rollDie`, `rollDice`), `attributes.ts` (modificador e proficiência, antes em `characterMath`) e a mudança mecânica de faith (ex-`faithTest`), deathSaves, rest, ammo, consumables, armorResistance, vitals (ex-`vitalsUtils`), sessionTests, levelUp, initialStats, attributeGeneration e vocation. `Math.random` saiu do motor: o `Rng` é parâmetro obrigatório e o app injeta `systemRng`. O lint de pureza agora também proíbe importar `lib`, `services`, `store`, `hooks`, `features`, `components` e `pages`. Fica fora por enquanto: `equipmentUtils` e `combatEngine` (misturam regra e dados do banco), que entram nos passos 5 e 6.
3. ~~**Fé.**~~ FEITO em `src/domain/faith.ts`: `getCurrentFaith` no lugar das cópias de `current_faith ?? faith ?? 0`; `addFaith` (teto `FAITH_MAX = 100` para todos) e `spendFaith`; `sumItemFaithPenalty` e `getEffectiveFaith` (Fé Efetiva); `isFaithTestPassed`, usada pela tela do jogador e pelo serviço que grava `is_approved` (acabou a divergência com Item Profano: o serviço agora lê a penalidade dos itens do personagem). Efeitos visíveis: consumível de Fé e botões ±Fé de NPCs e inimigos vão até 100 (antes, até a Fé Inicial); o cartão de personagem mostra a Fé Atual (antes, a Fé Inicial). Nenhuma linha de `items` tem `statPenalty` hoje, então nenhum Teste de Fé existente muda de resultado. Resta um quarto "máximo": `max_faith: 100` solto no NPC jogável (`sessionEntities.ts`), que some junto da correção do NPC.
4. **Conteúdo**, em dois PRs:
   - **(a) Condições e itens: FEITO** (PR #19; migrations aplicadas em produção em 2026-10-17). `src/content/` (`conditions`, `items`, `kits`, `proficiencies`, `schemas`); os esquemas zod do gate de dados vivem em `schemas.ts` e os tipos saem deles. Migration `items_slug`: coluna `slug` (única, obrigatória) preenchida pelo nome das 35 linhas, com mapa explícito para "Flechas" → `flechas` e "Saco de Pedras para Funda" → `pedras_funda`; aborta se alguma linha ficar sem slug ou dois itens caírem no mesmo (hoje não há duplicata: a linha "Flecha" nunca foi criada); `price` vira `numeric` (flecha 0,05 e pedra 0,025 eram arredondadas). Migration `seed_items`, gerada de `src/content/items.ts` por `npm run gen:items-seed`: grava nome, descrição, tipo em `category`, preço, flag de consumível e as Resistências a Condição em português (traduz as 10 linhas em inglês); um teste falha se o conteúdo mudar sem nova migration de seed. O `syncInventory` procura por `slug` numa consulta só e não insere mais em `items`. A penalidade do Item Profano passa a vir do conteúdo (antes de `items.effects`, que está vazio na linha do amuleto). Os scripts antigos de sync de itens e `supabase/seed_items*.sql` saíram.
   - **(b) Kits e habilidades: FEITO.** `KITS_DB` guarda, por Vocação, o texto da criação e os itens (slug e quantidade); `VOCATION_KIT_ITEMS` saiu do `syncInventory`, e o Sábio reusa o objeto do Sacerdote. `abilities.ts`, o esquema `abilitySchema`, o gate de dados (`gameData.test.ts`) e `known-violations.json` moveram de `src/data/` para `src/content/` (em `src/data/` sobra só `npcPresets.json`); os ids das habilidades não mudaram. Saiu a segunda cópia, sem uso, de `getAbilitiesForCharacter`. `tribeSkills.ts` já não existia. Os textos das habilidades foram sincronizados com os docs corrigidos (Aser nível 1 e 12, Zebulom nível 8, Sacerdote nível 18, e HP → PV em 26 linhas), e um teste novo (`abilitiesDocs.test.ts`) compara cada habilidade com a linha da tabela "Resumo de Habilidades" do doc (nome, nível, Caminho, texto do efeito e custo de Fé) nos dois sentidos.
5. **CA**, em dois PRs:
   - **(a) A fórmula, o elmo e o escudo: FEITO.** `src/domain/armorClass.ts` (`calculateArmorClass`, `getItemArmorClass`, `formatItemArmorClass`) é a fórmula única da ficha, do cartão de slot e do chip do inventário: 10 + DES; leve soma a DES inteira, média até +2, pesada nenhuma; escudo +2; Qualidade +1 por nível acima de 1 em armadura e escudo; elmo não dá CA. O item é lido do catálogo pelo `slug`, então `items.effects` deixou de contar para CA. `getCombatStats` calcula a CA de quem tem ficha a partir dos atributos (o `stats.ca` gravado na criação não é mais lido); inimigos e NPCs simples seguem com a CA que o Mestre digitou. O elmo diz "Não dá CA" e mostra a Resistência a Condição no inventário, na dica do botão Equipar e no slot da cabeça. O cartão da lista de personagens passou a mostrar a CA calculada, e por isso `getCharacters`/`getMyCharacters` trazem os itens junto. `src/domain/equipment.ts` (`getEquipSlot`) resolve onde cada item se equipa a partir do catálogo. Conferido no banco em 2026-10-17: nenhuma das 6 fichas muda de CA (5 jogadores com Couro Cru ou nada, 1 NPC jogável sem itens; nenhum escudo equipado).
   - **Bug achado e corrigido (`fix:` separado):** o escudo nunca podia ser equipado. O catálogo chama o slot dele de `offHand`, que o inventário não entende, e as linhas do banco têm `effects` vazio; os dois escudos em jogo estão sem equipar. Agora o slot sai do catálogo.
   - **(b) Proficiências e avisos: FEITO.** `VOCATION_PROFICIENCIES` segue a linha "Proficiências" dos docs de vocação (Caçador ganha Escudo; Batedor perde Média; Sacerdote e Sábio ganham Média e Escudo; Guerreiro igual; só Sacerdote e Sábio têm a Sagrada, a Túnica Sagrada), e `proficiencies.test.ts` lê os docs e compara. `src/domain/equipWarnings.ts` (`getEquipWarnings`) devolve o aviso de proficiência (categoria da armadura, do escudo ou do elmo fora da tabela da Vocação; "Armadura exclusiva de Sacerdote e Sábio" para a Túnica Sagrada) e o de FOR (itens ganharam `requiresStrength`; a Lorica pede 13; o gate confere com o "Requer For N" da descrição). Os avisos aparecem sob o item no inventário e no slot depois de equipado; equipar continua permitido. Sem Vocação ou FOR conhecida não há aviso. A loja da criação filtra pela mesma tabela: o Batedor deixa de ver armadura Média, o Caçador e o Sacerdote/Sábio passam a ver escudos. Conferido no banco em 2026-10-17: nenhuma das 6 fichas ganha aviso nem perde nada (Couro Cru e, no Guerreiro, escudo no inventário).
   - **Resta do (a):** `calculateInitialStats` ainda devolve `ca` e a criação ainda grava `stats.ca` (a tela de resumo usa); para fichas é dado morto. O objeto `characters.equipment` guarda uma chave solta `"0"` com o carrinho da criação junto dos slots. A Resistência a Condição e as propriedades de armadura (Furtividade) ainda leem `items.effects`/`condition_resistances` (passo 6).
6. **Resistência a Condição: FEITO.** Decisões do autor (2026-10-17): os níveis 1 a 4 valem como no doc (vantagem, metade da duração para cima, as duas, imunidade); o nível de um item é o da tabela do doc mais (Qualidade − 1), no máximo 4; vale o maior nível entre os itens equipados, Condição por Condição; a regra é ligada onde o Mestre aplica Condições à mão, com opção de ignorar. Antes, a resistência nunca se aplicava (o item era procurado pelo UUID num catálogo de slugs), o maior nível de uma habilidade vazava para todas as suas Condições, e o nível lido era a Qualidade (começa em 1) em vez do nível da tabela. Agora `src/domain/armorResistance.ts` (`getItemResistanceLevel`, `getConditionResistanceLevels`, `resolveEquippedItems` pelo slug, `applyConditionResistance`) é o motor, com a mensagem em português; `getCombatStats` devolve `conditionResistanceLevels`; o `combatEngine` busca `items(slug)`. O seletor "Adicionar Efeito" (painel de combate, cartão do jogador e lista de NPCs) mostra o efeito, aplica a Condição já com ele (duração pela metade), desliga Aplicar para alvo imune e tem o botão "Ignorar a resistência do alvo". A etiqueta de resistência da ficha lista cada Condição com o nível. Os documentos (`docs/itens/armaduras.md`, `CONTEXT.md`) ganharam a regra por Condição e o efeito da Qualidade. Nenhuma ficha existente muda: ninguém tem item com resistência equipado.
   - **Efeito visível, com o Lorica:** como o nível parte da tabela do doc, a Lorica (Nv4 vs Sangrando e Atordoado) deixa o portador imune a essas duas Condições já na Qualidade 1, e o Escudo (Nv2 vs Impedido) corta a duração pela metade. Se isso parecer forte, o ajuste é o `level` do item em `src/content/items.ts` e a tabela do doc.
   - **Achado:** o único caminho que chamava o motor era o efeito de arma em 18 natural (`PhysicalRollForm`, comentado) e nenhuma habilidade tem `applyConditions`; a aplicação manual do Mestre não passava pela resistência. O `combatEngine` já usa a regra nova e a usará quando houver ataque e habilidades com Condição (Onda 5).
   - **Fica para depois:** `custom_condition_resistances` guarda tipos de dano (Corte, Fogo…), outro vocabulário; não entram no nível de Condição e só aparecem na etiqueta. A vantagem do nível 1 e 3 é só informada, porque as rolagens são físicas (ADR 0001). As colunas `items.effects` e `items.condition_resistances` continuam sem uso para esta regra.
7. **RLS**, uma migration por tabela ou função, cada uma confirmada antes de aplicar: revogar `EXECUTE` de `anon` nas funções `SECURITY DEFINER`, fixar `search_path` e checar dono ou Mestre dentro delas; apagar `add_kit_to_character` (sem uso); `session_test_results` e `character_items` escritos só pelo dono ou pelo Mestre da sessão; `items` sem insert pelo cliente; `characters` continua "dono ou Mestre".
   - **FEITO e aplicado em produção em 2026-10-18** (`supabase db push`, com a confirmação do autor). Conferido depois: 0 políticas no papel `public`, `anon` não executa nenhuma função `SECURITY DEFINER`, `db diff --linked` vazio, e o Security Advisor perdeu os 4 avisos de `search_path` e os 9 de `anon`. Com os dados reais, `anon` não vê nada (sem erro), o Mestre vê os 11 Testes e 22 resultados da sessão ativa e pode escrever nos 17 personagens dela, e um jogador vê os mesmos Testes mas só escreve no próprio personagem. Sobram 8 avisos de função `SECURITY DEFINER` chamável por usuário logado (as 4 RPCs do app e as 4 auxiliares, todas agora com checagem de quem chama) e o da proteção contra senhas vazadas (plano Pro). Detalhe: 14 migrations `rls_*` em `supabase/migrations/`, cada uma uma tabela ou função, mais o teste `supabase/tests/rls.sql` (95 verificações por papel; roda com `npm run test:rls-db`; contra o estado anterior 41 das 76 primeiras verificações falharam). O que o teste achou no estado de hoje: `anon` lia e criava Testes e resultados de Teste; qualquer logado inseria o resultado de outro jogador; qualquer um, até `anon`, executava `execute_trade` (movia itens e moedas), `use_consumable_item`, `cancel_session_trades` e `add_kit_to_character`; qualquer logado inseria e alterava os itens de qualquer personagem e criava itens; qualquer participante criava uma troca em nome de outro usuário.
   - Migrations: `drop_add_kit_to_character`, `lock_rls_auto_enable`, `session_tests`, `session_test_results`, `can_manage_character` (função nova: dono ou Mestre de sessão ativa), `character_items`, `items_no_client_insert`, `cancel_session_trades`, `create_game_session`, `execute_trade`, `use_consumable_item`, `trades_initiator`, `policies_authenticated_only` (27 políticas de `public` para `authenticated`), `helpers_no_anon`. O gate `check:rls` passou a cobrar `revoke execute ... from public, anon` em toda função `SECURITY DEFINER`.
   - **Fica de fora, registrado:** o Mestre de uma sessão escreve em qualquer personagem que adicionou como participante, mesmo antes de o jogador entrar (`session_participants.joined`); `trades` deixa qualquer participante da troca marcar os dois lados como prontos (`initiator_ready` e `target_ready`); `trade_items` e `execute_trade` não conferem se o item pertence a quem o oferece (ADR 0004: o cliente é confiável nas regras; o RLS só diz quem escreve); as funções auxiliares `is_*` e `can_manage_character` seguem chamáveis por usuário logado (aviso `authenticated_security_definer_function_executable` fica; a saída é movê-las para um schema não exposto); a proteção contra senhas vazadas é do plano Pro.


Achado que este plano resolve: o catálogo chama as flechas de "Flecha" e o banco de "Flechas". Como o `syncInventory` procura pelo nome e cria o item se não acha, comprar flechas (ou o kit do Caçador, desde o PR #14) cria uma segunda linha de flechas em `items`. A munição continua funcionando (reconhece "Flecha" no nome); o passo 4 funde as duplicatas.

Achados do passo 4(a) (leitura do banco em 2026-10-17):
- `items.category` guarda o **tipo** do item (`Arma`, `Armadura`, `Escudo`, `Consumível`, `Utilidade`), que é o que `InventoryList` e `TradeSide` leem. Três linhas criadas pelo app (Clava Grande, Espada Grande de Ferro, Martelo de Guerra) tinham a categoria de proficiência (`Simples`/`Marcial`); o seed as corrige para `Arma`, então o painel de arma da troca passa a aparecer nelas.
- As descrições de Odre e Ração no banco ainda diziam "Cura 2 PV" e "Cura 1d4 PV"; o seed grava o texto de Sustento. A cura em si já vinha do catálogo, então nada cura.
- As colunas `items.effects`, `armor_class`, `damage`, `level`, `weight`, `is_kit` e `requires_target` não são espelhadas pelo seed. `effects` ainda é lida por CA e equipar (`equipmentUtils`, `EquipmentSlots`, `InventoryList`), pela Resistência a Condição, pelas propriedades de armadura do diálogo de teste (desvantagem em Furtividade) e pelos consumíveis; cada uma sai quando seu passo (5, 6, consumíveis) mover a regra para o conteúdo. Só então a migration que apaga as colunas entra, junto do RLS (passo 7). `weight` hoje é sempre 0 e `is_kit` sempre falso.
- Deploy: aplicar as migrations **antes** de mesclar. O código novo procura por `slug`; o antigo continua achando os itens pelo nome, que a migration deixa igual ao do catálogo.

- **Recomendação mantida:** *refatorar* o motor; *reescrever* a camada de efeitos de item e habilidade (união discriminada interpretada pelo motor).
- **Risco:** alto, mitigado pela Onda 2.

### Onda 4: o restante, módulo por módulo
- **Camada de dados única:** `src/data-access/`, com react-query como cache. A supressão de `no-restricted-imports` vai a zero. `combatStore` deixa de escrever no banco.
- **Quebrar** `CharacterSheetView`, `ActiveSessionPage` e `PlayerTestDialog`. **Remover** os `@ts-nocheck` da criação de personagem e o código morto.
- **Padronização visual, em 3 passos:**
  1. **Tokens.** Primeiro PR da onda: os valores das variáveis CSS do shadcn passam a ser os da paleta da referência (`--background` = stone-900, `--card` = stone-800, `--primary` = amber-500…). As telas que já usam tokens convergem sem mexer em markup. Verificação visual com screenshot antes e depois, pela skill `run` (sem regressão visual automatizada).
  2. **Componentes compartilhados extraídos da referência:** `PageShell`, `Panel`, `PageHeader`, `ProgressBar`, `ChipToggle`, em `src/components/ui/`.
  3. **Migração por módulo:** cada PR de refatoração (sessão, combate, ficha, inventário, auth) troca classes fixas e cores avulsas pelos tokens e componentes. Quando a contagem estiver baixa, um gate ratchet (script que conta classes fora da paleta, falha se aumentar) impede a volta.
- **Recomendações:**
  - *Refatorar* a criação de personagem, **preservando o markup e o visual** (é a referência): tirar os `@ts-nocheck`, extrair as regras para o motor e trocar as classes fixas pelos tokens equivalentes sem mudar a aparência.
  - *Refatorar* sessão e combate (grandes, com realtime, alto risco de regressão).
- **Testes E2E (decisão do autor, 2026-10-18):** nenhum fluxo atrás de login foi testado no navegador durante a Onda 4. No fim, cada feature ganha um teste E2E e a suíte roda por inteiro. Precisa de um Supabase de teste (projeto separado ou Postgres local com as migrations) com usuários semeados; decidir a ferramenta e o ambiente quando a Onda 4 fechar.
- **Pronto quando:** `eslint-suppressions.json` está vazio ou próximo disso.

#### Passos da Onda 4 (planejados em 2026-10-18)
A ordem põe a camada de dados antes de quebrar os componentes, porque eles passam a consumi-la; os tokens visuais vêm cedo porque são independentes e baratos de desfazer.
1. **Limpeza.** `useItem` → `consumeItem` (era um falso positivo do `rules-of-hooks`, não um bug: é uma mutação assíncrona, não um hook); parâmetro sem uso e `let`/`catch` triviais; código morto (`ActiveSession/index.tsx`, `WelcomeCard.tsx`, `store/index.ts`, `scripts/check-sessions.js`). `PhysicalRollForm` fica: é a tela do ataque físico, da Onda 5. As variáveis sem uso que sobram estão em arquivos que os passos 4 e 5 reescrevem.
2. **Tokens visuais.** As variáveis CSS do shadcn passam aos valores da paleta de `docs/DESIGN.md`, com captura de tela antes e depois. Feito: `--background` stone-900, `--card` e `--popover` stone-800, `--primary` amber-600 (texto `stone-900`), `--secondary`, `--muted`, `--accent` e `--border` stone-700, `--input` stone-600, `--ring` amber-500, `--destructive` red-500. Cores avulsas (`slate`, `gray`, `blue`…) só saem na migração por módulo (passo 6).
3. **Camada de dados** (`src/data-access/`), por área: autenticação e sessão; personagem e inventário; combate (`combatStore` deixa de escrever no banco); testes e trocas. Cada área tipa as linhas com `database.types.ts`, o que tira os `any` do caminho, e zera as suas supressões de `no-restricted-imports`.
   - **3a, autenticação e sessão (feito):** `src/data-access/{auth,sessions,characters,realtime}.ts`; o `realtimeSubscriptions` de `src/lib` virou `realtime.ts`. As funções lançam o erro do Supabase e quem chama decide a mensagem (`getErrorMessage` em `src/lib/errorMessage.ts`). Saíram do Supabase direto: `authStore`, as 5 páginas de autenticação, o `Home`, `ActiveSessionPage`, os hooks da sessão e 6 componentes de `components/session`. O elenco da mesa agora tem tipo (`SessionPlayer`, `SessionNpc`, `SessionCharacter`); a asserção de `Json` para os tipos do app fica em `toCharacter`, num lugar só.
   - **Mudanças de comportamento da 3a (todas em caminho de erro):** os updates de Fé, visibilidade e descanso longo eram `await` sem checar o erro, então a tela mostrava sucesso mesmo com o banco recusando; agora o erro cai no `catch` que já existia (e o descanso longo avisa). `AuthCallbackPage` passa a cancelar o listener ao sair. A consulta da sessão ativa do Mestre na `Home` registra o erro em vez de engolir.
   - **3b, personagem e inventário (feito):** `data-access/characters.ts` ganhou o que era `characterApi` e `saveCharacter` (e `updateCharacterEquipment`, que morava em `lib/supabase`); `data-access/inventory.ts` (novo) tem a sincronização do inventário, o catálogo, as gravações num item, o consumo, a munição e `getItemFaithPenalty`; `data-access/vitals.ts` é o antigo `characterVitalsService` (agora com testes). `useAmmunition` foi para `src/hooks` e as duas hooks de inventário ficaram só com o estado. `CharacterSheetView`, `NPCInventoryManager` e `TokenContextMenu` não importam mais o cliente. Os dois `services` e a pasta `features/character-management/api` deixaram de existir.
   - **Achado da 3b, corrigido num `fix:` separado:** a consulta do inventário da ficha (`CharacterSheetView`) listava as colunas à mão e não trazia `items.slug`. Sem o slug, a CA de armadura, a Resistência a Condição, os avisos de equipar e o texto de CA/resistência por item (Onda 3) não apareciam na ficha; só funcionavam onde a linha vinha de `select('*')` (lista de personagens, mesa do Mestre). Agora `getCharacterInventory` traz o slug, com teste.
   - **Observado, não mexi:** o ramo de `updateCharacter` que refaz o inventário quando `equipment` muda não tem chamador (a ficha grava o equipamento por `updateCharacterEquipment`, e `Summary`/`useQuickSave` tiram `equipment` do envio). Fica como código parado.
   - **Mudanças de comportamento da 3b (caminhos de erro):** a busca da ficha do jogador na sessão (`findParticipantCharacterId`) agora lança o erro do Supabase em vez de ignorar e cair na ficha mais recente; `TokenContextMenu` registra a falha do uso do item em vez de descartá-la.
   - **3c, combate (feito):** `data-access/combat.ts` (novo) tem as leituras e gravações de `combats` e `combat_participants`; `data-access/conditions.ts` grava as Condições; `characters.ts` ganhou habilidades, estado de morte e a fonte da Resistência a Condição. As funções puras de Condição (`mergeCondition`, `removeCondition`, `tickConditions`, `cleanTemporaryConditions`) foram para `src/domain/conditions.ts`, o que fecha parte do "duração e tique das Condições ainda estão fora do motor". `combatStore`, `combatEngine`, `useDeathSaves` e `MasterDeathControls` não importam mais o cliente; o teste de caracterização do `combatStore` passou sem mudança. `conditionsService` deixou de existir.
   - **Mudanças de comportamento da 3c (caminhos de erro):** as leituras que eram ignoradas no início e no fim do combate (Condições, habilidades, fichas) continuam tolerantes, mas agora registram o erro; a rodada ainda avança se o tique de uma Condição falhar. O reset das habilidades de combate agora também registra falhas de gravação, que antes passavam sem aviso.
   - **3d, testes, trocas e criação de sessão (feito):** `data-access/trades.ts` (antigo `tradeService`, agora sem `any`), `data-access/sessionTests.ts` (leituras e gravações dos Testes de sessão) e, em `sessions.ts`/`characters.ts`/`inventory.ts`, as peças de `createGameSession` e `endSession`. `sessionService` e `sessionTestService` ficam em `src/services` só com a orquestração (ordem dos passos, tolerância a falha, aprovação e perda de Fé); `tradeService` deixou de existir. O `PlayerTestDialog` lê a ficha por `getCharacterTestContext`, `listCharacterItemEffects` e `getCharacterStats`. Os testes de caracterização dos três serviços passaram sem mudança de expectativa.
   - **Lint fechado:** `src/services/**` e `src/features/*/api/**` saíram da lista de exceções, e um seletor `no-restricted-syntax` pega `await import('@/lib/supabase')`, que `no-restricted-imports` não via. Só `src/data-access/**` e `src/lib/**` importam o cliente; a única supressão que sobra é a do `PhysicalRollForm` (parado, Onda 5).
   - **Mudanças de comportamento da 3d (caminhos de erro):** no `endSession`, as gravações que ignoravam o erro (apagar NPCs e inimigos, conceder level-up) agora caem no `catch` que já existia e registram a falha; o fluxo segue igual. O Teste que não é de Fé não lê mais os `stats` da ficha (a leitura nunca era usada). As leituras do `PlayerTestDialog` e do Teste de Fé registram a falha.
   - **Observado, não mexi (GAP):** se a leitura dos `stats` falha num Teste de Fé, o serviço cai na regra do teste comum (`resultado >= CD`) em vez de falhar, e a perda de Fé não é aplicada. Antes o erro passava em silêncio; agora é registrado. Decidir se a falha deve interromper o envio do resultado.
4. **Criação de personagem.** Tira os 5 `@ts-nocheck`, leva as regras para o motor e preserva o visual, que é a referência.
   - **Feito:** os 5 `@ts-nocheck` saíram. Quase tudo já tipava; o que faltava era código morto (um estado `rolls`, um `handleAssign` vazio, imports sem uso). As regras de atributos e de valores iniciais já estavam no motor desde a Onda 3; faltava a **loja inicial**, que agora é `src/domain/startingEquipment.ts` (carteira de 50 Siclos, compra, venda, Pacote Inicial, filtro por proficiência). `Summary` e `useQuickSave` dividem `withoutShop`. O markup não mudou (só um nome de constante no JSX). Cada passo ganhou teste de caracterização escrito antes da extração (loja, atributos, valores iniciais, resumo, salvar rápido); o da loja passou sem mudança depois de a regra sair do componente.
   - **Observado, não mexi (GAP):** (1) Pegar o Pacote Inicial **troca a bolsa inteira**; hoje ninguém perde item, porque o botão exige os 50 Siclos inteiros e nenhum item custa 0, mas a função não protege a bolsa se isso mudar. (2) Vender o kit devolve 50 fixos, não o `cost` gravado na linha; hoje os dois valem 50. (3) Os preços fracionados (0,5, 0,025…) entram na conta sem arredondar, então a carteira pode mostrar valores como `49.975`. (4) O Pacote Inicial só existe para as Vocações com kit em `KITS_DB`; uma Vocação fora da tabela (`Nobre`) vê a loja sem a aba e só com itens da categoria "Todas". Decidir se algum desses deve mudar.
   - **Fica para o passo 5:** `DraftCharacter.equipment` continua `any`. Na criação é uma lista de compras (`EquipmentItem[]`); na edição vem o `CharacterEquipment` (espaços vestidos) de `CharacterEdit`. Tipar como união estoura em `CharacterSheetView` e em `data-access/characters`, que tratam o campo de um jeito só.
5. **Quebrar** `CharacterSheetView`, `ActiveSessionPage` e `PlayerTestDialog`.
   Um PR por tela, cada um com teste de caracterização antes de dividir e comparação do HTML antes e depois.
   - **5a, `PlayerTestDialog` (feito):** 574 → 245 linhas. `useTestCharacterContext` lê a ficha, a Desvantagem de furtividade e a penalidade de Itens Profanos; `ChallengeCard`, `RollForm`, `BonusBreakdown`, `FaithPenaltyForm` e `SubmittedResult` (em `components/session/player-test/`) só desenham. As regras do dado do Teste (d100 na Fé, d20 nos demais), do total enviado, do intervalo 0–100 e do d6 da punição foram para `domain/sessionTests.ts`; a animação do dado virtual virou `lib/rollAnimation.ts`. O dado virtual deixou de usar `Math.random` direto e passa pelo `Rng` injetado (mesma fórmula). O HTML renderizado ficou idêntico ao antigo em oito estados (inicial, digitado, avisos, tela da punição, enviado aprovado e reprovado). Saíram os props `playerCharacters` e `onClose`, que ninguém lia.
   - **Observado, não mexi:** `Math.random` direto em regra ainda existe em `DeathSavesModal` (d20), `DiceRollerDialog` (dado livre) e `SessionRestControls` (1d4 da Fé do descanso). `getTestModifiers` e `getTestBreakdown` seguem em `features/character-management/utils/characterMath` com `any`; levar para o motor pede tipar a ficha primeiro (5c). A Desvantagem de furtividade só aparece como aviso; o app não rola 2 dados (ver Onda 2).
   - **5b, `ActiveSessionPage` (feito):** 702 → 262 linhas. Os hooks `useGameSession` (lê, acompanha em tempo real e avisa a virada para um novo dia), `useSessionPresence`, `useCombatToast` e `useSessionTradeActions` guardam dados e handlers; `SessionHeader`, `GmSessionView`, `PlayerSessionView`, `SpectatorView` e `CombatToast` (em `components/session/active-session/`) desenham. As regras foram para o motor: `domain/sessionTime.ts` (Manhã → Tarde → Noite → Manhã do dia seguinte, com os Descansos Curtos zerando na virada) e `domain/trades.ts` (qual troca é a minha, quando se pode abrir uma nova); `lib/combatEntities.ts` monta a lista de quem entra num combate. O HTML ficou idêntico ao da página antiga em dez cenários, com os filhos trocados por stubs que desenham as props, e os 65 casos do teste de caracterização passaram sem mudança (depois entraram mais 2, para mutantes que sobreviveram). O estado de presença virou `useMemo`, o que tira uma supressão de `set-state-in-effect` (128 → 126 no total).
   - **GAP, achado na 5b (pendente: o autor decide mais adiante):** o efeito de limpeza da tela deveria cancelar as trocas abertas quando o usuário sai, mas ele guarda as listas do **primeiro render** (o array de dependências é `[]`), quando as trocas ainda não chegaram. Na prática, nenhuma troca aberta é cancelada ao sair. Mantive exatamente assim (com um comentário no código e dois testes que fixam o comportamento). Para corrigir é preciso decidir: cancelar ao sair é mesmo o desejado (a troca pendente pode ser retomada ao voltar)? Corrigir vem num commit `fix:` separado.
   - **Observado, não mexi (5b):** `useSessionCharacters`/`useSessionTrades` ainda assinam o realtime com `Math.random()` no nome do canal (não é regra de jogo).
   - **5c, `CharacterSheetView` (feito):** 625 → 150 linhas. `useCharacterSheet` acha a ficha (a pedida, a do usuário na sessão ou a mais recente dele), lê o inventário e acompanha o tempo real; `useSheetActions` guarda tudo que grava a partir de um clique (equipar, Qualidade, resistências e efeitos dos itens, munição, usar e restaurar Habilidade). `SheetHeader`, `VitalsGrid`, `AttributesGrid`, `AbilitiesSection`, `NarrativeSection` e `EquipmentSection` (em `components/character/sheet/`) desenham. As regras de uso das Habilidades foram para `domain/abilityUse.ts` (usos que restam, Fé Insuficiente antes de Sem Usos, gastar um uso e o custo de Fé, restaurar). O HTML ficou idêntico ao da ficha antiga em nove cenários e os 48 casos do teste de caracterização passaram sem mudança (mais uma asserção para um mutante que sobreviveu). Saíram todos os `any` do arquivo (supressões 126 → 107).
   - **Fica para o passo 7:** `DraftCharacter.equipment` continua `any` (na criação é a lista de compras, na edição é o `CharacterEquipment`). Tipar como união estoura em `data-access/characters`, porque `updateCharacter` tem um ramo que sincroniza o inventário quando recebe `equipment` e **nenhum código chama esse ramo** (a ficha grava o equipamento por `updateCharacterEquipment`; `Summary` e o salvar rápido tiram o equipamento do envio). O caminho limpo é apagar esse ramo parado e tipar `Character.equipment` como `CharacterEquipment`; é uma remoção de comportamento, então peço a sua confirmação antes. `getTestModifiers`/`getTestBreakdown` seguem em `characterMath` com `any`.
   - **Observado, não mexi (5c):** a ficha do inimigo (skills em lista) nunca mostra a seção de Habilidades, só a de jogadores e NPCs com `skills` em objeto. O botão de usar Habilidade grava a Fé gasta em `stats.current_faith` mas não respeita o teto nem o piso do Sistema de Fé (a Fé só desce, então não estoura).
6. **Componentes compartilhados** (`PageShell`, `Panel`, `PageHeader`, `ProgressBar`, `ChipToggle`), migração por módulo e o gate ratchet de classes fora da paleta. Dividido em subpassos, um PR cada:
   - **6a, componentes (feito):** os cinco ficam em `src/components/ui/` (`page-shell`, `panel`, `page-header`, `progress-bar`, `chip-toggle`), extraídos do `WizardLayout`, que agora os usa. O teste de caracterização do `WizardLayout` (21 casos, escrito antes) passou sem mudança. O HTML renderizado ficou igual ao antigo em sete estados, a menos de: ordem das classes, os atributos acrescentados (`role="progressbar"` e `aria-value*` na barra, `aria-pressed` e `type="button"` nos chips) e o passo 10, que não existe (`nextStep`/`prevStep` seguram em 1–9): a barra deixou de passar de 100%. `docs/DESIGN.md` aponta para os componentes.
   - **6b, gate ratchet da paleta (feito):** `scripts/check-palette.mjs` (`npm run check:palette`, dentro do `npm run check` e do CI) conta, por arquivo de `src/`, as classes de cor fora da paleta (`bg`/`text`/`border`/`ring`/`from`/`via`/`to`/`divide`/`outline`/`fill`/`stroke`/`placeholder`/`accent`/`caret`/`decoration`/`shadow` com `slate`, `gray`, `zinc`, `neutral`, `orange`, `yellow`, `lime`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, ou hexadecimal arbitrário). A dívida atual fica em `palette-baseline.json` (92 usos em 24 arquivos) e só diminui: arquivo com mais usos que a baseline falha, arquivo com menos também, até `npm run check:palette -- --update`, que se recusa a subir um número. Ficam de fora: testes, `src/test/`, `src/content/conditions.ts` (cores de Condição), `rgba(...)` dentro de sombras arbitrárias, e `white`/`black`. 58 testes cobrem o que conta, o que não conta, a comparação e o comando (código de saída, `--update`).
   - **Observado, não mexi (6b):** `text-white` (37 usos) e `bg-black/NN` (fundos de diálogo) ficam fora do gate; o `DESIGN.md` pede `text-stone-100` para o texto principal, mas a decisão do autor sobre cores só tratou das cores de estado. Se quiser, o `white` entra no gate numa próxima rodada (trocar por `stone-100` muda um pouco o tom). Sombras com `rgba(...)` de âmbar e vermelho (brilhos) também não são contadas.
   - **6c em diante, migração por módulo:** um PR por módulo, na ordem ficha e gestão de personagens, inventário, mesa de sessão, Testes de sessão, combate. Auth já estava dentro da paleta. A cada módulo, baixar a baseline com `--update`; só as classes de cor mudam, e o corpo do PR lista o que a cor distinguia e onde a diferença foi parar.
   - **6c-1, ficha e gestão de personagens (feito):** `App.tsx` (Home), `SheetHeader`, `VitalsGrid` e `CharacterList`, 14 usos (baseline 92 → 78). Mapa aplicado: o bônus de CA e o ícone de Proficiência (azul) viram âmbar, que é o acento dos números que somam; a etiqueta "Resistência" (índigo) vira pedra, por ser apoio; o cartão de moedas (amarelo) vira âmbar; o botão "Entrar" da Home (azul) usa a receita do botão secundário do `DESIGN.md` (pedra, texto âmbar); o spinner (índigo) vira âmbar. **Diferença que a cor carregava:** o cartão de moedas "SP" e o de "Fé" ficam da mesma cor; o ícone (`Coins` × `Sparkles`) e o rótulo (SP × Fé) já os distinguiam, então nada foi acrescentado.
   - **6c-2, inventário (feito):** `InventoryList` e `EquipmentSlots`, 7 usos (baseline 78 → 71). Mapa: o selo "CA x" da armadura (azul) vira um selo de pedra (`bg-stone-700 text-stone-200`, apoio); o "🛡️ CA" do espaço equipado (azul) vira `text-stone-300`; o selo "Resiste: …" que o Mestre acrescenta ao item (índigo) vira pedra. **Diferença que a cor carregava:** a Resistência a Condição que o item já dá (âmbar) e a personalizada (índigo) tinham o mesmo texto "Resiste: X" e só a cor as separava. Agora a personalizada é de pedra e leva `title="Resistência personalizada"`, com dois testes novos (um prova que a nota aparece só nela). Se quiser a diferença visível sem passar o mouse, dá para escrever "Personalizada" no selo. **Observado, não mexi:** o verde de `InventoryList`/`EquipmentSlots` (botão Equipar, selos "CA" e "Equipado", marcador "Equipado") passa no gate, porque verde é da paleta, mas é verde para "equipado/positivo" e não para "sucesso" no sentido estrito do `DESIGN.md`; decidir se fica.
   - **6c-3, mesa de sessão (feito):** `PlayerCard`, `PlayerRestIndicator`, `SessionRestControls`, `SessionNPCList`, `SessionEnemyList`, `PlayerSessionView` e `TradeSide`, 32 usos (baseline 71 → 39). Mapa: o selo "🎲 Testando..." (azul) vira âmbar e o "⚖️ Negociando..." (roxo) vira pedra; o ícone de CA do cartão (azul) e o ⛨ das listas de NPC e inimigos (azul) viram `stone-400`; o Descanso Curto (esmeralda) vira verde e o Longo (índigo) vira âmbar, no aviso do jogador e nos botões do Mestre; o selo "Visão do Jogador" (azul) vira um painel de pedra com título âmbar; o selo de resistência personalizada da troca (índigo) vira pedra com `title="Resistência personalizada"`, como no inventário. **Diferenças que a cor carregava:** Testando × Negociando, Descanso Curto × Longo e as três visões (Mestre âmbar, Jogador pedra com título âmbar, Espectador pedra com título pedra) já se distinguiam por texto e emoji ou ícone (Coffee × Moon); a cor ficou só como reforço, e os testes novos fixam isso (os dois selos não têm a mesma aparência; os dois descansos têm ícones diferentes). Antes desta etapa `PlayerCard`, `PlayerRestIndicator` e `TradeSide` não tinham teste direto: agora têm 14 + 3 casos, com mutantes mortos (o selo de Teste e o de troca não aparecem para o Mestre da sessão; o Curto vale com menos de 2 no dia; o Longo, com 2 dias desde o último). **Dúvida registrada:** o aviso e o botão do Descanso Curto ficaram verdes, e "descanso disponível" não é "sucesso" no sentido estrito do `DESIGN.md`; é a leitura de esmeralda → verde que a decisão do autor deu.
   - **6c-4, Testes de sessão (feito):** `MasterTestDialog`, `RollForm`, `SubmittedResult` e `BonusBreakdown`, 9 usos (baseline 39 → 30). Mapa: o selo "Aprovado" do Mestre e o "Aprovado!" do jogador (esmeralda) viram verde, no mesmo tom e opacidade do "Reprovado" vermelho ao lado, que é o caso de sucesso de verdade; o aviso "⚠️ Profanação" (roxo) vira âmbar, a cor de aviso do `DESIGN.md`; o "+N" da proficiência na conta do dado (esmeralda) vira verde. **Diferenças que a cor carregava:** Aprovado × Reprovado, Profanação × Desvantagem (âmbar × vermelho) e Mod × Prof já se distinguiam por texto e rótulo ("Mod" e "Prof" em cima de cada número); os testes novos fixam que o selo de aprovado e o de reprovado não têm a mesma aparência e que Mod e Prof também não. `SubmittedResult` e `BonusBreakdown` não tinham teste direto: agora têm 12 casos (aprovação, perda de Fé no Teste de Fé reprovado, os dois botões de fechar, a proficiência só quando existe, sinal do modificador). **Dúvida registrada:** o "+N" da proficiência em verde segue o mapa esmeralda → verde, mas é um bônus, não um sucesso; se preferir âmbar, o rótulo "Prof" já a distingue do "Mod". **Observado, não mexi:** `MasterTestDialog` (384 linhas) continua sem teste direto; o selo Aprovado/Reprovado dele só mudou de classe.
   - **6c-5, combate (feito):** `AbilityCard`, `DeathSavesModal`, `MasterDeathControls`, `PhysicalRollForm`, `CombatDashboard`, `EnemyCard` e `EnemySheet`, 30 usos (baseline 30 → 0). **Passo 6 fechado: a dívida de paleta está zerada**; `palette-baseline.json` ficou vazio e qualquer cor fora de pedra, âmbar, vermelho e verde falha o `npm run check`. Mapa: o chip de tipo de ação da Habilidade tinha cinco cores (azul, roxo, laranja, verde, cinza) e passa a ter duas: âmbar para o que se faz (Ação, Ação Bônus, Reação, Ação Livre) e pedra para a Passiva, porque a paleta só tem quatro cores e o texto do chip já dá o tipo; o cartão (`#1C1C24` e cinza) vira `stone-900`/`stone-800`; o Teste de Morte em andamento (laranja) vira âmbar, com Morto vermelho e Estável verde; os controles de morte do Mestre (laranja) viram âmbar; o selo "Proficiente" do ataque físico (esmeralda) vira verde; a CA total do painel de combate (azul) usa o texto normal, a CA do cartão de inimigo vira `stone-300` e o escudo da ficha do inimigo vira `stone-400`. **Diferenças que a cor carregava:** os cinco tipos de ação já se distinguiam por texto ("Ação", "Ação Bônus", "Reação", "Ação Livre", "Passiva"); os três estados do Teste de Morte, pelo título ("Você Morreu", "Estável", "Teste de Morte"). Os testes novos fixam os dois. `AbilityCard`, `DeathSavesModal` e `MasterDeathControls` não tinham teste direto: agora têm 58 casos (rótulos de uso, quando "Usar" está liberado, quando o Mestre restaura, os estados e as marcas do Teste de Morte, o que cada d20 causa, quais botões do Mestre ficam liberados em cada estado). **Dúvida registrada:** se você quer uma cor por tipo de ação, a paleta não comporta cinco; as opções são manter assim (texto distingue) ou escolher quais tipos dividem a cor. **Observado, não mexi:** (1) o botão "Rolar Auto" trocou `hover:text-white` por `hover:text-stone-900`, porque branco sobre âmbar quase não tem contraste; os botões verdes de `MasterDeathControls` seguem com `hover:text-white`; (2) `AbilityCard.canUse` tem uma checagem de Passiva que nunca muda o resultado (o botão já não existe para Passiva); (3) o d20 do "Rolar Auto" ainda usa `Math.random` direto (registrado no passo 5a).
   - **Decisão do autor (cores semânticas, 2026-10-20):** a paleta ganha só o **verde** para sucesso; o resto sai. Mapa para a migração: verde e esmeralda → verde de sucesso; cinza e ardósia → `stone`; laranja e amarelo → `amber` (aviso); azul, índigo e roxo → `stone` ou `amber`, conforme o papel (destaque vira `amber`, apoio vira `stone`). Vermelho continua só para erro e perigo. Onde a cor era o único jeito de distinguir dois estados lado a lado (Descanso Curto × Longo, jogador × NPC), a distinção passa para o texto ou o ícone, e o PR da migração lista cada caso. As cores de condição de `src/content/conditions.ts` seguem como exceção. Com o verde dentro da paleta, a dívida medida pelo gate é de 92 usos em 24 arquivos.
7. **Resíduo** de `any`, `set-state-in-effect` e `only-export-components`. Mapa feito em 2026-10-20: 107 supressões em 41 arquivos (`any` 91, `set-state-in-effect` 7, `unused-vars` 4, `only-export-components` 3, `immutability` 1, `no-restricted-imports` 1). Um PR por tema:
   - **7a, regras que não são `any` (feito):** `buttonVariants`, `badgeVariants` e `useFormField` só eram usados dentro do próprio arquivo shadcn, então deixaram de ser exportados (3 supressões de `only-export-components`). Três props sem uso saíram junto com os chamadores: `sessionId` de `CombatDashboard` e de `PlayerCombatView`, e `character` de `PlayerRestIndicator` (3 de `unused-vars`; os testes que citavam esses props foram ajustados). O `catch (e: any)` do `TradeDialog` usa `getErrorMessage`, que também lê a mensagem de erro do Supabase (objeto, não `Error`). O `TradeDialog` ganhou o teste de caracterização que faltava (33 casos: título por tipo, quem edita cada lado, execução automática, falha, cancelamento). Supressões 107 → 99.
   - **GAP, achado na 7a (pendente: o autor decide):** o efeito do `TradeDialog` que executa a troca quando os dois lados estão prontos depende de `executing`. Ao fim da execução, `executing` volta a `false`, o efeito roda de novo e, se a troca ainda chega como "os dois prontos e ativa" (o recarregamento é assíncrono), `executeTrade` é chamado uma **segunda vez**: o servidor responde `Trade não está ativa` (não há transferência dupla), mas o diálogo mostra esse erro, apaga o erro anterior ao recomeçar e grava `setReady(false)` nos dois lados. Dois testes fixam isso (`GAP:`). O jogador e o alvo também podem chamar `execute_trade` ao mesmo tempo, cada um no seu navegador. Decidir: impedir a nova tentativa até a prontidão mudar? Corrigir vem num commit `fix:` separado.
   - **7b, `set-state-in-effect` (feito, 8 supressões):** três padrões. (1) **Carregar ao entrar ou ao trocar de sessão** (`useSessionTrades`, `useSessionTests`, `useSessionCharacters`, `useActiveSession`): o `loading` ligado na troca de sessão (ou de objeto de usuário) agora é ajustado durante a renderização, que é o jeito que a documentação do React recomenda; a consulta do efeito deixou de ligar o `loading` por conta própria (ele já começa ligado); o `refresh` e o realtime continuam ligando antes de consultar. O tratamento de falha saiu da função que o efeito chama e foi para quem chama (`.catch(logFetchError)`), porque o React Compiler marca como `set-state-in-effect` qualquer função chamada no efeito que tenha `catch` e grave estado. (2) **Zerar o formulário quando muda a entrada** (`DiceRollerDialog` ao abrir, `PlayerTestDialog` ao chegar um Teste, `TradeSide` com as moedas da troca): também ajustado durante a renderização. (3) **Executar a troca quando os dois lados estão prontos** (`TradeDialog`): a execução virou uma `useMutation` do react-query (já usado no projeto, com o provider em `main.tsx`), que dispara no efeito sem gravar estado de forma síncrona; o `immutability` que escondia esse erro some junto. Todos os testes de caracterização (escritos antes: 28 dos três hooks novos, 15 do rolador de dados, 4 das moedas, 2 do reset do Teste e os 33 do `TradeDialog`) passam iguais contra o código antigo e o novo; os mutantes que sobreviveram (o `loading` na atualização, a falha vinda do realtime, quem dispara o reset do `PlayerTestDialog`, o erro e a tela da punição que somem) ganharam teste. Supressões 99 → 91 (`set-state-in-effect` 7 → 0, `immutability` 1 → 0). Efeitos de bordo: a troca de sessão não passa mais por um quadro com a sessão nova e `loading` desligado, e `useActiveSession` sem usuário não passa por um quadro com `loading` ligado. Nota para os testes do `TradeDialog`: a mutation só mostra "executando" se a chamada durar mais que um ciclo do navegador (a rede sempre dura), então os testes do GAP usam uma chamada com atraso de 20 ms, e o teste agora precisa do `QueryClientProvider`.
   - **GAP, achado na 7b (pendente: o autor decide):** o `PlayerTestDialog` zera o formulário (valor digitado, aviso de erro, tela da punição, "ocultar janela") sempre que `activeTest` ou `testResult` chegam como **objetos novos**, mesmo sendo o mesmo Teste. `useSessionTests` recarrega a lista inteira a cada mudança de qualquer resultado de Teste da sessão (o realtime de `session_test_results` não filtra por Teste), então um jogador digitando o valor do dado perde o que digitou quando outro jogador envia o dele. Dois testes marcados `GAP:` fixam isso. Para corrigir, o reset teria de depender dos ids do Teste e do resultado (e não da identidade dos objetos). Corrigir vem num commit `fix:` separado.
   - **7c, ficha (feito, 16 `any`):** `characterMath` (6), `LevelUpWizard` (8), `CharacterSavingThrows` e `CharacterSkillsList` (1 cada). Só tipos, sem mudar regra. `characterMath` ganhou a forma `TestSheet` para a ficha que o cálculo do Teste lê (os campos `jsonb` ficam `unknown`, lidos por dois leitores pequenos que fazem a mesma consulta de antes); os dois componentes tipam `attributes` como `Partial<CharacterAttributes>`; o `LevelUpWizard` tipa `stats`, `attributes`, o Caminho (`'A' | 'B'`, com o formato antigo em texto convertido por `toPathChoices`) e a escolha de atributo (`keyof CharacterAttributes`), e lê a mensagem de erro com `getErrorMessage`. Dois `as` ficam, ambos na gravação: `stats` e `attributes` são lidos de forma defensiva (`Partial`, `|| 10`) porque fichas antigas podem não ter todas as chaves, mas `updateCharacter` pede o tipo completo. Testes de caracterização escritos antes (o `LevelUpWizard` não tinha nenhum: 24; `CharacterSavingThrows` 7; `CharacterSkillsList` 6; os 28 de `testModifiers` já existiam) passam iguais contra o código antigo e o novo, e 17 mutantes foram todos mortos. Supressões 91 → 75 (`any` 89 → 73). Efeito de bordo: um valor de atributo inválido vindo do `<select>` (que nenhuma opção produz) agora vira "sem escolha" em vez de ser gravado como chave.
  - **Observação, 7c (sem efeito visível; o autor decide se corrige):** o `LevelUpWizard` copia `character.skills` só no primeiro nível (`{ ...skills }`), então `path_choices`, `tribe` e `vocation` continuam sendo os mesmos objetos da ficha carregada, e a gravação os altera no lugar antes de o `updateCharacter` confirmar. Se a gravação falha, o objeto da tela já tem o Caminho novo. Como a nova tentativa grava o mesmo Caminho por cima, nada muda para o jogador. O tipado preserva isso; corrigir é copiar os dois mapas (`{ ...tribe }`), num commit `fix:` separado.
   - **7d, equipamento (a fazer, 24 `any`; precisa da sua confirmação):** `equipmentUtils`, `EquipmentSlots`, `InventoryList`, `NPCInventoryManager`, `CharacterEdit`, `DraftCharacter`, `CharacterList`. Destrava com a remoção do ramo morto de `updateCharacter` (ver "Fica para o passo 7" acima).
   - **7e, mesa de sessão (a fazer, 35 `any`):** `SessionParticipantList` (14), `MasterTestDialog` (4), `PlayerCard` (4), `SessionRestControls` (3), `createSessionStore` (2) e mais 8 arquivos com 1.
   - **7f, combate (a fazer, 12 `any`):** `EnemySheet` (4), `CombatDashboard` (3), `PlayerCombatView` (2), `DeathSavesModal`, `EnemyCard`, `combatEngine` (1 cada).
   - **Fica para a Onda 5:** `PhysicalRollForm` (4: 2 `any`, 1 `unused-vars`, 1 `no-restricted-imports`), a tela parada do ataque físico, que vai ser reescrita.

### Onda 5 em diante: features novas
Cada uma passa por grill-with-docs → `/to-spec` → `/to-tickets` → `/tdd`, e só começa depois que a área que ela toca foi refatorada. A lista de features do prompt estava vazia; preencher no ROADMAP.

## 6. O que VOCÊ precisa fazer fora do código
1. Rodar `/setup-matt-pocock-skills` no passo 12 da Onda 1.
2. **GitHub:** proteger a branch `main`, exigindo o check `ci` e o deploy da Vercel antes do merge (sem isso o CI não bloqueia de fato). Ativar Dependabot alerts.
3. **Supabase**
   - ~~Verificar se o projeto está pausado.~~ Estava pausado; reativado em 2026-10-17. O plano gratuito pausa por inatividade, então o app pode cair de novo.
   - ~~Conferir RLS de `characters` e rodar o Security Advisor.~~ Feito (ver §4). A proteção contra senhas vazadas não aparece no menu do plano gratuito (provável recurso do Pro, não confirmado); fica como risco aceito enquanto o projeto for gratuito.
   - ~~Login e link do CLI.~~ Feito em 2026-10-17.
4. **Vercel:** confirmar que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão em Production e Preview e que **nenhuma** `SUPABASE_SERVICE_ROLE_KEY` está lá (o app não precisa dela). Não consegui conferir: o MCP da Vercel deu 403 no time e o CLI não está logado (`vercel login`).
5. Revisar os 13 itens de conteúdo bíblico do §2.
6. Preencher a lista de features novas.
7. Revisar `docs/DESIGN.md` (Onda 1, passo 12) e dizer se falta algo do padrão da criação de personagem que você quer manter.

## Verificação da Onda 1
- `npm run check` passa localmente; `npm run build` passa depois do commit do Prettier.
- Para cada gate (format, lint, typecheck, dados, RLS): introduzir uma violação, rodar o comando, mostrar a falha, reverter com `git checkout`/`git stash`.
- Os hooks disparam num commit e num push de teste.
- Abrir um PR (com sua confirmação antes do push) e ver o job `ci` verde.
- `grep -ri speckit` sem resultados fora do ROADMAP e da tag.

---

## Dívida congelada pelos gates
Os gates bloqueiam dívida **nova**; a existente fica registrada aqui e só pode diminuir.

### Lint: `eslint-suppressions.json` (75 em 2026-10-22)
| Regra | Qtde |
|---|---|
| `@typescript-eslint/no-explicit-any` | 73 |
| `no-restricted-imports` (Supabase fora da camada de dados) | 1 |
| `@typescript-eslint/no-unused-vars` | 1 |

Só restam `any` e as duas do `PhysicalRollForm` (a tela parada do ataque físico, Onda 5).

Ao corrigir uma violação, rode `npm run lint:prune`; o lint falha enquanto houver supressão órfã.

### Paleta: `palette-baseline.json` (zerada em 2026-10-20)
Os 92 usos de cor fora da paleta que o gate encontrou no passo 6b foram migrados nos PRs 6c-1 a 6c-5. A baseline ficou `{}`: qualquer classe `slate`, `gray`, `orange`, `blue`, `indigo`, `purple`, `emerald`… ou hexadecimal arbitrário em `src/` falha o `npm run check`. Ficam de fora do gate (ver 6b): `white`/`black`, brilhos em `rgba(...)`, testes e as cores de Condição.

### Typecheck
Nenhum arquivo com `@ts-nocheck` (os 5 da criação de personagem saíram no passo 4 da Onda 4).

`scripts/*.ts` não entram em nenhum tsconfig (só no lint).

### Dados: `src/content/known-violations.json` (vazio desde 2026-10-17)
Todas são o mesmo problema: `conditionResistances` de itens usa IDs em inglês (`poisoned`, `bleeding`, `frightened`, `grappled`, `stunned`, `blinded`, `restrained`) que não existem em `src/content/conditions.ts` (IDs em português). Corrigido no catálogo e no banco (seed do passo 4(a)); a lista ficou vazia.

O gate de dados cobre Condições, itens, kits e habilidades (esquema, referências cruzadas, estrutura das tribos e as tabelas dos docs). Fora dele: `src/data/npcPresets.json`.
