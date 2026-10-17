import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vocationSchema } from '../../schemas/characterSchema';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { useQuickSave } from '../../hooks/useQuickSave';
import { HelpCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const VOCATIONS = [
  {
    id: 'Guerreiro',
    name: 'Guerreiro',
    icon: '⚔️',
    desc: 'Linha de frente. Uso de armaduras pesadas e armas de guerra.',
  },
  {
    id: 'Batedor',
    name: 'Batedor',
    icon: '🗡️',
    desc: 'Especialistas em furtividade, espionagem e ataques rápidos e letais.',
  },
  {
    id: 'Caçador',
    name: 'Caçador / Nômade',
    icon: '🏹',
    desc: 'Habitantes dos ermos. Rastreio, arqueria e conhecimento da terra.',
  },
  {
    id: 'Sacerdote',
    name: 'Sacerdote / Sábio',
    icon: '📜',
    desc: 'Suporte espiritual e cura. Essenciais para restaurar a Fé.',
  },
];

const vocationDocs = import.meta.glob('../../../../../docs/vocacoes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const normalizeString = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const getVocationMarkdown = (vocationId: string) => {
  const normalizedId = normalizeString(vocationId);
  const docKey = Object.keys(vocationDocs).find((key) => key.endsWith(`/${normalizedId}.md`));
  return docKey ? (vocationDocs[docKey] as string) : '';
};

export function VocationSelection() {
  const { draft, setVocation, nextStep, prevStep, isLocked } = useCharacterCreationStore();
  const { quickSave, saving, message, isEditing } = useQuickSave();
  const isLevi = draft.tribe === 'Levi';
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeVocation, setActiveVocation] = useState<(typeof VOCATIONS)[0] | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vocationSchema),
    defaultValues: {
      vocation: draft.vocation || '',
    },
  });

  const selectedVocation = watch('vocation');

  useEffect(() => {
    if (isLevi) {
      setValue('vocation', 'Sacerdote');
      setVocation('Sacerdote');
    }
  }, [isLevi, setValue, setVocation]);

  const onSubmit = (data: { vocation: string }) => {
    setVocation(data.vocation);
    nextStep();
  };

  const handleQuickSave = () => {
    const data = getValues();
    quickSave({ vocation: data.vocation });
  };

  const handleOpenSheet = (e: React.MouseEvent, vocation: (typeof VOCATIONS)[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveVocation(vocation);
    setSheetOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {isLocked && (
          <div className="bg-amber-900/50 border border-amber-500/50 p-4 rounded text-amber-200">
            <strong>Atenção:</strong> Personagem já está participando de uma sessão. Vocação não
            pode ser alterada.
          </div>
        )}
        {isLevi && !isLocked && (
          <div className="bg-amber-900/50 border border-amber-500/50 p-4 rounded text-amber-200">
            <strong>A Regra de Levi:</strong> Como membro da tribo de Levi, você foi chamado para o
            serviço sagrado. Sua vocação deve ser Sacerdote/Sábio.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VOCATIONS.map((vocation) => {
            const disabled = isLocked || (isLevi && vocation.id !== 'Sacerdote');
            const isSelected = selectedVocation === vocation.id;

            return (
              <label
                key={vocation.id}
                className={`relative p-4 rounded-lg border-2 transition-all flex items-start space-x-4
                  ${disabled ? 'opacity-50 cursor-not-allowed border-stone-800' : 'cursor-pointer hover:border-amber-500/50 hover:bg-stone-700/50'}
                  ${isSelected && !disabled ? 'border-amber-500 bg-amber-500/10' : 'border-stone-700 bg-stone-800'}
                `}
              >
                <input
                  type="radio"
                  value={vocation.id}
                  {...register('vocation')}
                  className="hidden"
                  disabled={disabled}
                />

                <button
                  type="button"
                  onClick={(e) => handleOpenSheet(e, vocation)}
                  className="absolute top-2 right-2 text-stone-500 hover:text-amber-500 transition-colors"
                  title="Mais detalhes"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>

                <div className="text-3xl">{vocation.icon}</div>
                <div className="pr-6">
                  <h3 className="font-serif text-lg text-stone-100">{vocation.name}</h3>
                  <p className="text-sm text-stone-400 mt-1">{vocation.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        {errors.vocation && <p className="text-red-400">{errors.vocation.message}</p>}

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-stone-700">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={prevStep}
              className="w-full sm:w-auto px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors flex justify-center items-center"
            >
              Voltar
            </button>
            {isEditing && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleQuickSave}
                  disabled={saving || isLocked}
                  className="w-full sm:w-auto px-6 py-2 bg-stone-700 hover:bg-stone-600 text-amber-500 border border-stone-600 rounded transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                {message && <span className="text-amber-500 text-sm font-semibold">{message}</span>}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors flex justify-center items-center"
          >
            Avançar
          </button>
        </div>
      </form>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-stone-900 border-l border-stone-700 text-stone-100 overflow-y-auto sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle className="text-2xl font-serif text-amber-500 flex items-center gap-2">
              <span>{activeVocation?.icon}</span> {activeVocation?.name}
            </SheetTitle>
            <SheetDescription className="text-stone-400 mt-4 text-base">
              {activeVocation?.desc}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8 pt-6 border-t border-stone-800 space-y-4">
            <div className="prose prose-invert prose-stone prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeVocation ? getVocationMarkdown(activeVocation.id) : ''}
              </ReactMarkdown>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
