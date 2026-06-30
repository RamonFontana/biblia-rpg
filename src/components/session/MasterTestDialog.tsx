import { useState } from 'react'
import { type SessionTest, type SessionTestResult, sessionTestService } from '@/services/sessionTestService'
import type { Character } from '@/features/character-management/types'

interface MasterTestDialogProps {
  sessionId: string
  isOpen: boolean
  onClose: () => void
  activeTests: SessionTest[]
  testResults: Record<string, SessionTestResult[]>
  playerCharacters: { character: Character; profile: any | null }[]
}

const TEST_TYPES = ['Percepção', 'Fé', 'Sobrevivência', 'Vigor', 'Vontade', 'Destreza', 'Força', 'Carisma']

export function MasterTestDialog({
  sessionId,
  isOpen,
  onClose,
  activeTests,
  testResults,
  playerCharacters
}: MasterTestDialogProps) {
  const [testType, setTestType] = useState(TEST_TYPES[0])
  const [difficulty, setDifficulty] = useState(10)
  const [faithModifierType, setFaithModifierType] = useState<'mercy' | 'punishment'>('mercy')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // There is an active test if there's any test with 'active' status
  // We can just look at the first active test for now to simplify
  const currentActiveTest = activeTests.find(t => t.status === 'active')
  const currentResults = currentActiveTest ? testResults[currentActiveTest.id] || [] : []

  if (!isOpen) return null

  const handleTogglePlayer = (characterId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  const handleSelectAll = () => {
    setSelectedPlayers(playerCharacters.map(pc => pc.character.id))
  }

  const handleDeselectAll = () => {
    setSelectedPlayers([])
  }

  const handleCreateTest = async () => {
    if (selectedPlayers.length === 0) {
      setError('Selecione pelo menos um jogador.')
      return
    }
    if (difficulty < 0 || difficulty > 100) {
      setError('O valor deve estar entre 0 e 100.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    let finalDifficulty = difficulty
    if (testType === 'Fé') {
      finalDifficulty = faithModifierType === 'punishment' ? -Math.abs(difficulty) : Math.abs(difficulty)
    }

    try {
      const targets = selectedPlayers.map(charId => {
        const pc = playerCharacters.find(p => p.character.id === charId)
        return {
          characterId: charId,
          playerId: pc?.character.user_id || ''
        }
      }).filter(t => t.playerId !== '')

      await sessionTestService.createTest(sessionId, testType, finalDifficulty, targets)
      // The state will be updated via the realtime hook in the parent
    } catch (err: any) {
      setError(err.message || 'Erro ao criar o teste.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelTest = async () => {
    if (!currentActiveTest) return
    setIsSubmitting(true)
    try {
      await sessionTestService.cancelTest(currentActiveTest.id)
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar o teste.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteTest = async () => {
    if (!currentActiveTest) return
    setIsSubmitting(true)
    try {
      await sessionTestService.completeTest(currentActiveTest.id)
      onClose() // Close the dialog completely when finished
    } catch (err: any) {
      setError(err.message || 'Erro ao concluir o teste.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine if we are showing the creation form or the active dashboard
  if (currentActiveTest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-amber-500">Teste em Andamento</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
          </div>

          <div className="mb-6 p-4 bg-stone-800 rounded border border-stone-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-stone-400">Tipo de Teste</p>
                <p className="text-lg font-bold text-amber-400">{currentActiveTest.test_type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-400">
                  {currentActiveTest.test_type === 'Fé' 
                    ? (currentActiveTest.difficulty < 0 ? 'Punição' : 'Misericórdia') 
                    : 'Dificuldade'}
                </p>
                <p className="text-2xl font-bold text-red-500">{Math.abs(currentActiveTest.difficulty)}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">Resultados ({currentResults.filter(r => r.status === 'submitted').length}/{currentResults.length})</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {currentResults.map(result => {
                const pc = playerCharacters.find(p => p.character.id === result.character_id)
                const charName = pc?.character.name || 'Desconhecido'
                
                return (
                  <div key={result.id} className="flex justify-between items-center p-3 bg-stone-800 rounded border border-stone-700">
                    <span className="font-medium text-stone-300">{charName}</span>
                    {result.status === 'pending' ? (
                      <span className="text-stone-500 italic text-sm animate-pulse">Aguardando...</span>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-mono bg-stone-900 px-2 py-1 rounded">{result.result_value}</span>
                        {result.is_approved ? (
                          <span className="text-emerald-500 font-bold px-2 py-1 bg-emerald-500/10 rounded">Aprovado</span>
                        ) : (
                          <span className="text-red-500 font-bold px-2 py-1 bg-red-500/10 rounded">Reprovado</span>
                        )}
                      </div>
                    )}
                  </div>
                )
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
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium disabled:opacity-50 transition-colors"
            >
              Encerrar Teste
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif text-amber-500">Solicitar Teste aos Jogadores</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-5">
          <div className={`grid ${testType === 'Fé' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Tipo de Teste</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
              >
                {TEST_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
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
                  ? (faithModifierType === 'mercy' ? 'Misericórdia (0-100)' : 'Punição (0-100)') 
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

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-stone-400">Jogadores Alvo ({selectedPlayers.length})</label>
              <div className="space-x-2 text-xs">
                <button onClick={handleSelectAll} className="text-amber-500 hover:text-amber-400">Todos</button>
                <span className="text-stone-600">|</span>
                <button onClick={handleDeselectAll} className="text-stone-500 hover:text-stone-400">Nenhum</button>
              </div>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 border border-stone-800 p-2 rounded bg-stone-900/50">
              {playerCharacters.length === 0 ? (
                <p className="text-stone-500 text-sm italic text-center py-4">Nenhum jogador conectado com personagem.</p>
              ) : (
                playerCharacters.map((pc) => {
                  const isSelected = selectedPlayers.includes(pc.character.id)
                  return (
                    <div 
                      key={pc.character.id}
                      onClick={() => handleTogglePlayer(pc.character.id)}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-stone-800 border border-amber-500/30' : 'hover:bg-stone-800 border border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-stone-900' : 'border-stone-600'
                      }`}>
                        {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={isSelected ? 'text-stone-200 font-medium' : 'text-stone-400'}>
                        {pc.character.name} <span className="text-xs opacity-50">({pc.profile?.name || 'Sem jogador'})</span>
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

        <div className="flex justify-end mt-6 pt-4 border-t border-stone-800 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateTest}
            disabled={isSubmitting || selectedPlayers.length === 0}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Teste'}
          </button>
        </div>
      </div>
    </div>
  )
}
