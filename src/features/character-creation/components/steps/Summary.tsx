import React, { useState } from 'react';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router';

import { saveCharacter } from '../../api/saveCharacter';
import { updateCharacter } from '../../../character-management/api/characterApi';

export function Summary() {
  const { draft, prevStep, editingId } = useCharacterCreationStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await updateCharacter(editingId, draft);
      } else {
        await saveCharacter(draft);
      }
      // Success, redirect to home or character view
      navigate('/characters');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar personagem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="bg-stone-800 p-6 rounded-xl border-2 border-amber-500/30 text-stone-300">
        <h2 className="text-3xl font-serif text-amber-500 mb-6 text-center border-b border-amber-500/20 pb-4">
          {draft.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-amber-400 mb-2">Detalhes Principais</h3>
            <p><strong>Tribo:</strong> {draft.tribe}</p>
            <p><strong>Vocação:</strong> {draft.vocation}</p>
            <p><strong>Fortaleza:</strong> {draft.fortress}</p>
            <p><strong>Tentação:</strong> {draft.temptation}</p>
          </div>

          <div>
            <h3 className="font-bold text-amber-400 mb-2">Estatísticas</h3>
            <p><strong>PV:</strong> {draft.stats?.pv}</p>
            <p><strong>CA:</strong> {draft.stats?.ca}</p>
            <p><strong>Fé:</strong> {draft.stats?.faith}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-700 pt-4">
          <h3 className="font-bold text-amber-400 mb-2">Atributos</h3>
          <div className="flex gap-4">
            <span>FOR: {draft.attributes?.for}</span>
            <span>DES: {draft.attributes?.des}</span>
            <span>CON: {draft.attributes?.con}</span>
            <span>INT: {draft.attributes?.int}</span>
            <span>SAB: {draft.attributes?.sab}</span>
            <span>CAR: {draft.attributes?.car}</span>
          </div>
        </div>

      </div>

      {error && <p className="text-red-400 text-center">{error}</p>}

      <div className="flex justify-between mt-8 pt-4 border-t border-stone-700">
        <button 
          type="button"
          onClick={prevStep}
          disabled={saving}
          className="px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors disabled:opacity-50"
        >
          Voltar e Editar
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Confirmar e Salvar'}
        </button>
      </div>

    </div>
  );
}
