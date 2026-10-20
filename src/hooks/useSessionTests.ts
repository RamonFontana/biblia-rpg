import { useState, useEffect, useCallback } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import {
  type SessionTest,
  type SessionTestResult,
  getActiveTestsForSession,
  getTestResults,
} from '@/data-access/sessionTests';

export function useSessionTests(sessionId: string) {
  const [activeTests, setActiveTests] = useState<SessionTest[]>([]);
  const [testResults, setTestResults] = useState<Record<string, SessionTestResult[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch initial active tests
  const fetchActiveTests = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const tests = await getActiveTestsForSession(sessionId);
      setActiveTests(tests);

      // Fetch results for all active tests
      const resultsMap: Record<string, SessionTestResult[]> = {};
      for (const test of tests) {
        const results = await getTestResults(test.id);
        resultsMap[test.id] = results;
      }
      setTestResults(resultsMap);
    } catch (error) {
      console.error('Error fetching session tests:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchActiveTests();
  }, [fetchActiveTests]);

  useEffect(() => {
    if (!sessionId) return;

    return subscribeToTables(`session_tests_realtime_${sessionId}_${Math.random()}`, [
      { table: 'session_tests', filter: `session_id=eq.${sessionId}`, onChange: fetchActiveTests },
      { table: 'session_test_results', onChange: fetchActiveTests },
    ]);
  }, [sessionId, fetchActiveTests]);

  return {
    activeTests,
    testResults,
    loading,
    refresh: fetchActiveTests,
  };
}
