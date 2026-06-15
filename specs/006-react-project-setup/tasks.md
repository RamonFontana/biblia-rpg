# Tasks: React Project Setup

**Input**: Design documents from `/specs/006-react-project-setup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Vite React TypeScript project in repository root (or merge if using `npm create vite@latest . -- --template react-ts`)
- [x] T002 Update `tsconfig.json` and `tsconfig.node.json` for strict typing and path aliases (`@/` mapped to `src/`)
- [x] T003 Update `vite.config.ts` to support path aliases using `vite-tsconfig-paths` or manual alias
- [x] T004 [P] Configure Vitest and React Testing Library in `vite.config.ts` and `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Install Tailwind CSS, PostCSS, and Autoprefixer, then initialize `tailwind.config.js` and `postcss.config.js`
- [x] T006 Initialize Shadcn UI using `npx shadcn-ui@latest init` to generate `components.json` and setup the `src/components/ui` structure
- [x] T007 Install foundational libraries: `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, and `zustand`
- [x] T008 Configure the global React Query client provider in `src/main.tsx`
- [x] T009 Create a sample Zustand store template in `src/store/index.ts` to ensure global state is ready for use

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Project Access (Priority: P1) 🎯 MVP

**Goal**: As a developer, I want to have a functioning base project so that I can start building the game's interface without having to configure build tools, type checking, or UI libraries from scratch.

**Independent Test**: Can be fully tested by starting the development server and seeing the default application screen running without errors.

### Implementation for User Story 1

- [x] T010 [US1] Clean up default Vite boilerplate (remove `App.css`, reset `src/index.css` to only contain Tailwind directives)
- [x] T011 [P] [US1] Create a basic layout wrapper component in `src/components/layout.tsx`
- [x] T012 [US1] Update `src/App.tsx` to render the new layout component and a simple "Biblical RPG Development Environment" welcome message

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently by running `npm run dev`.

---

## Phase 4: User Story 2 - UI Component Verification (Priority: P2)

**Goal**: As a developer, I want to verify that the UI component library is correctly integrated so that I can confidently use its components to build the interface.

**Independent Test**: Can be fully tested by rendering a basic pre-styled component from the library on the main page.

### Implementation for User Story 2

- [x] T013 [US2] Install the Shadcn `button` component via `npx shadcn-ui@latest add button`
- [x] T014 [US2] Create a sample component `src/components/WelcomeCard.tsx` that imports and uses the Shadcn Button
- [x] T015 [US2] Render `WelcomeCard` in `src/App.tsx` to visually verify the UI library integration

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 [P] Run `npm run build` to ensure the project compiles with zero TypeScript errors
- [x] T017 [P] Verify `quickstart.md` steps run successfully on a clean terminal
- [x] T018 Code cleanup (remove unused boilerplate files like Vite logos)
- [x] T019 Update `README.md` to point to the `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1's basic layout

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Story 1 and 2 can start in parallel

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `npm run dev` and test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Local Demo (MVP!)
3. Add User Story 2 → Test independently → Verify UI Components

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing (if written)
- Commit after each task or logical group
