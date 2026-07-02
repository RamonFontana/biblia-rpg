# Implementation Plan: 046-skills-proficiency-system

**Branch**: `046-skills-proficiency-system` | **Date**: 2026-07-02 | **Spec**: [specs/046-skills-proficiency-system/spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/046-skills-proficiency-system/spec.md)

**Input**: Feature specification from `/specs/046-skills-proficiency-system/spec.md`

## Summary

O objetivo desta feature é implementar o sistema de Perícias e Proficiência do D&D 5e adaptado para o RPG Bíblico. O foco principal é trazer clareza visual e funcional à montagem (criação de personagem) e gameplay (ficha e rolagens da sessão).
Isso requer a criação de um novo passo no Wizard de criação para a escolha de perícias (restrita pela vocação selecionada), a atualização da UI da Ficha de Personagem para exibir os bônus calculados em tempo real (baseado no nível), e a adaptação do sistema de Rolagens (Testes de Sessão) para tratar os testes em 3 categorias distintas: Testes de Atributo, Testes de Perícia, e Teste de Fé (mecânica especial do sistema).

## Technical Context

**Language/Version**: TypeScript / React 19 / Vite

**Primary Dependencies**: React Hook Form, Zustand, Tailwind CSS, Supabase JS, Radix UI

**Storage**: Supabase PostgreSQL (Tabela `characters`)

**Testing**: Vitest / Testes unitários (se aplicável para regras matemáticas)

**Target Platform**: Web Browser / PWA (Responsividade Mobile é essencial, conforme histórico do projeto)

**Project Type**: Web Application (React SPA)

**Performance Goals**: N/A (Atualização de UI instantânea nas abas da ficha)

**Constraints**: Retrocompatibilidade com personagens antigos. Separação de responsabilidades no DB (não reutilizar a coluna JSON `skills`).

**Scale/Scope**: Intervenção no Módulo de Criação (Wizard), Módulo de Ficha (Views) e Módulo de Sessão (Rolagens). Adição de migração no Banco de Dados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Fidelidade Bíblica)**: ✅ A lista de 18 perícias do 5e será adaptada conceitualmente onde necessário (ex: Religião permanece relevante; Arcanismo passa a ser Conhecimento Antigo). Não introduz magia.
- **Principle II (Materialismo Histórico)**: ✅ As perícias são habilidades inatas ou treinadas, não objetos mágicos.
- **Principle III (Sistema de Fé como Núcleo)**: ✅ No FR-012, mantemos explicitamente o Teste de Fé como mecânica especial (rolagem de 1d100) sem mesclar ou poluir com o bônus de proficiência, preservando a integridade da mecânica base.
- **Principle IV (Tribos como Raças)**: ✅ Atendido. A proficiência inicial decorre da Vocação. Perícias advindas da Tribo (Edge Case validado) ficam para iteração futura, sem ferir o princípio.
- **Principle V (Regra de Levi)**: ✅ Não há alteração nisso. A restrição de vocação atua antes da escolha de perícia.
- **Principle VI (Documentação)**: ✅ O `regras-base.md` já contém a base 5e. As especificações em `specs/046-skills-proficiency-system` e os requisitos estão completos.

## Project Structure

### Documentation (this feature)

```text
specs/046-skills-proficiency-system/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Especificação de base
├── checklists/          # Checklists de qualidade
├── data-model.md        # Phase 1 output (Database schema/types)
└── tasks.md             # Phase 2 output (Geração futura)
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── character-creation/
│   │   ├── components/
│   │   │   └── steps/
│   │   │       └── SkillsStep.tsx            # NOVO: Passo de perícias no Wizard
│   │   ├── store/
│   │   │   └── useCharacterCreationStore.ts  # MODIFICADO: Adicionar estado proficiencies
│   │   └── types/                            # MODIFICADO: DraftCharacter
│   └── character-management/
│       ├── types/                            # MODIFICADO: Atualizar tipo Character (level, proficiencies)
│       └── utils/
│           ├── characterMath.ts              # MODIFICADO: Lógica de cálculo do Bônus de Proficiência e listagem de Perícias
│           └── rules/
│               └── vocations.ts              # NOVO/MODIFICADO: Mapeamento de perícias e saving throws elegíveis por vocação
├── components/
│   ├── character/
│   │   └── CharacterSheetView.tsx            # MODIFICADO: Exibir indicador de proficiência, perícias e saving throws
│   └── session/
│       ├── MasterTestDialog.tsx              # MODIFICADO: Refatorar TEST_TYPES (3 grupos)
│       └── PlayerTestDialog.tsx              # MODIFICADO: Refatorar aplicação de bônus na rolagem do d20
└── types/
    └── database.types.ts                     # MODIFICADO: Atualização gerada/manual das colunas `level` e `proficiencies`

supabase/
└── migrations/
    └── [TIMESTAMP]_add_level_and_proficiencies.sql # NOVO: Migração do BD
```

**Structure Decision**: O projeto usa um padrão "features-first" na pasta `src/features`, separando criação e visualização, além de diretórios genéricos como `src/components/session` para as ferramentas de mesa (VTT).

## Implementation Details & Approach

A implementação seguirá esta ordem lógica:

1. **Camada de Dados & Tipagem**:
   - Criar migração SQL no Supabase para as novas colunas (`level` DEFAULT 1, e `proficiencies` JSONB).
   - Atualizar `database.types.ts` e os tipos de domínio (`DraftCharacter`, `Character`).

2. **Core Logic / Utilities**:
   - Definir as constantes com os 3 grupos de testes (Atributos, Perícias, Fé).
   - Definir o dicionário de perícias do D&D 5e e mapeamento de Atributos Base.
   - Definir a restrição de "Perícias Elegíveis" e "Saving Throws" por Vocação.
   - Assegurar que `calculateProficiency(level)` está calculando a escala de `+2` a `+6`.

3. **Módulo de Criação de Personagem**:
   - Expandir o Zustand store (`useCharacterCreationStore`) para controlar o estado das `proficiencies`.
   - Adicionar o `SkillsStep.tsx` no Wizard Layout. A UI deve informar "Você pode escolher N perícias" baseada na vocação, renderizar a lista filtrada, e travar/mostrar aviso quando o limite for excedido.

4. **Ficha de Personagem (Visualização)**:
   - Em `CharacterSheetView.tsx`, mapear as perícias e os saving throws, calculando o valor final (`Modificador de Atributo + Proficiência`).
   - Destacar visualmente (ícone de preenchimento, cor de badge) as perícias em que o personagem possui proficiência.
   - Adicionar o `Tooltip` detalhando a soma.

5. **Módulo de Sessão (Testes / Rolagens)**:
   - Refatorar o `MasterTestDialog` e `PlayerTestDialog`.
   - Em vez dos testes genéricos misturados, dividir em:
     - Atributos (6 tipos).
     - Perícias (18 tipos).
     - Fé (1 tipo - comportamento legado).
   - Na rolagem, verificar se o teste solicitado é uma perícia. Se for, e o personagem tiver a proficiência naquela perícia (verificando o JSON `proficiencies.skill_proficiencies`), somar o bônus de proficiência na rolagem.
   - Submeter e exibir o histórico formatado na UI do chat de testes.
