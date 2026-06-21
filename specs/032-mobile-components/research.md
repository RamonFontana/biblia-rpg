# Phase 0: Research

**Decision**: Use Tailwind CSS flex-wrap and width/min-width constraints to handle mobile layout overflows in cards.
**Rationale**: The cards contain complex controls (HP +/- buttons, Armor Class badges, etc.) which can easily exceed standard phone widths (320px). By using `flex-wrap` for groupings and `min-w-0` alongside `truncate` for text, we ensure that the content adapts rather than overflowing the container. 
**Alternatives considered**: CSS Grid, but standard Flexbox is more appropriate for these inline control bars.
