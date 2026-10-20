import { useState, useEffect } from 'react';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { submitTestResult } from '@/services/sessionTestService';
import { getTestModifiers } from '@/features/character-management/utils/characterMath';
import { getEffectiveFaith, isFaithTestPassed } from '@/domain/faith';
import {
  calculateSubmittedTotal,
  checkFaithPenaltyDie,
  isSubmittableResult,
  rollTestDie,
} from '@/domain/sessionTests';
import { getCharacterStats } from '@/data-access/characters';
import { rollDie } from '@/domain/dice';
import { getErrorMessage } from '@/lib/errorMessage';
import { animateRoll } from '@/lib/rollAnimation';
import { systemRng } from '@/lib/systemRng';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useTestCharacterContext } from '@/hooks/useTestCharacterContext';
import { ChallengeCard } from './player-test/ChallengeCard';
import { FaithPenaltyForm } from './player-test/FaithPenaltyForm';
import { RollForm } from './player-test/RollForm';
import { SubmittedResult } from './player-test/SubmittedResult';

interface PlayerTestDialogProps {
  isOpen: boolean;
  activeTest: SessionTest | null;
  testResult: SessionTestResult | null;
}

export function PlayerTestDialog({ isOpen, activeTest, testResult }: PlayerTestDialogProps) {
  const [resultValue, setResultValue] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  // Faith test penalty state
  const [showPenaltyScreen, setShowPenaltyScreen] = useState(false);
  const [initialRollValue, setInitialRollValue] = useState<number>(0);
  const [faithPenaltyResult, setFaithPenaltyResult] = useState<number | ''>('');
  const [isRollingPenalty, setIsRollingPenalty] = useState(false);

  const isMounted = useIsMounted();
  const { sheet, hasStealthDisadvantage, faithPenalty } = useTestCharacterContext(
    activeTest && testResult ? testResult.character_id : undefined,
    testResult,
  );

  // Reset state when a new test arrives
  useEffect(() => {
    if (activeTest) {
      setResultValue('');
      setError(null);
      setIsSubmitting(false);
      setDismissed(false);
      setIsRolling(false);
      setShowPenaltyScreen(false);
      setInitialRollValue(0);
      setFaithPenaltyResult('');
      setIsRollingPenalty(false);
    }
  }, [activeTest, testResult]);

  if (!isOpen || !activeTest || !testResult || dismissed) return null;

  // If already submitted, show waiting screen
  if (testResult.status === 'submitted') {
    return (
      <SubmittedResult
        test={activeTest}
        result={testResult}
        sheet={sheet}
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  const executeSubmit = async (val: number, penalty?: number, rollValue?: number) => {
    if (!isSubmittableResult(val)) {
      setError('Valor fora do intervalo aceitável (0-100).');
      return;
    }

    let isFailedFaithTest = false;
    if (activeTest.test_type === 'Fé') {
      // Busca a fé atual do personagem direto do banco para garantir o valor correto
      const stats = await getCharacterStats(testResult.character_id).catch((error) => {
        console.error('Error reading the character Faith for the test:', error);
        return null;
      });
      // faithPenalty é a soma (negativa) dos Itens Profanos; a mesma regra grava is_approved.
      isFailedFaithTest = !isFaithTestPassed(
        val,
        activeTest.difficulty,
        getEffectiveFaith(stats, faithPenalty),
      );
    }

    if (isFailedFaithTest && penalty === undefined) {
      setShowPenaltyScreen(true);
      setInitialRollValue(val);
      setResultValue(''); // clear input just in case
      setError(null);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await submitTestResult(
        testResult.id,
        val,
        activeTest.difficulty,
        testResult.character_id,
        activeTest.test_type,
        penalty,
        rollValue ?? val,
      );
      // The component will re-render in the 'submitted' state because of realtime update
    } catch (err) {
      if (isMounted.current) {
        setError(getErrorMessage(err, 'Erro ao enviar resultado.'));
        setIsSubmitting(false);
        setIsRolling(false);
      }
    }
  };

  const handleSubmit = () => {
    if (resultValue === '' || isNaN(resultValue as number)) {
      setError('Insira um valor válido.');
      return;
    }

    const rolled = Number(resultValue);
    const total = calculateSubmittedTotal(
      activeTest.test_type,
      rolled,
      getTestModifiers(activeTest.test_type, sheet),
    );

    executeSubmit(total, undefined, rolled);
  };

  const handleSubmitPenalty = () => {
    const problem = checkFaithPenaltyDie(faithPenaltyResult);
    if (problem === 'empty') {
      setError('Insira um valor válido para o d6 (1-6).');
      return;
    }
    if (problem === 'range') {
      setError('O valor do d6 deve estar entre 1 e 6.');
      return;
    }
    executeSubmit(initialRollValue, Number(faithPenaltyResult));
  };

  const handleRollPenalty = () => {
    if (isRollingPenalty || isSubmitting) return;
    setIsRollingPenalty(true);
    setError(null);

    animateRoll({
      duration: 1000,
      minInterval: 50,
      maxInterval: 150,
      isActive: () => isMounted.current,
      onTick: () => setFaithPenaltyResult(rollDie(6, systemRng)),
      onFinish: () => {
        const finalResult = rollDie(6, systemRng);
        setFaithPenaltyResult(finalResult);
        setTimeout(() => {
          if (isMounted.current) {
            executeSubmit(initialRollValue, finalResult);
          }
        }, 400);
      },
    });
  };

  const handleRollDice = () => {
    if (isRolling || isSubmitting) return;
    setIsRolling(true);
    setError(null);

    animateRoll({
      duration: 1500, // 1.5 seconds of rolling
      minInterval: 50,
      maxInterval: 200,
      isActive: () => isMounted.current,
      onTick: () => setResultValue(rollTestDie(activeTest.test_type, systemRng)),
      onFinish: () => {
        setResultValue(rollTestDie(activeTest.test_type, systemRng));
        setIsRolling(false); // Parar o estado de rolando
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-600/20 rotate-45 transform translate-x-8 -translate-y-8" />

        <h2 className="text-2xl font-serif text-amber-500 mb-1 text-center animate-pulse">
          O Mestre Exige um Teste!
        </h2>
        <p className="text-center text-stone-400 text-sm mb-6 pb-4 border-b border-stone-800">
          Role seus dados físicos e insira o resultado, ou use o dado virtual.
        </p>

        <div className="space-y-6">
          <ChallengeCard test={activeTest} />

          {!showPenaltyScreen ? (
            <RollForm
              test={activeTest}
              sheet={sheet}
              hasStealthDisadvantage={hasStealthDisadvantage}
              faithPenalty={faithPenalty}
              value={resultValue}
              onChange={setResultValue}
              isRolling={isRolling}
              isSubmitting={isSubmitting}
              error={error}
              onRoll={handleRollDice}
              onSubmit={handleSubmit}
            />
          ) : (
            <FaithPenaltyForm
              value={faithPenaltyResult}
              onChange={setFaithPenaltyResult}
              isRolling={isRollingPenalty}
              isSubmitting={isSubmitting}
              error={error}
              onRoll={handleRollPenalty}
              onSubmit={handleSubmitPenalty}
            />
          )}
        </div>
      </div>
    </div>
  );
}
