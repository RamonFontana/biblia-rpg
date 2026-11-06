# 02: Só Endemoniados como alvo da Repreensão Divina, e aviso quando não há nenhum

Status: done
Blocked by: 01
Spec: `.scratch/repreensao-divina/spec.md`

## What to build

Ao usar a Repreensão Divina, a lista de alvos do jogador mostra só os inimigos que têm a passiva Vulnerabilidade Espiritual. O nome é reconhecido sem acento nem caixa, como na Fúria Desumana e no Ataque Furtivo. Entram o Preset Endemoniado Comum, qualquer Preset com o Template e o inimigo do zero que tenha a passiva. Sem Endemoniado no combate, o painel avisa que não há alvo e não deixa usar, então não gasta Fé nem uso. O efeito de Habilidade passa a poder exigir uma passiva do alvo. A lista de alvos do jogador carrega o que for preciso para isso, e a narrativa do inimigo continua fora das listas de jogador e espectador. O autor aceitou que a lista revele ao jogador quem é Endemoniado.

## Acceptance criteria

- [ ] Testes do motor: o filtro de alvos com a passiva exigida. O Endemoniado do Preset, o do Template e o do zero com a passiva entram. O inimigo comum e os aliados ficam fora.
- [ ] Sem alvo possível, o painel mostra o aviso e o uso não acontece (nada gasto).
- [ ] A narrativa do inimigo segue fora das listas de jogador e espectador; o teste existente continua verde.
- [ ] E2E (desktop e Pixel 7): um Sacerdote de nível 2 contra um Endemoniado e um inimigo comum.
  - Só o Endemoniado aparece como alvo.
  - Ao usar, a Fé cai 8.
  - O Mestre vê o TR de Carisma com a CD certa, lança um d20 que falha e vê o lembrete de fuga no histórico.
  - Sem Endemoniado na mesa, o jogador vê o aviso.
- [ ] `npm run check` passa; `playwright.config.ts` inclui o spec novo no projeto mobile.
