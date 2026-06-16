import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { faithAspectsSchema } from '../../schemas/characterSchema';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';

const FORTRESSES = [
  { id: 'Compaixão', name: 'Compaixão', desc: 'Não consegue ignorar o sofrimento dos vulneráveis.' },
  { id: 'Coragem', name: 'Coragem', desc: 'Primeiro a se colocar na linha de frente contra ameaças esmagadoras.' },
  { id: 'Zelo', name: 'Zelo', desc: 'Não tolera desrespeito ao nome do Criador ou ao sagrado.' },
  { id: 'Temperança', name: 'Temperança', desc: 'Capaz de resistir a apelos carnais, luxos e festins desmedidos.' },
  { id: 'Humildade', name: 'Humildade', desc: 'Reconhece que a força vem do Alto e não busca glória pessoal.' },
  { id: 'Justiça', name: 'Justiça', desc: 'Age com imparcialidade, recusando subornos e favoritismos.' },
  { id: 'Generosidade', name: 'Generosidade', desc: 'É mão-aberta com os frutos do seu trabalho.' },
  { id: 'Prudência', name: 'Prudência (Sabedoria)', desc: 'Busca conselho e reflete antes de empunhar a espada.' },
  { id: 'Lealdade', name: 'Lealdade', desc: 'Valoriza a aliança com irmãos acima da própria vida.' },
  { id: 'Perseverança', name: 'Perseverança', desc: 'Mantém a esperança mesmo quando tudo aponta para a ruína.' }
];

const TEMPTATIONS = [
  { id: 'Ira', name: 'Ira', desc: 'Tem pavio curto e perde a cabeça com insultos.' },
  { id: 'Avareza', name: 'Avareza', desc: 'Fascinado por espólios de guerra e riquezas.' },
  { id: 'Luxúria', name: 'Luxúria', desc: 'Facilmente seduzido por encantos da carne ou festas pagãs.' },
  { id: 'Soberba', name: 'Soberba/Orgulho', desc: 'Acredita que suas vitórias são méritos inteiramente seus.' },
  { id: 'Inveja', name: 'Inveja', desc: 'Não suporta ver aliados recebendo mais glória.' },
  { id: 'Covardia', name: 'Covardia/Hesitação', desc: 'Preza pela autopreservação e hesita diante do perigo.' },
  { id: 'Curiosidade', name: 'Curiosidade Idólatra', desc: 'Fascinado por práticas e artefatos de outras nações.' },
  { id: 'Vingança', name: 'Vingança', desc: 'Não perdoa ofensas e prefere resolver com sangue.' },
  { id: 'Gula', name: 'Gula', desc: 'Encontra conforto exagerado na comida e bebida.' },
  { id: 'Dúvida', name: 'Dúvida/Desespero', desc: 'Questiona a Providência quando as coisas dão errado.' }
];

export function FaithAspects() {
  const { draft, setFaithAspects, nextStep, prevStep } = useCharacterCreationStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(faithAspectsSchema),
    defaultValues: {
      fortress: draft.fortress || '',
      temptation: draft.temptation || ''
    }
  });

  const selectedFortress = watch('fortress');
  const selectedTemptation = watch('temptation');

  const onSubmit = (data: { fortress: string; temptation: string }) => {
    setFaithAspects(data.fortress, data.temptation);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Fortaleza */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif text-amber-500 border-b border-amber-500/30 pb-2">Fortaleza (Virtude)</h3>
          <p className="text-sm text-stone-400">Escolha um traço virtuoso. Agir de acordo com ele pode recuperar Fé.</p>
          <select
            {...register('fortress')}
            className="w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-amber-500 outline-none"
          >
            <option value="">Selecione uma Fortaleza...</option>
            {FORTRESSES.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {errors.fortress && <p className="text-red-400 text-sm">{errors.fortress.message}</p>}

          {selectedFortress && (
            <div className="bg-stone-800 p-4 rounded border border-stone-700">
              <p className="text-stone-300 text-sm">
                {FORTRESSES.find(f => f.id === selectedFortress)?.desc}
              </p>
            </div>
          )}
        </div>

        {/* Tentação */}
        <div className="space-y-4">
          <h3 className="text-xl font-serif text-red-500 border-b border-red-500/30 pb-2">Tentação (Falha)</h3>
          <p className="text-sm text-stone-400">Escolha um defeito de caráter. Ceder ou falhar contra ele drena sua Fé.</p>
          <select
            {...register('temptation')}
            className="w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-red-500 outline-none"
          >
            <option value="">Selecione uma Tentação...</option>
            {TEMPTATIONS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.temptation && <p className="text-red-400 text-sm">{errors.temptation.message}</p>}

          {selectedTemptation && (
            <div className="bg-stone-800 p-4 rounded border border-stone-700">
              <p className="text-stone-300 text-sm">
                {TEMPTATIONS.find(t => t.id === selectedTemptation)?.desc}
              </p>
            </div>
          )}
        </div>

      </div>

      <div className="flex justify-between mt-8 pt-4 border-t border-stone-700">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors"
        >
          Avançar
        </button>
      </div>
    </form>
  );
}
