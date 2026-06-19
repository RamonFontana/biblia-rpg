# Research & Decisions: combat-system

## Technical Stack Selection

- **Decision**: TypeScript, React, Next.js, Zustand, Supabase (Realtime + DB), Shadcn UI, React Hook Form, Zod.
- **Rationale**: A stack robusta para a construção de uma aplicação reativa em tempo real. Supabase Realtime permite sincronizar os estados de combate (HP, Turnos, Condições) entre o Mestre (DM) e os jogadores instantaneamente. Zustand gerenciará os estados locais voláteis (ex: checklist de ações do turno). Shadcn UI com React Hook Form e Zod garantirão formulários bem validados (ex: setup de iniciativa, aplicação de dano/cura).
- **Alternatives considered**: Context API puro (rejeitado por causar re-renders excessivos em cenários de Realtime). Redux (rejeitado por verbosidade).

## Data Modeling & Realtime Synchronization

- **Decision**: Manter as tabelas `combats` e `combat_participants` no Supabase e inscrever o `combatStore` (Zustand) nos canais do Supabase Realtime para escutar inserts/updates/deletes nessas tabelas baseadas no `combat_id`.
- **Rationale**: Essa arquitetura centraliza a verdade no banco de dados, prevenindo dessincronização caso o jogador ou o Mestre deem reload na página. O estado local do checklist de ações (Movimento, Ação, Ação Bônus, Reação) será mantido apenas localmente no Zustand do cliente do Jogador e será resetado quando o `current_turn_index` mudar e indicar que o turno voltou para ele.
- **Alternatives considered**: Manter o combate puramente na memória do servidor ou em canais de broadcast sem persistência (rejeitado porque uma desconexão do Mestre ou recarregamento de página perderia o estado do combate).

## Form Integration

- **Decision**: Usar `react-hook-form` em conjunto com `@hookform/resolvers/zod` para o formulário de Setup do Combate (iniciativas) e modais de dano.
- **Rationale**: A adoção dessas ferramentas obedece às melhores práticas solicitadas pelo usuário, oferecendo validação robusta de tipos, prevenindo inserção de valores nulos ou incorretos (ex: dano negativo) e facilitando a integração com componentes controlados do Shadcn UI (Form, FormField, FormItem).
