// Testes de sessão (`session_tests`) e o resultado de cada jogador (`session_test_results`).
// As funções lançam o erro do Supabase. A aprovação e a perda de Fé ficam em
// `services/sessionTestService`.
import { supabase } from '@/lib/supabase';
import type { FaithUse } from '@/domain/sessionTests';
import type { MasterMark, TestMode } from '@/domain/testMode';
import type { Tables } from '@/types/database.types';

export type SessionTest = Omit<Tables<'session_tests'>, 'status' | 'faith_use'> & {
  status: 'active' | 'completed' | 'cancelled';
  faith_use: FaithUse | null;
};

export type SessionTestResult = Omit<
  Tables<'session_test_results'>,
  'status' | 'master_mark' | 'applied_mode'
> & {
  status: 'pending' | 'submitted';
  /** A marca do Mestre para este alvo; nula é Normal. */
  master_mark: MasterMark;
  /** A modalidade que valeu, gravada no envio; nula antes dele. */
  applied_mode: TestMode | null;
};

/**
 * `status` é `text` no banco; quem grava os valores é o app, que usa só as uniões acima (e o banco
 * recusa um `faith_use` fora dos três usos). É a única asserção dessa conversão.
 */
function toSessionTest(row: Tables<'session_tests'>): SessionTest {
  return row as SessionTest;
}

function toSessionTestResult(row: Tables<'session_test_results'>): SessionTestResult {
  return row as SessionTestResult;
}

/** O uso do Teste de Fé e a marca de Pedido Egoísta; `null` nos Testes que não são de Fé. */
export interface FaithTestOptions {
  use: FaithUse;
  selfishRequest: boolean;
}

/** Cria o Teste e, para cada jogador alvo, o resultado pendente. */
export async function createSessionTest(
  sessionId: string,
  testType: string,
  difficulty: number,
  targetPlayers: { characterId: string; playerId: string; masterMark?: MasterMark }[],
  faith: FaithTestOptions | null,
): Promise<SessionTest> {
  const { data: test, error: testError } = await supabase
    .from('session_tests')
    .insert({
      session_id: sessionId,
      test_type: testType,
      difficulty: difficulty,
      faith_use: faith?.use ?? null,
      selfish_request: faith?.selfishRequest ?? false,
      status: 'active',
    })
    .select()
    .single();

  if (testError) throw testError;

  const { error: resultsError } = await supabase.from('session_test_results').insert(
    targetPlayers.map((p) => ({
      test_id: test.id,
      character_id: p.characterId,
      player_id: p.playerId,
      master_mark: p.masterMark ?? null,
      status: 'pending',
    })),
  );

  if (resultsError) throw resultsError;

  return toSessionTest(test);
}

export interface SubmittedTestResult {
  resultValue: number;
  rollValue: number | null;
  isApproved: boolean;
  /** A modalidade que valeu (com as Desvantagens automáticas e a Inspiração). */
  appliedMode: TestMode | null;
  /** Os dois dados da Rolagem Virtual com Vantagem ou Desvantagem; nulo nos demais casos. */
  rollValues: number[] | null;
  /** O jogador gastou a Inspiração neste Teste. */
  inspirationUsed: boolean;
}

export async function saveTestResult(resultId: string, result: SubmittedTestResult): Promise<void> {
  const { error } = await supabase
    .from('session_test_results')
    .update({
      result_value: result.resultValue,
      roll_value: result.rollValue,
      is_approved: result.isApproved,
      applied_mode: result.appliedMode,
      roll_values: result.rollValues,
      inspiration_used: result.inspirationUsed,
      status: 'submitted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', resultId);

  if (error) throw error;
}

export async function cancelSessionTest(testId: string): Promise<void> {
  const { error } = await supabase
    .from('session_tests')
    .update({ status: 'cancelled' })
    .eq('id', testId);

  if (error) throw error;
}

export async function completeSessionTest(testId: string): Promise<void> {
  const { error } = await supabase
    .from('session_tests')
    .update({ status: 'completed' })
    .eq('id', testId);

  if (error) throw error;
}

export async function getActiveTestsForSession(sessionId: string): Promise<SessionTest[]> {
  const { data, error } = await supabase
    .from('session_tests')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'active');

  if (error) throw error;
  return data.map(toSessionTest);
}

export async function getTestResults(testId: string): Promise<SessionTestResult[]> {
  const { data, error } = await supabase
    .from('session_test_results')
    .select('*')
    .eq('test_id', testId);

  if (error) throw error;
  return data.map(toSessionTestResult);
}
