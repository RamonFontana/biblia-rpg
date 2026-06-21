# Data Model: Ajuste de Botões da Sessão (Home)

**Nota**: Nenhuma alteração no esquema do banco de dados (Supabase) é necessária para esta feature.

As tabelas utilizadas (`game_sessions` e `session_participants`) e suas relações já atendem perfeitamente aos requisitos.

## Entidades Utilizadas

### `game_sessions`
Representa a sessão ativa do jogo.
- **Campos Importantes**:
  - `id` (UUID): Identificador único da sessão.
  - `name` (String): Nome da sessão.
  - `status` (String): Estado atual da sessão (ex: 'active').
  - `gm_id` (UUID): Referência ao `user.id` do criador/mestre da sessão.

### `session_participants`
Representa o vínculo entre um personagem, uma sessão e o dono do personagem (usuário).
- **Campos Importantes**:
  - `session_id` (UUID): Referência à sessão de jogo.
  - `character_id` (UUID): Personagem participando da sessão.
  - `user_id` (UUID): Dono do personagem.

## Tratamento de Dados (Frontend)

O hook `useActiveSession` consome os dados dessas entidades e retorna o array `ActivePlayerSession[]`.
Devido à cardinalidade onde um usuário pode ter múltiplos personagens na mesma sessão, o front-end deverá realizar uma agregação ou filtragem (`reduce` ou `Set` approach) para retornar objetos únicos por `session_id`.

```typescript
export interface ActivePlayerSession {
  session_id: string;
  character_id: string; // Pode ser mantido o primeiro ou transformado em array se necessário, mas para o link basta 1 character_id.
  session_name: string;
  gm_id: string;
}
```
