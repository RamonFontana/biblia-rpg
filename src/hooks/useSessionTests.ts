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

  // Subscribe to changes
  useEffect(() => {
    if (!sessionId) return
    // Generate unique channel names per effect execution to avoid StrictMode conflicts
    const channelId = crypto.randomUUID()
    
    const testsSubscription = supabase
      .channel(`session_tests_${sessionId}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_tests',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Test change received!', payload)
          // For simplicity, refetch when a test is added/updated/deleted
          // Realistically, you could update the state manually here
          fetchActiveTests()
        }
      )
      .subscribe()

    const resultsSubscription = supabase
      .channel(`session_test_results_${sessionId}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_test_results'
        },
        (payload) => {
          console.log('Result change received!', payload)
          fetchActiveTests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(testsSubscription)
      supabase.removeChannel(resultsSubscription)
    }
  }, [sessionId, fetchActiveTests])

  return {
    activeTests,
    testResults,
    loading,
    refresh: fetchActiveTests
  }
}
