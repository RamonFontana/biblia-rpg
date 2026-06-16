import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NPCCharacterSheetModal } from './NPCCharacterSheetModal';
import npcPresets from '@/data/npcPresets.json';

const npcSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
});

type NPCFormValues = z.infer<typeof npcSchema>;

export function Step3NPCs() {
  const { npcs, addNPC, removeNPC, nextStep, prevStep } = useSessionDraftStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetModalData, setPresetModalData] = useState<{name: string, description: string}>({ name: '', description: '' });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NPCFormValues>({
    resolver: zodResolver(npcSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const onAddSimpleNPC = (data: NPCFormValues) => {
    addNPC({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || '',
      isPlayable: false
    });
    reset();
  };

  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    if (!presetId) return;

    const preset = npcPresets.find(p => p.id === presetId);
    if (preset) {
      if (preset.isPlayable) {
        setPresetModalData({ name: preset.name, description: preset.description });
        setIsModalOpen(true);
      } else {
        setValue('name', preset.name);
        setValue('description', preset.description);
      }
    }
    e.target.value = ""; // Reset dropdown
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">NPCs da Sessão</h2>
        <p className="text-muted-foreground">
          Crie Personagens Não-Jogáveis que terão um papel importante ou auxiliarão os jogadores nesta sessão.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-md border">
        <Label htmlFor="preset-select" className="whitespace-nowrap font-medium">Usar Preset:</Label>
        <select 
          id="preset-select"
          className="flex h-10 w-full max-w-sm items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          onChange={handlePresetSelect}
          defaultValue=""
        >
          <option value="" disabled>Selecione um NPC predefinido...</option>
          {npcPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name} {preset.isPlayable ? "(Jogável)" : ""}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit(onAddSimpleNPC)} className="p-4 border rounded-lg bg-muted/10 space-y-4 relative">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Adicionar NPC Simples</h3>
          <Button type="button" variant="outline" onClick={() => {
            setPresetModalData({ name: '', description: '' });
            setIsModalOpen(true);
          }}>
            Criar NPC Jogável (Ficha Completa)
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="npc_name">Nome do NPC</Label>
            <Input id="npc_name" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="npc_desc">Descrição / Papel</Label>
            <Textarea id="npc_desc" {...register('description')} className="min-h-[80px]" />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>
        </div>
        <Button type="submit" variant="secondary">Adicionar NPC Simples</Button>
      </form>

      <div className="space-y-2">
        <h3 className="font-medium">NPCs Criados ({npcs.length})</h3>
        {npcs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum NPC criado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {npcs.map((npc) => (
              <div key={npc.id} className="p-3 border rounded-md flex justify-between items-start bg-card">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{npc.name}</p>
                    {npc.isPlayable && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">Jogável</span>
                    )}
                  </div>
                  {npc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{npc.description}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeNPC(npc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100">
                  X
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>Voltar</Button>
        <Button type="button" onClick={nextStep}>Próximo: Jogadores</Button>
      </div>

      <NPCCharacterSheetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialName={presetModalData.name}
        initialDescription={presetModalData.description}
        onSave={(data) => {
          addNPC({
            id: crypto.randomUUID(),
            name: data.name,
            description: data.description || '',
            isPlayable: true,
            characterData: data
          });
        }} 
      />
    </div>
  );
}
