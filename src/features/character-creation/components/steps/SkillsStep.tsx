
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { getVocationRules } from '../../../character-management/utils/rules/vocations';
import { SKILLS_LIST } from '../../../character-management/utils/characterMath';

export function SkillsStep() {
  const { draft, setProficiencies, nextStep, prevStep } = useCharacterCreationStore();
  
  const rules = getVocationRules(draft.vocation);
  const maxSkills = rules?.maxSkills || 0;
  const eligibleSkills = rules?.eligibleSkills || [];
  
  const selectedSkills = draft.proficiencies?.skill_proficiencies || [];

  const toggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      setProficiencies({
        skill_proficiencies: selectedSkills.filter(s => s !== skillId)
      });
    } else {
      if (selectedSkills.length < maxSkills) {
        setProficiencies({
          skill_proficiencies: [...selectedSkills, skillId]
        });
      }
    }
  };

  const isComplete = selectedSkills.length === maxSkills;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif text-stone-100 mb-2">Treinamento e Perícias</h2>
        <p className="text-stone-400">
          Sua vocação <strong>{draft.vocation || 'Desconhecida'}</strong> permite escolher <strong>{maxSkills}</strong> perícias.
        </p>
        <p className="text-sm text-stone-500">
          Selecionadas: {selectedSkills.length} de {maxSkills}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {eligibleSkills.length === 0 && (
          <p className="col-span-full text-center text-stone-500 italic py-8">
            Nenhuma perícia disponível para esta vocação ou vocação não definida.
          </p>
        )}
        {eligibleSkills.map(skillId => {
          const skillDef = SKILLS_LIST.find(s => s.id === skillId);
          if (!skillDef) return null;
          
          const isSelected = selectedSkills.includes(skillId);
          const isDisabled = !isSelected && selectedSkills.length >= maxSkills;
          
          return (
            <button
              key={skillId}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleSkill(skillId)}
              className={`
                flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                  : isDisabled
                    ? 'border-stone-700 bg-stone-800/50 text-stone-600 cursor-not-allowed'
                    : 'border-stone-700 bg-stone-800 hover:border-stone-500 text-stone-300'}
              `}
            >
              <div className="flex flex-col">
                <span className="font-semibold">{skillDef.name}</span>
                <span className="text-xs opacity-70 uppercase">Atributo: {skillDef.attribute}</span>
              </div>
              {isSelected && (
                <div className="w-3 h-3 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-stone-700">
        <button 
          type="button"
          onClick={prevStep}
          className="w-full sm:w-auto px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors flex justify-center items-center"
        >
          Voltar
        </button>
        <button 
          onClick={nextStep}
          disabled={!isComplete && maxSkills > 0}
          className="w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isComplete || maxSkills === 0 ? 'Avançar' : 'Selecione as Perícias'}
        </button>
      </div>
    </div>
  );
}
