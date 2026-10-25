import { useState } from 'react';
import {
  type SessionTest,
  type SessionTestResult,
  cancelSessionTest,
  completeSessionTest,
  createSessionTest,
} from '@/data-access/sessionTests';
import type { Character } from '@/features/character-management/types';
import { getErrorMessage } from '@/lib/errorMessage';

interface MasterTestDialogProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  activeTests: SessionTest[];
  testResults: Record<string, SessionTestResult[]>;
  playerCharacters: { character: Character }[];
}

import { TEST_GROUPS, getTestBreakdown } from '@/features/character-management/utils/characterMath';
import {
  FAITH_USES,
  FAITH_USE_LABELS,
  failureCostsFaith,
  toStoredDifficulty,
  type FaithUse,
} from '@/domain/sessionTests';
import type { MasterMark } from '@/domain/testMode';

// A escolha do Mestre por alvo: Normal (sem marca), Vantagem ou Desvantagem.
const MODE_CHOICES: { value: MasterMark; label: string }[] = [
  { value: null, label: 'Normal' },
  { value: 'vantagem', label: 'Vantagem' },
  { value: 'desvantagem', label: 'Desvantagem' },
];

// Atalhos de Punição do Teste de Fé (0, −20, −50); no Clamor levam o nome do doc.
const PUNISHMENT_SHORTCUTS = [0, 20, 50] as const;
const CLAMOR_SHORTCUT_NAMES = ['Pequena Providência', 'Milagre Moderado', 'Milagre Extraordinário'];
const shortcutLabel = (use: FaithUse, index: number) => {
  const value = PUNISHMENT_SHORTCUTS[index];
  return use === 'clamor'
    ? `${CLAMOR_SHORTCUT_NAMES[index]} (${value === 0 ? '0' : `−${value}`})`
    : `Punição ${value === 0 ? '0' : `−${value}`}`;
};

