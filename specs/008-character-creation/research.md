# Feature Research & Decisions: Character Creation

## State Management for Wizard

**Decision**: Use `Zustand` for global state management across wizard steps, paired with `React Hook Form` + `Zod` inside individual steps.

**Rationale**: A 9-step wizard holds a significant amount of temporary state before the final API call. `React Hook Form` handles form validation and local input state efficiently, but since the flow is spread across multiple components, `Zustand` will act as the single source of truth for the drafted character payload.

**Alternatives considered**: React Context API (too much boilerplate and potential re-render issues for complex forms). Passing props down a single massive component (violates clean code).

## Form Validation

**Decision**: Use `Zod` schemas for strict runtime validation.

**Rationale**: Strongly typed schemas directly map to the backend's Supabase tables, ensuring data integrity. `Zod` also natively integrates with `React Hook Form` via `@hookform/resolvers/zod`.

## Database Interaction

**Decision**: Use `Supabase JS Client` to push the completed JSON payload to the `characters` table.

**Rationale**: MCP is configured. Supabase allows simple RPC or direct table inserts. Since the user must be authenticated, RLS (Row Level Security) can automatically link the character to their auth ID.

## Architecture Pattern

**Decision**: Feature-sliced design (`src/features/character-creation/`).

**Rationale**: Keeps the codebase clean as requested by the user. Grouping components, stores, and schemas under a specific feature folder prevents global scope pollution and makes it easier to maintain standard patterns.
