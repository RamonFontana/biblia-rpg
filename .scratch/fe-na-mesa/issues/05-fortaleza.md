# 05: Fortaleza

**What to build:** o Mestre tem um botão "Fortaleza" em cada cartão de jogador, que mostra o nome da Fortaleza do personagem e dá +1d4 de Fé: o Mestre digita o dado físico ou usa a Rolagem Virtual. A Fé respeita o teto de 100, não há limite por dia, e a Fé e o Estado de Fé do jogador mudam em seguida. A Vantagem da Fortaleza não passa por aqui: o Mestre a marca no pedido do Teste (ticket 03). Spec: `../spec.md` (histórias 45 a 50).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] O motor calcula a Fé depois do 1d4 pelo `addFaith` (teto e piso); a Rolagem Virtual usa a `Rng` injetada
- [ ] Botão e diálogo no cartão do jogador com o nome da Fortaleza, o d4 digitado (1 a 4) ou virtual
- [ ] A Fé gravada muda e o jogador a vê em tempo real
- [ ] Testes do motor, do componente e um E2E (Fortaleza dá +1d4; no teto fica em 100), com mutação conferida
