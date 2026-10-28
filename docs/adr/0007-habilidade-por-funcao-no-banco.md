# O efeito de Habilidade grava as Condições por uma função no banco, e o TR do alvo fica pendente até ser lançado

Estende o ADR 0005 às Habilidades. Uma Habilidade de jogador pode aplicar Condição a um inimigo ou removê-la de um aliado, e só o Mestre pode alterar `combat_participants`. Uma função `SECURITY DEFINER` recebe o efeito já calculado pelo motor do cliente (ADR 0004): a CD da Habilidade, os alvos e, depois do TR, quem falhou. Ela confere o combate ativo, o dono do personagem e o turno, aplica e remove as Condições numa transação e grava o uso no histórico do combate, ao lado dos ataques.

Quando a Habilidade impõe TR, o uso fica **pendente**: o Mestre lança os TRs dos inimigos (dado físico digitado ou Rolagem Virtual) e só então as Condições entram em quem falhou. A Habilidade de inimigo contra personagens segue o caminho inverso: o pedido de TR chega ao celular de cada jogador pelo Teste de sessão, e o resultado aplica a Condição e a perda de Fé.

## Considered Options

- Aplicar a Condição na hora e o Mestre remover de quem passou: rápido, mas inverte o ônus e deixa a Condição errada visível até a correção.
- Abrir o RLS de `combat_participants` ao jogador: largo demais para um gesto, o mesmo motivo do ADR 0005.
- Calcular o TR dos inimigos no banco: o modificador e a modalidade vivem no motor, e o dado é físico (ADR 0001).

## Consequences

- Um uso pendente depende do Mestre lançar os TRs; se o combate acabar antes, o uso pendente expira sem efeito no fim do combate (o uso e a Fé já foram gastos), e o Teste de sessão que ele abriu nos celulares é cancelado.
- A Resistência a Condição e as imunidades de Habilidade passiva entram no motor antes da gravação, como no efeito de arma.
- A função segue o gate de RLS: `search_path` fixo e `revoke execute ... from public, anon`, com teste por papel em `supabase/tests/rls.sql`.
