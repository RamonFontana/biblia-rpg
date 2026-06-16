import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tribeSchema } from '../../schemas/characterSchema';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { HelpCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TRIBES = [
  { id: 'Judá', name: 'Judá', icon: '🦁', desc: 'Liderança e Medicina', paths: 'Liderança ou Médico', details: 'A tribo dos reis e curandeiros. Possuem forte bônus em testes de Carisma para comandar aliados e em testes de Sabedoria para tratar ferimentos.' },
  { id: 'Levi', name: 'Levi', icon: '⛪', desc: 'Devoção e Oráculo (Obrigatório: Sacerdote)', paths: 'Oráculo ou Intercessão', details: 'Separados para o serviço sagrado. Possuem maior base de Pontos de Fé e são os principais mediadores de milagres.' },
  { id: 'Gade', name: 'Gade', icon: '🪨', desc: 'Força Bruta', paths: 'Tanque ou Dano Bruto', details: 'Guerreiros rústicos que habitam além do Jordão. Seus ataques são focados em dano massivo e resistência física.' },
  { id: 'Benjamim', name: 'Benjamim', icon: '🐺', desc: 'Furtividade e Precisão', paths: 'Atirador ou Controle de Terreno', details: 'Famosos por atiradores canhotos letais e táticas de emboscada implacáveis.' },
  { id: 'Rúben', name: 'Rúben', icon: '💨', desc: 'Comércio e Feras', paths: 'Mestre das Feras ou Lábia', details: 'A primeira tribo. Possuem facilidade em lidar com animais selvagens e negociações com outros povos.' },
  { id: 'Issacar', name: 'Issacar', icon: '🌾', desc: 'Mercenários e Lavradores', paths: 'Mercenário ou Lavrador', details: 'Homens fortes de trabalho pesado. Altamente resistentes a venenos e exaustão, servindo bem como linha de frente.' },
  { id: 'Simeão', name: 'Simeão', icon: '🌿', desc: 'Boticários', paths: 'Venenos ou Curas', details: 'Especialistas em criar misturas de ervas, tanto para curar quanto para envenenar lâminas em combate.' },
  { id: 'Dã', name: 'Dã', icon: '🐍', desc: 'Juízes e Furtividade', paths: 'Emboscadas ou Punição', details: 'Tribo isolada e perigosa. Bônus em ataques furtivos e conhecimento de armadilhas.' },
  { id: 'Naftali', name: 'Naftali', icon: '🦌', desc: 'Rapidez e Persuasão', paths: 'Mobilidade ou Liderança', details: 'Ágeis como gazelas. Recebem bônus de deslocamento e vantagens em diplomacia rápida.' },
  { id: 'Aser', name: 'Aser', icon: '🥖', desc: 'Prosperidade e Fartura', paths: 'Resistência ou Suporte', details: 'Tribo rica do norte. Bons com suprimentos logísticos e capazes de conceder vantagens táticas através de banquetes.' },
  { id: 'Zebulom', name: 'Zebulom', icon: '⚓', desc: 'Portos e Formação', paths: 'Fluidez ou Falange', details: 'Lutadores altamente disciplinados que operam melhor em falange (ao lado de aliados).' },
  { id: 'Efraim', name: 'Efraim', icon: '🏹', desc: 'Orgulho e Guerra', paths: 'Arqueiro ou Investida', details: 'Excelentes atiradores com arco longo e bônus de dano ao realizar uma investida a cavalo ou a pé.' },
  { id: 'Manassés', name: 'Manassés', icon: '⚔️', desc: 'Tática e Resiliência', paths: 'Surpresa ou Defensor', details: 'Guerreiros que lutam melhor quando estão em desvantagem numérica. Difíceis de serem derrubados.' }
];

const tribeDocs = import.meta.glob('../../../../../docs/tribos/*.md', { query: '?raw', import: 'default', eager: true });

const normalizeString = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const getTribeMarkdown = (tribeId: string) => {
  const normalizedId = normalizeString(tribeId);
  const docKey = Object.keys(tribeDocs).find(key => key.endsWith(`/${normalizedId}.md`));
  return docKey ? (tribeDocs[docKey] as string) : '';
};

export function TribeSelection() {
  const { draft, setTribe, nextStep } = useCharacterCreationStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTribe, setActiveTribe] = useState<typeof TRIBES[0] | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(tribeSchema),
    defaultValues: {
      tribe: draft.tribe || '',
    }
  });

  const selectedTribe = watch('tribe');

  const onSubmit = (data: { tribe: string }) => {
    setTribe(data.tribe);
    nextStep();
  };

  const handleOpenSheet = (e: React.MouseEvent, tribe: typeof TRIBES[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTribe(tribe);
    setSheetOpen(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRIBES.map((tribe) => (
            <label
              key={tribe.id}
              className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center space-x-4
                ${selectedTribe === tribe.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-stone-700 bg-stone-800 hover:border-amber-500/50 hover:bg-stone-700/50'}`}
            >
              <input
                type="radio"
                value={tribe.id}
                {...register('tribe')}
                className="hidden"
              />

              <button
                type="button"
                onClick={(e) => handleOpenSheet(e, tribe)}
                className="absolute top-2 right-2 text-stone-500 hover:text-amber-500 transition-colors"
                title="Mais detalhes"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <div className="text-3xl">{tribe.icon}</div>
              <div className="pr-6">
                <h3 className="font-serif text-lg text-stone-100">{tribe.name}</h3>
                <p className="text-sm text-stone-400">{tribe.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {errors.tribe && <p className="text-red-400">{errors.tribe.message}</p>}

        <div className="flex justify-end mt-8 pt-4 border-t border-stone-700">
          <button
            type="submit"
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
          >
            Avançar
          </button>
        </div>
      </form>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-stone-900 border-l border-stone-700 text-stone-100 overflow-y-auto sm:max-w-md w-full">
          <SheetHeader>
            <SheetTitle className="text-2xl font-serif text-amber-500 flex items-center gap-2">
              <span>{activeTribe?.icon}</span> Tribo de {activeTribe?.name}
            </SheetTitle>
            <SheetDescription className="text-stone-400 mt-4 text-base">
              {activeTribe?.details}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8 pt-6 border-t border-stone-800 space-y-4">
            <div className="prose prose-invert prose-stone prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeTribe ? getTribeMarkdown(activeTribe.id) : ''}
              </ReactMarkdown>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
