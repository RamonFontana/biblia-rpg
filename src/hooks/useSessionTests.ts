import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { type SessionTest, type SessionTestResult, sessionTestService } from '@/services/sessionTestService'

export function useSessionTests(sessionId: string) {
  const [activeTests, setActiveTests] = useState<SessionTest[]>([])
  const [testResults, setTestResults] = useState<Record<string, SessionTestResult[]>>({})
  const [loading, setLoading] = useState(true)

  // Fetch initial active tests
  const fetchActiveTests = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const tests = await sessionTestService.getActiveTestsForSession(sessionId)
      setActiveTests(tests)

      // Fetch results for all active tests
      const resultsMap: Record<string, SessionTestResult[]> = {}
      for (const test of tests) {
        const results = await sessionTestService.getTestResults(test.id)
        resultsMap[test.id] = results
      }
      setTestResults(resultsMap)
    } catch (error) {
      console.error('Error fetching session tests:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchActiveTests()
  }, [fetchActiveTests])

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`session_tests_realtime_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_tests', filter: `session_id=eq.${sessionId}` },
        fetchActiveTests
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_test_results' },
        fetchActiveTests
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, fetchActiveTests])

  return {
    activeTests,
    testResults,
    loading,
    refresh: fetchActiveTests
  }
}
