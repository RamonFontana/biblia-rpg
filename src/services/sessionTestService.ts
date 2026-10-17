import { supabase } from '@/lib/supabase';
import { getCurrentFaith, getEffectiveFaith, isFaithTestPassed } from '@/domain/faith';
import { getItemFaithPenalty } from '@/services/characterItemService';
import { calculateFaithAfterFailure, isRegularTestApproved } from '@/domain/sessionTests';
import { systemRng } from '@/lib/systemRng';

export interface SessionTest {
  id: string;
  session_id: string;
  test_type: string;
  difficulty: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface SessionTestResult {
  id: string;
  test_id: string;
  character_id: string;
  player_id: string;
  status: 'pending' | 'submitted';
  result_value: number | null;
  /** Dado rolado, sem bônus. Nulo em testes anteriores à coluna. */
  roll_value: number | null;
  is_approved: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export const sessionTestService = {
  async createTest(
    sessionId: string,
    testType: string,
    difficulty: number,
    targetPlayers: { characterId: string; playerId: string }[],
  ): Promise<SessionTest> {
    // Insert the main test record
    const { data: test, error: testError } = await (supabase as any)
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

    // Insert the results records for each player (pending status)
    const resultsData = targetPlayers.map((p) => ({
      test_id: test.id,
      character_id: p.characterId,
      player_id: p.playerId,
      status: 'pending',
    }));

    const { error: resultsError } = await (supabase as any)
      .from('session_test_results')
      .insert(resultsData);

    if (resultsError) throw resultsError;

    return test;
  },

  async submitTestResult(
    resultId: string,
    resultValue: number,
    difficulty: number,
    characterId?: string,
    testType?: string,
    faithPenalty?: number,
    rollValue?: number,
  ): Promise<void> {
    let isApproved = isRegularTestApproved(resultValue, difficulty);

    let charData = null;
    if (characterId) {
      const { data } = await supabase
        .from('characters')
        .select('stats')
        .eq('id', characterId)
        .single();
      charData = data;
    }

    if (testType === 'Fé' && characterId && charData?.stats) {
      const stats = charData.stats as Record<string, any>;
      // Mesma regra da tela do jogador: passa se o dado <= Fé Efetiva (Fé Atual mais a penalidade
      // dos Itens Profanos) + Modificador de Fé do Mestre.
      const itemFaithPenalty = await getItemFaithPenalty(characterId);
      isApproved = isFaithTestPassed(
        resultValue,
        difficulty,
        getEffectiveFaith(stats, itemFaithPenalty),
      );
    }

    const { error } = await (supabase as any)
      .from('session_test_results')
      .update({
        result_value: resultValue,
        roll_value: rollValue ?? null,
        is_approved: isApproved,
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resultId);

    if (error) throw error;

    // Regra Bíblica: Falha em teste de Fé causa perda de 1d6 de Fé
    if (testType === 'Fé' && !isApproved && characterId) {
      // Busca os stats atualizados do personagem
      const { data: freshCharData } = await (supabase as any)
        .from('characters')
        .select('stats')
        .eq('id', characterId)
        .single();

      if (freshCharData && freshCharData.stats) {
        const stats = freshCharData.stats as Record<string, any>;
        const { newFaith: newCurrentFaith } = calculateFaithAfterFailure(
          getCurrentFaith(stats),
          faithPenalty,
          systemRng,
        );

        await (supabase as any)
          .from('characters')
          .update({
            stats: {
              ...stats,
              current_faith: newCurrentFaith,
            },
          })
          .eq('id', characterId);
      }
    }
  },

  async cancelTest(testId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('session_tests')
      .update({ status: 'cancelled' })
      .eq('id', testId);

    if (error) throw error;
  },

  async completeTest(testId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('session_tests')
      .update({ status: 'completed' })
      .eq('id', testId);

    if (error) throw error;
  },

  async getActiveTestsForSession(sessionId: string): Promise<SessionTest[]> {
    const { data, error } = await (supabase as any)
      .from('session_tests')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  },

  async getTestResults(testId: string): Promise<SessionTestResult[]> {
    const { data, error } = await (supabase as any)
      .from('session_test_results')
      .select('*')
      .eq('test_id', testId);

    if (error) throw error;
    return data;
  },
};
