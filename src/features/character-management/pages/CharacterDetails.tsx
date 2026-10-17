import { useParams, useNavigate } from 'react-router-dom';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { ArrowLeft, Edit3 } from 'lucide-react';

export function CharacterDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col">
      <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900 sticky top-0 z-10">
        <button
          onClick={() => navigate('/characters')}
          className="flex items-center gap-2 text-stone-400 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/characters/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-300 rounded hover:text-amber-500 hover:bg-stone-700 transition-colors text-sm border border-stone-700"
          >
            <Edit3 className="w-4 h-4" />
            Editar Narrativa
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <CharacterSheetView characterId={id} />
      </div>
    </div>
  );
}
