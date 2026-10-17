import { useState, useMemo } from 'react';
import type { Character } from '../types';
import { updateCharacter } from '../api/characterApi';
import { applyMaxPvIncrease } from '@/lib/vitalsUtils';
import { ABILITIES } from '../../../data/abilities';

interface LevelUpWizardProps {
  character: Character;
  onComplete: () => void;
  onCancel: () => void;
}

const VOCATION_HP_AVERAGE: Record<string, number> = {
  guerreiro: 6,
  batedor: 5,
  caçador: 6,
  cacador: 6,
  sacerdote: 5,
  sábio: 5,
  sabio: 5,
};

function normalizeString(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function calculateConMod(con: number) {
  return Math.floor((con - 10) / 2);
}

export function LevelUpWizard({ character, onComplete, onCancel }: LevelUpWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newLevel = (character.level || (character.stats as any)?.level || 1) + 1;
  const currentCon = (character.attributes as any)?.con || 10;

  // State for choices
  const [selectedTribePath, setSelectedTribePath] = useState<'A' | 'B' | null>(null);
  const [selectedVocationPath, setSelectedVocationPath] = useState<'A' | 'B' | null>(null);
  const [asiChoices, setAsiChoices] = useState<{ attr1?: string; attr2?: string }>({});

  const normalizedVocation = normalizeString(character.vocation || '');
  const hpAverage = VOCATION_HP_AVERAGE[normalizedVocation] || 5;
  const conMod = calculateConMod(currentCon);

  const hpGained = Math.max(1, hpAverage + conMod);

  // Steps calculation
  const tribeOptions = useMemo(() => {
    return ABILITIES.filter(
      (a) =>
        a.sourceType === 'tribe' &&
        normalizeString(a.sourceId) === normalizeString(character.tribe || '') &&
        a.minLevel === newLevel &&
        a.path,
    );
  }, [character.tribe, newLevel]);

  const vocationOptions = useMemo(() => {
    return ABILITIES.filter(
      (a) =>
        a.sourceType === 'vocation' &&
        normalizeString(a.sourceId) === normalizedVocation &&
        a.minLevel === newLevel &&
        a.path,
    );
  }, [normalizedVocation, newLevel]);

  const hasTribeChoice = tribeOptions.length > 0;
  const hasVocationChoice = vocationOptions.length > 0;
  const hasAsi = [4, 8, 12, 16, 19].includes(newLevel);

  const steps = useMemo(() => {
    const s = ['hp'];
    if (hasTribeChoice) s.push('tribe');
    if (hasVocationChoice) s.push('vocation');
    if (hasAsi) s.push('asi');
    s.push('summary');
    return s;
  }, [hasTribeChoice, hasVocationChoice, hasAsi]);

  const currentStepId = steps[currentStepIndex];

  // Derived ASI changes
  const newCon =
    currentCon + (asiChoices.attr1 === 'con' ? 1 : 0) + (asiChoices.attr2 === 'con' ? 1 : 0);
  const newConMod = calculateConMod(newCon);

  // Retroactive HP
  // If CON increases, this level ALSO gets the new mod, AND previous levels get it.
  // Actually, retroactive HP is (newConMod - oldConMod) * (newLevel - 1).
  // We can just add this to the total max HP.

  const finalHpGained = hpAverage + newConMod;
  const retroactiveHpGained = (newConMod - conMod) * (newLevel - 1);
  const totalHpGained = Math.max(1, finalHpGained) + retroactiveHpGained;

  const canProceed = () => {
    if (currentStepId === 'tribe' && !selectedTribePath) return false;
    if (currentStepId === 'vocation' && !selectedVocationPath) return false;
    if (currentStepId === 'asi') {
      const keys = Object.values(asiChoices).filter(Boolean);
      if (keys.length !== 2) return false; // Must select 2 points (could be same attr twice if allowed, but UI should enforce max 20)
    }
    return true;
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((s) => s + 1);
    } else {
      finalizeLevelUp();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((s) => s - 1);
    } else {
      onCancel();
    }
  };

  const finalizeLevelUp = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Build updates
      const currentStats: any = character.stats || {};
      const currentAttributes: any = character.attributes || {};
      const currentSkills: any = character.skills || {};

      const { pv, current_pv } = applyMaxPvIncrease(currentStats, totalHpGained);
      const newStats = {
        ...currentStats,
        level: newLevel,
        pv,
        current_pv,
      };

      const newAttributes = { ...currentAttributes };
      if (hasAsi) {
        if (asiChoices.attr1)
          newAttributes[asiChoices.attr1] = (newAttributes[asiChoices.attr1] || 10) + 1;
        if (asiChoices.attr2)
          newAttributes[asiChoices.attr2] = (newAttributes[asiChoices.attr2] || 10) + 1;
      }

      const newSkills = { ...currentSkills };
      newSkills.path_choices = newSkills.path_choices || {};

      // Upgrade path_choices to object if it's string
      if (typeof newSkills.path_choices.tribe === 'string') {
        newSkills.path_choices.tribe = { 1: newSkills.path_choices.tribe };
      } else {
        newSkills.path_choices.tribe = newSkills.path_choices.tribe || {};
      }

      if (typeof newSkills.path_choices.vocation === 'string') {
        newSkills.path_choices.vocation = { 1: newSkills.path_choices.vocation };
      } else {
        newSkills.path_choices.vocation = newSkills.path_choices.vocation || {};
      }

      if (hasTribeChoice && selectedTribePath) {
        newSkills.path_choices.tribe[newLevel] = selectedTribePath;
      }

      if (hasVocationChoice && selectedVocationPath) {
        newSkills.path_choices.vocation[newLevel] = selectedVocationPath;
      }

      await updateCharacter(character.id, {
        level: newLevel,
        pending_level_up: false,
        stats: newStats,
        attributes: newAttributes,
        skills: newSkills,
      });

      onComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar progressão');
      setIsSubmitting(false);
    }
  };

  const renderHpStep = () => (
    <div className="space-y-4">
      <p className="text-stone-300">
        Seu personagem evoluiu! Você ganhou pontos de vida adicionais baseados na sua vocação e
        constituição.
      </p>
      <div className="bg-stone-950 border border-stone-800 p-4 rounded-lg flex items-center justify-between">
        <div>
          <h4 className="text-sm text-stone-500 uppercase tracking-wider mb-1">
            Vocação ({character.vocation})
          </h4>
          <span className="text-xl font-bold text-stone-200">+{hpAverage} PV</span>
        </div>
        <div className="text-2xl text-stone-600">+</div>
        <div>
          <h4 className="text-sm text-stone-500 uppercase tracking-wider mb-1">
            Constituição (Mod)
          </h4>
          <span className="text-xl font-bold text-stone-200">
            {conMod >= 0 ? `+${conMod}` : conMod} PV
          </span>
        </div>
        <div className="text-2xl text-stone-600">=</div>
        <div>
          <h4 className="text-sm text-amber-500 uppercase tracking-wider mb-1">Total Ganho</h4>
          <span className="text-2xl font-bold text-amber-400">+{hpGained} PV</span>
        </div>
      </div>
      <p className="text-sm text-stone-500">
        * Se você aumentar sua Constituição neste nível, o ganho retroativo será calculado no final.
      </p>
    </div>
  );

  const renderPathChoice = (
    type: 'tribe' | 'vocation',
    options: any[],
    selected: string | null,
    onSelect: (val: any) => void,
  ) => {
    return (
      <div className="space-y-4">
        <p className="text-stone-300">
          Escolha uma habilidade passiva ou ativa de {type === 'tribe' ? 'Tribo' : 'Vocação'} para o
          nível {newLevel}.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => onSelect(opt.path)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selected === opt.path
                  ? 'bg-amber-900/20 border-amber-500 shadow-md shadow-amber-900/20'
                  : 'bg-stone-950 border-stone-800 hover:border-amber-700/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-stone-200">{opt.name}</h4>
                <span className="text-xs font-mono bg-stone-800 text-stone-400 px-2 py-1 rounded">
                  Caminho {opt.path}
                </span>
              </div>
              <p className="text-sm text-stone-400">{opt.effect}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAsiStep = () => {
    const attrs = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
    const attrNames = {
      for: 'Força',
      des: 'Destreza',
      con: 'Constituição',
      int: 'Inteligência',
      sab: 'Sabedoria',
      car: 'Carisma',
    };
    const currentAttributes: any = character.attributes || {};

    const handleSelect = (slot: 'attr1' | 'attr2', val: string) => {
      setAsiChoices((prev) => ({ ...prev, [slot]: val }));
    };

    return (
      <div className="space-y-6">
        <p className="text-stone-300">
          Você pode aumentar um atributo em +2 ou dois atributos em +1 (Máximo 20).
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Slot 1 */}
          <div className="space-y-2">
            <label className="text-sm text-stone-400 font-medium">Ponto 1 (+1)</label>
            <select
              value={asiChoices.attr1 || ''}
              onChange={(e) => handleSelect('attr1', e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-md p-2 text-stone-200"
            >
              <option value="" disabled>
                Selecione um atributo
              </option>
              {attrs.map((a) => {
                const isMaxed =
                  (currentAttributes[a] || 10) + (asiChoices.attr2 === a ? 1 : 0) >= 20;
                return (
                  <option key={a} value={a} disabled={isMaxed}>
                    {attrNames[a]} (Atual: {currentAttributes[a] || 10})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Slot 2 */}
          <div className="space-y-2">
            <label className="text-sm text-stone-400 font-medium">Ponto 2 (+1)</label>
            <select
              value={asiChoices.attr2 || ''}
              onChange={(e) => handleSelect('attr2', e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-md p-2 text-stone-200"
            >
              <option value="" disabled>
                Selecione um atributo
              </option>
              {attrs.map((a) => {
                const isMaxed =
                  (currentAttributes[a] || 10) + (asiChoices.attr1 === a ? 1 : 0) >= 20;
                return (
                  <option key={a} value={a} disabled={isMaxed}>
                    {attrNames[a]} (Atual: {currentAttributes[a] || 10})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-amber-500 border-b border-stone-800 pb-2">
        Resumo da Evolução
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-stone-950 rounded-lg border border-stone-800">
          <span className="text-stone-400">Novo Nível</span>
          <span className="font-bold text-stone-200">{newLevel}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-stone-950 rounded-lg border border-stone-800">
          <span className="text-stone-400">PV Máximo Adicional</span>
          <span className="font-bold text-green-400">+{totalHpGained}</span>
        </div>

        {retroactiveHpGained > 0 && (
          <p className="text-xs text-stone-500 text-right">
            (Inclui +{retroactiveHpGained} PV retroativo pelo aumento de Constituição)
          </p>
        )}

        {hasTribeChoice && selectedTribePath && (
          <div className="flex justify-between items-center p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400">Habilidade de Tribo</span>
            <span className="font-medium text-stone-200">
              {tribeOptions.find((o) => o.path === selectedTribePath)?.name}
            </span>
          </div>
        )}

        {hasVocationChoice && selectedVocationPath && (
          <div className="flex justify-between items-center p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400">Habilidade de Vocação</span>
            <span className="font-medium text-stone-200">
              {vocationOptions.find((o) => o.path === selectedVocationPath)?.name}
            </span>
          </div>
        )}

        {hasAsi && asiChoices.attr1 && asiChoices.attr2 && (
          <div className="flex justify-between items-center p-3 bg-stone-950 rounded-lg border border-stone-800">
            <span className="text-stone-400">Melhoria de Atributos (ASI)</span>
            <span className="font-medium text-stone-200 uppercase">
              +
              {asiChoices.attr1 === asiChoices.attr2
                ? `2 ${asiChoices.attr1}`
                : `1 ${asiChoices.attr1}, +1 ${asiChoices.attr2}`}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-900/50 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-stone-900 border border-stone-700 rounded-xl flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-amber-500 tracking-wide">Progressão de Nível</h2>
            <p className="text-sm text-stone-400 mt-1">
              {character.name} <span className="mx-1">•</span> Subindo para nível {newLevel}
            </p>
          </div>
          <div className="text-sm font-medium text-stone-500 bg-stone-950 px-3 py-1 rounded-full border border-stone-800">
            Passo {currentStepIndex + 1} de {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentStepId === 'hp' && renderHpStep()}
          {currentStepId === 'tribe' &&
            renderPathChoice('tribe', tribeOptions, selectedTribePath, setSelectedTribePath)}
          {currentStepId === 'vocation' &&
            renderPathChoice(
              'vocation',
              vocationOptions,
              selectedVocationPath,
              setSelectedVocationPath,
            )}
          {currentStepId === 'asi' && renderAsiStep()}
          {currentStepId === 'summary' && renderSummaryStep()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 flex justify-between bg-stone-950 rounded-b-xl">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-4 py-2 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-50"
          >
            {currentStepIndex === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              !canProceed() || isSubmitting
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-amber-700 hover:bg-amber-600 text-amber-50 shadow-md shadow-amber-900/30'
            }`}
          >
            {isSubmitting
              ? 'Salvando...'
              : currentStepIndex === steps.length - 1
                ? 'Finalizar Progressão'
                : 'Próximo Passo'}
          </button>
        </div>
      </div>
    </div>
  );
}
