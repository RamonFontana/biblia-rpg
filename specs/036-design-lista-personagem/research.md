# Design Research: Idade do Bronze/Ferro & Tailwind CSS

## Aesthetics & Color Palette

O tema do RPG Bíblico gira em torno da Idade do Bronze e Ferro. Devemos afastar-nos dos azuis e cores neons genéricas e abraçar os tons terrosos, metais rústicos e contrastes dramáticos (como a noite no deserto e o brilho do fogo).

### Paleta Proposta (Tailwind Colors)

- **Background Principal**: Cores escuras e profundas do deserto à noite.
  - Ex: `bg-stone-950` ou `bg-zinc-950`
- **Background Secundário (Cards)**: Tons que lembram couro envelhecido ou pedra escura.
  - Ex: `bg-stone-900`, `bg-neutral-900`
- **Bordas (Metais/Bronze)**:
  - Ex: `border-amber-700/50`, `border-orange-800/60`
  - Hover de Bordas: `hover:border-amber-500` (Brilho do bronze/fogo)
- **Texto Principal (Foreground)**:
  - Ex: `text-stone-200`, `text-amber-50`
- **Texto Secundário**:
  - Ex: `text-stone-400`, `text-amber-200/70`
- **Botões de Ação**:
  - Tons metálicos ou terrosos em contraste com o fundo escuro.
  - Ex: `bg-amber-700 hover:bg-amber-600 text-amber-50`

### Typography

Utilizar fontes que evoquem um aspecto antigo, porém limpo e legível. Se o projeto já utiliza as fontes nativas, focar no contraste e no peso das fontes:
- Nomes de personagens com destaque (`font-bold text-lg text-amber-100`).
- Atributos com aspecto rústico ou limpo (`text-stone-300`).

### Interações (Micro-animations)

- Tailwind Transitions: `transition-all duration-300 ease-in-out`
- Hover state nos cards: `hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/20`
- Efeito Glassmorphism sutil (opcional se encaixar no tema escuro rústico): `bg-stone-900/80 backdrop-blur-sm`

## Decisions

- **Decision**: Adotar uma paleta baseada em `stone` e `amber` do Tailwind.
- **Rationale**: A cor `stone` transmite um ambiente rústico e antigo, enquanto o `amber` fornece o contraste do fogo e do bronze, alinhando-se aos princípios visuais do RPG.
- **Alternatives considered**: Cores baseadas em `slate` ou `zinc`, mas estas soam muito industriais e frias, incompatíveis com a estética árida do Bronze/Ferro.

- **Decision**: Uso de animações sutis nos cards (`-translate-y-1` e mudança de opacidade da borda).
- **Rationale**: Fornece um feedback premium interativo sem descaracterizar a sobriedade do cenário.
