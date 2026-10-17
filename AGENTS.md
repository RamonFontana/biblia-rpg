# RPG Bíblico

RPG baseado em D&D 5e ambientado no período bíblico (Idade do Bronze/Ferro, 1050–586 a.C.).
SPA React (Vite) na Vercel; Supabase como backend.

## Regras do jogo

`docs/` é a fonte da verdade das regras. Leia antes de criar ou alterar conteúdo, classe, NPC, item, habilidade ou balanceamento:

- `docs/regras-base.md`: atributos, vocações, Sistema de Fé, degradação e recuperação.
- `docs/tribos/README.md` e `docs/tribos/<tribo>.md`: tribos (raças), passivas e progressão 1–20.
- `docs/vocacoes/`, `docs/itens/`, `docs/bestiario/`, `docs/criacao-de-personagem.md`.

Quando código e doc divergirem, registre a divergência em `docs/ROADMAP.md` e pergunte qual vale. Mudança de regra, valor de balanceamento ou conteúdo bíblico só entra com confirmação do autor.

### Princípios do cenário
- **O sobrenatural vem só do Sistema de Fé.** Não há magia arcana; milagres dependem de rolagem com a Fé como modificador.
- **Equipamento é histórico.** Armas e armaduras da Idade do Bronze/Ferro (bronze, ferro, couro, madeira, pedra, osso), sem itens mágicos nem bônus sobrenaturais. A CA vem de armadura e escudo.
- **A Fé (0–100) é a mecânica central.** Todo personagem tem 1 Fortaleza e 1 Tentação; a degradação Inabalável → Comum → Abalado → Vulnerável → Ruptura vale em toda sessão.
- **Tribos são as raças.** Cada tribo tem 2 passivas no nível 1, escolhe entre os caminhos A e B no nível 4 e tem marcos nos níveis 1, 4, 8, 12, 16 e 20. Toda tribo tem ficha em `docs/tribos/<tribo>.md`.
- **Regra de Levi.** Qualquer tribo pode ser Sacerdote/Sábio; a tribo de Levi é obrigatoriamente Sacerdote/Sábio.
- **Vocações:** Guerreiro, Batedor, Caçador/Nômade, Sacerdote/Sábio. Atributos FOR, DES, CON, INT, SAB, CAR.
- **Simplicidade.** O sistema deve continuar acessível a jogadores novos.
