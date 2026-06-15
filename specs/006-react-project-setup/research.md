# Research & Decisions: React Project Setup

## Architecture Decisions

### 1. Build Tool & Framework
- **Decision**: Vite with React
- **Rationale**: The user explicitly selected Vite over Next.js during the clarification phase. Vite provides an incredibly fast development server (HMR) and builds a purely client-side Single Page Application (SPA). For a highly interactive browser-based RPG game where SEO is not the primary driver for the actual gameplay interface, a lightweight SPA avoids the complexity of server components and SSR data-fetching patterns.
- **Alternatives considered**: Next.js (App Router), Create React App (Deprecated).

### 2. Styling System
- **Decision**: Shadcn UI (with Tailwind CSS)
- **Rationale**: Requested by the user. Shadcn provides highly customizable, accessible components that are copied directly into the project rather than installed as an opaque dependency. This allows deep customization for the "Idade do Bronze/Ferro" aesthetic required by the Biblical RPG constitution.
- **Alternatives considered**: MUI, Chakra UI, plain CSS/SASS.

### 3. State Management
- **Decision**: Zustand
- **Rationale**: Requested by the user. Zustand is a small, fast, and scalable bearbones state-management solution. It is perfect for tracking complex, nested client-side game state (e.g., character sheets, inventory, current 'Fé' levels).
- **Alternatives considered**: Redux Toolkit, Context API.

### 4. Data Fetching
- **Decision**: TanStack React Query
- **Rationale**: Requested by the user. React Query is the industry standard for managing asynchronous state (caching, synchronizing, and updating server state).
- **Alternatives considered**: SWR, standard `useEffect` fetching.

### 5. Form Handling & Validation
- **Decision**: React Hook Form + Zod
- **Rationale**: Requested by the user. Provides excellent performance by minimizing re-renders and offers strict type-safety from schema definition to form submission.
- **Alternatives considered**: Formik, Yup.

### 6. Testing Framework (Implicit necessity)
- **Decision**: Vitest
- **Rationale**: Since the project uses Vite, Vitest is the natural testing framework choice as it shares the exact same configuration pipeline and is drastically faster than Jest.
- **Alternatives considered**: Jest.
