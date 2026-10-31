import { useSessionDraftStore } from '@/store/createSessionStore';
import { Step1Preparation } from './Step1Preparation';
import { Step2Enemies } from './Step2Enemies';
import { Step3NPCs } from './Step3NPCs';
import { Step4Players } from './Step4Players';
import { StepMaps } from './StepMaps';
import { Step6Summary } from './Step6Summary';

export function CreateSessionForm() {
  const currentStep = useSessionDraftStore((state) => state.currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto p-0 sm:p-4 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Criar Nova Sessão</h1>
        <div className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
          Passo {currentStep} de 6
        </div>
      </div>

      <div className="border-0 sm:border rounded-none sm:rounded-lg p-4 sm:p-6 bg-card text-card-foreground shadow-none sm:shadow-sm">
        {currentStep === 1 && <Step1Preparation />}
        {currentStep === 2 && <Step2Enemies />}
        {currentStep === 3 && <Step3NPCs />}
        {currentStep === 4 && <Step4Players />}
        {currentStep === 5 && <StepMaps />}
        {currentStep === 6 && <Step6Summary />}
      </div>
    </div>
  );
}
