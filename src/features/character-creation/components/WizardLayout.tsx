import React from 'react';
import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { TribeSelection } from './steps/TribeSelection';
import { VocationSelection } from './steps/VocationSelection';
import { AttributeGeneration } from './steps/AttributeGeneration';
import { FaithAspects } from './steps/FaithAspects';
import { InitialStats } from './steps/InitialStats';
import { EquipmentMerchant } from './steps/EquipmentMerchant';
import { NarrativeDetails } from './steps/NarrativeDetails';
import { Summary } from './steps/Summary';

interface WizardLayoutProps {
  children?: React.ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
  const { currentStep } = useCharacterCreationStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TribeSelection />;
      case 2:
        return <VocationSelection />;
      case 3:
        return <AttributeGeneration />;
      case 4:
        return <FaithAspects />;
      case 5:
        return <InitialStats />;
      case 6:
        return <EquipmentMerchant />;
      case 7:
        return <NarrativeDetails />;
      case 8:
        return <Summary />;
      default:
        return <div>Passo Desconhecido</div>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-8">
      <div className="max-w-4xl mx-auto bg-stone-800 p-6 rounded-xl shadow-lg border border-stone-700">
        <header className="mb-8 border-b border-stone-700 pb-4">
          <h1 className="text-3xl font-serif text-amber-500">Criação de Personagem</h1>
          <p className="text-stone-400 mt-2">Passo {currentStep} de 8</p>
          <div className="w-full bg-stone-700 h-2 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-300" 
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </header>

        <main className="min-h-[400px]">
          {children || renderStep()}
        </main>
      </div>
    </div>
  );
};
