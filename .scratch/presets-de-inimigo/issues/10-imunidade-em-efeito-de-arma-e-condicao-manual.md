# 10: A imunidade do inimigo vale também no efeito de arma e avisa na Condição manual

Status: ready-for-agent
Blocked by: 06
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

A revisão do ticket 06 achou dois caminhos que ignoram a imunidade a Condição do inimigo: o efeito de arma (natural 18 ou mais) e a Condição que o Mestre adiciona à mão. No efeito de arma, a Condição que o inimigo é imune não chega e o Mestre vê a frase de imunidade, como numa Habilidade. Na Condição manual, o Mestre continua com a palavra final (pode ignorar), mas a janela avisa que o inimigo é imune, como já faz com a Resistência a Condição. Só a imunidade do inimigo muda; a de personagens segue como hoje (mudar isso é mudança de regra, pendente do autor).

## Acceptance criteria

- [ ] Teste do motor: o efeito de arma não aplica a Condição de que o alvo é imune e devolve a frase "Imunidade: imune a X"; as outras Condições da arma chegam.
- [ ] Teste do serviço de ataque: contra um inimigo com a imunidade nos `stats`, a Condição não vai ao banco; contra inimigo antigo, vai como hoje.
- [ ] A janela de Condição manual avisa a imunidade do inimigo e deixa o Mestre ignorá-la; sem imunidade, igual a hoje.
- [ ] A imunidade de personagens (Habilidade passiva) não muda no efeito de arma.
- [ ] `npm run check` passa; E2E de ataque e combate continuam verdes.
