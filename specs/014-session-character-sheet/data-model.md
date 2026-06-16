# Data Model: Session Character Sheet

## Entities

### Character

The character data is assumed to be stored in a `characters` table or similar in Supabase.
Based on the RPG Biblical constitution and the specification, the character sheet must contain:

- **Attributes**: FOR, DES, CON, INT, SAB, CAR.
- **Vitals**: PV (Health Points), CA (Armor Class), Fé (Faith - the core mechanic replacing magic).
- **Details**: Tribo (Tribe), Classe (Class/Vocation).
- **Inventory/Items**: Weapons, armor, equipment from the Bronze/Iron Age.
- **Skills/Passives**: Specific passives from the Tribe and Class.

```typescript
// Assumed TypeScript interface for Character based on the rules:
interface Character {
  id: string;
  user_id: string;
  name: string;
  tribo: string; // e.g., "Judá", "Levi"
  classe: string; // e.g., "Guerreiro", "Sacerdote/Sábio"
  nivel: number;
  
  // Vitals
  pv_maximo: number;
  pv_atual: number;
  ca: number;
  fe_maxima: number;
  fe_atual: number;
  
  // Attributes
  atributos: {
    forca: number;
    destreza: number;
    constituicao: number;
    inteligencia: number;
    sabedoria: number;
    carisma: number;
  };
  
  // Inventory & Skills
  itens: string[]; // Simplification for now
  pericias: string[];
  passivas: string[];
}
```

*Note: Since the backend is not being modified right now, we will rely on fetching the existing data structure from Supabase. The UI will adapt to what is currently available.*