export function MasterTestDialog({
  sessionId,
  isOpen,
  onClose,
  activeTests,
  testResults,
  playerCharacters,
}: MasterTestDialogProps) {
  const [testType, setTestType] = useState(TEST_GROUPS[0].options[0]);
  const [difficulty, setDifficulty] = useState(10);
  const [faithModifierType, setFaithModifierType] = useState<'mercy' | 'punishment'>('mercy');
  const [faithUse, setFaithUse] = useState<FaithUse>('clamor');
  const [selfishRequest, setSelfishRequest] = useState(false);
  const [marks, setMarks] = useState<Record<string, MasterMark>>({});
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // There is an active test if there's any test with 'active' status
  // We can just look at the first active test for now to simplify
  const currentActiveTest = activeTests.find((t) => t.status === 'active');
  const currentResults = currentActiveTest ? testResults[currentActiveTest.id] || [] : [];

  if (!isOpen) return null;

  const handleTogglePlayer = (characterId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(characterId) ? prev.filter((id) => id !== characterId) : [...prev, characterId],
    );
  };

  const handleSelectAll = () => {
    setSelectedPlayers(playerCharacters.map((pc) => pc.character.id));
  };

  const handleDeselectAll = () => {
    setSelectedPlayers([]);
  };

  const handleCreateTest = async () => {
    if (selectedPlayers.length === 0) {
      setError('Selecione pelo menos um jogador.');
      return;
    }
    if (difficulty < 0 || difficulty > 100) {
      setError('O valor deve estar entre 0 e 100.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const finalDifficulty = toStoredDifficulty(testType, difficulty, faithModifierType);

    try {
      const targets = selectedPlayers
        .map((charId) => {
          const pc = playerCharacters.find((p) => p.character.id === charId);
          return {
            characterId: charId,
            playerId: pc?.character.user_id || '',
            masterMark: marks[charId] ?? null,
          };
        })
        .filter((t) => t.playerId !== '');

      await createSessionTest(
        sessionId,
        testType,
        finalDifficulty,
        targets,
        testType === 'Fé'
          ? { use: faithUse, selfishRequest: faithUse === 'clamor' && selfishRequest }
          : null,
      );
      // The state will be updated via the realtime hook in the parent
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao criar o teste.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTest = async () => {
    if (!currentActiveTest) return;
    setIsSubmitting(true);
    try {
      await cancelSessionTest(currentActiveTest.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao cancelar o teste.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTest = async () => {
    if (!currentActiveTest) return;
    setIsSubmitting(true);
    try {
      await completeSessionTest(currentActiveTest.id);
      onClose(); // Close the dialog completely when finished
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao concluir o teste.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if we are showing the creation form or the active dashboard
  if (currentActiveTest) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-amber-500">Teste em Andamento</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-stone-800 rounded border border-stone-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-stone-400">Tipo de Teste</p>
                <p className="text-lg font-bold text-amber-400">{currentActiveTest.test_type}</p>
                {currentActiveTest.faith_use && (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-300">
                    <span>{FAITH_USE_LABELS[currentActiveTest.faith_use]}</span>
                    {currentActiveTest.selfish_request && (
                      <span className="rounded-full border border-red-700/50 bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
                        Pedido Egoísta
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-400">
                  {currentActiveTest.test_type === 'Fé'
                    ? currentActiveTest.difficulty < 0
                      ? 'Punição'
                      : 'Misericórdia'
                    : 'Dificuldade'}
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {Math.abs(currentActiveTest.difficulty)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">
              Resultados ({currentResults.filter((r) => r.status === 'submitted').length}/
              {currentResults.length})
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {currentResults.map((result) => {
                const pc = playerCharacters.find((p) => p.character.id === result.character_id);
                const charName = pc?.character.name || 'Desconhecido';

                return (
                  <div
                    key={result.id}
                    className="flex justify-between items-center p-3 bg-stone-800 rounded border border-stone-700"
                  >
                    <span className="font-medium text-stone-300">{charName}</span>
                    {result.status === 'pending' ? (
                      <span className="text-stone-500 italic text-sm animate-pulse">
                        Aguardando...
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-mono bg-stone-900 px-2 py-1 rounded">
                            {result.result_value}
                          </span>
                          {result.is_approved ? (
                            <span className="text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded">
                              Aprovado
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold px-2 py-1 bg-red-500/10 rounded">
                              Reprovado
                            </span>
                          )}
                        </div>
                        {result.applied_mode && result.applied_mode !== 'normal' && (
                          <span className="text-xs text-stone-400">
                            com {result.applied_mode === 'vantagem' ? 'Vantagem' : 'Desvantagem'}
                          </span>
                        )}
                        {currentActiveTest.test_type === 'Fé' && !result.is_approved && (
                          <span className="text-xs text-stone-400">
                            {failureCostsFaith(
                              currentActiveTest.faith_use,
                              currentActiveTest.selfish_request,
                            )
                              ? 'Perdeu Fé (1d6)'
                              : 'Silêncio divino, sem perda de Fé'}
                          </span>
                        )}
                        <span className="text-xs font-mono text-stone-500">
                          {getTestBreakdown(
                            currentActiveTest.test_type,
                            result.result_value,
                            pc?.character,
                            result.roll_value,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

          <div className="flex justify-between mt-6 pt-4 border-t border-stone-800">
            <button
              onClick={handleCancelTest}
              disabled={isSubmitting}
              className="px-4 py-2 text-stone-400 hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              Cancelar Teste
            </button>
            <button
              onClick={handleCompleteTest}
              disabled={isSubmitting}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-100 rounded font-medium disabled:opacity-50 transition-colors"
            >
              Encerrar Teste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif text-amber-500">Solicitar Teste aos Jogadores</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div
            className={`grid grid-cols-1 ${testType === 'Fé' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}
          >
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Tipo de Teste</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {TEST_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {testType === 'Fé' && (
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Modificador</label>
                <select
                  value={faithModifierType}
                  onChange={(e) => setFaithModifierType(e.target.value as 'mercy' | 'punishment')}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="mercy">Misericórdia</option>
                  <option value="punishment">Punição</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">
                {testType === 'Fé'
                  ? faithModifierType === 'mercy'
                    ? 'Misericórdia (0-100)'
                    : 'Punição (0-100)'
                  : 'Dificuldade'}
              </label>
              <input
                type="number"
                min="0"
                max={testType === 'Fé' ? 100 : 20}
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value) || 0)}
                className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-red-500 text-center font-mono text-lg"
              />
            </div>
          </div>

          {testType === 'Fé' && (
            <div className="space-y-3">
              <div
                role="radiogroup"
                aria-label="Uso do Teste de Fé"
                className="flex flex-wrap gap-2"
              >
                {FAITH_USES.map((use) => (
                  <button
                    key={use}
                    type="button"
                    role="radio"
                    aria-checked={faithUse === use}
                    onClick={() => setFaithUse(use)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      faithUse === use
                        ? 'border-amber-600 bg-amber-600 text-stone-900'
                        : 'border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {FAITH_USE_LABELS[use]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {PUNISHMENT_SHORTCUTS.map((value, index) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFaithModifierType('punishment');
                      setDifficulty(value);
                    }}
                    className="rounded border border-stone-600 bg-stone-800 px-3 py-1 text-xs text-stone-300 hover:bg-stone-700"
                  >
                    {shortcutLabel(faithUse, index)}
                  </button>
                ))}
              </div>
              {faithUse === 'clamor' && (
                <label className="flex items-center gap-2 text-sm text-stone-300">
                  <input
                    type="checkbox"
                    checked={selfishRequest}
                    onChange={(e) => setSelfishRequest(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Pedido Egoísta
                </label>
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-stone-400">
                Jogadores Alvo ({selectedPlayers.length})
              </label>
              <div className="space-x-2 text-xs">
                <button onClick={handleSelectAll} className="text-amber-500 hover:text-amber-400">
                  Todos
                </button>
                <span className="text-stone-600">|</span>
                <button onClick={handleDeselectAll} className="text-stone-500 hover:text-stone-400">
                  Nenhum
                </button>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 border border-stone-800 p-2 rounded bg-stone-900/50">
              {playerCharacters.length === 0 ? (
                <p className="text-stone-500 text-sm italic text-center py-4">
                  Nenhum jogador conectado com personagem.
                </p>
              ) : (
                playerCharacters.map((pc) => {
                  const isSelected = selectedPlayers.includes(pc.character.id);
                  const name = pc.character.name;
                  const mark = marks[pc.character.id] ?? null;
                  return (
                    <div key={pc.character.id}>
                      <div
                        onClick={() => handleTogglePlayer(pc.character.id)}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-stone-800 border border-amber-500/30'
                            : 'hover:bg-stone-800 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-stone-900'
                              : 'border-stone-600'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={isSelected ? 'text-stone-200 font-medium' : 'text-stone-400'}
                        >
                          {name}
                        </span>
                        {pc.character.fortress && (
                          <span className="text-xs text-stone-500">
                            Fortaleza: {pc.character.fortress}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div
                          role="radiogroup"
                          aria-label={`Modalidade de ${name}`}
                          className="mt-1 ml-7 flex flex-wrap gap-1"
                        >
                          {MODE_CHOICES.map(({ value, label }) => (
                            <button
                              key={label}
                              type="button"
                              role="radio"
                              aria-checked={mark === value}
                              aria-label={`${label} (${name})`}
                              onClick={() =>
                                setMarks((prev) => ({ ...prev, [pc.character.id]: value }))
                              }
                              className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                                mark === value
                                  ? 'border-amber-600 bg-amber-600 text-stone-900'
                                  : 'border-stone-600 bg-stone-800 text-stone-300 hover:bg-stone-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

        <div className="flex justify-end mt-6 pt-4 border-t border-stone-800 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-400 hover:text-stone-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateTest}
            disabled={isSubmitting || selectedPlayers.length === 0}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-100 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Teste'}
          </button>
        </div>
      </div>
    </div>
  );
}
