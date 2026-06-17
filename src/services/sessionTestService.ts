import { supabase } from '@/lib/supabase'

export interface SessionTest {
  id: string
  session_id: string
  test_type: string
  difficulty: number
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

export interface SessionTestResult {
  id: string
  test_id: string
  character_id: string
  player_id: string
  status: 'pending' | 'submitted'
  result_value: number | null
  is_approved: boolean | null
  created_at: string
  updated_at: string | null
}

export const sessionTestService = {
  async createTest(
    sessionId: string,
    testType: string,
    difficulty: number,
    targetPlayers: { characterId: string; playerId: string }[]
  ): Promise<SessionTest> {
    // Insert the main test record
    const { data: test, error: testError } = await (supabase as any)
      .from('session_tests')
      .insert({
        session_id: sessionId,
        test_type: testType,
        difficulty: difficulty,
        status: 'active'
      })
      .select()
      .single()

    if (testError) throw testError

    // Insert the results records for each player (pending status)
    const resultsData = targetPlayers.map((p) => ({
      test_id: test.id,
      character_id: p.characterId,
      player_id: p.playerId,
      status: 'pending'
    }))

    const { error: resultsError } = await (supabase as any)
      .from('session_test_results')
      .insert(resultsData)

    if (resultsError) throw resultsError

    return test
  },

  async submitTestResult(
    resultId: string,
    resultValue: number,
    difficulty: number,
    characterId?: string,
    testType?: string,
    faithPenalty?: number
  ): Promise<void> {
    let isApproved = resultValue >= difficulty

    let charData = null
    if (characterId) {
      const { data } = await supabase.from('characters').select('stats').eq('id', characterId).single()
      charData = data
    }

    if (testType === 'Fé' && charData?.stats) {
      const stats = charData.stats as Record<string, any>
      const currentFaith = stats.current_faith ?? stats.faith ?? 0
      // Misericórdia subtrai do DADO, não da fé
      // Passa se (dado - misericórdia) <= fé  <==>  dado <= fé + misericórdia
      isApproved = (resultValue - difficulty) <= currentFaith
    }

    const { error } = await (supabase as any)
      .from('session_test_results')
      .update({
        result_value: resultValue,
        is_approved: isApproved,
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId)

    if (error) throw error

    // Regra Bíblica: Falha em teste de Fé causa perda de 1d6 de Fé
    if (testType === 'Fé' && !isApproved && characterId) {
      // Busca os stats atualizados do personagem
      const { data: freshCharData } = await (supabase as any)
        .from('characters')
        .select('stats')
        .eq('id', characterId)
        .single()

      if (freshCharData && freshCharData.stats) {
        const stats = freshCharData.stats as Record<string, any>
        // current_faith é a fé atual (se não existir, usa faith como base)
        const currentFaithValue = stats.current_faith ?? stats.faith ?? 0
        if (typeof currentFaithValue === 'number') {
          const faithLoss = faithPenalty !== undefined ? faithPenalty : (Math.floor(Math.random() * 6) + 1)
          const newCurrentFaith = Math.max(0, currentFaithValue - faithLoss)

          await (supabase as any)
            .from('characters')
            .update({
              stats: {
                ...stats,
                current_faith: newCurrentFaith
              }
            })
            .eq('id', characterId)
        }
      }
    }
  },

  async cancelTest(testId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('session_tests')
      .update({ status: 'cancelled' })
      .eq('id', testId)

    if (error) throw error
  },

  async completeTest(testId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('session_tests')
      .update({ status: 'completed' })
      .eq('id', testId)

    if (error) throw error
  },

  async getActiveTestsForSession(sessionId: string): Promise<SessionTest[]> {
    const { data, error } = await (supabase as any)
      .from('session_tests')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')

    if (error) throw error
    return data
  },

  async getTestResults(testId: string): Promise<SessionTestResult[]> {
    const { data, error } = await (supabase as any)
      .from('session_test_results')
      .select('*')
      .eq('test_id', testId)

    if (error) throw error
    return data
  }
}
