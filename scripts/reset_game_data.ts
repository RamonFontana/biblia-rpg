import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// É necessário usar a service_role key para ignorar RLS (Row Level Security)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Credenciais do Supabase ausentes.');
  console.error(
    'Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env.local',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetGameData() {
  console.log('Iniciando limpeza de dados de personagens e sessões...');

  // A ordem é importante devido às chaves estrangeiras (Foreign Keys).
  // Tabelas dependentes devem ser deletadas antes das tabelas principais.
  const tablesToDelete = [
    'session_test_results',
    'session_tests',
    'trade_items',
    'trades',
    'combat_participants',
    'combats',
    'session_enemies',
    'session_npcs',
    'session_participants',
    'character_items',
    'game_sessions',
    'characters',
  ];

  for (const table of tablesToDelete) {
    console.log(`Limpando tabela: ${table}...`);
    // O filtro .neq('id', '00000000-0000-0000-0000-000000000000') é um truque
    // para deletar todos os registros na API REST do Supabase.
    // Algumas tabelas podem não ter coluna 'id', caso isso aconteça esse script precisará ser adaptado,
    // mas de acordo com o database.types.ts todas possuem id.
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`Erro ao limpar tabela ${table}:`, error.message);
    } else {
      console.log(`Tabela ${table} limpa com sucesso.`);
    }
  }

  console.log('===========================================================');
  console.log('Dados do jogo apagados com sucesso!');
  console.log('Usuários (auth.users) e Itens (items/kit_items) permanecem intactos.');
  console.log('===========================================================');
}

resetGameData().catch(console.error);
