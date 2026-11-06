# 08: Fúria Desumana

Status: ready-for-agent
Blocked by: 07
Spec: `.scratch/presets-de-inimigo/spec.md`

## What to build

Quando o PV de um inimigo com a Fúria Desumana chega a 0, por qualquer caminho (visto pelo Realtime), a tela do Mestre pede o TR de CON com CD 10 + 5 × usos no combate. O Mestre digita o d20 ou usa a Rolagem Virtual (ADR 0001 e 0007). Passou: o inimigo fica com 1 PV. Falhou: segue a 0 PV. O contador fica no estado do participante do combate e zera com ele. O pedido não repete para o mesmo 0 PV.

## Acceptance criteria

- [ ] Testes do motor: CD 10, 15 e 20; sucesso e falha; contador zerado em combate novo; sem repetir o pedido.
- [ ] Inimigo sem a Fúria não gera o pedido.
- [ ] O d20 digitado e a Rolagem Virtual resolvem igual ao TR de Habilidade existente.
- [ ] Sem migration (usa `ability_state`); `db diff` vazio.
- [ ] `npm run check` passa; teste manual no combate com Mestre no celular e na web.
