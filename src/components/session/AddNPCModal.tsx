import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCampaignNPCs } from '@/hooks/useCampaignNPCs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddNPCModalProps {
  sessionId: string;
  onAdded?: () => void;
}

export function AddNPCModal({ sessionId, onAdded }: AddNPCModalProps) {
  const { npcs, isLoading } = useCampaignNPCs();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNPC = async (npcId: string) => {
    setIsAdding(true);
    try {
      // GM's user id isn't strictly required for NPCs in session_participants if they are just linked.
      // We can get the current user (GM) to satisfy the user_id requirement if needed.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          character_id: npcId,
          user_id: user.id // Using GM's user_id since they control the NPC
        });

      if (!error) {
        if (onAdded) onAdded();
        setIsOpen(false);
      } else {
        console.error('Error adding NPC to session:', error);
      }
    } catch (err) {
      console.error('Failed to add NPC:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus size={16} />
          Adicionar NPC
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-stone-900 text-stone-200 border-stone-700">
        <DialogHeader>
          <DialogTitle>Adicionar NPC à Sessão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-center text-stone-400 p-4">Carregando NPCs da campanha...</p>
          ) : npcs.length === 0 ? (
            <p className="text-center text-stone-400 p-4">Nenhum NPC encontrado na campanha.</p>
          ) : (
            <ul className="space-y-2">
              {npcs.map((npc) => (
                <li key={npc.id} className="flex items-center justify-between p-3 bg-stone-800 border border-stone-700 rounded-lg">
                  <div>
                    <p className="font-semibold">{npc.name}</p>
                    <p className="text-sm text-stone-400">{npc.tribe}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="default"
                    disabled={isAdding}
                    onClick={() => handleAddNPC(npc.id)}
                  >
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
