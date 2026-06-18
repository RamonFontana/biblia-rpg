import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { createGameSession } from '@/services/sessionService';
import { Button } from '@/components/ui/button';

export function Step5Summary() {
  const store = useSessionDraftStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const sessionId = await createGameSession({
        session_name: store.name,
        session_description: store.description,
        enemies: store.enemies,
        npcs: store.npcs,
        participant_character_ids: store.participantCharacterIds,
      });
      store.resetStore();
      navigate(`/session/${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a sessão.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Resumo da Sessão</h2>
        <p className="text-muted-foreground">
          Revise os dados antes de iniciar a sessão.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-lg text-primary">Informações Básicas</h3>
          <p><strong>Nome:</strong> {store.name}</p>
          <p><strong>Descrição:</strong> {store.description || 'Sem descrição'}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg text-primary">Inimigos ({store.enemies.length})</h3>
          {store.enemies.length > 0 ? (
            <ul className="list-disc list-inside">
              {store.enemies.map(e => <li key={e.id}>{e.name} (HP: {e.hpCurrent}/{e.hpMax})</li>)}
            </ul>
          ) : <p className="text-muted-foreground italic">Nenhum inimigo adicionado.</p>}
        </div>

        <div>
          <h3 className="font-semibold text-lg text-primary">NPCs ({store.npcs.length})</h3>
          {store.npcs.length > 0 ? (
            <ul className="list-disc list-inside">
              {store.npcs.map(n => <li key={n.id}>{n.name}</li>)}
            </ul>
          ) : <p className="text-muted-foreground italic">Nenhum NPC adicionado.</p>}
        </div>

        <div>
          <h3 className="font-semibold text-lg text-primary">Jogadores ({store.participantCharacterIds.length})</h3>
          {store.participantCharacterIds.length > 0 ? (
            <p>{store.participantCharacterIds.length} personagens selecionados.</p>
          ) : <p className="text-muted-foreground italic">Nenhum jogador selecionado.</p>}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={store.prevStep} disabled={isSubmitting}>
          Voltar
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando Sessão...' : 'Iniciar Sessão'}
        </Button>
      </div>
    </div>
  );
}
