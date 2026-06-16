# Quickstart: Character Creation

This document outlines how the character creation UI will be integrated into the main application.

## Integration Point

The feature will be accessible from the main `Home` screen.

```tsx
// Example of routing to the feature
import { useNavigate } from 'react-router';

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/create-character')}>
        Criar Personagem
      </button>
      <button onClick={() => navigate('/create-game')}>
        Criar Partida
      </button>
    </div>
  );
}
```

## Component Usage

The main feature is encapsulated in a single page component that renders the wizard layout.

```tsx
// src/pages/CharacterCreationPage.tsx
import { WizardLayout } from '@/features/character-creation/components/WizardLayout';

export function CharacterCreationPage() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <WizardLayout />
    </div>
  );
}
```

The `WizardLayout` component will internally connect to the Zustand store (`useCharacterCreationStore`) to manage its 9 steps. Each step component (e.g., `TribeSelection`, `EquipmentMerchant`) is isolated inside `src/features/character-creation/components/steps/` and interacts with local React Hook Form instances (using Zod validation) before pushing their payload to the global Zustand store.
