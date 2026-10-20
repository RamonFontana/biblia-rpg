import React from 'react';
import { ChipToggle } from '@/components/ui/chip-toggle';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { Panel } from '@/components/ui/panel';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { TribeSelection } from './steps/TribeSelection';
import { VocationSelection } from './steps/VocationSelection';
import { AttributeGeneration } from './steps/AttributeGeneration';
import { FaithAspects } from './steps/FaithAspects';
import { InitialStats } from './steps/InitialStats';
import { EquipmentMerchant } from './steps/EquipmentMerchant';
import { NarrativeDetails } from './steps/NarrativeDetails';
import { Summary } from './steps/Summary';
import { SkillsStep } from './steps/SkillsStep';

interface WizardLayoutProps {
  children?: React.ReactNode;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
  const { currentStep, setStep, editingId } = useCharacterCreationStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TribeSelection />;
      case 2:
        return <VocationSelection />;
      case 3:
        return <AttributeGeneration />;
      case 4:
        return <SkillsStep />;
      case 5:
        return <FaithAspects />;
      case 6:
        return <InitialStats />;
      case 7:
        return <EquipmentMerchant />;
      case 8:
        return <NarrativeDetails />;
      case 9:
        return <Summary />;
      default:
        return <div>Passo Desconhecido</div>;
    }
  };

  const stepsLabels = [
    'Tribo',
    'Vocação',
    'Atributos',
    'Perícias',
    'Fé',
    'Status',
    'Equipamento',
    'Narrativa',
    'Resumo',
  ];

  return (
    <PageShell>
      <Panel>
        <PageHeader
          title={editingId ? 'Edição de Personagem' : 'Criação de Personagem'}
          subtitle={`Passo ${currentStep} de 9`}
        >
          <ProgressBar value={currentStep} max={9} className="mt-4" />
          {editingId && (
            <div className="flex flex-wrap gap-2 mt-6">
              {stepsLabels.map((label, idx) => (
                <ChipToggle
                  key={idx}
                  active={currentStep === idx + 1}
                  onClick={() => setStep(idx + 1)}
                >
                  {label}
                </ChipToggle>
              ))}
            </div>
          )}
        </PageHeader>

        <main className="min-h-[400px]">{children || renderStep()}</main>
      </Panel>
    </PageShell>
  );
};
