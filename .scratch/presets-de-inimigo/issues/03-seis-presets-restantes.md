# 03: Os 6 Presets restantes do Bestiário

Status: ready-for-agent
Blocked by: 02
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

O Bestiário completo no app: Sentinela Amalequita, Sacerdote de Baal, Víbora do Deserto, Urso Pardo Sírio, Guerreiro Anakim e Endemoniado Comum, com os números do doc. Habilidades da biblioteca: Presença Aterradora (Anakim), Maldição de Baal (Sacerdote de Baal), Grito Atormentador (Endemoniado Comum). Bônus de TR do bloco (Anakim For +7, Con +5; Sacerdote SAB +5; General For +5, Con +4) e imunidade a Amedrontado do Endemoniado Comum ficam gravados no Preset. As outras passivas entram como texto. O Endemoniado Comum guarda 30 PV (a divergência com Bandido + Template está no ROADMAP).

## Acceptance criteria

- [ ] Os 10 Presets passam no gate e no teste docs ↔ conteúdo.
- [ ] O Mestre escolhe qualquer um dos 10 no assistente e na sessão.
- [ ] Ataques multi-parte (Ataques Múltiplos) ficam como Habilidade em texto; cada ataque tem a estrutura.
- [ ] A Habilidade da biblioteca aparece no painel de Habilidades de inimigo ao criar Anakim, Sacerdote de Baal e Endemoniado Comum.
- [ ] `npm run check` passa.
