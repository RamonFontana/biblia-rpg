import { useState } from 'react';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { UnifiedEnemyForm, type EnemyFormValues } from './../enemy-form';
import { Plus } from 'lucide-react';

export function Step2Enemies() {
  const { enemies, addEnemy, removeEnemy, nextStep, prevStep } = useSessionDraftStore();
  const [isAdding, setIsAdding] = useState(false);

  const onAddEnemy = (data: EnemyFormValues) => {
    addEnemy({
      id: crypto.randomUUID(),
      ...data
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Inimigos da Sessão</h2>
          <p className="text-muted-foreground">
            Adicione os inimigos que farão parte desta sessão.
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="gap-2">
            <Plus size={16} />
            Adicionar Inimigo
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border border-stone-700 rounded-lg bg-stone-900/50">
          <h3 className="font-medium text-lg mb-4">Novo Inimigo</h3>
          <UnifiedEnemyForm 
            onSubmit={onAddEnemy} 
            onCancel={() => setIsAdding(false)} 
            submitLabel="Adicionar à Sessão" 
          />
        </div>
      )}

      {/* List of added enemies */}
      <div className="space-y-2 mt-6">
        <h3 className="font-medium">Inimigos Selecionados ({enemies.length})</h3>
        {enemies.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum inimigo adicionado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {enemies.map((enemy) => (
              <div key={enemy.id} className="p-3 border border-stone-800 rounded-md flex justify-between items-start bg-stone-900">
                <div className="flex items-center gap-3">
                  {enemy.imageBase64 ? (
                    <img src={enemy.imageBase64} alt={enemy.name} className="w-10 h-10 rounded-full object-cover border border-stone-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs text-stone-500">
                      IMG
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{enemy.name}</p>
                    <p className="text-xs text-stone-400">{enemy.vocation || 'Sem Vocação'}</p>
                    <p className="text-xs text-stone-500 mt-1">HP: {enemy.hpCurrent}/{enemy.hpMax} | CA: {enemy.ca}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEnemy(enemy.id)} className="h-6 w-6 p-0 text-red-500 hover:text-red-400 hover:bg-stone-800">
                  X
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-stone-800 mt-8">
        <Button type="button" variant="outline" onClick={prevStep}>Voltar</Button>
        <Button type="button" onClick={nextStep}>Próximo: NPCs</Button>
      </div>
    </div>
  );
}
