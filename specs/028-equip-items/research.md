# Research: Sistema de Equipamentos e Inventário

## Overview
This document consolidates findings and decisions made during the planning phase for the equipment system.

## 1. Storage of Equipment State
**Decision**: Store equipment state in the `equipment` JSONB column in the `characters` table.
**Rationale**: The `characters` table already contains an `equipment: Json | null` column. Storing the currently equipped `character_items` IDs in this JSON allows us to keep the schema simple without adding a new table specifically for equipment slots.
**Alternatives considered**: Creating a new table `character_equipment_slots` (e.g. `character_id`, `slot`, `character_item_id`). Rejected because adding a new table for simple 1-to-1 relationships (a character has exactly 1 head slot, 1 body slot, etc.) increases JOIN complexity unnecessarily, whereas JSONB easily maps to frontend state.

## 2. Equipment Slots Data Structure
**Decision**: The `equipment` JSON should be structured as:
```json
{
  "head": "character_item_id_or_null",
  "body": "character_item_id_or_null",
  "mainHand": "character_item_id_or_null",
  "offHand": "character_item_id_or_null"
}
```
**Rationale**: This explicit structure directly maps to FR-001 (Cabeça, Corpo, Mão Principal, Mão Secundária).

## 3. Two-Handed and Versatile Weapons
**Decision**: When a Two-Handed weapon is equipped, both `mainHand` and `offHand` will reference the same `character_item_id`. For Versatile weapons, if `offHand` is empty, it's assumed to be used with two hands (damage increases).
**Rationale**: FR-003 and FR-007 require this logic. Pointing both hand slots to the same item elegantly prevents another item from being equipped in the off-hand.

## 4. Supabase & Database Validations
**Decision**: The frontend will handle standard logic, but any critical updates (like deducting items or ensuring a character doesn't equip an item they don't own) can be enforced either by the existing frontend constraints or RLS/RPCs if needed. For now, the MVP relies on frontend validation before saving the JSON state to Supabase, but using the supabase client properly to validate ownership.
**Rationale**: User noted: "Não esqueça que tem o mcp do supabase para qualquer validação no bando". We will make sure the React components update the `equipment` JSON using the Supabase client.

## 5. Enemy & NPC Equipment
**Decision**: Enemies (`session_enemies`) don't have full inventory management. As per FR-009, we will rely on a simpler JSON field for enemies or just display their hardcoded actions.
**Rationale**: Simplifies GM workload.
