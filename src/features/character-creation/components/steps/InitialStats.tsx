// @ts-nocheck
import React, { useEffect } from 'react';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { Shield, Heart, Flame } from 'lucide-react';

// Simplified modifier calculation (D&D 5e standard)
const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

export function InitialStats() {
  const { draft, setStats, nextStep, prevStep } = useCharacterCreationStore();
  
  const conMod = calculateModifier(draft.attributes?.con || 10);
  const desMod = calculateModifier(draft.attributes?.des || 10);
  
  const baseHp = ['Guerreiro', 'Caçador'].includes(draft.vocation || '') ? 10 : 8;
  const initialPv = baseHp + conMod;
  
  const initialCa = 10 + desMod;
  const initialFaith = draft.tribe === 'Levi' ? 60 : 50;

  useEffect(() => {
    setStats({ pv: initialPv, ca: initialCa, faith: initialFaith });
  }, [initialPv, initialCa, initialFaith, setStats]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-serif text-stone-100 mb-2">Seus Atributos Derivados</h2>
        <p className="text-stone-400">Com base na sua tribo, vocação e atributos, aqui estão as suas estatísticas iniciais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PV */}
        <div className="bg-stone-800 border-2 border-red-500/50 p-6 rounded-xl flex flex-col items-center justify-center">
          <Heart className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-stone-300 font-semibold mb-1">Pontos de Vida (PV)</h3>
          <p className="text-4xl font-serif text-stone-100">{initialPv}</p>
          <span className="text-xs text-stone-500 mt-2">Base {baseHp} + Mod. CON ({conMod})</span>
        </div>

        {/* CA */}
        <div className="bg-stone-800 border-2 border-stone-500/50 p-6 rounded-xl flex flex-col items-center justify-center">
          <Shield className="w-12 h-12 text-stone-500 mb-4" />
          <h3 className="text-stone-300 font-semibold mb-1">Classe de Armadura (CA)</h3>
          <p className="text-4xl font-serif text-stone-100">{initialCa}</p>
          <span className="text-xs text-stone-500 mt-2">10 + Mod. DES ({desMod})</span>
        </div>

        {/* Fé */}
        <div className="bg-stone-800 border-2 border-amber-500/50 p-6 rounded-xl flex flex-col items-center justify-center">
          <Flame className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-stone-300 font-semibold mb-1">Pontos de Fé</h3>
          <p className="text-4xl font-serif text-stone-100">{initialFaith}</p>
          <span className="text-xs text-stone-500 mt-2">
            {draft.tribe === 'Levi' ? 'Bônus de Levi (+10)' : 'Padrão (50)'}
          </span>
        </div>

      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-stone-700">
        <button 
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors"
        >
          Voltar
        </button>
        <button 
          onClick={nextStep}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
        >
          Avançar
        </button>
      </div>
    </div>
  );
}
