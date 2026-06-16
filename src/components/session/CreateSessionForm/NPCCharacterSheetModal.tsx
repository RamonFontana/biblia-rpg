import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const characterSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  level: z.number().min(1).max(20).default(1),
  tribo: z.string().min(1, 'Tribo é obrigatória'),
  classe: z.string().min(1, 'Classe é obrigatória'),
  for: z.number().min(1).max(20).default(10),
  des: z.number().min(1).max(20).default(10),
  con: z.number().min(1).max(20).default(10),
  int: z.number().min(1).max(20).default(10),
  sab: z.number().min(1).max(20).default(10),
  car: z.number().min(1).max(20).default(10),
  ca: z.number().min(1).max(30).default(10),
}).superRefine((data, ctx) => {
  if (data.tribo === 'Levi' && data.classe !== 'Sacerdote' && data.classe !== 'Sábio') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Levitas devem obrigatoriamente ser Sacerdote ou Sábio",
      path: ['classe'],
    });
  }
});

type CharacterFormValues = z.infer<typeof characterSchema>;

interface NPCCharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CharacterFormValues) => void;
  initialName?: string;
  initialDescription?: string;
}

export function NPCCharacterSheetModal({ isOpen, onClose, onSave, initialName = '', initialDescription = '' }: NPCCharacterSheetModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema) as any,
    defaultValues: {
      name: initialName,
      description: initialDescription,
      level: 1,
      tribo: '',
      classe: '',
      for: 10,
      des: 10,
      con: 10,
      int: 10,
      sab: 10,
      car: 10,
      ca: 10
    }
  });

  const onSubmit = (data: CharacterFormValues) => {
    onSave(data);
    reset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Criar NPC Jogável</SheetTitle>
          <SheetDescription>
            Preencha a ficha completa do personagem. NPCs jogáveis poderão acompanhar os jogadores e evoluir.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Informações Básicas</h3>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição / História</Label>
              <Textarea {...register('description')} className="min-h-[80px]" />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível</Label>
                <Input type="number" {...register('level', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Classe de Armadura (CA)</Label>
                <Input type="number" {...register('ca', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tribo (Raça)</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('tribo')}
                >
                  <option value="">Selecione...</option>
                  <option value="Judá">Judá</option>
                  <option value="Levi">Levi</option>
                  <option value="Benjamim">Benjamim</option>
                  <option value="Dã">Dã</option>
                  {/* ... other tribes ... */}
                </select>
                {errors.tribo && <p className="text-xs text-red-500">{errors.tribo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Classe (Vocação)</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('classe')}
                >
                  <option value="">Selecione...</option>
                  <option value="Guerreiro">Guerreiro</option>
                  <option value="Batedor">Batedor</option>
                  <option value="Caçador">Caçador/Nômade</option>
                  <option value="Sacerdote">Sacerdote</option>
                  <option value="Sábio">Sábio</option>
                </select>
                {errors.classe && <p className="text-xs text-red-500">{errors.classe.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium border-b pb-2">Atributos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>FOR</Label>
                <Input type="number" {...register('for', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>DES</Label>
                <Input type="number" {...register('des', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>CON</Label>
                <Input type="number" {...register('con', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>INT</Label>
                <Input type="number" {...register('int', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>SAB</Label>
                <Input type="number" {...register('sab', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>CAR</Label>
                <Input type="number" {...register('car', { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar Personagem</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
