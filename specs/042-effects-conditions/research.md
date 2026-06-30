# Research & Decisions: Efeitos e Condições

## Shadcn UI e Componentes Visuais
**Decision**: Utilizar `Badge`, `DropdownMenu` e `Dialog` do shadcn/ui.
**Rationale**: Garantem uma UI rica e limpa para as tabelas e grids, mantendo acessibilidade.
**Alternatives considered**: Usar CSS/Tailwind puro sem Radix. Rejeitado pelo retrabalho em acessibilidade e navegação de teclado que o shadcn já fornece nativamente.

## Supabase Real-time Sync
**Decision**: Ativar o `supabase.channel('schema-db-changes')` escutando a tabela `combat_participants` e `characters` via WebSockets.
**Rationale**: O usuário exige feedback em "real-time" para que os jogadores vejam quando o mestre aplicar efeitos na ficha deles.
**Alternatives considered**: Polling de 5 em 5 segundos. Rejeitado pelo custo no banco e tempo de resposta pior.
