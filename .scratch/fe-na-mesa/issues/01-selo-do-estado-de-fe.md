# 01: Selo do Estado de Fé e aviso de Ruptura

**What to build:** o jogador vê o seu Estado de Fé (Inabalável, Comum, Abalado, Vulnerável, Ruptura) como selo na ficha, e o Mestre vê o selo de cada jogador no cartão, com o efeito do doc na dica. O selo do Vulnerável lembra o Mestre de pedir Testemunho. Enquanto algum personagem estiver com Fé 0, a tela da sessão do Mestre mostra um aviso fixo de Ruptura com os nomes, que some quando a Fé sobe. O estado segue a Fé Atual (não a Efetiva) e muda em tempo real. Spec: `../spec.md` (histórias 27 a 36).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] O motor devolve o Estado de Fé a partir da Fé Atual, com as fronteiras do doc (0; 1–10; 11–30; 31–69; 70–100) e o texto do efeito
- [ ] Selo na ficha do jogador e no cartão do jogador do Mestre, com o nome em texto e a cor da paleta (Inabalável verde, Comum pedra, Abalado âmbar, Vulnerável e Ruptura vermelho)
- [ ] Dica com o efeito do doc; no Vulnerável, o lembrete do Testemunho
- [ ] Aviso fixo de Ruptura na tela do Mestre com os nomes, que some quando a Fé passa de 0
- [ ] Itens Profanos não mudam o estado (segue a Fé Atual)
- [ ] Testes do motor nas fronteiras, testes dos componentes que mudam e um E2E (selo na ficha e no cartão; Ruptura aparece e some), com mutação conferida
