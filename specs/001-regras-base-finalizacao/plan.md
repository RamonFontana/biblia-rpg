# Feature Implementation Plan: Finalização das Regras Base do RPG Bíblico

**Branch**: `001-regras-base-finalizacao` | **Date**: 2026-06-14 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/001-regras-base-finalizacao/spec.md)

**Input**: Feature specification from `/specs/001-regras-base-finalizacao/spec.md`

## Summary

O objetivo primário é melhorar e expandir o documento atual `regras-base.md` para incluir regras essenciais faltantes (combate, criação de personagem, progressão, equipamento) e completar o repositório de Tribos (faltam 6: Dã, Naftali, Aser, Zebulom, Efraim, Manassés). Por fim, o projeto estabelece formalmente a terminologia "Vocação" e determina as habilidades destas com progressão nos níveis 2/6/10/14/18. O plano abaixo traduz a *spec* para execução técnica faseada, terminando com o inventário do que ficará faltando ("Bestiário" etc.).

## User Review Required

> [!IMPORTANT]
> - O conteúdo do **Combate** e **Equipamento** será em grande parte "adaptado do D&D 5e sem magia". Confirmar se o nível de detalhe deve ser "resumo direto" ou "seções completas de combate com 5 páginas". Por padrão, usaremos a abordagem de resumo direto para agilidade.
> - As passivas e mecânicas inventadas para as **6 Novas Tribos** serão submetidas nas Pull Requests subsequentes. O plano propõe criá-las em um formato de *draft* para sua validação.

## Technical Context

**Language/Version**: N/A (Markdown Documents)

**Primary Dependencies**: Markdown (GitHub Flavored)

**Storage**: Arquivos `.md` no diretório `docs/`

**Testing**: Revisão manual cruzada com `constitution.md`

**Target Platform**: GitHub / Web VTT (potencial leitura)

**Project Type**: RPG de Mesa / Tabletop RPG Documentation

**Performance Goals**: Leitura rápida e referências claras.

**Constraints**: Fidelidade à Constituição (sem magia, época específica, regra de Levi).

**Scale/Scope**: ~15 arquivos Markdown com até 300 linhas cada no total.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Sem Magia):** Pass. O novo guia de criação e vocações não trará magias arcanas.
- **Princípio II (Sem Itens Mágicos):** Pass. Os equipamentos listados (BR-006) serão limitados a Bronze/Ferro.
- **Princípio III (Fé):** Pass. Já clarificado (Fé inicial 50, Levi 60).
- **Princípio IV (Tribos como Raças):** Pass. Serão 13 tribos no total, mantendo a progressão padrão 1/4/8/12/16/20.
- **Princípio V (Regra de Levi):** Pass. Será forçada no guia de criação e mencionada na Vocação.
- **Princípio VI (Docs):** Pass. Todo este trabalho é de documentação.

## Proposed Changes

---

### `docs/` (Núcleo)

#### [MODIFY] [regras-base.md](file:///Users/take5dev1/projects/rpg-biblico/docs/regras-base.md)
O arquivo existente será reconstruído/expandido para conter:
1. Atributos (Atualizar texto com o método Standard Array ou 4d6drop1)
2. Vocações (Detalhar Guerreiro, Batedor, Caçador, Sacerdote/Sábio, definindo a progressão 2/6/10/14/18 e atualizando "Classe" para "Vocação").
3. Sistema de Fé (Incorporar regras de inicialização: base 50, Levi 60).
4. Sistema de Combate (Iniciativa, Ações no Turno, Dano, HP, Descansos, Condições).
5. Criação de Personagem (6 passos: Tribo, Atributos, Vocação, Fortaleza/Tentação, HP/CA/Fé, Equipamento).
6. Progressão de Nível (Explicar intercalação Tribo/Vocação).

#### [NEW] [equipamentos.md](file:///Users/take5dev1/projects/rpg-biblico/docs/equipamentos.md)
A lista de armas (10+), armaduras (5+) e itens comuns (10+) da Idade do Bronze/Ferro pode poluir muito o `regras-base.md`. 
*Design decision*: Criar arquivo separado referenciado no `regras-base.md` ou incluir como seção 7 no `regras-base.md`. **Opção escolhida**: Incluir como Seção 7 no `regras-base.md` para satisfazer o FR-001 estritamente.

---

### `docs/tribos/`

#### [MODIFY] [README.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/README.md)
Atualizar índice de 12 para 13 tribos, incluindo links para as novas fichas. Modificar "José" para Efraim e Manassés separadamente.

#### [NEW] [da.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/da.md)
#### [NEW] [naftali.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/naftali.md)
#### [NEW] [aser.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/aser.md)
#### [NEW] [zebulom.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/zebulom.md)
#### [NEW] [efraim.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/efraim.md)
#### [NEW] [manasses.md](file:///Users/take5dev1/projects/rpg-biblico/docs/tribos/manasses.md)
Criar 6 novas fichas baseadas no template de progressão tribal. A parte criativa (design das habilidades) será feita respeitando o contexto bíblico de cada tribo (ex: Dã = juízes/serpentes, Zebulom = portos/comércio).

---

### `docs/vocacoes/`

Dado o volume de habilidades das vocações (do nível 2 ao 18), elas serão organizadas em um diretório próprio, mantendo o `regras-base.md` focado em explicar o conceito geral de Vocação.

#### [NEW] [guerreiro.md](file:///Users/take5dev1/projects/rpg-biblico/docs/vocacoes/guerreiro.md)
#### [NEW] [batedor.md](file:///Users/take5dev1/projects/rpg-biblico/docs/vocacoes/batedor.md)
#### [NEW] [cacador.md](file:///Users/take5dev1/projects/rpg-biblico/docs/vocacoes/cacador.md)
#### [NEW] [sacerdote.md](file:///Users/take5dev1/projects/rpg-biblico/docs/vocacoes/sacerdote.md)
Criar as 4 fichas de Vocações com a progressão completa de nível (2, 6, 10, 14, 18).
#### [NEW] [README.md](file:///Users/take5dev1/projects/rpg-biblico/docs/vocacoes/README.md)
Criar um índice rápido para as 4 Vocações.

## Verificação do "Que Falta" (Roadmap de Continuidade)

A implementação desta fase satisfaz `regras-base.md`, Tribos e Vocações. O plano gerará uma lista final que incluirá, previsivelmente:
1. Criação do Bestiário / Manual de Inimigos.
2. Criação da planilha / modelo PDF da Ficha de Personagem.
3. Criação de mecânicas de viagem/exploração no deserto.
4. Regras de economia (shekels de prata) vs. equipamentos avançados.

## Verification Plan

### Automated Tests
- N/A (Text documentation)

### Manual Verification
1. **Validation 1:** Revisar `regras-base.md` para garantir que o termo "Classe" não aparece fora de "(classe no D&D)" ou "Classe de Armadura".
2. **Validation 2:** Garantir que o Guia de Criação possui 6 passos exatos.
3. **Validation 3:** Contar 13 arquivos Markdown na pasta `docs/tribos/` (excluindo README).
4. **Validation 4:** Verificar que nenhuma das 6 novas tribos e das 4 novas vocações quebra a restrição de magia da Constituição.
