# O Pedido de Descanso abre o Descanso Curto por uma função no banco, e cada cliente recarrega o próprio personagem

O Descanso Curto abre quando o Mestre o abre ou quando todos os jogadores fazem o Pedido de Descanso. Só o Mestre pode alterar `game_sessions`, então o pedido do jogador passa por uma função `SECURITY DEFINER`, que grava o pedido e abre o descanso quando o último jogador pede, numa só transação. A função valida quem pode pedir, combate ativo e Descansos Curtos restantes, mas não calcula regra de jogo (ADR 0004): a recarga das Habilidades que voltam no Curto fica no motor. Por isso cada cliente, ao ver o descanso aberto, recarrega o próprio personagem uma vez por descanso, e o Mestre recarrega os NPCs jogáveis.

## Considered Options

- Abrir o RLS de `game_sessions` para o jogador: a permissão seria larga demais (dia, período, status da sessão) para um único gesto.
- Pedido só como aviso, com o Mestre sempre abrindo: descartado pelo autor; o grupo pode abrir sozinho.
- A tela do Mestre recarrega todo mundo quando o grupo abre: depende do Mestre online, o mesmo motivo de descarte do ADR 0005.
- Recarga calculada no banco: o banco não conhece o tipo de uso de cada Habilidade, que vive no conteúdo (ADR 0003).

## Consequences

- Cada descanso tem uma identidade, e a ficha guarda o último descanso em que recarregou, para não recarregar duas vezes no mesmo descanso.
- Um jogador que não abrir o app enquanto o descanso estiver aberto não recarrega as Habilidades daquele descanso. Na mesa presencial, todos estão com o app aberto.
- A função segue o gate de RLS: `search_path` fixo e `revoke execute ... from public, anon`, com teste por papel em `supabase/tests/rls.sql`.
