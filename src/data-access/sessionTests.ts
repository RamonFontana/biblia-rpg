// Testes de sessão (`session_tests`) e o resultado de cada jogador (`session_test_results`).
// As funções lançam o erro do Supabase. A aprovação e a perda de Fé ficam em
// `services/sessionTestService`.
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type SessionTest = Omit<Tables<'session_tests'>, 'status'> & {
  status: 'active' | 'completed' | 'cancelled';
};

export type SessionTestResult = Omit<Tables<'session_test_results'>, 'status'> & {
  status: 'pending' | 'submitted';
};

/**
 * `status` é `text` no banco; quem grava os valores é o app, que usa só as uniões acima. É a única
 * asserção dessa conversão.
 */
function toSessionTest(row: Tables<'session_tests'>): SessionTest {
  return row as SessionTest;
}

function toSessionTestResult(row: Tables<'session_test_results'>): SessionTestResult {
  return row as SessionTestResult;
}

/** Cria o Teste e, para cada jogador alvo, o resultado pendente. */
export async function createSessionTest(
  sessionId: string,
  testType: string,
  difficulty: number,
  targetPlayers: { characterId: string; playerId: string }[],
): Promise<SessionTest> {
  const { data: test, error: testError } = await supabase
    .from('session_tests')
    .insert({
      session_id: sessionId,
      test_type: testType,
      difficulty: difficulty,
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
}

export async function saveTestResult(resultId: string, result: SubmittedTestResult): Promise<void> {
  const { error } = await supabase
    .from('session_test_results')
    .update({
      result_value: result.resultValue,
      roll_value: result.rollValue,
      is_approved: result.isApproved,
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
