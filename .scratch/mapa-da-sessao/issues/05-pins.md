# 05: Pins

**What to build:** os Retratos viram pins no Mapa atual. Quem não tem posição naquele mapa espera na Bandeja do Mestre, invisível aos jogadores. Só o Mestre arrasta, no web e no celular; ao soltar, o pin encaixa no centro do Quadrado e grava, e durante o arrasto ele vê quantos Quadrados e metros andou. Cada mapa guarda as posições. Os jogadores veem o pin se mover ao vivo, com animação curta, tocam no pin para abrir o cartão do Retrato e têm um botão para centralizar no próprio personagem.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Migration: pins (mapa da sessão, Retrato personagem ou NPC simples, coluna, linha; um pin por Retrato por mapa), RLS (Mestre da sessão escreve, participantes leem) e Realtime; `gen:types`; `rls.sql` por papel.
- [x] A função que monta os Retratos para quem olha passa a montar a cena do mapa (posição ou Bandeja de cada Retrato, se é de quem olha); testes de unidade estendidos.
- [x] Pins como botões com o nome e o `CharacterAvatar`; tocar abre o cartão do Retrato de hoje.
- [x] Arrasto só do Mestre: da Bandeja ao mapa, entre Quadrados e de volta à Bandeja; encaixe; régua de Quadrados e metros desde a origem; arrastar no pin move o pin, fora dele move o mapa.
- [x] Inimigo pode ir ao mapa fora do combate.
- [x] Movimento ao vivo animado com `motion`; movimento reduzido deixa só o salto.
- [x] Botão de centralizar no personagem do jogador, desabilitado com o motivo quando ele não tem pin.
- [x] Jogador não arrasta nenhum pin (teste de componente).
- [x] E2E: o Mestre arrasta um pin e o jogador o vê mudar.
