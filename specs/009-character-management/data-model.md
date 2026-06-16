# Data Model: Personagens

## Entities

### `characters` (Supabase Table)
*Armazena as instâncias dos personagens dos usuários.*

**Fields:**
- `id`: uuid, primary key
- `user_id`: uuid, foreign key (references `auth.users`)
- `name`: string
- `tribe`: string
- `vocation`: string
- `has_participated_in_session`: boolean (default: false)
- `attributes`: jsonb (FOR, DES, CON, INT, SAB, CAR)
- `stats`: jsonb (PV, CA, Faith)
- `equipment`: jsonb
- `coins`: integer
- `fortress`: string
- `temptation`: string
- `created_at`: timestamp with time zone
- `updated_at`: timestamp with time zone

**Relationships:**
- Pertence a `auth.users` (1:1 per record)

**Validation Rules:**
- `user_id` não pode ser nulo.
- Nome deve ser string não-vazia.

**State Transitions:**
- `has_participated_in_session`: Vai de `false` -> `true` quando o sistema de mesa relata que a sessão começou. Transição irreversível via CRUD do usuário.

## Row Level Security (RLS) Policies

1. **Select**: `CREATE POLICY "Users can view their own characters" ON characters FOR SELECT USING (auth.uid() = user_id);`
2. **Insert**: `CREATE POLICY "Users can insert their own characters" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);`
3. **Update**: `CREATE POLICY "Users can update their own characters if not in session" ON characters FOR UPDATE USING (auth.uid() = user_id AND has_participated_in_session = false);`
4. **Delete**: (Opcional, restrito a `has_participated_in_session = false`)
