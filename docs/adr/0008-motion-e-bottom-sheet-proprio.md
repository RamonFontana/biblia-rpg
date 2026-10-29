# A animação usa a biblioteca `motion`, e o bottom sheet é nosso, sobre o Radix Dialog

A tela da sessão (Onda 6) pede animação de painel, de dano e cura, de turno e de uso de Habilidade, com respeito a `prefers-reduced-motion`. O autor aprovou `motion` como única dependência nova de animação (`MotionConfig reducedMotion="user"`). O bottom sheet do celular é um componente nosso: o `Dialog` do Radix que o projeto já usa, com `drag="y"` do `motion` e dois pontos de parada (meia altura e tela cheia). A decisão é cara de desfazer porque cada tela animada passa a importar da biblioteca.

## Considered Options

- Só `tailwindcss-animate` e CSS: cobre o essencial, mas não arrasta nem anima a saída de um elemento que sai do DOM.
- `vaul` (o `Drawer` do shadcn): traz arrastar, pontos de parada e o ajuste ao teclado do iOS, mas o README diz "unmaintained" e a última versão (1.1.2) é de dezembro de 2024. Se o React ou o Radix o quebrarem, ninguém corrige.

## Consequences

- O bottom sheet próprio tem teste e arrasto a manter. Se o protótipo mostrar problema no iOS (teclado, rolagem interna), a troca por `vaul` é um PR pequeno, e este ADR passa a `superseded`.
- A animação não usa cor nova (vermelho e verde de estado já estão na paleta) e nunca roda em loop.
