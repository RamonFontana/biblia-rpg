# 04: Efeito de arma no 18+

**What to build:** quando o jogador acerta com um 18 natural ou mais usando uma arma que tem efeito configurado pelo Mestre, as Condições do efeito passam pela Resistência a Condição do alvo (reduzidas ou anuladas conforme o nível) e entram no alvo pela própria função de ataque, na mesma gravação do dano. O registro guarda que o efeito disparou e o aviso do Mestre o mostra. Spec: `../spec.md` (histórias 38, 39 e 48).

**Blocked by:** 01 (Ataque básico de ponta a ponta)

**Status:** ready-for-agent

- [ ] Motor: gatilho do efeito (17 não, 18 sim, só no acerto)
- [ ] Serviço: Condições resolvidas pela Resistência a Condição do alvo antes da chamada
- [ ] A função de ataque mescla as Condições no participante alvo; `rls.sql` cobre a mescla
- [ ] Aviso do Mestre com o efeito disparado
- [ ] Testes do motor, do serviço e um E2E (18 natural aplica a Condição no alvo), com mutação conferida
- [ ] Migration aplicada na produção, com o autor (se a função mudar)
