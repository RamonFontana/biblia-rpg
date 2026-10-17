# Roadmap — RPG Bíblico

> Documento vivo. Gerado na análise de 2026-10-16 e atualizado ao fim de cada onda.
> Para continuar numa sessão nova: leia **Status** e a seção da próxima onda; não refaça a análise.

## Status
| Onda | Estado |
|---|---|
| 1 — Fundação | concluída (PR #1 mesclado). Falta só proteger a `main` no GitHub (o sistema bloqueou a minha tentativa via `gh api`; o autor configura no GitHub) |
| 2 — Rede de segurança | em andamento. Feito: grill, glossário, ADRs 0001–0002, correções de doc (bloco A, PR #9) e testes de caracterização das regras (PRs #10 e #11, ver abaixo). Caracterização concluída (faltam só as funções SQL e o tempo real, ver abaixo). Próximo: as correções de código (bloco B) |
| 3 — Motor e dados | pendente |
| 4 — Restante + padronização visual | pendente |
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
- `endCombat` deixa o personagem Morrendo em vez de matar (`vitalsUtils.ts:43`, `characterVitalsService.ts:69`). O fim da sessão também.
- Descanso Longo 1 por dia (hoje a cada 2). Descanso Curto recarrega habilidades mesmo sem cura (`SessionRestControls.tsx:53`).
- `conditionResistances` dos itens usam os IDs em português do catálogo (zera `known-violations.json`). O ID `assustado` vira `amedrontado` com migração de dados (Onda 3). Condições Impedido, Paralisado e Exausto entram no catálogo.
- Sangrando: descrição passa a dizer final do turno (`conditions.ts:13`).
- "Sábio" é alias de Sacerdote; Nobre e `tribeSkills.ts` são removidos.
- Itens: textos de Odre e Ração perdem "Cura"; Caçador recebe 20 flechas.
- **Precisam de lista de fichas afetadas antes de aplicar:** CA com teto de DES (média +2, pesada sem DES, aviso de FOR em vez de bloqueio) e proficiências de armadura conforme os docs de vocação.
- Recuperação de munição segue automática (50%); o 1d4 de Fé do Descanso Longo é digitado pelo Mestre; rolagens de jogador são digitadas, com Rolagem Virtual opcional (ADR 0001).

**C. Features novas** (Onda 5, via `/to-spec` → `/to-tickets` → `/tdd`)
1. Tipos de Teste de Fé no app: Clamor (atalhos + Pedido Egoísta), Tentação e Testemunho.
2. Sustento no Descanso Longo: tela de confirmação do Mestre (inclui NPCs aliados, desmarcável), aviso no celular de cada jogador e Exausto automático.
3. Efeitos do Estado de Fé: Inspiração (Inabalável), desvantagem (Abalado), Ruptura.
4. Dados de Vida nos descansos.

**Sincronizar o código com os docs já corrigidos** (junto do bloco B, Onda 3, ao migrar `abilities.ts` para `src/content/`)
- `abilities.ts`: efeito de Zebulom nível 8 (sem Encantado; vantagem em Testes de Fé de Tentação), de Aser níveis 1 e 12 (refeição sem ração; Exausto no lugar de "exaustão") e de Sacerdote nível 18 (sem Encantado).
- `itemsDb.ts`: descrições de Odre e Ração sem "Cura"; adicionar 20 Flechas ao kit do Caçador (`VOCATION_KIT_ITEMS`).
- `KITS_DB`: textos dos kits iguais aos do `criacao-de-personagem.md`; kit do Sábio é o do Sacerdote.
- `bestiario`: o endemoniado não tem mais imunidade a Encantado (campo de condição no preset, se existir).

**Pendências (nenhuma decisão ainda)**
- **Vantagem e Desvantagem num Teste de Fé** (1d100, passa se ≤ Fé Efetiva + Modificador): como o teste passa com resultado BAIXO, Vantagem deve usar o **menor** dos dois dados e Desvantagem o **maior**. Assumido assim, mas confirme antes de implementar. Afeta Fortaleza (Vantagem), Zebulom nível 8 e Abalado.
- **Valores do Modificador de Fé** para Tentação e Testemunho: os guias descrevem níveis (Misericórdia / sem modificador / Punição), sem números. Só o Clamor tem atalhos (0 / −20 / −50).
- **"TR de Fé"** aparece nas habilidades (ex.: Aser "Vigor do Azeite", Juda "Coração de Leão"). Decidir se é Teste de Fé ou um teste de resistência de Sabedoria.
- Efeito exato de Vulnerável além do Testemunho frequente.
- Definição de Ruptura em termos de app (hoje só texto de doc).
- Dados de Vida: o doc os cita nos descansos, o código não os implementa (feature C4).
- **Testes de Morte**: o 1 natural contar duas falhas e o 20 natural voltar com 1 PV já estavam no código e passaram para o `regras-base.md` e o glossário sem pergunta explícita. Confirmar que valem.

### Onda 3: motor e dados
- **`src/domain/`:** motor puro. `rng.ts` com um `Rng` injetável (seed); `dice`, `attributes`, `proficiency`, `armorClass`, `vitals` (reaproveitar `vitalsUtils.ts`), `faith` (`getCurrentFaith`), `conditions`, `rest`, `deathSaves`, `ammo`. Tudo migra de componentes e services para cá, um módulo por PR, com os testes da Onda 2 ficando verdes.
- **`src/content/`:** definições tipadas e validadas por zod. Os efeitos passam a ser uma união discriminada (`{type:'heal', dice:'1d4'}`, `{type:'applyCondition', id, duration}`, `{type:'acBonus', value}`), interpretada pelo motor.
  - Ordem: condições, itens, kits, habilidades.
  - Os IDs de habilidade são **preservados** (chaves no banco).
  - O gate da Onda 1 passa a validar o schema novo e a lista de `known-violations` encolhe.
- **Supabase:** com o CLI aprovado, `supabase db pull` gera a migration-base (inclui `characters`) e `gen types` vira script. Depois, migrations de correção de RLS e `search_path` (cada uma com sua confirmação), e o gate de RLS passa a cobrir tudo.
- **Recomendação:** *refatorar* o motor (a lógica existe e é testável depois de extraída); *reescrever* a camada de efeitos de item e habilidade (hoje é texto livre e `jsonb` sem contrato, não há o que aproveitar).
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
- **Avaliar:** 1–2 smoke tests E2E contra o preview da Vercel (login → abrir ficha), só se as regressões de UI incomodarem.
- **Pronto quando:** `eslint-suppressions.json` está vazio ou próximo disso.

### Onda 5 em diante: features novas
Cada uma passa por grill-with-docs → `/to-spec` → `/to-tickets` → `/tdd`, e só começa depois que a área que ela toca foi refatorada. A lista de features do prompt estava vazia; preencher no ROADMAP.

## 6. O que VOCÊ precisa fazer fora do código
1. Rodar `/setup-matt-pocock-skills` no passo 12 da Onda 1.
2. **GitHub:** proteger a branch `main`, exigindo o check `ci` e o deploy da Vercel antes do merge (sem isso o CI não bloqueia de fato). Ativar Dependabot alerts.
3. **Supabase**
   - ~~Verificar se o projeto está pausado.~~ Estava pausado; reativado em 2026-10-17. O plano gratuito pausa por inatividade, então o app pode cair de novo.
   - ~~Conferir RLS de `characters` e rodar o Security Advisor.~~ Feito (ver §4). A proteção contra senhas vazadas não aparece no menu do plano gratuito (provável recurso do Pro, não confirmado); fica como risco aceito enquanto o projeto for gratuito.
   - Ter a senha do banco à mão para o `supabase db pull` na Onda 3.
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

### Lint: `eslint-suppressions.json` (298 em 2026-10-17)
| Regra | Qtde |
|---|---|
| `@typescript-eslint/no-explicit-any` | 223 |
| `no-restricted-imports` (Supabase fora da camada de dados) | 29 |
| `@typescript-eslint/no-unused-vars` | 22 |
| `react-hooks/set-state-in-effect` | 8 |
| `prefer-const` | 6 |
| `@typescript-eslint/ban-ts-comment` (os `@ts-nocheck` abaixo) | 5 |
| `react-refresh/only-export-components` | 3 |
| `react-hooks/rules-of-hooks` (**possível bug real, ver na Onda 4**) | 1 |
| `react-hooks/immutability` | 1 |

Ao corrigir uma violação, rode `npm run lint:prune`; o lint falha enquanto houver supressão órfã.

### Typecheck: arquivos com `// @ts-nocheck`
O `tsc` passa com `strict`, mas estes arquivos não são checados (todos da criação de personagem, tratados na Onda 4):
- `src/pages/CharacterCreationPage.tsx`
- `src/features/character-creation/components/steps/AttributeGeneration.tsx`
- `src/features/character-creation/components/steps/EquipmentMerchant.tsx`
- `src/features/character-creation/components/steps/InitialStats.tsx`
- `src/features/character-creation/components/steps/Summary.tsx`

`scripts/*.ts` não entram em nenhum tsconfig (só no lint).

### Dados: `src/data/known-violations.json` (13 em 2026-10-17)
Todas são o mesmo problema: `conditionResistances` de itens usa IDs em inglês (`poisoned`, `bleeding`, `frightened`, `grappled`, `stunned`, `blinded`, `restrained`) que não existem em `src/data/conditions.ts` (IDs em português). Resolver junto com a decisão "vocabulário canônico de condições" (Onda 2/3).

Ainda fora do gate de dados (precisa mover código, Onda 3): `VOCATION_KIT_ITEMS` em `src/features/character-management/api/syncInventory.ts` (itens dos kits por nome), os seeds SQL e `src/data/tribeSkills.ts`.
