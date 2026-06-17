# Phase 0: Research

**Decision**: Database schema needs no DDL migrations.
**Rationale**: Through Supabase MCP introspection, it is confirmed that the `characters` and `session_npcs` tables utilize dynamic `jsonb` fields for tracking runtime `stats` (which includes PV and Faith). Therefore, updating PV/Faith simply means performing an `UPDATE ... SET stats = ...` on the JSONB structure.

**Decision**: PC Death vs NPC Death.
**Rationale**: `docs/regras-base.md` outlines that PCs require Death Saves and shouldn't die instantly upon reaching 0 PV. NPCs, conversely, adhere to a simpler instant death mechanic, which the GM desires to be automatic when overriding their PV to 0.
