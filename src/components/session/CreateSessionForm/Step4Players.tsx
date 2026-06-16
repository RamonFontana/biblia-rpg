import { useQuery } from '@tanstack/react-query';
import { getCharacters } from '@/features/character-management/api/characterApi';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function Step4Players() {
  const { participantCharacterIds, setParticipantCharacterIds, nextStep, prevStep } = useSessionDraftStore();

  const { data: characters, isLoading, isError } = useQuery({
    queryKey: ['characters'],
    queryFn: getCharacters,
  });

  const handleToggle = (charId: string) => {
    if (participantCharacterIds.includes(charId)) {
      setParticipantCharacterIds(participantCharacterIds.filter(id => id !== charId));
    } else {
      setParticipantCharacterIds([...participantCharacterIds, charId]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Convocar Personagens</h2>
        <p className="text-muted-foreground">
          Selecione os personagens que participarão desta sessão.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-muted/20">
        <h3 className="font-medium text-lg mb-4">Personagens Disponíveis</h3>
        
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-red-500">Erro ao carregar personagens. Tente novamente mais tarde.</p>
        )}

        {!isLoading && !isError && characters && characters.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhum personagem encontrado no banco de dados.
          </p>
        )}

        {!isLoading && !isError && characters && characters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map((char) => {
              const isSelected = participantCharacterIds.includes(char.id);
              return (
                <div 
                  key={char.id} 
                  className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-muted/50'}`}
                  onClick={() => handleToggle(char.id)}
                >
                  <Checkbox 
                    id={`char-${char.id}`} 
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(char.id)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none flex-1">
                    <Label htmlFor={`char-${char.id}`} className="font-semibold cursor-pointer">
                      {char.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {char.tribe} • {char.vocation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep}>Voltar</Button>
        <Button type="button" onClick={nextStep}>Próximo: Resumo</Button>
      </div>
    </div>
  );
}
