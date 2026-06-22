import { useState, useEffect, useRef } from 'react'
import { type SessionTest, type SessionTestResult, sessionTestService } from '@/services/sessionTestService'

interface PlayerTestDialogProps {
  isOpen: boolean
  activeTest: SessionTest | null
  testResult: SessionTestResult | null
  playerCharacters?: any[]
  onClose?: () => void
}

export function PlayerTestDialog({
  isOpen,
  activeTest,
  testResult,
  playerCharacters: _playerCharacters = [],
  onClose: _onClose
}: PlayerTestDialogProps) {
  const [resultValue, setResultValue] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  
  // Equipment and passive effects
  const [hasStealthDisadvantage, setHasStealthDisadvantage] = useState(false)
  const [faithPenalty, setFaithPenalty] = useState(0)
  
  // Faith test penalty state
  const [showPenaltyScreen, setShowPenaltyScreen] = useState(false)
  const [initialRollValue, setInitialRollValue] = useState<number>(0)
  const [faithPenaltyResult, setFaithPenaltyResult] = useState<number | ''>('')
  const [isRollingPenalty, setIsRollingPenalty] = useState(false)

  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Reset state when a new test arrives
  useEffect(() => {
    if (activeTest) {
      setResultValue('')
      setError(null)
      setIsSubmitting(false)
      setDismissed(false)
      setIsRolling(false)
      setShowPenaltyScreen(false)
      setInitialRollValue(0)
      setFaithPenaltyResult('')
      setIsRollingPenalty(false)
    }

    if (activeTest && testResult) {
      // Fetch character stats, equipment, and items
      const fetchCharContext = async () => {
        const { supabase } = await import('@/lib/supabase')
        const { data: charData } = await supabase
          .from('characters')
          .select('stats, equipment')
          .eq('id', testResult.character_id)
          .single()

        const { data: charItems } = await supabase
          .from('character_items')
          .select(`id, items!inner(effects)`)
          .eq('character_id', testResult.character_id)

        let stealthDis = false;
        let penaltyF = 0;

        if (charData && charItems) {
          const equipmentIds = Object.values(charData.equipment || {}).filter(Boolean) as string[];
          for (const cItem of charItems) {
            const effects = (cItem.items as any)?.effects || {};
            // Check passive penalty regardless of being equipped
            if (effects.statPenalty && effects.statPenalty.stat === 'faith') {
              penaltyF += effects.statPenalty.value;
            }

            // Check stealth disadvantage only if equipped
            if (equipmentIds.includes(cItem.id) && effects.properties?.includes('stealth_disadvantage')) {
              stealthDis = true;
            }
          }
        }

        if (isMounted.current) {
          setHasStealthDisadvantage(stealthDis);
          setFaithPenalty(penaltyF);
        }
      }
      fetchCharContext();
    }
  }, [activeTest, testResult])

  if (!isOpen || !activeTest || !testResult || dismissed) return null

  // If already submitted, show waiting screen
  if (testResult.status === 'submitted') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl text-center relative">
          <button 
            onClick={() => setDismissed(true)} 
            className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
            title="Fechar aviso"
          >
            ✕
          </button>
          
          <div className="mb-4 mt-2">
            <svg className="w-12 h-12 mx-auto text-amber-500 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-serif text-amber-500">Resultado Enviado!</h2>
          </div>
          
          <div className="p-4 bg-stone-800 rounded mb-4">
            <p className="text-stone-400 text-sm mb-1">Seu Resultado</p>
            <div className="flex justify-center items-center gap-4">
              <span className="text-3xl font-mono bg-stone-950 px-4 py-2 rounded-lg border border-stone-700">{testResult.result_value}</span>
              {testResult.is_approved ? (
                <span className="text-emerald-500 font-bold px-4 py-2 bg-emerald-500/10 rounded-lg text-xl border border-emerald-500/20">Aprovado!</span>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-red-500 font-bold px-4 py-2 bg-red-500/10 rounded-lg text-xl border border-red-500/20">Reprovado</span>
                </div>
              )}
            </div>
            
            {!testResult.is_approved && activeTest.test_type === 'Fé' && (
              <div className="mt-4 text-red-400 italic bg-red-500/10 p-2 rounded border border-red-500/20">
                Sua fé foi abalada... O personagem perdeu 1d6 pontos de Fé.
              </div>
            )}

            <p className="mt-6 text-sm text-stone-500">O Mestre já pode ver o seu resultado.</p>
          </div>
          
          <p className="text-sm text-stone-500 italic mb-4">
            Aguardando o mestre encerrar o teste...
          </p>

          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-colors"
          >
            Ocultar Janela
          </button>
        </div>
      </div>
    )
  }

  const executeSubmit = async (val: number, penalty?: number) => {
    if (val < 0 || val > 100) {
      setError('Valor fora do intervalo aceitável (0-100).')
      return
    }

    let isFailedFaithTest = false;
    if (activeTest.test_type === 'Fé') {
      // Busca a fé atual do personagem direto do banco para garantir o valor correto
      const { supabase } = await import('@/lib/supabase')
      const { data: charData } = await supabase
        .from('characters')
        .select('stats')
        .eq('id', testResult.character_id)
        .single()
      const stats = charData?.stats as Record<string, any> | undefined
      let currentFaith = stats?.current_faith ?? stats?.faith ?? 0;
      currentFaith += faithPenalty; // faithPenalty is usually negative
      
      // Misericórdia subtrai do DADO, não da fé
      // Passa se (dado - misericórdia) <= fé
      isFailedFaithTest = (val - activeTest.difficulty) > currentFaith;
    }

    if (isFailedFaithTest && penalty === undefined) {
      setShowPenaltyScreen(true)
      setInitialRollValue(val)
      setResultValue('') // clear input just in case
      setError(null)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await sessionTestService.submitTestResult(
        testResult.id,
        val,
        activeTest.difficulty,
        testResult.character_id,
        activeTest.test_type,
        penalty
      )
      // The component will re-render in the 'submitted' state because of realtime update
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'Erro ao enviar resultado.')
        setIsSubmitting(false)
        setIsRolling(false)
      }
    }
  }

  const handleSubmit = () => {
    if (resultValue === '' || isNaN(resultValue as number)) {
      setError('Insira um valor válido.')
      return
    }
    executeSubmit(Number(resultValue))
  }

  const handleSubmitPenalty = () => {
    if (faithPenaltyResult === '' || isNaN(faithPenaltyResult as number)) {
      setError('Insira um valor válido para o d6 (1-6).')
      return
    }
    if (Number(faithPenaltyResult) < 1 || Number(faithPenaltyResult) > 6) {
      setError('O valor do d6 deve estar entre 1 e 6.')
      return
    }
    executeSubmit(initialRollValue, Number(faithPenaltyResult))
  }

  const handleRollPenalty = () => {
    if (isRollingPenalty || isSubmitting) return
    setIsRollingPenalty(true)
    setError(null)

    const duration = 1000
    const minInterval = 50
    const maxInterval = 150
    let elapsed = 0

    const rollStep = () => {
      if (!isMounted.current) return

      const progress = elapsed / duration
      const currentInterval = minInterval + (maxInterval - minInterval) * Math.pow(progress, 2)

      if (elapsed >= duration) {
        const finalResult = Math.floor(Math.random() * 6) + 1
        setFaithPenaltyResult(finalResult)
        setTimeout(() => {
          if (isMounted.current) {
            executeSubmit(initialRollValue, finalResult)
          }
        }, 400)
      } else {
        setFaithPenaltyResult(Math.floor(Math.random() * 6) + 1)
        elapsed += currentInterval
        setTimeout(rollStep, currentInterval)
      }
    }

    rollStep()
  }

  const handleRollDice = () => {
    if (isRolling || isSubmitting) return
    setIsRolling(true)
    setError(null)

    const duration = 1500 // 1.5 seconds of rolling
    const minInterval = 50
    const maxInterval = 200
    let elapsed = 0

    const rollStep = () => {
      if (!isMounted.current) return

      // Calculate next interval (starts fast, slows down)
      const progress = elapsed / duration
      const currentInterval = minInterval + (maxInterval - minInterval) * Math.pow(progress, 2)

      if (elapsed >= duration) {
        // Final result
        const maxDice = activeTest.test_type === 'Fé' ? 100 : 20;
        const finalResult = Math.floor(Math.random() * maxDice) + 1
        setResultValue(finalResult)
        // Automatically submit after a tiny delay so the user sees the final number
        setTimeout(() => {
          if (isMounted.current) {
            executeSubmit(finalResult)
          }
        }, 400)
      } else {
        // Show random number
        const maxDice = activeTest.test_type === 'Fé' ? 100 : 20;
        setResultValue(Math.floor(Math.random() * maxDice) + 1)
        elapsed += currentInterval
        setTimeout(rollStep, currentInterval)
      }
    }

    rollStep()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-600/20 rotate-45 transform translate-x-8 -translate-y-8" />
        
        <h2 className="text-2xl font-serif text-amber-500 mb-1 text-center animate-pulse">O Mestre Exige um Teste!</h2>
        <p className="text-center text-stone-400 text-sm mb-6 pb-4 border-b border-stone-800">
          Role seus dados físicos e insira o resultado, ou use o dado virtual.
        </p>

        <div className="space-y-6">
          <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 text-center relative">
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-stone-900 px-2 text-xs font-bold text-stone-500 uppercase tracking-widest">
              Desafio
            </span>
            <div className="grid grid-cols-2 gap-4 divide-x divide-stone-700">
              <div>
                <p className="text-xs text-stone-400 mb-1 uppercase">Teste de</p>
                <p className="font-bold text-amber-400 text-lg">{activeTest.test_type}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-1 uppercase">
                  {activeTest.test_type === 'Fé' ? 'Misericórdia' : 'Dificuldade'}
                </p>
                <p className="font-bold text-red-500 text-2xl leading-none">{activeTest.difficulty}</p>
              </div>
            </div>
          </div>

          {!showPenaltyScreen ? (
            <>
              {hasStealthDisadvantage && activeTest.test_type === 'Destreza' && (
                <div className="bg-red-900/30 border border-red-500/50 p-2 rounded mb-4 text-center">
                  <p className="text-red-400 text-sm font-bold">⚠️ Desvantagem</p>
                  <p className="text-stone-300 text-xs">Sua armadura pesada prejudica seus reflexos e furtividade. Role 2 dados e escolha o pior!</p>
                </div>
              )}

              {activeTest.test_type === 'Fé' && faithPenalty < 0 && (
                <div className="bg-purple-900/30 border border-purple-500/50 p-2 rounded mb-4 text-center">
                  <p className="text-purple-400 text-sm font-bold">⚠️ Profanação</p>
                  <p className="text-stone-300 text-xs">A presença de um item profano no seu inventário reduziu sua Fé em {Math.abs(faithPenalty)} para este teste.</p>
                </div>
              )}
              
              <div>
                <label className="block text-center text-sm font-medium text-stone-300 mb-3">
                  Qual foi o resultado da rolagem?
                </label>
                <input
                  type="number"
                  min="0"
                  autoFocus
                  disabled={isRolling || isSubmitting}
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isRolling && !isSubmitting) {
                      handleSubmit()
                    }
                  }}
                  className="w-full bg-stone-950 border-2 border-stone-700 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-amber-500 text-center font-mono text-4xl placeholder-stone-700 transition-colors disabled:opacity-70"
                  placeholder="0"
                />
              </div>

              {error && <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRollDice}
                  disabled={isSubmitting || isRolling}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <span>🎲</span> {isRolling ? 'Rolando...' : (activeTest.test_type === 'Fé' ? 'Rolar D100' : 'Rolar D20')}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isRolling || resultValue === ''}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] active:scale-[0.98]"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Valor'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mb-4 text-center">
                <p className="text-red-400 font-medium mb-1">Teste de Fé Reprovado!</p>
              <p className="text-stone-300 text-sm">A sua fé vacilou perante o desafio. O personagem perderá <strong>1d6</strong> de Fé.</p>
              </div>

              <div>
              <label className="block text-center text-sm font-medium text-stone-300 mb-3">
                Role o d6 de punição pela falha de Fé:
              </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  autoFocus
                  disabled={isRollingPenalty || isSubmitting}
                  value={faithPenaltyResult}
                  onChange={(e) => setFaithPenaltyResult(e.target.value === '' ? '' : parseInt(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isRollingPenalty && !isSubmitting) {
                      handleSubmitPenalty()
                    }
                  }}
                  className="w-full bg-stone-950 border-2 border-stone-700 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-red-500 text-center font-mono text-4xl placeholder-stone-700 transition-colors disabled:opacity-70"
                  placeholder="0"
                />
              </div>

              {error && <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRollPenalty}
                  disabled={isSubmitting || isRollingPenalty}
                  className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <span>🎲</span> {isRollingPenalty ? 'Rolando...' : 'Rolar 1d6'}
                </button>

                <button
                  onClick={handleSubmitPenalty}
                  disabled={isSubmitting || isRollingPenalty || faithPenaltyResult === ''}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-[0.98]"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar Punição'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
