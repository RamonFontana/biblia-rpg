import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nameSchema, narrativeSchema } from '../../schemas/characterSchema';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { z } from 'zod';

const combinedSchema = z.object({
  ...nameSchema.shape,
  ...narrativeSchema.shape
});

type NarrativeFormData = z.infer<typeof combinedSchema>;

export function NarrativeDetails() {
  const { draft, setName, setNarrative, nextStep, prevStep } = useCharacterCreationStore();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NarrativeFormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      name: draft.name || '',
      narrative: {
        imageUrl: draft.narrative?.imageUrl || '',
        physicalDesc: draft.narrative?.physicalDesc || '',
        history: draft.narrative?.history || '',
        personality: draft.narrative?.personality || '',
      }
    }
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = watch('narrative.imageUrl');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para max 500x500 mantendo proporção
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Comprimir como WEBP com 70% de qualidade
          const base64String = canvas.toDataURL('image/webp', 0.7);
          setValue('narrative.imageUrl', base64String);
        }
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: NarrativeFormData) => {
    setName(data.name);
    setNarrative(data.narrative);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div>
        <label className="block text-stone-300 font-bold mb-2">Nome do Personagem *</label>
        <input 
          type="text"
          {...register('name')}
          placeholder="Ex: Davi, Eliabe, Rute..."
          className="w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-amber-500 outline-none"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-stone-300 font-bold mb-2">Retrato do Personagem (Opcional)</label>
        
        <div className="flex items-center gap-4">
          <div 
            className="w-24 h-24 bg-stone-800 border-2 border-dashed border-stone-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-amber-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isCompressing ? (
              <span className="text-xs text-stone-400">Processando...</span>
            ) : previewUrl ? (
              <img src={previewUrl} alt="Retrato" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-stone-500 text-center px-2">Clique para <br/> enviar</span>
            )}
          </div>
          
          <div className="flex-1">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <p className="text-sm text-stone-400 mb-2">Envie uma imagem para sua ficha. Ela será automaticamente reduzida e otimizada.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-300 text-sm transition-colors"
            >
              Escolher Arquivo
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={() => setValue('narrative.imageUrl', '')}
                className="ml-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 rounded text-red-400 text-sm transition-colors"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-stone-300 font-bold mb-2">Aparência Física (Opcional)</label>
        <textarea 
          {...register('narrative.physicalDesc')}
          placeholder="Descreva a aparência do personagem..."
          rows={3}
          className="w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-amber-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-stone-300 font-bold mb-2">História e Origem (Opcional)</label>
        <textarea 
          {...register('narrative.history')}
          placeholder="De onde veio? O que busca?"
          rows={4}
          className="w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-amber-500 outline-none resize-none"
        />
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
          type="submit"
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
        >
          Avançar para Resumo
        </button>
      </div>
    </form>
  );
}
