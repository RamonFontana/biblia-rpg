import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attributesSchema } from '../../schemas/characterSchema';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { Dices, List } from 'lucide-react';
import type { CharacterAttributes } from '../../types';

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ATTRIBUTES_KEYS: (keyof CharacterAttributes)[] = ['for', 'des', 'con', 'int', 'sab', 'car'];
const LABELS: Record<keyof CharacterAttributes, string> = {
  for: 'Força (FOR)',
  des: 'Destreza (DES)',
  con: 'Constituição (CON)',
  int: 'Inteligência (INT)',
  sab: 'Sabedoria (SAB)',
  car: 'Carisma (CAR)',
};

export function AttributeGeneration() {
  const { draft, setAttributes, nextStep, prevStep } = useCharacterCreationStore();
  
  const [method, setMethod] = useState<'array' | 'dice' | null>(null);
  const [availableValues, setAvailableValues] = useState<number[]>(STANDARD_ARRAY);
  const [rolls, setRolls] = useState<number[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(attributesSchema),
    defaultValues: {
      attributes: draft.attributes || { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 }
    }
  });

  const currentAttributes = watch('attributes');

  const handleRollDice = () => {
    const newRolls = Array.from({ length: 6 }, () => {
      const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      dice.sort((a, b) => b - a); // sort descending
      return dice[0] + dice[1] + dice[2]; // sum top 3
    });
    setRolls(newRolls);
    setAvailableValues([...newRolls]);
    setMethod('dice');

    // Atribui automaticamente aos atributos na ordem
    ATTRIBUTES_KEYS.forEach((attr, index) => {
      setValue(`attributes.${attr}`, newRolls[index]);
    });
  };

  const handleSelectArray = () => {
    setAvailableValues([...STANDARD_ARRAY]);
    setMethod('array');
    // Reseta para 0 para forçar a escolha
    ATTRIBUTES_KEYS.forEach((attr) => {
      setValue(`attributes.${attr}`, 0);
    });
  };

  const handleAssign = (attr: keyof CharacterAttributes, value: number) => {
    // Basic logic to swap or assign (simplified for brevity, a real drag-and-drop or select is better)
    // We will just use a native select for simplicity here
  };

  const onSubmit = (data: { attributes: CharacterAttributes }) => {
    setAttributes(data.attributes);
    nextStep();
  };

  return (
    <div className="space-y-6">
      {!method ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleSelectArray}
            className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-stone-700 bg-stone-800 hover:border-amber-500 hover:bg-stone-700 transition-all group"
          >
            <List className="w-16 h-16 text-stone-400 group-hover:text-amber-500 mb-4" />
            <h3 className="font-serif text-xl text-stone-100">Standard Array</h3>
            <p className="text-stone-400 text-center mt-2">Valores fixos (15, 14, 13, 12, 10, 8) para distribuir estrategicamente.</p>
          </button>
          
          <button 
            onClick={handleRollDice}
            className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-stone-700 bg-stone-800 hover:border-amber-500 hover:bg-stone-700 transition-all group"
          >
            <Dices className="w-16 h-16 text-stone-400 group-hover:text-amber-500 mb-4" />
            <h3 className="font-serif text-xl text-stone-100">Rolar Dados</h3>
            <p className="text-stone-400 text-center mt-2">Sorte divina. Rola 4d6 e descarta o menor, 6 vezes.</p>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-stone-800 p-4 rounded border border-stone-700">
            <h4 className="text-stone-300 mb-2">Valores Gerados ({method === 'array' ? 'Array' : 'Dados'}):</h4>
            <div className="flex gap-2 flex-wrap">
              {availableValues.map((v, i) => {
                const usedValues = Object.values(currentAttributes || {});
                // No array padrão, não podemos repetir. Nos dados, pode haver números iguais rolados (ex: dois 12).
                // Mas no modo dados é preenchido automaticamente, então a indicação visual importa mais para o Array.
                let isUsed = false;
                if (method === 'array') {
                  isUsed = usedValues.includes(v);
                }

                return (
                  <span 
                    key={i} 
                    className={`px-3 py-1 border rounded font-bold transition-colors ${
                      isUsed 
                        ? 'bg-stone-800 border-stone-700 text-stone-600 line-through opacity-50' 
                        : 'bg-stone-900 border-amber-600 text-amber-500'
                    }`}
                  >
                    {v}
                  </span>
                );
              })}
            </div>
            {method === 'dice' && (
              <button type="button" onClick={handleRollDice} className="text-sm text-amber-500 mt-2 underline hover:text-amber-400">Rolar Novamente</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ATTRIBUTES_KEYS.map((attr) => {
              const usedValues = Object.values(currentAttributes || {});
              return (
                <div key={attr} className="flex flex-col">
                  <label className="text-stone-300 font-semibold mb-1">{LABELS[attr]}</label>
                  <select 
                    {...register(`attributes.${attr}`, { valueAsNumber: true })}
                    disabled={method === 'dice'}
                    className="bg-stone-900 border border-stone-700 text-stone-100 p-2 rounded focus:border-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {method === 'dice' ? (
                      // No modo de dados, renderizamos todos os valores possíveis (3 a 18) para garantir 
                      // que o setValue ache a option no DOM mesmo antes da próxima renderização
                      Array.from({ length: 16 }, (_, i) => i + 3).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))
                    ) : (
                      <>
                        <option value={0}>Selecione um valor...</option>
                        {availableValues.map((val, i) => {
                          const isOptionDisabled = method === 'array' && usedValues.includes(val) && currentAttributes?.[attr] !== val;
                          return (
                            <option key={`${attr}-${i}`} value={val} disabled={isOptionDisabled}>
                              {val}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                  {errors.attributes?.[attr] && <p className="text-red-400 text-sm mt-1">{errors.attributes[attr]?.message}</p>}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button 
              type="button"
              onClick={() => { setMethod(null); prevStep(); }}
              className="px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors"
            >
              Voltar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
            >
              Avançar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
