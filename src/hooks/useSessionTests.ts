import { useState, useEffect, useCallback } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import {
  type SessionTest,
  type SessionTestResult,
  getActiveTestsForSession,
  getTestResults,
} from '@/data-access/sessionTests';

const logFetchError = (error: unknown) => console.error('Error fetching session tests:', error);

export function useSessionTests(sessionId: string) {
  const [activeTests, setActiveTests] = useState<SessionTest[]>([]);
  const [testResults, setTestResults] = useState<Record<string, SessionTestResult[]>>({});
  const [loading, setLoading] = useState(true);

  // Outra sessão recomeça o carregamento. Ajustar durante a renderização (e não num efeito) evita
  // um quadro com a sessão nova e `loading` desligado.
  const [loadedSessionId, setLoadedSessionId] = useState(sessionId);
  if (loadedSessionId !== sessionId) {
    setLoadedSessionId(sessionId);
    setLoading(true);
  }

  // Quem chama trata a falha (`logFetchError`); aqui só se garante que o carregamento termina.
  const loadActiveTests = useCallback(async () => {
    if (!sessionId) return;

    try {
      const tests = await getActiveTestsForSession(sessionId);
      setActiveTests(tests);

      // Fetch results for all active tests
      const resultsMap: Record<string, SessionTestResult[]> = {};
      for (const test of tests) {
        const results = await getTestResults(test.id);
        resultsMap[test.id] = results;
      }
      setTestResults(resultsMap);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Consulta nova (realtime ou chamada de fora): liga `loading` e carrega.
  const fetchActiveTests = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    await loadActiveTests().catch(logFetchError);
  }, [sessionId, loadActiveTests]);

  useEffect(() => {
    loadActiveTests().catch(logFetchError);
  }, [loadActiveTests]);

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
