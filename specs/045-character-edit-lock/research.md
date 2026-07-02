# Research: Character Edit Lock & Wizard UX

## Unknowns Resolved
- **Como verificar se o personagem participou de uma sessão?**
  - O arquivo `src/types/database.types.ts` confirma a existência do campo `has_participated_in_session: boolean | null` na tabela `characters`. Esta flag será usada no frontend.

## Best Practices & Patterns
- **Botão Salvar por aba**: Atualmente os forms provavelmente usam React Hook Form para armazenar o state no form "pai" e enviar tudo no final. Teremos que propiciar uma forma de disparar um "submit" com os dados validados correspondentes à etapa (aba) atual, disparando a chamada ao Supabase.
- **Campos Controlados e Bloqueio**: Para os campos mecânicos, a flag `has_participated_in_session` determinará a propriedade `disabled` dos inputs correspondentes, enquanto campos de história/aparência permanecerão habilitados.
