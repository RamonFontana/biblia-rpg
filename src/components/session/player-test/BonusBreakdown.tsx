interface BonusBreakdownProps {
  roll: number;
  modifiers: { attrMod: number; profBonus: number };
}

/** A conta que o app faz pelo jogador: dado + modificador (+ proficiência) = total. */
export function BonusBreakdown({ roll, modifiers }: BonusBreakdownProps) {
  const { attrMod, profBonus } = modifiers;
  const totalBonus = attrMod + profBonus;
  return (
    <div className="w-full bg-stone-800 border border-stone-700 px-3 py-3 rounded-lg flex justify-between items-center text-sm font-mono mt-2 animate-in fade-in zoom-in duration-200 overflow-x-auto">
      <div className="flex flex-col items-center">
        <span className="text-stone-500 text-[10px] uppercase">Dado</span>
        <span className="text-stone-300">{roll}</span>
      </div>
      <span className="text-stone-600 mx-1">+</span>
      <div className="flex flex-col items-center">
        <span className="text-stone-500 text-[10px] uppercase">Mod</span>
        <span className="text-amber-500">{attrMod >= 0 ? `+${attrMod}` : attrMod}</span>
      </div>
      {profBonus > 0 && (
        <>
          <span className="text-stone-600 mx-1">+</span>
          <div className="flex flex-col items-center">
            <span className="text-stone-500 text-[10px] uppercase">Prof</span>
            <span className="text-green-500">+{profBonus}</span>
          </div>
        </>
      )}
      <span className="text-stone-600 mx-1">=</span>
      <div className="flex flex-col items-center">
        <span className="text-stone-500 text-[10px] uppercase">Total</span>
        <span className="text-white font-bold text-lg">{roll + totalBonus}</span>
      </div>
    </div>
  );
}
