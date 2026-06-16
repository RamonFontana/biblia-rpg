import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const npcSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
});

type NPCFormValues = z.infer<typeof npcSchema>;

export function Step3NPCs() {
  const { npcs, addNPC, removeNPC, nextStep, prevStep } = useSessionDraftStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NPCFormValues>({
    resolver: zodResolver(npcSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const onAddNPC = (data: NPCFormValues) => {
    addNPC({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description || '',
    });
    reset();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">NPCs da Sessão</h2>
        <p className="text-muted-foreground">
          Crie Personagens Não-Jogáveis que terão um papel importante ou auxiliarão os jogadores nesta sessão.
        </p>
      </div>

      <form onSubmit={handleSubmit(onAddNPC)} className="p-4 border rounded-lg bg-muted/20 space-y-4">
        <h3 className="font-medium text-lg">Adicionar NPC</h3>
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
        <Button type="submit" variant="secondary">Criar NPC</Button>
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
                  <p className="font-semibold">{npc.name}</p>
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
    </div>
  );
}
