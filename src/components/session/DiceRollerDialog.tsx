import { useState, useRef, useEffect } from 'react'

interface DiceRollerDialogProps {
  isOpen: boolean
  onClose: () => void
}

type DiceType = 4 | 6 | 8 | 10 | 12 | 20 | 100

export function DiceRollerDialog({ isOpen, onClose }: DiceRollerDialogProps) {
  const [selectedDice, setSelectedDice] = useState<DiceType>(20)
  const [result, setResult] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setResult(null)
      setIsRolling(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const diceTypes: DiceType[] = [4, 6, 8, 10, 12, 20, 100]

  const rollDice = () => {
    if (isRolling) return
    setIsRolling(true)
    setResult(null)

    const duration = 800
    const minInterval = 40
    const maxInterval = 120
    let elapsed = 0

    const rollStep = () => {
      if (!isMounted.current) return

      const progress = elapsed / duration
      const currentInterval = minInterval + (maxInterval - minInterval) * Math.pow(progress, 2)

      if (elapsed >= duration) {
        setResult(Math.floor(Math.random() * selectedDice) + 1)
        setIsRolling(false)
      } else {
        setResult(Math.floor(Math.random() * selectedDice) + 1)
        elapsed += currentInterval
        setTimeout(rollStep, currentInterval)
      }
    }

    rollStep()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
          title="Fechar"
        >
          ✕
        </button>

        <h2 className="text-xl font-serif text-amber-500 mb-4 text-center">Rolador de Dados</h2>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {diceTypes.map(d => (
            <button
              key={d}
              onClick={() => { setSelectedDice(d); setResult(null); }}
              disabled={isRolling}
              className={`py-2 rounded border font-mono transition-colors ${
                selectedDice === d 
                  ? 'bg-amber-600 border-amber-500 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)]' 
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
              }`}
            >
              d{d}
            </button>
          ))}
        </div>

        <div className="bg-stone-950 border border-stone-800 rounded-lg h-32 flex items-center justify-center mb-6 relative overflow-hidden">
          {/* subtle background glow based on roll state */}
          <div className={`absolute inset-0 opacity-20 transition-colors duration-300 ${result !== null && !isRolling ? 'bg-amber-500' : 'bg-transparent'}`} />
          
          <div className="text-6xl font-mono relative z-10 text-white">
            {result !== null ? result : '-'}
          </div>
        </div>

        <button
          onClick={rollDice}
          disabled={isRolling}
          className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 transition-colors"
        >
          {isRolling ? 'Rolando...' : `Rolar d${selectedDice}`}
        </button>
      </div>
    </div>
  )
}
