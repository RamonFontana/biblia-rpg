# Implementation Plan: Character List Design Improvement

**Branch**: `036-design-lista-personagem` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/036-design-lista-personagem/spec.md`

## Summary

Melhorar a apresentação visual da página de listagem de personagens (Character List). O objetivo é aplicar uma estética inspirada na Idade do Bronze/Ferro, utilizando TailwindCSS para definir adequadamente as cores de background, foreground, tipografia, efeitos de hover e micro-animações, conforme requisitado na especificação e pelo usuário.

## Technical Context

**Language/Version**: TypeScript, React 19

**Primary Dependencies**: TailwindCSS (v3), Radix UI, Lucide React

**Storage**: Supabase / Local (N/A para esta feature visual)

**Testing**: Vitest, React Testing Library

**Target Platform**: Web (Desktop e Mobile)

**Project Type**: Web Application

**Performance Goals**: Animações suaves a 60 FPS e tempo de resposta de hover < 100ms

**Constraints**: Aderência ao tema Idade do Bronze/Ferro.

**Scale/Scope**: UI Components (Cards, Buttons, Layout da Lista)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica / Sem Magia Arcana**: PASS. Apenas elementos visuais, sem mecânicas arcanas.
- **Materialismo Histórico**: PASS. A estética visual refletirá a Idade do Bronze/Ferro (tons terrosos, metais rústicos).
- **Tribos como Raças / Fé**: PASS. A interface exibe claramente os atributos PV, CA, Fé, Tribo e Classe.
- **A Regra de Levi**: PASS. Não aplicável para alterações apenas visuais.

## Project Structure

### Documentation (this feature)

```text
specs/036-design-lista-personagem/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code (repository root)

```text
src/
├── features/
│   └── character-management/
│       ├── pages/
│       │   └── CharacterList.tsx
│       └── components/
│           └── CharacterCard.tsx (if extracted)
│       └── Button.tsx
└── index.css (or global stylesheet for custom Tailwind classes)
```

**Structure Decision**: A implementação focará nos componentes React existentes que renderizam a listagem de personagens e seus estilos associados. As mudanças serão principalmente arquivos `.tsx` e, se necessário, configuração do `tailwind.config.js`.

## Complexity Tracking

Nenhuma violação ou complexidade adicional introduzida. Apenas melhorias de estilização via TailwindCSS.
