# O ataque do jogador grava o dano por uma função no banco

Só o Mestre pode alterar `combat_participants` (PV e Condições do combate), mas o ataque físico do jogador precisa tirar PV do alvo, que pode ser inimigo, NPC ou aliado, e aplicar o efeito de arma. Uma função `SECURITY DEFINER` recebe o ataque já calculado pelo motor do cliente (ADR 0004). Ela confere que atacante e alvo estão no mesmo combate e que é o turno do atacante, aplica o dano e as Condições numa só transação e grava o ataque em `combat_attacks`.

Descartamos abrir o RLS para que o jogador altere o PV de qualquer participante, porque a permissão seria larga demais para um único gesto. Descartamos também deixar a tela do Mestre aplicar os ataques pendentes, porque dependeria do Mestre online e de mais um caminho em tempo real.

## Consequences

- A conta (acerto, crítico, dano, modalidade) fica no motor; a função só valida quem pode gravar e grava de forma atômica, o que também resolve dois danos seguidos que liam o mesmo PV.
- A função segue o gate de RLS: `search_path` fixo e `revoke execute ... from public, anon`, com teste por papel em `supabase/tests/rls.sql`.
