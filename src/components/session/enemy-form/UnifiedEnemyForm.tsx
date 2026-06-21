import React, { useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enemyFormSchema, type EnemyFormValues } from './schema';
import { Plus, Upload, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface UnifiedEnemyFormProps {
  initialValues?: Partial<EnemyFormValues>;
  onSubmit: (data: EnemyFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const MOCK_BESTIARY = [
  { id: 'bandido-deserto', name: 'Bandido do Deserto', max_hp: 11, ca: 11, desc: 'Salteadores de beira de estrada com ataque furtivo e funda.', attributes: { for: 10, des: 14, con: 12, int: 10, sab: 10, car: 10 }, vocation: 'Ladrão', skills: [{ name: 'Ataque Furtivo', description: 'Causa dano extra se o alvo estiver distraído' }] },
  { id: 'soldado-filisteu', name: 'Soldado Filisteu', max_hp: 16, ca: 16, desc: 'Soldados bem treinados com cota de escamas e formação em parede.', attributes: { for: 15, des: 12, con: 14, int: 10, sab: 10, car: 10 }, vocation: 'Guerreiro', skills: [{ name: 'Ataque Poderoso', description: 'Pode reduzir a chance de acerto para aumentar o dano' }] },
  { id: 'general-guerra', name: 'General de Guerra', max_hp: 52, ca: 18, desc: 'Líder tático que pode comandar aliados a atacar com reação.', attributes: { for: 16, des: 14, con: 16, int: 14, sab: 12, car: 16 }, vocation: 'Guerreiro', skills: [{ name: 'Comando', description: 'Aliados próximos ganham bônus no ataque' }] },
  { id: 'leao-judeia', name: 'Leão da Judeia', max_hp: 26, ca: 13, desc: 'Fera com tática de matilha, salto e bote.', attributes: { for: 16, des: 15, con: 14, int: 3, sab: 12, car: 8 }, vocation: 'Fera', skills: [{ name: 'Bote', description: 'Se mover antes de atacar e acertar, pode derrubar o alvo' }] },
];

export function UnifiedEnemyForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Salvar Inimigo',
  isSubmitting = false
}: UnifiedEnemyFormProps) {
  const [selectedBaseId, setSelectedBaseId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EnemyFormValues>({
    resolver: zodResolver(enemyFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      vocation: initialValues?.vocation || '',
      hpMax: initialValues?.hpMax || 10,
      hpCurrent: initialValues?.hpCurrent || 10,
      ca: initialValues?.ca || 10,
      attributes: initialValues?.attributes || {
        for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10,
      },
      skills: initialValues?.skills || [],
      imageBase64: initialValues?.imageBase64 || '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const imageUrl = watch('imageBase64');

  const onBaseEnemySelect = (val: string) => {
    setSelectedBaseId(val);
    const base = MOCK_BESTIARY.find(b => b.id === val);
    if (base) {
      setValue('name', base.name);
      setValue('hpMax', base.max_hp);
      setValue('hpCurrent', base.max_hp);
      setValue('ca', base.ca);
      setValue('vocation', base.vocation);
      setValue('attributes', base.attributes);
      setValue('skills', base.skills);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('imageBase64', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onValidSubmit = (data: EnemyFormValues) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
      
      {/* Preset Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Base (Bestiário)</label>
        <Select value={selectedBaseId} onValueChange={onBaseEnemySelect}>
          <SelectTrigger className="bg-stone-800 border-stone-700">
            <SelectValue placeholder="Selecione para preencher automaticamente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum (Criar do Zero)</SelectItem>
            {MOCK_BESTIARY.map(base => (
              <SelectItem key={base.id} value={base.id}>
                {base.name} (HP: {base.max_hp} | CA: {base.ca})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBaseId && selectedBaseId !== 'none' && (
          <p className="text-xs text-stone-400 mt-1">
            {MOCK_BESTIARY.find(b => b.id === selectedBaseId)?.desc}
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div className="flex flex-col gap-2 border border-stone-700 p-4 rounded-lg items-center">
        {imageUrl ? (
            <img src={imageUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-stone-600" />
        ) : (
            <div className="w-24 h-24 rounded-full bg-stone-800 flex items-center justify-center border-2 border-stone-600">
              <span className="text-stone-500 text-sm">Sem Imagem</span>
            </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          className="mt-2 flex items-center px-3 py-1.5 text-sm border border-stone-700 rounded-md hover:bg-stone-800 transition-colors"
        >
          <Upload size={14} className="mr-2" /> Upload Imagem
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Inimigo</label>
          <input
            {...register('name')}
            className={`flex h-9 w-full rounded-md border bg-stone-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-300 ${errors.name ? 'border-red-500' : 'border-stone-700'}`}
            placeholder="Ex: Lobo Selvagem"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vocação (Classe)</label>
          <input
            {...register('vocation')}
            className="flex h-9 w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-300"
            placeholder="Ex: Batedor"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">PV Máx</label>
          <input
            type="number"
            {...register('hpMax', { valueAsNumber: true })}
            className={`flex h-9 w-full rounded-md border bg-stone-800 px-3 py-1 text-sm shadow-sm transition-colors ${errors.hpMax ? 'border-red-500' : 'border-stone-700'}`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">PV Atual</label>
          <input
            type="number"
            {...register('hpCurrent', { valueAsNumber: true })}
            className={`flex h-9 w-full rounded-md border bg-stone-800 px-3 py-1 text-sm shadow-sm transition-colors ${errors.hpCurrent ? 'border-red-500' : 'border-stone-700'}`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">CA</label>
          <input
            type="number"
            {...register('ca', { valueAsNumber: true })}
            className={`flex h-9 w-full rounded-md border bg-stone-800 px-3 py-1 text-sm shadow-sm transition-colors ${errors.ca ? 'border-red-500' : 'border-stone-700'}`}
          />
        </div>
      </div>

      <div className="pt-2">
        <h4 className="text-sm font-medium mb-2 border-b border-stone-700 pb-1">Atributos</h4>
        <div className="grid grid-cols-3 gap-3">
          {(['for', 'des', 'con', 'int', 'sab', 'car'] as const).map((attr) => (
            <div key={attr} className="grid gap-1">
              <label className="text-xs uppercase text-stone-400">{attr}</label>
              <input
                type="number"
                {...register(`attributes.${attr}`, { valueAsNumber: true })}
                className="flex h-8 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-sm shadow-sm transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between mb-2 border-b border-stone-700 pb-1">
          <h4 className="text-sm font-medium">Habilidades</h4>
          <button
            type="button"
            onClick={() => append({ name: '', description: '' })}
            className="flex items-center text-xs text-stone-300 hover:text-white"
          >
            <Plus size={14} className="mr-1" /> Adicionar
          </button>
        </div>
        
        {fields.length === 0 ? (
          <p className="text-xs text-stone-500 italic">Nenhuma habilidade adicionada.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start bg-stone-800/50 p-2 rounded-md border border-stone-700/50">
                <div className="flex-1 space-y-2">
                  <input
                    {...register(`skills.${index}.name`)}
                    placeholder="Nome da habilidade"
                    className={`flex h-8 w-full rounded-md border bg-stone-800 px-2 py-1 text-xs shadow-sm transition-colors ${errors.skills?.[index]?.name ? 'border-red-500' : 'border-stone-700'}`}
                  />
                  <input
                    {...register(`skills.${index}.description`)}
                    placeholder="Descrição do efeito"
                    className="flex h-8 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-xs shadow-sm transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-stone-400 hover:text-red-400 rounded-md hover:bg-stone-800 transition-colors mt-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-stone-700 rounded-md text-stone-300 hover:bg-stone-800 transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
