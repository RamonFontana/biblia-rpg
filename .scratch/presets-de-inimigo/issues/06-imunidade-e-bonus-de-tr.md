# 06: Imunidade a Condição e bônus de TR do inimigo valendo no motor

Status: ready-for-agent
Blocked by: 02
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

As regras do bloco passam a valer no app. Um inimigo com imunidade a uma Condição não a recebe (a proteção do alvo inimigo lê a ficha, como já faz com o personagem). O TR do inimigo usa o bônus de TR do bloco quando existe para o atributo (Anakim: For +7) e o modificador quando não existe. Vale para Habilidades de jogador e de inimigo contra inimigo. A mensagem de imunidade aparece como no personagem.

## Acceptance criteria

- [ ] Teste do motor: imunidade bloqueia a Condição e mostra a mensagem; sem imunidade, aplica.
- [ ] Teste: TR com bônus do bloco (+7) e sem bônus (modificador).
- [ ] Inimigo antigo, sem esses campos, resolve como hoje.
- [ ] `npm run check` passa; E2E de habilidade e combate continuam verdes.
