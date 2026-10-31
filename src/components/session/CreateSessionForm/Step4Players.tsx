import { useQuery } from '@tanstack/react-query';
import { getCharacters } from '@/data-access/characters';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function Step4Players() {
  const { participantCharacterIds, setParticipantCharacterIds, nextStep, prevStep } =
    useSessionDraftStore();

  const {
    data: characters,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['characters'],
    queryFn: getCharacters,
  });

  const handleToggle = (charId: string) => {
    if (participantCharacterIds.includes(charId)) {
      setParticipantCharacterIds(participantCharacterIds.filter((id) => id !== charId));
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
              const isLevelUpPending = char.pending_level_up;

              return (
                <div
                  key={char.id}
                  className={`flex items-start space-x-3 p-3 border rounded-md transition-colors ${isLevelUpPending ? 'bg-muted/50 opacity-60 cursor-not-allowed' : isSelected ? 'bg-primary/5 border-primary/30 cursor-pointer' : 'bg-card hover:bg-muted/50 cursor-pointer'}`}
                  onClick={() => !isLevelUpPending && handleToggle(char.id)}
                >
                  <Checkbox
                    id={`char-${char.id}`}
                    checked={isSelected}
                    disabled={isLevelUpPending}
                    onCheckedChange={() => !isLevelUpPending && handleToggle(char.id)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none flex-1">
                    <Label
                      htmlFor={`char-${char.id}`}
                      className={`font-semibold ${isLevelUpPending ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}
                    >
                      {char.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {char.tribe} • {char.vocation} {char.level ? `(Nível ${char.level})` : ''}
                    </p>
                    {isLevelUpPending && (
                      <span className="text-xs text-amber-500 font-medium mt-1 block">
                        Este personagem possui um Aumento de Nível pendente. Complete a evolução
                        antes de iniciar a sessão.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button type="button" onClick={nextStep} className="w-full sm:w-auto">
          Próximo: Mapas
        </Button>
      </div>
    </div>
  );
}
