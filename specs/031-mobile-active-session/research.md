# Phase 0: Research & Decisions

## Technical Context Resolution

1. **Shadcn UI Components for Mobile**:
   - **Decision**: We will use the existing `Sheet` component for side-navigation or large context menus if needed, and we will **install the `dropdown-menu`** component from shadcn/ui to group the action buttons in the header on mobile screens.
   - **Rationale**: The `ActiveSessionPage.tsx` header has many buttons for the GM ("Avançar Tempo", "Solicitar Teste", "Iniciar Combate", "Finalizar Sessão"). On a mobile screen, these will overflow or cause layout breakage. A `DropdownMenu` triggered by a "Ações do Mestre" button is the cleanest way to preserve functionality without eating up screen real estate.
   - **Alternatives considered**: Using horizontal scrolling (poor UX for main actions), or stacking them vertically taking up the whole screen (pushes important content down).

2. **Grid Layout Adjustments**:
   - **Decision**: We will update the `grid-cols` definitions in `ActiveSessionPage.tsx` to default to `grid-cols-1` for mobile and expand to `md:grid-cols-2` or `lg:grid-cols-3` for larger screens.
   - **Rationale**: This is the standard Tailwind approach for responsive design. The current implementation has some hardcoded assumptions about width that break on screens < 768px.

3. **Modals Responsiveness**:
   - **Decision**: Check and adjust the max-width and overflow properties of the `DialogContent` used in custom modals (like `CombatSetupModal`, `TradeDialog`, etc.).
   - **Rationale**: Modals must fit within the viewport on mobile and allow vertical scrolling of their internal content instead of growing beyond the screen boundaries.
