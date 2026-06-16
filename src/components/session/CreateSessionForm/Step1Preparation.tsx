import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const step1Schema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(1000, 'Máximo de 1000 caracteres').optional(),
});

type Step1Values = z.infer<typeof step1Schema>;

export function Step1Preparation() {
  const { name, description, setPreparation, nextStep } = useSessionDraftStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name,
      description,
    },
  });

  const onSubmit = (data: Step1Values) => {
    setPreparation(data.name, data.description || '');
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Preparação da Sessão</h2>
        <p className="text-muted-foreground">
          Defina o nome e uma breve descrição para a sessão que você irá mestrar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Sessão</Label>
          <Input
            id="name"
            placeholder="Ex: Invasão a Jericó"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição / Sinopse (Opcional)</Label>
          <Textarea
            id="description"
            placeholder="Um breve resumo do que os jogadores enfrentarão..."
            className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Próximo: Inimigos</Button>
        </div>
      </form>
    </div>
  );
}
