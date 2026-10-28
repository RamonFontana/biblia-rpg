import { useCallback, useEffect, useState } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import { getTestResults, type SessionTestResult } from '@/data-access/sessionTests';
import { uniqueChannelName } from '@/lib/channelName';

/**
 * Os resultados de um Teste de sessão, ao vivo: o painel do Mestre acompanha quem já respondeu o
 * TR de uma Habilidade de inimigo. Sem Teste (`null`), a lista é vazia.
 */
export function useTestResults(testId: string | null): SessionTestResult[] {
  const [results, setResults] = useState<SessionTestResult[]>([]);

  const load = useCallback(async () => {
    if (!testId) return;
    try {
      setResults(await getTestResults(testId));
    } catch (error) {
      console.error('Erro ao ler os resultados do Teste:', error);
    }
  }, [testId]);

  useEffect(() => {
    if (!testId) return;
    // Eventos antes da confirmação do canal se perdem: relê quando ele estiver no ar.
    return subscribeToTables(
      uniqueChannelName(`test_results_${testId}`),
      [{ table: 'session_test_results', filter: `test_id=eq.${testId}`, onChange: load }],
      { onSubscribed: () => void load() },
    );
  }, [testId, load]);

  return testId ? results : [];
}
