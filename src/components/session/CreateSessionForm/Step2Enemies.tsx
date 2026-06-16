import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MOCK_BESTIARY = [
  { id: 'bandido-deserto', name: 'Bandido do Deserto', max_hp: 11, desc: 'Salteadores de beira de estrada com ataque furtivo e funda.' },
  { id: 'soldado-filisteu', name: 'Soldado Filisteu', max_hp: 16, desc: 'Soldados bem treinados com cota de escamas e formação em parede.' },
  { id: 'general-guerra', name: 'General de Guerra', max_hp: 52, desc: 'Líder tático que pode comandar aliados a atacar com reação.' },
  { id: 'sentinela-amalequita', name: 'Sentinela Amalequita', max_hp: 16, desc: 'Batedores cruéis com ataque furtivo de emboscada e arco curto.' },
  { id: 'sacerdote-baal', name: 'Sacerdote de Baal', max_hp: 33, desc: 'Herege que invoca maldições que causam dano psíquico e perda de Fé.' },
  { id: 'vibora-deserto', name: 'Víbora do Deserto', max_hp: 2, desc: 'Serpente venenosa com bote surpresa e mordida peçonhenta.' },
  { id: 'leao-judeia', name: 'Leão da Judeia', max_hp: 26, desc: 'Fera com tática de matilha, salto e bote.' },
  { id: 'urso-pardo', name: 'Urso Pardo Sírio', max_hp: 34, desc: 'Fera massiva com múltiplos ataques devastadores e faro aguçado.' },
  { id: 'anakim-guerreiro', name: 'Guerreiro Anakim (Gigante)', max_hp: 85, desc: 'Gigante com presença aterradora e resistência a dano.' },
  { id: 'endemoniado-comum', name: 'Endemoniado Comum', max_hp: 30, desc: 'Corrompido que ignora dor e solta gritos atormentadores que roubam Fé.' },
];

const enemySchema = z.object({
  base_enemy_id: z.string().min(1, 'Selecione um inimigo base'),
  name: z.string().min(1, 'Nomeie a instância deste inimigo'),
  max_hp: z.number().min(1, 'HP deve ser pelo menos 1'),
  current_hp: z.number().min(0, 'HP não pode ser negativo'),
});

type EnemyFormValues = z.infer<typeof enemySchema>;

export function Step2Enemies() {
  const { enemies, addEnemy, removeEnemy, updateEnemy, nextStep, prevStep } = useSessionDraftStore();
  const [selectedBaseId, setSelectedBaseId] = useState<string>('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EnemyFormValues>({
    resolver: zodResolver(enemySchema),
    defaultValues: {
      base_enemy_id: '',
      name: '',
      max_hp: 10,
      current_hp: 10,
    }
  });

  const onBaseEnemySelect = (val: string) => {
    setSelectedBaseId(val);
    setValue('base_enemy_id', val);
    const base = MOCK_BESTIARY.find(b => b.id === val);
    if (base) {
      // Auto-fill form based on selection
      const count = enemies.filter(e => e.base_enemy_id === val).length + 1;
      setValue('name', `${base.name} ${count}`);
      setValue('max_hp', base.max_hp);
      setValue('current_hp', base.max_hp);
    }
  };

  const onAddEnemy = (data: EnemyFormValues) => {
    addEnemy({
      id: crypto.randomUUID(),
      ...data
    });
    // Reset form for next addition
    reset();
    setSelectedBaseId('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Inimigos da Sessão</h2>
        <p className="text-muted-foreground">
          Adicione os inimigos que farão parte desta sessão. Eles são baseados no bestiário.
        </p>
      </div>

      {/* Form for adding an enemy */}
      <form onSubmit={handleSubmit(onAddEnemy)} className="p-4 border rounded-lg bg-muted/20 space-y-4">
        <h3 className="font-medium text-lg">Adicionar Inimigo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base (Bestiário)</Label>
            <Select value={selectedBaseId} onValueChange={onBaseEnemySelect}>
              <SelectTrigger className={errors.base_enemy_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_BESTIARY.map(base => (
                  <SelectItem key={base.id} value={base.id}>
                    {base.name} (HP: {base.max_hp})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.base_enemy_id && <p className="text-xs text-red-500">{errors.base_enemy_id.message}</p>}
            {selectedBaseId && (
              <p className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded border">
                {MOCK_BESTIARY.find(b => b.id === selectedBaseId)?.desc}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="enemy_name">Nome/Identificador</Label>
            <Input id="enemy_name" {...register('name')} className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_hp">HP Máximo</Label>
            <Input id="max_hp" type="number" {...register('max_hp', { valueAsNumber: true })} />
            {errors.max_hp && <p className="text-xs text-red-500">{errors.max_hp.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_hp">HP Atual</Label>
            <Input id="current_hp" type="number" {...register('current_hp', { valueAsNumber: true })} />
            {errors.current_hp && <p className="text-xs text-red-500">{errors.current_hp.message}</p>}
          </div>
        </div>
        <Button type="submit" variant="secondary" className="w-full md:w-auto">Adicionar à Sessão</Button>
      </form>

      {/* List of added enemies */}
      <div className="space-y-2">
        <h3 className="font-medium">Inimigos Selecionados ({enemies.length})</h3>
        {enemies.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum inimigo adicionado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {enemies.map((enemy) => (
              <div key={enemy.id} className="p-3 border rounded-md flex justify-between items-start bg-card">
                <div>
                  <p className="font-semibold">{enemy.name}</p>
                  <p className="text-xs text-muted-foreground">Base: {MOCK_BESTIARY.find(b => b.id === enemy.base_enemy_id)?.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs">HP:</Label>
                    <Input 
                      type="number" 
                      className="h-6 w-16 text-xs px-1" 
                      value={enemy.current_hp} 
                      onChange={(e) => updateEnemy(enemy.id, { current_hp: Number(e.target.value) })}
                    />
                    <span className="text-xs text-muted-foreground">/ {enemy.max_hp}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEnemy(enemy.id)} className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-100">
                  X
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>Voltar</Button>
        <Button type="button" onClick={nextStep}>Próximo: NPCs</Button>
      </div>
    </div>
  );
}
